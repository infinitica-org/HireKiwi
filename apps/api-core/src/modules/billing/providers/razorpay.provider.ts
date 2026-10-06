import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { BillingInterval } from '@hirekiwi/contracts';
import { env } from '../../../platform/config/env.js';

export interface CreateProviderSubscriptionInput {
  readonly planCode: string;
  readonly billingInterval: BillingInterval;
  readonly amountInr: number;
  readonly companyId: string;
  readonly notes?: Record<string, string>;
}

export interface CreateProviderSubscriptionResult {
  readonly providerSubscriptionId: string;
  readonly providerOrderId?: string;
  readonly shortUrl?: string;
}

export interface VerifyCheckoutSignatureInput {
  readonly razorpayPaymentId: string;
  readonly razorpaySubscriptionId?: string;
  readonly razorpayOrderId?: string;
  readonly razorpaySignature: string;
}

export interface RazorpaySubscriptionResource {
  readonly id: string;
  readonly status: string;
  readonly plan_id?: string;
  readonly customer_id?: string;
  readonly notes?: Record<string, string>;
}

export interface RazorpayPaymentResource {
  readonly id: string;
  readonly status: string;
  readonly order_id?: string;
  readonly subscription_id?: string;
  readonly amount?: number;
}

export interface CancelProviderSubscriptionInput {
  readonly razorpaySubscriptionId: string;
  readonly cancelAtCycleEnd?: boolean;
}

export interface RazorpayCancelSubscriptionResult {
  readonly id: string;
  readonly status: string;
  readonly cancel_at_cycle_end: boolean;
}

export interface UpdateProviderSubscriptionInput {
  readonly razorpaySubscriptionId: string;
  readonly razorpayPlanId: string;
  readonly scheduleChangeAt?: 'now' | 'cycle_end';
  readonly customerNotify?: boolean;
}

export interface RazorpayUpdateSubscriptionResult {
  readonly id: string;
  readonly status: string;
  readonly plan_id: string;
  readonly schedule_change_at?: string;
}

@Injectable()
export class RazorpayProvider {
  private readonly logger = new Logger(RazorpayProvider.name);

  get isConfigured(): boolean {
    return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  }

  get keyId(): string {
    if (!this.isConfigured && env.NODE_ENV === 'production') {
      throw new Error('RAZORPAY_KEY_ID is missing in production environment.');
    }
    return env.RAZORPAY_KEY_ID ?? 'rzp_test_stub_key_id';
  }

