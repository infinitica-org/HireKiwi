import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../platform/prisma/prisma.service.js';
import type { RedisService } from '../../platform/redis/redis.service.js';
import type { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { BillingService } from './billing.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { env } from '../../platform/config/env.js';

describe('BillingService', () => {
  let service: BillingService;
  let prismaMock: any;
  let razorpayMock: any;
  let auditPublisherMock: any;
  let redisMock: any;

  const mockCompany = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Acme Corp',
    planId: 'p0000000-0000-0000-0000-000000000001',
  };

  const mockOtherCompany = {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Other Corp',
    planId: 'p0000000-0000-0000-0000-000000000001',
  };

  const mockProPlan = {
    id: 'p0000000-0000-0000-0000-000000000002',
    code: 'PRO',
    name: 'Pro Plan',
    priceInr: 7500,
    isCustomPrice: false,
  };

  const mockFreePlan = {
    id: 'p0000000-0000-0000-0000-000000000001',
    code: 'FREE',
    name: 'Free Plan',
    priceInr: 0,
    isCustomPrice: false,
  };

  const mockEnterprisePlan = {
    id: 'p0000000-0000-0000-0000-000000000003',
    code: 'ENTERPRISE',
    name: 'Enterprise Plan',
    priceInr: null,
    isCustomPrice: true,
  };

  beforeEach(() => {
    prismaMock = {
      company: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      subscriptionPlan: {
        findUnique: vi.fn(),
      },
      employerSubscription: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      paymentTransaction: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    razorpayMock = {
      keyId: 'rzp_test_stub_key_id',
      createSubscription: vi.fn(),
      fetchSubscription: vi.fn(),
      fetchPayment: vi.fn(),
      cancelSubscription: vi.fn(),
      verifyCheckoutSignature: vi.fn(),
      verifyWebhookSignature: vi.fn(),
    };

    auditPublisherMock = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    redisMock = {
      set: vi.fn().mockResolvedValue('OK'),
    };

    service = new BillingService(
      prismaMock as unknown as PrismaService,
      razorpayMock as unknown as RazorpayProvider,
      auditPublisherMock as unknown as AuditPublisherService,
      redisMock as unknown as RedisService,
    );
  });

  describe('getSubscription', () => {
    it('retrieves subscription for the authenticated company', async () => {
      const mockSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockProPlan,
        pendingPlan: null,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);

      const res = await service.getSubscription(mockCompany.id);

      expect(res).not.toBeNull();
      expect(res?.id).toBe(mockSub.id);
      expect(res?.companyId).toBe(mockCompany.id);
      expect(res?.planCode).toBe('PRO');
      expect(prismaMock.employerSubscription.findUnique).toHaveBeenCalledWith({
        where: { companyId: mockCompany.id },
        include: { plan: true, pendingPlan: true },
      });
    });

    it('returns null when company has no subscription', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(null);

      const res = await service.getSubscription(mockCompany.id);

      expect(res).toBeNull();
    });

    it('prevents cross-company subscription retrieval', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(null);

      const res = await service.getSubscription(mockOtherCompany.id);

      expect(res).toBeNull();
      expect(prismaMock.employerSubscription.findUnique).toHaveBeenCalledWith({
        where: { companyId: mockOtherCompany.id },
        include: { plan: true, pendingPlan: true },
      });
    });
  });

  describe('cancelSubscription', () => {
    const mockActiveSub = {
      id: 's0000000-0000-0000-0000-000000000001',
      companyId: mockCompany.id,
      planId: mockProPlan.id,
      pendingPlanId: null,
      razorpaySubscriptionId: 'sub_rzp_123',
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      gracePeriodEndsAt: null,
      isEnterpriseContract: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: mockProPlan,
      pendingPlan: null,
    };

    it('cancels active subscription renewal at period end', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      razorpayMock.cancelSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        cancel_at_cycle_end: true,
      });

      const updatedSub = {
        ...mockActiveSub,
        cancelAtPeriodEnd: true,
      };

      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);

      const res = await service.cancelSubscription('user-1', mockCompany.id);

      expect(res.cancelAtPeriodEnd).toBe(true);
      expect(res.status).toBe('ACTIVE'); // Status remains ACTIVE during period
      expect(razorpayMock.cancelSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_rzp_123',
        cancelAtCycleEnd: true,
      });
      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_cancel_requested',
        }),
      );
    });

    it('rejects cancellation for non-existent subscription', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1', mockCompany.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancellation for subscription in CANCELED or EXPIRED state', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue({
        ...mockActiveSub,
        status: 'CANCELED',
      });

      await expect(service.cancelSubscription('user-1', mockCompany.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('handles provider cancellation failure gracefully', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      razorpayMock.cancelSubscription.mockRejectedValue(new Error('Razorpay 500 Network Error'));

      await expect(service.cancelSubscription('user-1', mockCompany.id)).rejects.toThrow(
        BadRequestException,
      );

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_cancellation_failed',
        }),
      );
    });

    it('handles cross-company cancellation attempt securely', async () => {
      // User belongs to mockCompany, but mockOtherCompany is passed
      prismaMock.employerSubscription.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1', mockOtherCompany.id)).rejects.toThrow(
        BadRequestException,
      );

      expect(prismaMock.employerSubscription.findUnique).toHaveBeenCalledWith({
        where: { companyId: mockOtherCompany.id },
        include: { plan: true, pendingPlan: true },
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('creates a subscription checkout session starting in PENDING status', async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      prismaMock.employerSubscription.findUnique.mockResolvedValue(null);

      const createdSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        status: 'PENDING',
        billingInterval: 'MONTHLY',
        razorpaySubscriptionId: null,
      };

      prismaMock.employerSubscription.create.mockResolvedValue(createdSub);
      razorpayMock.createSubscription.mockResolvedValue({
        providerSubscriptionId: 'sub_rzp_123',
      });
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...createdSub,
        razorpaySubscriptionId: 'sub_rzp_123',
      });

      const res = await service.createCheckoutSession('user-1', mockCompany.id, {
        planCode: 'PRO',
        billingInterval: 'MONTHLY',
      });

      expect(res.subscriptionId).toBe(createdSub.id);
      expect(res.razorpaySubscriptionId).toBe('sub_rzp_123');
      expect(res.amountInr).toBe(7500);
      expect(res.currency).toBe('INR');
      expect(prismaMock.employerSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.checkout_created',
        }),
      );
    });

    it('rejects checkout for FREE plan', async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      await expect(
        service.createCheckoutSession('user-1', mockCompany.id, {
          planCode: 'FREE' as any,
          billingInterval: 'MONTHLY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects checkout for ENTERPRISE plan', async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockEnterprisePlan);

      await expect(
        service.createCheckoutSession('user-1', mockCompany.id, {
          planCode: 'ENTERPRISE',
          billingInterval: 'ANNUAL',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment & Authoritative Verification', () => {
    const mockSub = {
      id: 's0000000-0000-0000-0000-000000000001',
      companyId: mockCompany.id,
      planId: mockProPlan.id,
      pendingPlanId: mockProPlan.id,
      razorpaySubscriptionId: 'sub_rzp_123',
      billingInterval: 'MONTHLY',
      status: 'PENDING',
      plan: mockProPlan,
    };

    it('activates subscription only when provider confirms authenticated/active state', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'authenticated',
      });
      razorpayMock.fetchPayment.mockResolvedValue({ id: 'pay_123', status: 'captured' });

      const updatedSub = {
        ...mockSub,
        status: 'ACTIVE',
        planId: mockProPlan.id,
        pendingPlanId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' });
      prismaMock.company.update.mockResolvedValue(mockCompany);

      const res = await service.verifyPayment('user-1', mockCompany.id, {
        razorpayPaymentId: 'pay_123',
        razorpaySubscriptionId: 'sub_rzp_123',
        razorpaySignature: 'sig_valid',
      });

      expect(res.status).toBe('ACTIVE');
      expect(razorpayMock.fetchSubscription).toHaveBeenCalledWith('sub_rzp_123');
      expect(razorpayMock.fetchPayment).toHaveBeenCalledWith('pay_123');
    });

    it('prevents direct client activation when provider reports unauthenticated state', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockResolvedValue({ id: 'sub_rzp_123', status: 'created' }); // unauthenticated

      await expect(
        service.verifyPayment('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_123',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects verification when provider API fetch fails', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockRejectedValue(new Error('Razorpay 500 Network Error'));

      await expect(
        service.verifyPayment('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_123',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cross-company provider subscription ID', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);

      await expect(
        service.verifyPayment('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_OTHER_COMPANY',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects verification if subscription record has no provider subscription ID', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue({
        ...mockSub,
        razorpaySubscriptionId: null,
      });

      await expect(
        service.verifyPayment('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_123',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects replayed razorpayPaymentId gracefully without P2002 exception', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue({
        id: 'existing-tx-id',
        razorpayPaymentId: 'pay_123',
      });

      await expect(
        service.verifyPayment('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_123',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook & Idempotency', () => {
    it('rejects invalid webhook signatures', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(service.handleWebhook('{}', 'invalid_sig')).rejects.toThrow(BadRequestException);
    });

    it('ignores duplicate webhook events via Redis deduplication', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue(null); // Key already exists

      const res = await service.handleWebhook(
        JSON.stringify({ id: 'evt_dup_1', event: 'subscription.charged' }),
        'valid_sig',
      );

      expect(res.duplicate).toBe(true);
    });

    it('throws ServiceUnavailableException when Redis deduplication fails', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(
        service.handleWebhook(
          JSON.stringify({ id: 'evt_1', event: 'subscription.charged' }),
          'valid_sig',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('transitions subscription to GRACE_PERIOD on payment.failed event', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      const mockSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        billingInterval: 'MONTHLY',
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockSub);
      prismaMock.employerSubscription.update.mockResolvedValue({});
      prismaMock.paymentTransaction.create.mockResolvedValue({});

      const payload = {
        id: 'evt_fail_1',
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_fail_1',
              subscription_id: 'sub_rzp_123',
              amount: 750000,
              error_description: 'Card declined',
            },
          },
        },
      };

      await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'GRACE_PERIOD',
          }),
        }),
      );
    });

    it('transitions subscription to CANCELED on subscription.cancelled event', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      const mockSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        razorpaySubscriptionId: 'sub_rzp_123',
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockSub);
      prismaMock.employerSubscription.update.mockResolvedValue({});

      const payload = {
        id: 'evt_cancel_1',
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_123',
            },
          },
        },
      };

      await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELED',
          }),
        }),
      );
    });

    it('transitions subscription to EXPIRED on subscription.completed event', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      const mockSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        razorpaySubscriptionId: 'sub_rzp_123',
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockSub);
      prismaMock.employerSubscription.update.mockResolvedValue({});

      const payload = {
        id: 'evt_complete_1',
        event: 'subscription.completed',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_123',
            },
          },
        },
      };

      await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EXPIRED',
          }),
        }),
      );
    });
  });

  describe('RazorpayProvider Stub Security', () => {
    it('rejects sig_stub_ in production environment', () => {
      const realEnv = process.env.NODE_ENV;
      try {
        (env as any).NODE_ENV = 'production';
        const provider = new RazorpayProvider();
        const isValid = provider.verifyCheckoutSignature({
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_123',
          razorpaySignature: 'sig_stub_123',
        });
        expect(isValid).toBe(false);
      } finally {
        (env as any).NODE_ENV = realEnv;
      }
    });
  });
});
