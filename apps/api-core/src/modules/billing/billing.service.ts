import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BillingInterval,
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
  EmployerSubscriptionDto,
  EmployerSubscriptionStatus,
  VerifyPaymentDto,
} from '@smart/contracts';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { RedisService } from '../../platform/redis/redis.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RazorpayProvider) private readonly razorpayProvider: RazorpayProvider,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  /**
   * Creates or reuses a subscription checkout session for a company.
   * Rejects FREE and ENTERPRISE plans from self-service paid checkout.
   * Subscriptions start in PENDING state; paid access requires provider confirmation.
   */
  async createCheckoutSession(
    userId: string,
    companyId: string,
    input: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new BadRequestException({
        error: 'company_not_found',
        message: 'Company profile not found for authenticated user.',
        statusCode: 400,
      });
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.planCode },
    });
    if (!plan) {
      throw new BadRequestException({
        error: 'plan_not_found',
        message: `Subscription plan '${input.planCode}' does not exist.`,
        statusCode: 400,
      });
    }

    if (plan.code === 'FREE') {
      throw new BadRequestException({
        error: 'invalid_plan_for_checkout',
        message: 'The FREE plan does not require payment checkout.',
        statusCode: 400,
      });
    }

    if (plan.code === 'ENTERPRISE' || plan.isCustomPrice) {
      throw new BadRequestException({
        error: 'enterprise_contact_required',
        message: 'Enterprise custom plans require account representative approval.',
        statusCode: 400,
      });
    }

    if (!plan.priceInr || plan.priceInr <= 0) {
      throw new BadRequestException({
        error: 'invalid_plan_price',
        message: 'Requested plan has no valid price configured.',
        statusCode: 400,
      });
    }

    const amountInr =
      input.billingInterval === 'ANNUAL'
        ? Math.round(plan.priceInr * 10) // 2 months free discount for annual
        : plan.priceInr;

    let subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
    });

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + (input.billingInterval === 'ANNUAL' ? 365 : 30) * 86400 * 1000,
    );

    if (!subscription) {
      subscription = await this.prisma.employerSubscription.create({
        data: {
          companyId,
          planId: plan.id,
          status: 'PENDING',
          billingInterval: input.billingInterval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      subscription = await this.prisma.employerSubscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlanId: plan.id,
          billingInterval: input.billingInterval,
        },
      });
    }

    const providerResult = await this.razorpayProvider.createSubscription({
      planCode: plan.code,
      billingInterval: input.billingInterval,
      amountInr,
      companyId,
    });

    subscription = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        razorpaySubscriptionId: providerResult.providerSubscriptionId,
      },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.checkout_created',
      resourceType: 'subscription',
      resourceId: subscription.id,
      reasonCode: 'CHECKOUT_INITIATED',
      metadata: {
        companyId,
        planCode: plan.code,
        billingInterval: input.billingInterval,
        amountInr,
        providerSubscriptionId: providerResult.providerSubscriptionId,
      },
    });

    return {
      subscriptionId: subscription.id,
      razorpaySubscriptionId: providerResult.providerSubscriptionId,
      razorpayKeyId: this.razorpayProvider.keyId,
      amountInr,
      currency: 'INR',
      companyName: company.name,
    };
  }

  /**
   * Verifies Razorpay payment signature AND authoritatively validates state with Razorpay API.
   * Client request is treated ONLY as a verification request; activation requires provider confirmation.
   * Handles replayed razorpayPaymentId gracefully without P2002 database exception.
   */
  async verifyPayment(
    userId: string,
    companyId: string,
    input: VerifyPaymentDto,
  ): Promise<EmployerSubscriptionDto> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No pending or active subscription found for this company.',
        statusCode: 400,
      });
    }

    // Tenant safety: Stored provider subscription ID MUST exist and match submitted ID.
    if (
      !subscription.razorpaySubscriptionId ||
      subscription.razorpaySubscriptionId !== input.razorpaySubscriptionId
    ) {
      throw new BadRequestException({
        error: 'subscription_provider_mismatch',
        message:
          'The submitted subscription identifier does not match your active pending subscription.',
        statusCode: 400,
      });
    }

    // Replay safety: Check if payment transaction has already been processed.
    const existingTx = await this.prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId: input.razorpayPaymentId },
    });
    if (existingTx) {
      throw new BadRequestException({
        error: 'payment_already_processed',
        message: 'This payment transaction has already been verified and processed.',
        statusCode: 400,
      });
    }

    // Local HMAC signature verification
    const isValidSignature = this.razorpayProvider.verifyCheckoutSignature({
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayOrderId: input.razorpayOrderId,
      razorpaySignature: input.razorpaySignature,
    });

    if (!isValidSignature) {
      throw new BadRequestException({
        error: 'invalid_payment_signature',
        message: 'Payment verification failed: invalid signature.',
        statusCode: 400,
      });
    }

    // Authoritative Provider State Retrieval: Fetch subscription from Razorpay API
    let providerSubscription;
    try {
      providerSubscription = await this.razorpayProvider.fetchSubscription(
        input.razorpaySubscriptionId,
      );
    } catch (err) {
      throw new BadRequestException({
        error: 'provider_lookup_failed',
        message: `Failed to verify subscription state with Razorpay: ${(err as Error).message}`,
        statusCode: 400,
      });
    }

    const validProviderStatuses = ['authenticated', 'active'];
    if (!validProviderStatuses.includes(providerSubscription.status.toLowerCase())) {
      throw new BadRequestException({
        error: 'provider_payment_not_authenticated',
        message: `Subscription status '${providerSubscription.status}' is not authenticated or active with provider.`,
        statusCode: 400,
      });
    }

    // Authoritative Provider Payment Retrieval: Fetch payment from Razorpay API
    let providerPayment;
    try {
      providerPayment = await this.razorpayProvider.fetchPayment(input.razorpayPaymentId);
    } catch (err) {
      throw new BadRequestException({
        error: 'provider_payment_lookup_failed',
        message: `Failed to verify payment state with Razorpay: ${(err as Error).message}`,
        statusCode: 400,
      });
    }

    const validPaymentStatuses = ['captured', 'authorized'];
    if (!validPaymentStatuses.includes(providerPayment.status.toLowerCase())) {
      throw new BadRequestException({
        error: 'provider_payment_not_captured',
        message: `Payment status '${providerPayment.status}' is not captured or authorized with provider.`,
        statusCode: 400,
      });
    }

    const activePlanId = subscription.pendingPlanId ?? subscription.planId;
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: activePlanId },
    });
    const amountInr = plan?.priceInr ?? 0;

    await this.prisma.paymentTransaction.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId,
        amountInr,
        status: 'SUCCESS',
      },
    });

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + (subscription.billingInterval === 'ANNUAL' ? 365 : 30) * 86400 * 1000,
    );

    const updatedSubscription = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        planId: activePlanId,
        pendingPlanId: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        gracePeriodEndsAt: null,
        canceledAt: null,
      },
      include: { plan: true },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: { planId: activePlanId },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.payment_verified',
      resourceType: 'subscription',
      resourceId: subscription.id,
      reasonCode: 'PAYMENT_VERIFIED',
      metadata: {
        companyId,
        planCode: updatedSubscription.plan.code,
        razorpayPaymentId: input.razorpayPaymentId,
        amountInr,
      },
    });

    return this.toEmployerSubscriptionDto(updatedSubscription);
  }

  /**
   * Retrieves current employer subscription for the authenticated company.
   * Scoped strictly to companyId.
   */
  async getSubscription(companyId: string): Promise<EmployerSubscriptionDto | null> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true, pendingPlan: true },
    });

    if (!subscription) {
      return null;
    }

    return this.toEmployerSubscriptionDto(subscription);
  }

  /**
   * Schedules employer subscription cancellation at the end of the current billing period.
   * Cancels renewal via provider API and sets cancelAtPeriodEnd = true.
   * Retains paid access and ACTIVE status until period end / provider webhook confirmation.
   */
  async cancelSubscription(userId: string, companyId: string): Promise<EmployerSubscriptionDto> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true, pendingPlan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No subscription found to cancel for this company.',
        statusCode: 400,
      });
    }

    const cancelableStatuses = ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'];
    if (!cancelableStatuses.includes(subscription.status)) {
      throw new BadRequestException({
        error: 'invalid_subscription_state',
        message: `Subscription in '${subscription.status}' status cannot be canceled.`,
        statusCode: 400,
      });
    }

    if (subscription.cancelAtPeriodEnd) {
      return this.toEmployerSubscriptionDto(subscription);
    }

    if (subscription.razorpaySubscriptionId) {
      try {
        await this.razorpayProvider.cancelSubscription({
          razorpaySubscriptionId: subscription.razorpaySubscriptionId,
          cancelAtCycleEnd: true,
        });
      } catch (err) {
        await this.auditPublisher.record({
          actorId: userId,
          action: 'billing.subscription_cancellation_failed',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'PROVIDER_CANCELLATION_ERROR',
          metadata: {
            companyId,
            razorpaySubscriptionId: subscription.razorpaySubscriptionId,
            error: (err as Error).message,
          },
        });

        throw new BadRequestException({
          error: 'provider_cancellation_failed',
          message: `Failed to cancel subscription with provider: ${(err as Error).message}`,
          statusCode: 400,
        });
      }
    }

    const updated = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
      include: { plan: true, pendingPlan: true },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.subscription_cancel_requested',
      resourceType: 'subscription',
      resourceId: updated.id,
      reasonCode: 'CANCEL_AT_PERIOD_END_REQUESTED',
      metadata: {
        companyId,
        razorpaySubscriptionId: updated.razorpaySubscriptionId,
        planCode: updated.plan.code,
      },
    });

    return this.toEmployerSubscriptionDto(updated);
  }

  private toEmployerSubscriptionDto(subscription: {
    id: string;
    companyId: string;
    planId: string;
    pendingPlanId: string | null;
    razorpaySubscriptionId: string | null;
    status: string;
    billingInterval: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    gracePeriodEndsAt: Date | null;
    isEnterpriseContract: boolean;
    createdAt: Date;
    updatedAt: Date;
    plan: { code: string; name: string };
    pendingPlan?: { code: string } | null;
  }): EmployerSubscriptionDto {
    return {
      id: subscription.id,
      companyId: subscription.companyId,
      planId: subscription.planId,
      planCode: subscription.plan.code,
      planName: subscription.plan.name,
      pendingPlanId: subscription.pendingPlanId ?? null,
      pendingPlanCode: subscription.pendingPlan?.code ?? null,
      razorpaySubscriptionId: subscription.razorpaySubscriptionId ?? null,
      status: subscription.status as EmployerSubscriptionStatus,
      billingInterval: subscription.billingInterval as BillingInterval,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt?.toISOString() ?? null,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt?.toISOString() ?? null,
      isEnterpriseContract: subscription.isEnterpriseContract,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  /**
   * Processes incoming Razorpay Webhook events asynchronously with signature verification and Redis deduplication.
   * If Redis deduplication fails, throws ServiceUnavailableException to safely allow provider retries.
   */
  async handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{ processed: boolean; duplicate?: boolean }> {
    const isValidSignature = this.razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      throw new BadRequestException({
        error: 'invalid_webhook_signature',
        message: 'Razorpay webhook signature verification failed.',
        statusCode: 400,
      });
    }

    let payload: {
      id?: string;
      event?: string;
      payload?: {
        subscription?: { entity?: { id?: string } };
        payment?: {
          entity?: {
            id?: string;
            subscription_id?: string;
            order_id?: string;
            amount?: number;
            error_description?: string;
          };
        };
      };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException({
        error: 'invalid_json',
        message: 'Webhook request body is not valid JSON.',
        statusCode: 400,
      });
    }

    const eventName: string = payload.event ?? 'unknown';
    const eventId: string = payload.id ?? `${eventName}_${Date.now()}`;
    const dedupeKey = `billing:webhook:${eventId}`;

    try {
      const setNx = await this.redis.set(dedupeKey, 'processed', 'EX', 86400 * 7, 'NX');
      if (setNx === null) {
        this.logger.log(`Duplicate webhook event ignored: ${eventId}`);
        return { processed: true, duplicate: true };
      }
    } catch (err) {
      this.logger.error(
        `Redis deduplication unavailable: ${(err as Error).message}. Failing webhook to trigger retry.`,
      );
      throw new ServiceUnavailableException({
        error: 'webhook_deduplication_unavailable',
        message: 'Idempotency store unavailable. Webhook postponed for provider retry.',
      });
    }

    const subEntity = payload.payload?.subscription?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    const providerSubId: string | undefined = subEntity?.id ?? paymentEntity?.subscription_id;

    if (!providerSubId) {
      this.logger.warn(`Webhook event '${eventName}' missing provider subscription ID.`);
      return { processed: true };
    }

    const subscription = await this.prisma.employerSubscription.findFirst({
      where: { razorpaySubscriptionId: providerSubId },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for provider ID '${providerSubId}' in webhook event '${eventName}'.`,
      );
      return { processed: true };
    }

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + (subscription.billingInterval === 'ANNUAL' ? 365 : 30) * 86400 * 1000,
    );

    switch (eventName) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged': {
        const activePlanId = subscription.pendingPlanId ?? subscription.planId;
        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            planId: activePlanId,
            pendingPlanId: null,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            gracePeriodEndsAt: null,
          },
        });

        await this.prisma.company.update({
          where: { id: subscription.companyId },
          data: { planId: activePlanId },
        });

        if (paymentEntity?.id) {
          const amountInPaise = paymentEntity.amount ?? 0;
          await this.prisma.paymentTransaction.create({
            data: {
              companyId: subscription.companyId,
              subscriptionId: subscription.id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id ?? null,
              amountInr: Math.round(amountInPaise / 100),
              status: 'SUCCESS',
              rawWebhookPayload: payload,
            },
          });
        }

        await this.auditPublisher.record({
          actorId: null,
          action: 'billing.subscription_activated',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'WEBHOOK_SUBSCRIPTION_CHARGED',
          metadata: { providerSubId, eventName },
        });
        break;
      }

      case 'payment.failed':
      case 'subscription.halted': {
        const gracePeriodEnd = new Date(now.getTime() + 48 * 3600 * 1000); // 48-hour controlled grace period

        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'GRACE_PERIOD',
            gracePeriodEndsAt: gracePeriodEnd,
          },
        });

        if (paymentEntity?.id) {
          await this.prisma.paymentTransaction.create({
            data: {
              companyId: subscription.companyId,
              subscriptionId: subscription.id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id ?? null,
              amountInr: Math.round((paymentEntity.amount ?? 0) / 100),
              status: 'FAILED',
              failureReason: paymentEntity.error_description ?? 'Payment charge failed',
              rawWebhookPayload: payload,
            },
          });
        }

        await this.auditPublisher.record({
          actorId: null,
          action: 'billing.payment_failed',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'WEBHOOK_PAYMENT_FAILED',
          metadata: { providerSubId, eventName, gracePeriodEndsAt: gracePeriodEnd.toISOString() },
        });
        break;
      }

      case 'subscription.cancelled': {
        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: now,
          },
        });

        await this.auditPublisher.record({
          actorId: null,
          action: 'billing.subscription_canceled',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'WEBHOOK_SUBSCRIPTION_CANCELLED',
          metadata: { providerSubId },
        });
        break;
      }

      case 'subscription.completed': {
        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'EXPIRED',
          },
        });

        await this.auditPublisher.record({
          actorId: null,
          action: 'billing.subscription_expired',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'WEBHOOK_SUBSCRIPTION_COMPLETED',
          metadata: { providerSubId },
        });
        break;
      }

      default:
        this.logger.log(`Unhandled webhook event received: ${eventName}`);
        break;
    }

    return { processed: true };
  }
}
