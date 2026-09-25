import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { env } from '../../../platform/config/env.js';
import { RazorpayProvider } from './razorpay.provider.js';

describe('RazorpayProvider', () => {
  const provider = new RazorpayProvider();

  describe('Webhook Raw Body Verification', () => {
    it('verifies exact raw request body bytes and rejects differently serialized JSON', () => {
      const secret = 'webhook_secret_test_123';
      (env as any).RAZORPAY_WEBHOOK_SECRET = secret;

      const rawBody = '{"event":"subscription.charged","id":"evt_123"}';
      const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

      // Exact raw body matches signature
      const valid = provider.verifyWebhookSignature(rawBody, signature);
      expect(valid).toBe(true);

      // Re-serialized JSON with different whitespace/formatting fails signature
      const differentlySerialized = '{\n  "event": "subscription.charged",\n  "id": "evt_123"\n}';
      const invalid = provider.verifyWebhookSignature(differentlySerialized, signature);
      expect(invalid).toBe(false);
    });
  });

  describe('Production Security Guards', () => {
    it('rejects sig_stub_ webhook signature in production', () => {
      const origEnv = env.NODE_ENV;
      try {
        (env as any).NODE_ENV = 'production';
        (env as any).RAZORPAY_WEBHOOK_SECRET = undefined;
        const valid = provider.verifyWebhookSignature('{}', 'sig_stub_123');
        expect(valid).toBe(false);
      } finally {
        (env as any).NODE_ENV = origEnv;
      }
    });

    it('rejects sig_stub_ checkout signature in production', () => {
      const origEnv = env.NODE_ENV;
      try {
        (env as any).NODE_ENV = 'production';
        const valid = provider.verifyCheckoutSignature({
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_123',
          razorpaySignature: 'sig_stub_123',
        });
        expect(valid).toBe(false);
      } finally {
        (env as any).NODE_ENV = origEnv;
      }
    });

    it('throws error on fetchSubscription when unconfigured in production', async () => {
      const origEnv = env.NODE_ENV;
      try {
        (env as any).NODE_ENV = 'production';
        (env as any).RAZORPAY_KEY_ID = undefined;
        (env as any).RAZORPAY_KEY_SECRET = undefined;

        await expect(provider.fetchSubscription('sub_stub_123')).rejects.toThrow(
          'Razorpay API keys missing in production environment.',
        );
      } finally {
        (env as any).NODE_ENV = origEnv;
      }
    });
  });
});
