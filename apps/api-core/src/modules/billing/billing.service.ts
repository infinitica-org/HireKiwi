import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { EmployerInvoice } from '../../generated/prisma/index.js';
import type {
  BillingInterval,
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
  EmployerInvoiceDto,
  EmployerSubscriptionDto,
  EmployerSubscriptionStatus,
  VerifyPaymentDto,
  VerifyPaymentMethodReplacementDto,
  UpgradePlanDto,
  DowngradePlanDto,
  PlanCode,
} from '@smart/contracts';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { env } from '../../platform/config/env.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { RedisService } from '../../platform/redis/redis.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RazorpayProvider) private readonly razorpayProvider: RazorpayProvider,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Optional() @Inject(StorageService) private readonly storageService?: StorageService,
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

    const paymentTx = await this.prisma.paymentTransaction.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId,
        amountInr,
        status: 'SUCCESS',
      },
    });

    await this.createInvoiceForSuccessfulPayment(companyId, paymentTx.id, subscription.id);

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

    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: 'FREE' },
    });

    const updated = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        pendingPlanId: freePlan ? freePlan.id : null,
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

  /**
   * Upgrades employer subscription immediately to a higher self-service plan (BASIC or PRO).
   * Plan change and proration are executed by Razorpay provider.
   * Company.planId and EmployerSubscription.planId are updated only after provider confirmation.
   * Clears pendingPlanId on successful upgrade.
   */
  async upgradeSubscription(
    userId: string,
    companyId: string,
    input: UpgradePlanDto,
  ): Promise<EmployerSubscriptionDto> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true, pendingPlan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No subscription found to upgrade for this company.',
        statusCode: 400,
      });
    }

    const upgradeableStatuses = ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE', 'PENDING'];
    if (!upgradeableStatuses.includes(subscription.status)) {
      throw new BadRequestException({
        error: 'invalid_subscription_state',
        message: `Subscription in '${subscription.status}' status cannot be upgraded.`,
        statusCode: 400,
      });
    }

    if ((input.planCode as string) === 'ENTERPRISE') {
      throw new BadRequestException({
        error: 'enterprise_contract_required',
        message: 'ENTERPRISE plan requires a custom enterprise contract.',
        statusCode: 400,
      });
    }

    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.planCode },
    });

    if (!targetPlan) {
      throw new BadRequestException({
        error: 'invalid_plan',
        message: `Subscription plan '${input.planCode}' is not available.`,
        statusCode: 400,
      });
    }

    const planRank: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    const currentRank = planRank[subscription.plan.code] ?? 0;
    const targetRank = planRank[targetPlan.code] ?? 0;

    if (targetRank <= currentRank) {
      throw new BadRequestException({
        error: 'invalid_upgrade_target',
        message: `Target plan '${input.planCode}' is not an upgrade from current plan '${subscription.plan.code}'.`,
        statusCode: 400,
      });
    }

    const resolvedInterval = (input.billingInterval ??
      subscription.billingInterval) as BillingInterval;
    const targetRazorpayPlanId = targetPlan.code;

    if (!targetRazorpayPlanId) {
      throw new BadRequestException({
        error: 'missing_razorpay_plan',
        message: `Target plan '${targetPlan.code}' has no configured Razorpay plan ID for '${resolvedInterval}' interval.`,
        statusCode: 400,
      });
    }

    if (subscription.razorpaySubscriptionId) {
      try {
        const updateResult = await this.razorpayProvider.updateSubscription({
          razorpaySubscriptionId: subscription.razorpaySubscriptionId,
          razorpayPlanId: targetRazorpayPlanId,
          scheduleChangeAt: 'now',
          customerNotify: true,
        });

        if (!updateResult || updateResult.plan_id !== targetRazorpayPlanId) {
          throw new Error(
            `Provider response plan '${updateResult?.plan_id}' did not match requested target plan '${targetRazorpayPlanId}'.`,
          );
        }
      } catch (err) {
        await this.auditPublisher.record({
          actorId: userId,
          action: 'billing.subscription_upgrade_failed',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'PROVIDER_UPGRADE_ERROR',
          metadata: {
            companyId,
            currentPlanCode: subscription.plan.code,
            targetPlanCode: targetPlan.code,
            error: (err as Error).message,
          },
        });

        throw new BadRequestException({
          error: 'provider_upgrade_failed',
          message: `Failed to upgrade subscription with provider: ${(err as Error).message}`,
          statusCode: 400,
        });
      }
    }

    const updated = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        planId: targetPlan.id,
        pendingPlanId: null,
        billingInterval: resolvedInterval,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      },
      include: { plan: true, pendingPlan: true },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: { planId: targetPlan.id },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.subscription_upgraded',
      resourceType: 'subscription',
      resourceId: updated.id,
      reasonCode: 'SELF_SERVICE_UPGRADE_CONFIRMED',
      metadata: {
        companyId,
        previousPlanCode: subscription.plan.code,
        targetPlanCode: targetPlan.code,
        billingInterval: resolvedInterval,
        razorpaySubscriptionId: updated.razorpaySubscriptionId,
      },
    });

    return this.toEmployerSubscriptionDto(updated);
  }

  /**
   * Schedules a subscription downgrade for the end of the current billing period (Phase 4B).
   * For paid -> paid (e.g. PRO -> BASIC): calls Razorpay with schedule_change_at = 'cycle_end'.
   * For paid -> FREE: calls Razorpay cancelSubscription with cancelAtCycleEnd = true.
   * EmployerSubscription.planId and Company.planId remain on current plan until cycle-end provider confirmation.
   * EmployerSubscription.pendingPlanId is updated to the target plan ID.
   */
  async downgradeSubscription(
    userId: string,
    companyId: string,
    input: DowngradePlanDto,
  ): Promise<EmployerSubscriptionDto> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true, pendingPlan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No subscription found to downgrade for this company.',
        statusCode: 400,
      });
    }

    const downgradeableStatuses = ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'];
    if (!downgradeableStatuses.includes(subscription.status)) {
      throw new BadRequestException({
        error: 'invalid_subscription_state',
        message: `Subscription in '${subscription.status}' status cannot be downgraded.`,
        statusCode: 400,
      });
    }

    const targetPlanCode = input.planCode;
    if ((targetPlanCode as string) === 'ENTERPRISE' || (targetPlanCode as string) === 'PRO') {
      throw new BadRequestException({
        error: 'invalid_downgrade_target',
        message: `Self-service downgrade to '${targetPlanCode}' is not supported.`,
        statusCode: 400,
      });
    }

    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: targetPlanCode },
    });

    if (!targetPlan) {
      throw new BadRequestException({
        error: 'invalid_plan',
        message: `Subscription plan '${targetPlanCode}' is not available.`,
        statusCode: 400,
      });
    }

    const planRank: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    const currentRank = planRank[subscription.plan.code] ?? 0;
    const targetRank = planRank[targetPlan.code] ?? 0;

    if (targetRank >= currentRank) {
      throw new BadRequestException({
        error: 'invalid_downgrade_target',
        message: `Target plan '${targetPlanCode}' is not a downgrade from current plan '${subscription.plan.code}'.`,
        statusCode: 400,
      });
    }

    const isFreeTarget = targetPlanCode === 'FREE';

    if (
      subscription.pendingPlanId === targetPlan.id &&
      subscription.cancelAtPeriodEnd === isFreeTarget
    ) {
      return this.toEmployerSubscriptionDto(subscription);
    }

    const resolvedInterval = (input.billingInterval ??
      subscription.billingInterval) as BillingInterval;

    if (isFreeTarget) {
      if (subscription.razorpaySubscriptionId) {
        try {
          await this.razorpayProvider.cancelSubscription({
            razorpaySubscriptionId: subscription.razorpaySubscriptionId,
            cancelAtCycleEnd: true,
          });
        } catch (err) {
          await this.auditPublisher.record({
            actorId: userId,
            action: 'billing.subscription_downgrade_failed',
            resourceType: 'subscription',
            resourceId: subscription.id,
            reasonCode: 'PROVIDER_DOWNGRADE_ERROR',
            metadata: {
              companyId,
              currentPlanCode: subscription.plan.code,
              targetPlanCode: targetPlan.code,
              error: (err as Error).message,
            },
          });

          throw new BadRequestException({
            error: 'provider_downgrade_failed',
            message: `Failed to schedule downgrade with provider: ${(err as Error).message}`,
            statusCode: 400,
          });
        }
      }

      const updated = await this.prisma.employerSubscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlanId: targetPlan.id,
          cancelAtPeriodEnd: true,
        },
        include: { plan: true, pendingPlan: true },
      });

      await this.auditPublisher.record({
        actorId: userId,
        action: 'billing.subscription_downgrade_scheduled',
        resourceType: 'subscription',
        resourceId: updated.id,
        reasonCode: 'DOWNGRADE_SCHEDULED_FREE_CYCLE_END',
        metadata: {
          companyId,
          currentPlanCode: subscription.plan.code,
          targetPlanCode: targetPlan.code,
          billingInterval: resolvedInterval,
          razorpaySubscriptionId: updated.razorpaySubscriptionId,
          replacedPendingPlan: Boolean(subscription.pendingPlanId),
        },
      });

      return this.toEmployerSubscriptionDto(updated);
    } else {
      const targetRazorpayPlanId = targetPlan.code;

      if (subscription.razorpaySubscriptionId) {
        try {
          await this.razorpayProvider.updateSubscription({
            razorpaySubscriptionId: subscription.razorpaySubscriptionId,
            razorpayPlanId: targetRazorpayPlanId,
            scheduleChangeAt: 'cycle_end',
            customerNotify: true,
          });
        } catch (err) {
          await this.auditPublisher.record({
            actorId: userId,
            action: 'billing.subscription_downgrade_failed',
            resourceType: 'subscription',
            resourceId: subscription.id,
            reasonCode: 'PROVIDER_DOWNGRADE_ERROR',
            metadata: {
              companyId,
              currentPlanCode: subscription.plan.code,
              targetPlanCode: targetPlan.code,
              error: (err as Error).message,
            },
          });

          throw new BadRequestException({
            error: 'provider_downgrade_failed',
            message: `Failed to schedule downgrade with provider: ${(err as Error).message}`,
            statusCode: 400,
          });
        }
      }

      const updated = await this.prisma.employerSubscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlanId: targetPlan.id,
          cancelAtPeriodEnd: false,
          billingInterval: resolvedInterval,
        },
        include: { plan: true, pendingPlan: true },
      });

      await this.auditPublisher.record({
        actorId: userId,
        action: 'billing.subscription_downgrade_scheduled',
        resourceType: 'subscription',
        resourceId: updated.id,
        reasonCode: 'DOWNGRADE_SCHEDULED_CYCLE_END',
        metadata: {
          companyId,
          currentPlanCode: subscription.plan.code,
          targetPlanCode: targetPlan.code,
          billingInterval: resolvedInterval,
          razorpaySubscriptionId: updated.razorpaySubscriptionId,
          replacedPendingPlan: Boolean(subscription.pendingPlanId),
        },
      });

      return this.toEmployerSubscriptionDto(updated);
    }
  }

  /**
   * Provisions a replacement Razorpay subscription (sub_new) for updating an employer's payment details.
   * Does NOT mutate local subscription ID or cancel sub_old until sub_new is authoritatively verified.
   */
  async createPaymentMethodReplacementSession(
    userId: string,
    companyId: string,
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

    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No subscription found to update payment details.',
        statusCode: 400,
      });
    }

    if (subscription.plan.code === 'FREE') {
      throw new BadRequestException({
        error: 'invalid_plan_for_payment_update',
        message: 'FREE plan does not have an active paid subscription or payment details.',
        statusCode: 400,
      });
    }

    if (subscription.plan.code === 'ENTERPRISE' || subscription.plan.isCustomPrice) {
      throw new BadRequestException({
        error: 'enterprise_contact_required',
        message:
          'Enterprise custom plans require account representative assistance for billing changes.',
        statusCode: 400,
      });
    }

    const eligibleStatuses = ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'];
    if (!eligibleStatuses.includes(subscription.status)) {
      throw new BadRequestException({
        error: 'invalid_subscription_state',
        message: `Subscription in '${subscription.status}' status cannot update payment method.`,
        statusCode: 400,
      });
    }

    const amountInr =
      subscription.billingInterval === 'ANNUAL'
        ? Math.round((subscription.plan.priceInr ?? 0) * 10)
        : (subscription.plan.priceInr ?? 0);

    const subOld = subscription.razorpaySubscriptionId ?? '';

    const providerResult = await this.razorpayProvider.createSubscription({
      planCode: subscription.plan.code,
      billingInterval: subscription.billingInterval as BillingInterval,
      amountInr,
      companyId,
      notes: {
        company_id: companyId,
        purpose: 'payment_method_replacement',
        previous_subscription_id: subOld,
      },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.payment_method_replacement_requested',
      resourceType: 'subscription',
      resourceId: subscription.id,
      reasonCode: 'PAYMENT_METHOD_REPLACEMENT_INITIATED',
      metadata: {
        companyId,
        previousSubscriptionId: subOld,
        replacementSubscriptionId: providerResult.providerSubscriptionId,
        planCode: subscription.plan.code,
        billingInterval: subscription.billingInterval,
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
   * Verifies Razorpay payment signature and authoritative provider state for replacement subscription sub_new.
   * Cancels sub_old immediately upon successful establishment and updates EmployerSubscription.razorpaySubscriptionId to sub_new.
   */
  async verifyPaymentMethodReplacement(
    userId: string,
    companyId: string,
    input: VerifyPaymentMethodReplacementDto,
  ): Promise<EmployerSubscriptionDto> {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new BadRequestException({
        error: 'subscription_not_found',
        message: 'No subscription found for this company.',
        statusCode: 400,
      });
    }

    const eligibleStatuses = ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'];
    if (!eligibleStatuses.includes(subscription.status)) {
      throw new BadRequestException({
        error: 'invalid_subscription_state',
        message: `Subscription in '${subscription.status}' status cannot update payment method.`,
        statusCode: 400,
      });
    }

    const existingTx = await this.prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId: input.razorpayPaymentId },
    });
    if (existingTx) {
      if (subscription.razorpaySubscriptionId === input.razorpaySubscriptionId) {
        return this.toEmployerSubscriptionDto(subscription);
      }
      throw new BadRequestException({
        error: 'payment_already_processed',
        message: 'This payment transaction has already been verified and processed.',
        statusCode: 400,
      });
    }

    const isValidSignature = this.razorpayProvider.verifyCheckoutSignature({
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpaySignature: input.razorpaySignature,
    });

    if (!isValidSignature) {
      throw new BadRequestException({
        error: 'invalid_payment_signature',
        message: 'Payment verification failed: invalid signature.',
        statusCode: 400,
      });
    }

    let providerSubscription;
    try {
      providerSubscription = await this.razorpayProvider.fetchSubscription(
        input.razorpaySubscriptionId,
      );
    } catch (err) {
      throw new BadRequestException({
        error: 'provider_lookup_failed',
        message: `Failed to verify replacement subscription state with Razorpay: ${(err as Error).message}`,
        statusCode: 400,
      });
    }

    const validProviderStatuses = ['authenticated', 'active'];
    if (!validProviderStatuses.includes(providerSubscription.status.toLowerCase())) {
      throw new BadRequestException({
        error: 'provider_payment_not_authenticated',
        message: `Replacement subscription status '${providerSubscription.status}' is not authenticated or active with provider.`,
        statusCode: 400,
      });
    }

    const providerCompanyId = providerSubscription.notes?.company_id;
    if (providerCompanyId && providerCompanyId !== companyId) {
      throw new BadRequestException({
        error: 'cross_company_replacement_rejected',
        message: 'Submitted replacement subscription belongs to a different company account.',
        statusCode: 400,
      });
    }

    const prevSubIdInNotes = providerSubscription.notes?.previous_subscription_id;
    if (
      prevSubIdInNotes &&
      subscription.razorpaySubscriptionId &&
      subscription.razorpaySubscriptionId !== input.razorpaySubscriptionId &&
      prevSubIdInNotes !== subscription.razorpaySubscriptionId
    ) {
      throw new BadRequestException({
        error: 'stale_replacement_session',
        message:
          'The replacement session is no longer valid because the subscription payment method has already been updated.',
        statusCode: 400,
      });
    }

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

    const subOld = subscription.razorpaySubscriptionId;

    if (subOld === input.razorpaySubscriptionId) {
      return this.toEmployerSubscriptionDto(subscription);
    }

    if (subOld) {
      try {
        await this.razorpayProvider.cancelSubscription({
          razorpaySubscriptionId: subOld,
          cancelAtCycleEnd: false,
        });
      } catch (err) {
        this.logger.error(
          `Failed to cancel old Razorpay subscription '${subOld}' during replacement: ${(err as Error).message}`,
        );
        await this.auditPublisher.record({
          actorId: userId,
          action: 'billing.old_subscription_cancellation_failed',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode: 'PROVIDER_OLD_CANCELLATION_ERROR',
          metadata: {
            companyId,
            previousSubscriptionId: subOld,
            replacementSubscriptionId: input.razorpaySubscriptionId,
            error: (err as Error).message,
          },
        });
      }
    }

    const amountInr = subscription.plan.priceInr ?? 0;

    await this.prisma.paymentTransaction.create({
      data: {
        companyId,
        subscriptionId: subscription.id,
        razorpayPaymentId: input.razorpayPaymentId,
        amountInr,
        status: 'SUCCESS',
      },
    });

    const updatedSubscription = await this.prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpaySubscriptionId: input.razorpaySubscriptionId,
        gracePeriodEndsAt: null,
        canceledAt: null,
      },
      include: { plan: true },
    });

    await this.auditPublisher.record({
      actorId: userId,
      action: 'billing.payment_method_replaced',
      resourceType: 'subscription',
      resourceId: subscription.id,
      reasonCode: 'PAYMENT_METHOD_REPLACED_CONFIRMED',
      metadata: {
        companyId,
        previousSubscriptionId: subOld,
        razorpaySubscriptionId: input.razorpaySubscriptionId,
        razorpayPaymentId: input.razorpayPaymentId,
      },
    });

    return this.toEmployerSubscriptionDto(updatedSubscription);
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
        subscription?: { entity?: { id?: string; plan_id?: string; status?: string } };
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

    let subscription = await this.prisma.employerSubscription.findFirst({
      where: { razorpaySubscriptionId: providerSubId },
      include: { plan: true, pendingPlan: true },
    });

    if (!subscription) {
      try {
        const providerSub = await this.razorpayProvider.fetchSubscription(providerSubId);
        const targetCompanyId = providerSub.notes?.company_id;
        const isReplacement = providerSub.notes?.purpose === 'payment_method_replacement';

        if (
          targetCompanyId &&
          isReplacement &&
          ['authenticated', 'active'].includes(providerSub.status.toLowerCase())
        ) {
          const targetSubscription = await this.prisma.employerSubscription.findUnique({
            where: { companyId: targetCompanyId },
            include: { plan: true, pendingPlan: true },
          });

          if (targetSubscription && targetSubscription.razorpaySubscriptionId !== providerSubId) {
            const prevSubInNotes = providerSub.notes?.previous_subscription_id;
            if (
              prevSubInNotes &&
              targetSubscription.razorpaySubscriptionId &&
              prevSubInNotes !== targetSubscription.razorpaySubscriptionId
            ) {
              this.logger.warn(
                `Stale replacement webhook ignored for provider sub '${providerSubId}': expected previous '${prevSubInNotes}', current is '${targetSubscription.razorpaySubscriptionId}'.`,
              );
              return { processed: true };
            }

            const subOld = targetSubscription.razorpaySubscriptionId;
            if (subOld) {
              try {
                await this.razorpayProvider.cancelSubscription({
                  razorpaySubscriptionId: subOld,
                  cancelAtCycleEnd: false,
                });
              } catch (err) {
                this.logger.error(
                  `Failed to cancel old subscription ${subOld} in webhook replacement: ${(err as Error).message}`,
                );
                await this.auditPublisher.record({
                  actorId: null,
                  action: 'billing.old_subscription_cancellation_failed',
                  resourceType: 'subscription',
                  resourceId: targetSubscription.id,
                  reasonCode: 'PROVIDER_OLD_CANCELLATION_ERROR',
                  metadata: {
                    companyId: targetCompanyId,
                    previousSubscriptionId: subOld,
                    replacementSubscriptionId: providerSubId,
                    error: (err as Error).message,
                  },
                });
              }
            }

            const paymentEntity = payload.payload?.payment?.entity;
            if (paymentEntity?.id) {
              const existingTx = await this.prisma.paymentTransaction.findUnique({
                where: { razorpayPaymentId: paymentEntity.id },
              });
              if (!existingTx) {
                const amountInr = paymentEntity.amount
                  ? Math.round(paymentEntity.amount / 100)
                  : (targetSubscription.plan.priceInr ?? 0);
                await this.prisma.paymentTransaction.create({
                  data: {
                    companyId: targetCompanyId,
                    subscriptionId: targetSubscription.id,
                    razorpayPaymentId: paymentEntity.id,
                    amountInr,
                    status: 'SUCCESS',
                  },
                });
              }
            }

            subscription = await this.prisma.employerSubscription.update({
              where: { id: targetSubscription.id },
              data: {
                status: 'ACTIVE',
                razorpaySubscriptionId: providerSubId,
                gracePeriodEndsAt: null,
                canceledAt: null,
              },
              include: { plan: true, pendingPlan: true },
            });

            await this.auditPublisher.record({
              actorId: null,
              action: 'billing.payment_method_replaced',
              resourceType: 'subscription',
              resourceId: subscription.id,
              reasonCode: 'WEBHOOK_REPLACEMENT_CONFIRMED',
              metadata: {
                companyId: targetCompanyId,
                previousSubscriptionId: subOld,
                razorpaySubscriptionId: providerSubId,
                eventName,
              },
            });
          }
        }
      } catch (err) {
        this.logger.warn(
          `Lookup for replacement subscription '${providerSubId}' failed: ${(err as Error).message}`,
        );
      }
    }

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
      case 'subscription.charged':
      case 'subscription.updated': {
        const providerPlanCode = subEntity?.plan_id;
        let activePlanId = subscription.planId;
        let isDowngradeApplied = false;

        if (providerPlanCode) {
          const providerPlan = await this.prisma.subscriptionPlan.findUnique({
            where: { code: providerPlanCode as PlanCode },
          });

          if (providerPlan) {
            if (subscription.pendingPlanId && subscription.pendingPlanId === providerPlan.id) {
              activePlanId = providerPlan.id;
              isDowngradeApplied = true;
            } else if (!subscription.pendingPlanId) {
              activePlanId = providerPlan.id;
            }
          }
        }

        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            planId: activePlanId,
            pendingPlanId: isDowngradeApplied ? null : subscription.pendingPlanId,
            cancelAtPeriodEnd: isDowngradeApplied ? false : subscription.cancelAtPeriodEnd,
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
          const paymentTx = await this.prisma.paymentTransaction.create({
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
          await this.createInvoiceForSuccessfulPayment(
            subscription.companyId,
            paymentTx.id,
            subscription.id,
          );
        }

        if (isDowngradeApplied) {
          await this.auditPublisher.record({
            actorId: null,
            action: 'billing.subscription_downgrade_applied',
            resourceType: 'subscription',
            resourceId: subscription.id,
            reasonCode: 'WEBHOOK_DOWNGRADE_CONFIRMED',
            metadata: { providerSubId, eventName, planId: activePlanId },
          });
        } else {
          await this.auditPublisher.record({
            actorId: null,
            action: 'billing.subscription_activated',
            resourceType: 'subscription',
            resourceId: subscription.id,
            reasonCode: 'WEBHOOK_SUBSCRIPTION_CHARGED',
            metadata: { providerSubId, eventName },
          });
        }
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

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const isFreeDowngrade =
          subscription.cancelAtPeriodEnd || subscription.pendingPlan?.code === 'FREE';

        if (isFreeDowngrade) {
          const freePlan = await this.prisma.subscriptionPlan.findUnique({
            where: { code: 'FREE' },
          });

          if (freePlan) {
            await this.prisma.employerSubscription.update({
              where: { id: subscription.id },
              data: {
                status: 'ACTIVE',
                planId: freePlan.id,
                pendingPlanId: null,
                cancelAtPeriodEnd: false,
                canceledAt: now,
              },
            });

            await this.prisma.company.update({
              where: { id: subscription.companyId },
              data: { planId: freePlan.id },
            });

            await this.auditPublisher.record({
              actorId: null,
              action: 'billing.subscription_downgrade_applied',
              resourceType: 'subscription',
              resourceId: subscription.id,
              reasonCode: 'WEBHOOK_FREE_DOWNGRADE_CONFIRMED',
              metadata: { providerSubId, eventName, planCode: 'FREE' },
            });
            break;
          }
        }

        const nextStatus = eventName === 'subscription.cancelled' ? 'CANCELED' : 'EXPIRED';
        await this.prisma.employerSubscription.update({
          where: { id: subscription.id },
          data: {
            status: nextStatus,
            canceledAt: eventName === 'subscription.cancelled' ? now : undefined,
          },
        });

        await this.auditPublisher.record({
          actorId: null,
          action:
            eventName === 'subscription.cancelled'
              ? 'billing.subscription_canceled'
              : 'billing.subscription_expired',
          resourceType: 'subscription',
          resourceId: subscription.id,
          reasonCode:
            eventName === 'subscription.cancelled'
              ? 'WEBHOOK_SUBSCRIPTION_CANCELLED'
              : 'WEBHOOK_SUBSCRIPTION_COMPLETED',
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

  /**
   * Idempotently generates an EmployerInvoice for a successful payment transaction.
   * Keyed by unique transactionId constraint.
   */
  async createInvoiceForSuccessfulPayment(
    companyId: string,
    transactionId: string,
    subscriptionId?: string | null,
  ): Promise<EmployerInvoiceDto> {
    const existingInvoice = await this.prisma.employerInvoice.findUnique({
      where: { transactionId },
    });
    if (existingInvoice) {
      return this.mapInvoiceToDto(existingInvoice);
    }

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx || tx.status !== 'SUCCESS') {
      throw new BadRequestException({
        error: 'invalid_transaction_for_invoice',
        message: 'Invoice can only be created for successful payment transactions.',
        statusCode: 400,
      });
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new BadRequestException({
        error: 'company_not_found',
        message: 'Company not found.',
        statusCode: 400,
      });
    }

    const taxRatePercent = env.BILLING_TAX_RATE_PERCENT ?? 0;
    const totalInr = tx.amountInr;
    let subtotalInr = totalInr;
    let taxInr = 0;

    if (taxRatePercent > 0) {
      subtotalInr = Math.round(totalInr / (1 + taxRatePercent / 100));
      taxInr = totalInr - subtotalInr;
    }

    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const invoiceNumber = await this.generateUniqueInvoiceNumber(yearMonth);

    let invoice;
    try {
      invoice = await this.prisma.employerInvoice.create({
        data: {
          invoiceNumber,
          companyId,
          subscriptionId: subscriptionId ?? tx.subscriptionId ?? null,
          transactionId: tx.id,
          subtotalInr,
          appliedTaxRate: taxRatePercent,
          taxInr,
          totalInr,
          gstin: company.gstin ?? null,
          status: 'PAID',
          issuedAt: tx.createdAt,
          paidAt: tx.createdAt,
        },
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2002') {
        const racedInvoice = await this.prisma.employerInvoice.findUnique({
          where: { transactionId },
        });
        if (racedInvoice) {
          return this.mapInvoiceToDto(racedInvoice);
        }
      }
      throw err;
    }

    if (invoice) {
      try {
        const pdfBuffer = await this.generateInvoicePdfBuffer(invoice, company.name);
        const storageKey = `invoices/${companyId}/${invoice.id}.pdf`;
        if (this.storageService) {
          await this.storageService.putObjectBuffer({
            objectKey: storageKey,
            buffer: pdfBuffer,
            contentType: 'application/pdf',
          });
          const updatedInvoice = await this.prisma.employerInvoice.update({
            where: { id: invoice.id },
            data: { pdfStorageKey: storageKey },
          });
          if (updatedInvoice) {
            invoice = updatedInvoice;
          }
        }
      } catch (pdfErr) {
        this.logger.warn(
          `Failed to store PDF for invoice ${invoice.id}: ${(pdfErr as Error).message}`,
        );
      }
    }

    await this.auditPublisher.record({
      actorId: 'system',
      action: 'billing.invoice_generated',
      resourceType: 'invoice',
      resourceId: invoice?.id ?? `inv-${transactionId}`,
      reasonCode: 'INVOICE_CREATED',
      metadata: {
        invoiceNumber: invoice?.invoiceNumber ?? invoiceNumber,
        companyId,
        totalInr,
        taxInr,
      },
    });

    return invoice
      ? this.mapInvoiceToDto(invoice)
      : {
          id: `inv-${transactionId}`,
          invoiceNumber,
          companyId,
          subtotalInr,
          appliedTaxRate: taxRatePercent,
          taxInr,
          totalInr,
          gstin: company.gstin ?? null,
          status: 'PAID',
          pdfStorageKey: null,
          issuedAt: tx.createdAt.toISOString(),
          paidAt: tx.createdAt.toISOString(),
          createdAt: now.toISOString(),
        };
  }

  async listInvoices(companyId: string): Promise<EmployerInvoiceDto[]> {
    const invoices = await this.prisma.employerInvoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map((inv) => this.mapInvoiceToDto(inv));
  }

  async getInvoice(companyId: string, invoiceId: string): Promise<EmployerInvoiceDto> {
    const invoice = await this.prisma.employerInvoice.findFirst({
      where: { id: invoiceId, companyId },
    });
    if (!invoice) {
      throw new BadRequestException({
        error: 'invoice_not_found',
        message: 'Invoice not found or access denied.',
        statusCode: 404,
      });
    }
    return this.mapInvoiceToDto(invoice);
  }

  async getInvoiceDownloadUrl(
    companyId: string,
    invoiceId: string,
  ): Promise<{ downloadUrl: string }> {
    const invoice = await this.prisma.employerInvoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { company: true },
    });
    if (!invoice) {
      throw new BadRequestException({
        error: 'invoice_not_found',
        message: 'Invoice not found or access denied.',
        statusCode: 404,
      });
    }

    let storageKey = invoice.pdfStorageKey;
    if (!storageKey || !this.storageService) {
      const pdfBuffer = await this.generateInvoicePdfBuffer(invoice, invoice.company.name);
      storageKey = `invoices/${companyId}/${invoice.id}.pdf`;
      if (this.storageService) {
        await this.storageService.putObjectBuffer({
          objectKey: storageKey,
          buffer: pdfBuffer,
          contentType: 'application/pdf',
        });
        await this.prisma.employerInvoice.update({
          where: { id: invoice.id },
          data: { pdfStorageKey: storageKey },
        });
      }
    }

    if (this.storageService && storageKey) {
      const downloadUrl = await this.storageService.getSignedDownloadUrl(storageKey);
      return { downloadUrl };
    }

    return { downloadUrl: `/api/v1/billing/invoices/${invoiceId}/download` };
  }

  private async generateUniqueInvoiceNumber(yearMonth: string): Promise<string> {
    const redisKey = `billing:invoice_seq:${yearMonth}`;
    let nextSeq: number;
    try {
      nextSeq = await this.redis.incr(redisKey);
    } catch {
      const prefix = `INV-${yearMonth}-`;
      const highest = await this.prisma.employerInvoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      if (highest) {
        const lastSeq = parseInt(highest.invoiceNumber.replace(prefix, ''), 10);
        nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
      } else {
        nextSeq = 1;
      }
    }
    const indexStr = String(nextSeq).padStart(5, '0');
    return `INV-${yearMonth}-${indexStr}`;
  }

  private async generateInvoicePdfBuffer(
    invoice: EmployerInvoice,
    companyName: string,
  ): Promise<Buffer> {
    const safeCompanyName = companyName.replace(/[()\\]/g, '');
    const lines = [
      '%PDF-1.4',
      '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj',
      '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj',
      '3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>> >> endobj',
      '5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj',
    ];

    const contentText = [
      `BT`,
      `/F1 16 Tf 50 720 Td (INVOICE - SMART PLATFORM) Tj`,
      `/F1 10 Tf 0 -30 Td (Invoice Number: ${invoice.invoiceNumber}) Tj`,
      `0 -15 Td (Company: ${safeCompanyName}) Tj`,
      `0 -15 Td (Date: ${invoice.issuedAt.toISOString().slice(0, 10)}) Tj`,
      `0 -15 Td (GSTIN: ${invoice.gstin || 'N/A'}) Tj`,
      `0 -25 Td (------------------------------------------------) Tj`,
      `0 -20 Td (Subtotal: INR ${invoice.subtotalInr}) Tj`,
      `0 -15 Td (Tax Rate: ${invoice.appliedTaxRate}%) Tj`,
      `0 -15 Td (Tax Amount: INR ${invoice.taxInr}) Tj`,
      `0 -20 Td (Total Amount Paid: INR ${invoice.totalInr}) Tj`,
      `0 -25 Td (Status: ${invoice.status}) Tj`,
      `ET`,
    ].join('\n');

    const streamObj = `4 0 obj <</Length ${contentText.length}>> stream\n${contentText}\nendstream\nendobj`;
    lines.push(streamObj);

    lines.push(
      'xref',
      '0 6',
      '0000000000 65535 f ',
      '0000000009 00000 n ',
      '0000000056 00000 n ',
      '0000000056 00000 n ',
      '0000000111 00000 n ',
      '0000000300 00000 n ',
      '0000000230 00000 n ',
      'trailer <</Size 6 /Root 1 0 R>>',
      'startxref',
      '400',
      '%%EOF',
    );

    return Buffer.from(lines.join('\n'));
  }

  private mapInvoiceToDto(invoice: EmployerInvoice): EmployerInvoiceDto {
    const toIsoStr = (val: Date | string | null | undefined): string => {
      if (!val) return new Date().toISOString();
      if (typeof val === 'string') return val;
      if (val instanceof Date) return val.toISOString();
      return new Date(val).toISOString();
    };

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      subtotalInr: invoice.subtotalInr,
      appliedTaxRate: Number(invoice.appliedTaxRate),
      taxInr: invoice.taxInr,
      totalInr: invoice.totalInr,
      gstin: invoice.gstin,
      status: invoice.status,
      pdfStorageKey: invoice.pdfStorageKey,
      issuedAt: toIsoStr(invoice.issuedAt),
      paidAt: invoice.paidAt ? toIsoStr(invoice.paidAt) : null,
      createdAt: toIsoStr(invoice.createdAt),
    };
  }
}