  /**
   * Creates a provider subscription or checkout session on Razorpay API.
   * If Razorpay credentials are not set in non-production, returns a stub subscription ID.
   * In production, credentials MUST be configured.
   */
  async createSubscription(
    input: CreateProviderSubscriptionInput,
  ): Promise<CreateProviderSubscriptionResult> {
    const amountInPaise = input.amountInr * 100;

    if (!this.isConfigured) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Razorpay API keys are required in production environment.');
      }
      this.logger.warn(
        `Razorpay API keys not configured. Using stub checkout session for company ${input.companyId}, plan ${input.planCode} (${amountInPaise} paise).`,
      );
      const stubId = `sub_stub_${Date.now()}_${input.companyId.slice(0, 8)}`;
      return {
        providerSubscriptionId: stubId,
        shortUrl: `https://rzp.test/s/${stubId}`,
      };
    }

    try {
      const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
        'base64',
      );

      const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: input.planCode,
          total_count: input.billingInterval === 'ANNUAL' ? 10 : 120,
          quantity: 1,
          customer_notify: 1,
          notes: {
            company_id: input.companyId,
            plan_code: input.planCode,
            billing_interval: input.billingInterval,
            ...input.notes,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Razorpay API subscription creation failed: ${errorText}`);
        throw new Error(`Razorpay API error: ${response.statusText}`);
      }

      const data = (await response.json()) as { id: string; short_url?: string };
      return {
        providerSubscriptionId: data.id,
        shortUrl: data.short_url,
      };
    } catch (err) {
      this.logger.error(`Failed to create Razorpay subscription: ${(err as Error).message}`);
      if (env.NODE_ENV !== 'production') {
        const stubId = `sub_stub_fallback_${Date.now()}`;
        return { providerSubscriptionId: stubId };
      }
      throw err;
    }
  }

  /**
   * Fetches authoritative subscription state from Razorpay API.
   */
  async fetchSubscription(subscriptionId: string): Promise<RazorpaySubscriptionResource> {
    if (!this.isConfigured) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Razorpay API keys missing in production environment.');
      }
      if (subscriptionId.startsWith('sub_stub_')) {
        return {
          id: subscriptionId,
          status: 'authenticated',
          notes: {
            purpose: subscriptionId.includes('replace') ? 'payment_method_replacement' : 'checkout',
          },
        };
      }
      throw new Error(`Cannot fetch subscription ${subscriptionId} without Razorpay credentials.`);
    }

    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      'base64',
    );

    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to fetch Razorpay subscription ${subscriptionId}: ${errorText}`);
      throw new Error(`Razorpay subscription lookup failed: ${response.statusText}`);
    }

    return (await response.json()) as RazorpaySubscriptionResource;
  }

  /**
   * Fetches authoritative payment state from Razorpay API.
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPaymentResource> {
    if (!this.isConfigured) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Razorpay API keys missing in production environment.');
      }
      if (paymentId.startsWith('pay_stub_')) {
        return {
          id: paymentId,
          status: 'captured',
        };
      }
      throw new Error(`Cannot fetch payment ${paymentId} without Razorpay credentials.`);
    }

    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      'base64',
    );

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to fetch Razorpay payment ${paymentId}: ${errorText}`);
      throw new Error(`Razorpay payment lookup failed: ${response.statusText}`);
    }

    return (await response.json()) as RazorpayPaymentResource;
  }

  /**
   * Cancels a Razorpay subscription at cycle end or immediately.
   */
  async cancelSubscription(
    input: CancelProviderSubscriptionInput,
  ): Promise<RazorpayCancelSubscriptionResult> {
    const cancelAtCycleEnd = input.cancelAtCycleEnd ?? true;

    if (!this.isConfigured) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Razorpay API keys missing in production environment.');
      }
      if (input.razorpaySubscriptionId.startsWith('sub_stub_')) {
        return {
          id: input.razorpaySubscriptionId,
          status: 'active',
          cancel_at_cycle_end: true,
        };
      }
      throw new Error(
        `Cannot cancel subscription ${input.razorpaySubscriptionId} without Razorpay credentials.`,
      );
    }

    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      'base64',
    );

    const response = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${input.razorpaySubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to cancel Razorpay subscription ${input.razorpaySubscriptionId}: ${errorText}`,
      );
      throw new Error(`Razorpay subscription cancellation failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      id: string;
      status: string;
      cancel_at_cycle_end?: boolean | number;
    };

    return {
      id: data.id,
      status: data.status,
      cancel_at_cycle_end: Boolean(data.cancel_at_cycle_end),
    };
  }

  /**
   * Updates an existing Razorpay subscription plan immediately ('now') or at cycle end ('cycle_end').
   */
  async updateSubscription(
    input: UpdateProviderSubscriptionInput,
  ): Promise<RazorpayUpdateSubscriptionResult> {
    const scheduleChangeAt = input.scheduleChangeAt ?? 'now';

    if (!this.isConfigured) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Razorpay API keys missing in production environment.');
      }
      if (input.razorpaySubscriptionId.startsWith('sub_stub_')) {
        return {
          id: input.razorpaySubscriptionId,
          status: 'active',
          plan_id: input.razorpayPlanId,
          schedule_change_at: scheduleChangeAt,
        };
      }
      throw new Error(
        `Cannot update subscription ${input.razorpaySubscriptionId} without Razorpay credentials.`,
      );
    }

    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      'base64',
    );

    const response = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${input.razorpaySubscriptionId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: input.razorpayPlanId,
          schedule_change_at: scheduleChangeAt,
          customer_notify: input.customerNotify ? 1 : 0,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to update Razorpay subscription ${input.razorpaySubscriptionId}: ${errorText}`,
      );
      throw new Error(`Razorpay subscription update failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      id: string;
      status: string;
      plan_id: string;
      schedule_change_at?: string;
    };

    return {
      id: data.id,
      status: data.status,
      plan_id: data.plan_id,
      schedule_change_at: data.schedule_change_at,
    };
  }

  /**
   * Verifies the Razorpay checkout response signature.
   * Stub signatures ('sig_stub_') are strictly REJECTED in production.
   */
  verifyCheckoutSignature(input: VerifyCheckoutSignatureInput): boolean {
    if (env.NODE_ENV === 'production' && input.razorpaySignature.startsWith('sig_stub_')) {
      this.logger.error('Stub signature rejected in production environment.');
      return false;
    }

    if (!this.isConfigured) {
      if (env.NODE_ENV !== 'production' && input.razorpaySignature.startsWith('sig_stub_')) {
        return true;
      }
      this.logger.warn('Razorpay secret not configured. Rejecting checkout signature.');
      return false;
    }

    const secret = env.RAZORPAY_KEY_SECRET ?? '';

    let payload = '';
    if (input.razorpaySubscriptionId) {
      payload = `${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`;
    } else if (input.razorpayOrderId) {
      payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    } else {
      return false;
    }

    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

    return this.secureCompare(expectedSignature, input.razorpaySignature);
  }

  /**
   * Verifies Razorpay Webhook signature against raw HTTP body string.
   * Stub signatures ('sig_stub_') are strictly REJECTED in production.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (env.NODE_ENV === 'production' && signature.startsWith('sig_stub_')) {
      this.logger.error('Stub webhook signature rejected in production environment.');
      return false;
    }

    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      if (
        !this.isConfigured &&
        env.NODE_ENV !== 'production' &&
        signature.startsWith('sig_stub_')
      ) {
        return true;
      }
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting webhook signature.');
      return false;
    }

    const expectedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    return this.secureCompare(expectedSignature, signature);
  }

  private secureCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
