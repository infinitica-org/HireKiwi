import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  API_PREFIX,
  CreateCheckoutSessionSchema,
  VerifyPaymentSchema,
  type CheckoutSessionResponseDto,
  type EmployerSubscriptionDto,
} from '@smart/contracts';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/guards/public.decorator.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { BillingService } from './billing.service.js';

@ApiTags('billing')
@Controller(`${API_PREFIX}/billing`)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('subscription/me')
  @Roles('COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve authenticated employer subscription status (Phase 3A).' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription retrieved or null if unsubscribed.',
  })
  @ApiResponse({ status: 403, description: 'Caller is not associated with a company account.' })
  async getSubscription(@CurrentUser() user: RequestUser): Promise<EmployerSubscriptionDto | null> {
    const companyId = user.companyId;
    if (!companyId) {
      throw new ForbiddenException({
        error: 'company_required',
        message: 'Authenticated user is not linked to a company account.',
        statusCode: 403,
      });
    }

    return this.billingService.getSubscription(companyId);
  }

  @Post('subscriptions/checkout')
  @Roles('COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or reuse a subscription checkout session (Phase 2).' })
  @ApiResponse({ status: 201, description: 'Checkout session created with Razorpay details.' })
  @ApiResponse({
    status: 400,
    description: 'FREE or ENTERPRISE plan cannot be checked out self-service.',
  })
  @ApiResponse({ status: 403, description: 'Caller is not associated with an active company.' })
  async createCheckoutSession(
    @CurrentUser() user: RequestUser,
    @Body() body: unknown,
  ): Promise<CheckoutSessionResponseDto> {
    const companyId = user.companyId;
    if (!companyId) {
      throw new ForbiddenException({
        error: 'company_required',
        message: 'Authenticated user is not linked to a company account.',
        statusCode: 403,
      });
    }

    const parsedInput = CreateCheckoutSessionSchema.parse(body);
    return this.billingService.createCheckoutSession(user.sub, companyId, parsedInput);
  }

  @Post('subscriptions/verify')
  @Roles('COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate subscription.' })
  @ApiResponse({ status: 200, description: 'Subscription activated and company plan synced.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or cross-company verification rejected.',
  })
  async verifyPayment(
    @CurrentUser() user: RequestUser,
    @Body() body: unknown,
  ): Promise<EmployerSubscriptionDto> {
    const companyId = user.companyId;
    if (!companyId) {
      throw new ForbiddenException({
        error: 'company_required',
        message: 'Authenticated user is not linked to a company account.',
        statusCode: 403,
      });
    }

    const parsedInput = VerifyPaymentSchema.parse(body);
    return this.billingService.verifyPayment(user.sub, companyId, parsedInput);
  }

  @Post('subscriptions/cancel')
  @Roles('COMPANY')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel employer subscription renewal at end of current period (Phase 3A).',
  })
  @ApiResponse({ status: 200, description: 'Subscription scheduled for period-end cancellation.' })
  @ApiResponse({
    status: 400,
    description: 'No active subscription or invalid state for cancellation.',
  })
  async cancelSubscription(@CurrentUser() user: RequestUser): Promise<EmployerSubscriptionDto> {
    const companyId = user.companyId;
    if (!companyId) {
      throw new ForbiddenException({
        error: 'company_required',
        message: 'Authenticated user is not linked to a company account.',
        statusCode: 403,
      });
    }

    return this.billingService.cancelSubscription(user.sub, companyId);
  }

  @Post('webhooks/razorpay')
  @Public()
  @ApiOperation({ summary: 'Razorpay webhook receiver for subscription and payment events.' })
  @ApiResponse({ status: 200, description: 'Webhook event processed idempotently.' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload.' })
  async handleRazorpayWebhook(
    @Req() request: FastifyRequest,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ): Promise<{ processed: boolean; duplicate?: boolean }> {
    const rawBody =
      ((request as unknown as Record<string, unknown>).rawBody as string | undefined) ??
      (typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {}));

    return this.billingService.handleWebhook(rawBody, signature ?? '');
  }
}
