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

  const mockBasicPlan = {
    id: 'p0000000-0000-0000-0000-000000000004',
    code: 'BASIC',
    name: 'Basic Plan',
    priceInr: 2500,
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

  let storageMock: any;

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
      employerInvoice: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn().mockImplementation(async (args: any) => ({
          id: 'inv-0000000-0000-0000-0000-000000000001',
          ...args.data,
          createdAt: args.data?.issuedAt ?? new Date(),
          updatedAt: new Date(),
        })),
        update: vi.fn().mockImplementation(async (args: any) => ({
          id: args.where?.id ?? 'inv-0000000-0000-0000-0000-000000000001',
          ...args.data,
        })),
      },
    };

    razorpayMock = {
      keyId: 'rzp_test_stub_key_id',
      createSubscription: vi.fn(),
      fetchSubscription: vi.fn(),
      fetchPayment: vi.fn(),
      cancelSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      verifyCheckoutSignature: vi.fn(),
      verifyWebhookSignature: vi.fn(),
    };

    auditPublisherMock = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    redisMock = {
      set: vi.fn().mockResolvedValue('OK'),
      incr: vi.fn().mockResolvedValue(1),
    };

    storageMock = {
      putObjectBuffer: vi.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: vi.fn().mockResolvedValue('https://storage.local/invoice.pdf'),
    };

    service = new BillingService(
      prismaMock as unknown as PrismaService,
      razorpayMock as unknown as RazorpayProvider,
      auditPublisherMock as unknown as AuditPublisherService,
      redisMock as unknown as RedisService,
      storageMock as unknown as any,
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
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.paymentTransaction.findUnique.mockImplementation(async ({ where }: any) => {
        if (where?.id) {
          return { id: where.id, amountInr: 7500, status: 'SUCCESS' };
        }
        return null;
      });
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

  describe('upgradeSubscription', () => {
    it('successfully upgrades subscription from FREE to PRO with provider update', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
      });

      const updatedSub = {
        ...mockCurrentSub,
        planId: mockProPlan.id,
        plan: mockProPlan,
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.company.update.mockResolvedValue({});

      const result = await service.upgradeSubscription('user-1', mockCompany.id, {
        planCode: 'PRO',
        billingInterval: 'MONTHLY',
      });

      expect(razorpayMock.updateSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_rzp_123',
        razorpayPlanId: 'PRO',
        scheduleChangeAt: 'now',
        customerNotify: true,
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCurrentSub.id },
          data: expect.objectContaining({
            planId: mockProPlan.id,
            pendingPlanId: null,
            status: 'ACTIVE',
          }),
        }),
      );

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockProPlan.id },
      });

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_upgraded',
          resourceId: mockCurrentSub.id,
        }),
      );

      expect(result.planCode).toBe('PRO');
    });

    it('rejects upgrade to ENTERPRISE plan requiring custom contract', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);

      await expect(
        service.upgradeSubscription('user-1', mockCompany.id, {
          planCode: 'ENTERPRISE' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects upgrade to lower or equal plan rank (e.g. PRO -> BASIC)', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockProPlan,
      };

      const mockBasicPlan = {
        id: 'p0000000-0000-0000-0000-000000000004',
        code: 'BASIC',
        name: 'Basic Plan',
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);

      await expect(
        service.upgradeSubscription('user-1', mockCompany.id, {
          planCode: 'BASIC',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles provider failure gracefully without updating local DB', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockRejectedValue(new Error('Razorpay network error'));

      await expect(
        service.upgradeSubscription('user-1', mockCompany.id, {
          planCode: 'PRO',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
      expect(prismaMock.company.update).not.toHaveBeenCalled();

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_upgrade_failed',
        }),
      );
    });

    it('rejects upgrade and keeps DB unchanged when provider returns mismatched plan_id', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'BASIC',
      });

      await expect(
        service.upgradeSubscription('user-1', mockCompany.id, {
          planCode: 'PRO',
          billingInterval: 'MONTHLY',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
      expect(prismaMock.company.update).not.toHaveBeenCalled();

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_upgrade_failed',
        }),
      );
    });

    it('preserves existing billing interval when billingInterval is omitted', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'ANNUAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
      });

      const updatedSub = {
        ...mockCurrentSub,
        planId: mockProPlan.id,
        plan: mockProPlan,
        billingInterval: 'ANNUAL',
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.company.update.mockResolvedValue({});

      await service.upgradeSubscription('user-1', mockCompany.id, {
        planCode: 'PRO',
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billingInterval: 'ANNUAL',
          }),
        }),
      );
    });

    it('handles explicit ANNUAL billing interval requested by client', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
      });

      const updatedSub = {
        ...mockCurrentSub,
        planId: mockProPlan.id,
        plan: mockProPlan,
        billingInterval: 'ANNUAL',
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.company.update.mockResolvedValue({});

      await service.upgradeSubscription('user-1', mockCompany.id, {
        planCode: 'PRO',
        billingInterval: 'ANNUAL',
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billingInterval: 'ANNUAL',
          }),
        }),
      );
    });

    it('rejects upgrade before provider call when target plan code is empty', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockFreePlan,
      };

      const mockPlanNoCode = {
        id: 'p0000000-0000-0000-0000-000000000099',
        code: '',
        name: 'Invalid Plan',
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockPlanNoCode);

      await expect(
        service.upgradeSubscription('user-1', mockCompany.id, {
          planCode: 'PRO',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(razorpayMock.updateSubscription).not.toHaveBeenCalled();
      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
    });

    it('clears pre-existing pendingPlanId upon successful upgrade', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockFreePlan.id,
        pendingPlanId: 'p0000000-0000-0000-0000-000000000004',
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
      });

      const updatedSub = {
        ...mockCurrentSub,
        planId: mockProPlan.id,
        pendingPlanId: null,
        plan: mockProPlan,
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.company.update.mockResolvedValue({});

      const result = await service.upgradeSubscription('user-1', mockCompany.id, {
        planCode: 'PRO',
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockProPlan.id,
            pendingPlanId: null,
          }),
        }),
      );

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockProPlan.id },
      });

      expect(result.pendingPlanId).toBeNull();
    });
  });

  describe('downgradeSubscription & Phase 4B Webhooks', () => {
    it('schedules PRO -> BASIC downgrade at cycle end and preserves active PRO plan', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockProPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockImplementation(async ({ where }: any) => {
        if (where.code === 'BASIC') return mockBasicPlan;
        return null;
      });

      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
        has_scheduled_changes: true,
      });

      const updatedSub = {
        ...mockCurrentSub,
        pendingPlanId: mockBasicPlan.id,
        pendingPlan: mockBasicPlan,
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);

      const result = await service.downgradeSubscription('user-1', mockCompany.id, {
        planCode: 'BASIC',
      });

      expect(razorpayMock.updateSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_rzp_123',
        razorpayPlanId: 'BASIC',
        scheduleChangeAt: 'cycle_end',
        customerNotify: true,
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCurrentSub.id },
          data: expect.objectContaining({
            pendingPlanId: mockBasicPlan.id,
            cancelAtPeriodEnd: false,
          }),
        }),
      );

      expect(prismaMock.company.update).not.toHaveBeenCalled();
      expect(result.planId).toBe(mockProPlan.id);
      expect(result.pendingPlanId).toBe(mockBasicPlan.id);
    });

    it('schedules PRO -> FREE downgrade via cycle-end cancellation', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: null,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockProPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockImplementation(async ({ where }: any) => {
        if (where.code === 'FREE') return mockFreePlan;
        return null;
      });

      razorpayMock.cancelSubscription.mockResolvedValue({ id: 'sub_rzp_123' });

      const updatedSub = {
        ...mockCurrentSub,
        pendingPlanId: mockFreePlan.id,
        cancelAtPeriodEnd: true,
        pendingPlan: mockFreePlan,
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);

      const result = await service.downgradeSubscription('user-1', mockCompany.id, {
        planCode: 'FREE',
      });

      expect(razorpayMock.cancelSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_rzp_123',
        cancelAtCycleEnd: true,
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pendingPlanId: mockFreePlan.id,
            cancelAtPeriodEnd: true,
          }),
        }),
      );

      expect(result.planId).toBe(mockProPlan.id);
      expect(result.pendingPlanId).toBe(mockFreePlan.id);
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('rejects same-plan downgrade request (BASIC -> BASIC)', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);

      await expect(
        service.downgradeSubscription('user-1', mockCompany.id, { planCode: 'BASIC' }),
      ).rejects.toThrow(BadRequestException);

      expect(razorpayMock.updateSubscription).not.toHaveBeenCalled();
    });

    it('rejects upgrade passed to downgrade endpoint (BASIC -> PRO)', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);

      await expect(
        service.downgradeSubscription('user-1', mockCompany.id, { planCode: 'PRO' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects ENTERPRISE plan downgrade target', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        status: 'ACTIVE',
        plan: mockProPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);

      await expect(
        service.downgradeSubscription('user-1', mockCompany.id, { planCode: 'ENTERPRISE' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('records audit event and leaves DB unchanged on provider downgrade failure', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        plan: mockProPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      razorpayMock.updateSubscription.mockRejectedValue(new Error('Razorpay error'));

      await expect(
        service.downgradeSubscription('user-1', mockCompany.id, { planCode: 'BASIC' }),
      ).rejects.toThrow(BadRequestException);

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_downgrade_failed',
        }),
      );
      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
    });

    it('returns existing state idempotently for identical repeated downgrade request', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: mockBasicPlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockProPlan,
        pendingPlan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);

      const result = await service.downgradeSubscription('user-1', mockCompany.id, {
        planCode: 'BASIC',
      });

      expect(razorpayMock.updateSubscription).not.toHaveBeenCalled();
      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
      expect(result.pendingPlanId).toBe(mockBasicPlan.id);
    });

    it('applies pending paid downgrade on period-end webhook confirmation', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: mockBasicPlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        plan: mockProPlan,
        pendingPlan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockCurrentSub,
        planId: mockBasicPlan.id,
        pendingPlanId: null,
      });
      prismaMock.company.update.mockResolvedValue({});
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);

      const webhookPayload = JSON.stringify({
        id: 'evt_123',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_123', plan_id: 'BASIC' },
          },
        },
      });

      const result = await service.handleWebhook(webhookPayload, 'sig_123');

      expect(result.processed).toBe(true);
      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockBasicPlan.id,
            pendingPlanId: null,
            cancelAtPeriodEnd: false,
          }),
        }),
      );
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockBasicPlan.id },
      });
      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.subscription_downgrade_applied',
        }),
      );
    });

    it('applies FREE downgrade on period-end cancellation webhook', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: mockFreePlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        cancelAtPeriodEnd: true,
        billingInterval: 'MONTHLY',
        plan: mockProPlan,
        pendingPlan: mockFreePlan,
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockCurrentSub,
        planId: mockFreePlan.id,
        pendingPlanId: null,
        cancelAtPeriodEnd: false,
      });
      prismaMock.company.update.mockResolvedValue({});
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);

      const webhookPayload = JSON.stringify({
        id: 'evt_456',
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_123' },
          },
        },
      });

      const result = await service.handleWebhook(webhookPayload, 'sig_456');

      expect(result.processed).toBe(true);
      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
            planId: mockFreePlan.id,
            pendingPlanId: null,
            cancelAtPeriodEnd: false,
          }),
        }),
      );
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockFreePlan.id },
      });
    });

    it('sets pendingPlanId to FREE on explicit cancellation when a paid downgrade was pending', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: mockBasicPlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockProPlan,
        pendingPlan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);
      razorpayMock.cancelSubscription.mockResolvedValue({ id: 'sub_rzp_123' });
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockCurrentSub,
        cancelAtPeriodEnd: true,
        pendingPlanId: mockFreePlan.id,
        pendingPlan: mockFreePlan,
      });

      const result = await service.cancelSubscription('user-1', mockCompany.id);

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cancelAtPeriodEnd: true,
            pendingPlanId: mockFreePlan.id,
          }),
        }),
      );
      expect(result.pendingPlanId).toBe(mockFreePlan.id);
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('does not apply downgrade when provider webhook before cycle end reports current active plan', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockProPlan.id,
        pendingPlanId: mockBasicPlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        billingInterval: 'MONTHLY',
        plan: mockProPlan,
        pendingPlan: mockBasicPlan,
      };

      prismaMock.employerSubscription.findFirst.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockCurrentSub,
        planId: mockProPlan.id,
        pendingPlanId: mockBasicPlan.id,
      });
      prismaMock.company.update.mockResolvedValue({});
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);

      const webhookPayload = JSON.stringify({
        id: 'evt_mid_cycle',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_123', plan_id: 'PRO' },
          },
        },
      });

      const result = await service.handleWebhook(webhookPayload, 'sig_mid_cycle');

      expect(result.processed).toBe(true);
      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockProPlan.id,
            pendingPlanId: mockBasicPlan.id,
          }),
        }),
      );
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockProPlan.id },
      });
    });

    it('overrides pending FREE downgrade and clears cancelAtPeriodEnd when upgrading to PRO', async () => {
      const mockCurrentSub = {
        id: 's0000000-0000-0000-0000-000000000001',
        companyId: mockCompany.id,
        planId: mockBasicPlan.id,
        pendingPlanId: mockFreePlan.id,
        razorpaySubscriptionId: 'sub_rzp_123',
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: null,
        gracePeriodEndsAt: null,
        isEnterpriseContract: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockBasicPlan,
        pendingPlan: mockFreePlan,
      };

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockCurrentSub);
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue(mockProPlan);
      razorpayMock.updateSubscription.mockResolvedValue({
        id: 'sub_rzp_123',
        status: 'active',
        plan_id: 'PRO',
      });
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockCurrentSub,
        planId: mockProPlan.id,
        pendingPlanId: null,
        cancelAtPeriodEnd: false,
        plan: mockProPlan,
        pendingPlan: null,
      });
      prismaMock.company.update.mockResolvedValue({});

      const result = await service.upgradeSubscription('user-1', mockCompany.id, {
        planCode: 'PRO',
      });

      expect(razorpayMock.updateSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_rzp_123',
        razorpayPlanId: 'PRO',
        scheduleChangeAt: 'now',
        customerNotify: true,
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockProPlan.id,
            pendingPlanId: null,
            cancelAtPeriodEnd: false,
          }),
        }),
      );
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: mockCompany.id },
        data: { planId: mockProPlan.id },
      });
      expect(result.planId).toBe(mockProPlan.id);
      expect(result.pendingPlanId).toBeNull();
      expect(result.cancelAtPeriodEnd).toBe(false);
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

  describe('Ticket 4 — Payment Method Replacement Flow', () => {
    const mockActiveSub = {
      id: 's0000000-0000-0000-0000-000000000001',
      companyId: mockCompany.id,
      planId: mockProPlan.id,
      pendingPlanId: null,
      razorpaySubscriptionId: 'sub_old_123',
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      gracePeriodEndsAt: null,
      isEnterpriseContract: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: mockProPlan,
      pendingPlan: null,
    };

    it('creates replacement session sub_new without mutating sub_old in database', async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      razorpayMock.createSubscription.mockResolvedValue({
        providerSubscriptionId: 'sub_new_456',
      });

      const res = await service.createPaymentMethodReplacementSession('user-1', mockCompany.id);

      expect(res.subscriptionId).toBe(mockActiveSub.id);
      expect(res.razorpaySubscriptionId).toBe('sub_new_456');
      expect(res.companyName).toBe('Acme Corp');

      expect(razorpayMock.createSubscription).toHaveBeenCalledWith({
        planCode: 'PRO',
        billingInterval: 'MONTHLY',
        amountInr: 7500,
        companyId: mockCompany.id,
        notes: {
          company_id: mockCompany.id,
          purpose: 'payment_method_replacement',
          previous_subscription_id: 'sub_old_123',
        },
      });

      // Database is NOT updated yet
      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.payment_method_replacement_requested',
          metadata: expect.objectContaining({
            companyId: mockCompany.id,
            previousSubscriptionId: 'sub_old_123',
            replacementSubscriptionId: 'sub_new_456',
          }),
        }),
      );
    });

    it('rejects replacement session creation for FREE plan', async () => {
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.employerSubscription.findUnique.mockResolvedValue({
        ...mockActiveSub,
        plan: mockFreePlan,
      });

      await expect(
        service.createPaymentMethodReplacementSession('user-1', mockCompany.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('verifies sub_new, cancels sub_old, and updates database atomically', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_new_456',
        status: 'authenticated',
        notes: { company_id: mockCompany.id },
      });
      razorpayMock.fetchPayment.mockResolvedValue({ id: 'pay_new_789', status: 'captured' });
      razorpayMock.cancelSubscription.mockResolvedValue({});

      const updatedSub = {
        ...mockActiveSub,
        razorpaySubscriptionId: 'sub_new_456',
        status: 'ACTIVE',
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const res = await service.verifyPaymentMethodReplacement('user-1', mockCompany.id, {
        razorpayPaymentId: 'pay_new_789',
        razorpaySubscriptionId: 'sub_new_456',
        razorpaySignature: 'sig_valid_replacement',
      });

      expect(res.razorpaySubscriptionId).toBe('sub_new_456');

      // Verifies sub_old cancellation was called immediately
      expect(razorpayMock.cancelSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_old_123',
        cancelAtCycleEnd: false,
      });

      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockActiveSub.id },
          data: expect.objectContaining({
            razorpaySubscriptionId: 'sub_new_456',
            status: 'ACTIVE',
          }),
        }),
      );

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.payment_method_replaced',
        }),
      );
    });

    it('rejects cross-company sub_new during replacement verification', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_new_456',
        status: 'authenticated',
        notes: { company_id: mockOtherCompany.id }, // Belongs to Other Corp!
      });

      await expect(
        service.verifyPaymentMethodReplacement('user-1', mockCompany.id, {
          razorpayPaymentId: 'pay_new_789',
          razorpaySubscriptionId: 'sub_new_456',
          razorpaySignature: 'sig_valid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles sub_old cancellation failure gracefully while preserving sub_new', async () => {
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      prismaMock.paymentTransaction.findUnique.mockResolvedValue(null);
      razorpayMock.verifyCheckoutSignature.mockReturnValue(true);
      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_new_456',
        status: 'authenticated',
        notes: { company_id: mockCompany.id },
      });
      razorpayMock.fetchPayment.mockResolvedValue({ id: 'pay_new_789', status: 'captured' });
      razorpayMock.cancelSubscription.mockRejectedValue(new Error('Razorpay 500 network error'));

      const updatedSub = {
        ...mockActiveSub,
        razorpaySubscriptionId: 'sub_new_456',
      };
      prismaMock.employerSubscription.update.mockResolvedValue(updatedSub);
      prismaMock.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const res = await service.verifyPaymentMethodReplacement('user-1', mockCompany.id, {
        razorpayPaymentId: 'pay_new_789',
        razorpaySubscriptionId: 'sub_new_456',
        razorpaySignature: 'sig_valid',
      });

      expect(res.razorpaySubscriptionId).toBe('sub_new_456');

      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.old_subscription_cancellation_failed',
        }),
      );
      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.payment_method_replaced',
        }),
      );
    });

    it('webhook resolves replacement sub_new via provider notes when DB still holds sub_old', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      // Initial DB lookup by sub_new returns null because DB still points to sub_old
      prismaMock.employerSubscription.findFirst.mockResolvedValue(null);

      // Webhook fetches sub_new authoritatively from provider
      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_new_456',
        status: 'authenticated',
        notes: {
          company_id: mockCompany.id,
          purpose: 'payment_method_replacement',
        },
      });

      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockActiveSub,
        razorpaySubscriptionId: 'sub_new_456',
      });
      razorpayMock.cancelSubscription.mockResolvedValue({});

      const payload = {
        id: 'evt_replacement_wh_1',
        event: 'subscription.authenticated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_new_456',
            },
          },
        },
      };

      const result = await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(result.processed).toBe(true);
      expect(razorpayMock.cancelSubscription).toHaveBeenCalledWith({
        razorpaySubscriptionId: 'sub_old_123',
        cancelAtCycleEnd: false,
      });
      expect(prismaMock.employerSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockActiveSub.id },
          data: expect.objectContaining({
            razorpaySubscriptionId: 'sub_new_456',
            status: 'ACTIVE',
          }),
        }),
      );
      expect(auditPublisherMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'billing.payment_method_replaced',
          reasonCode: 'WEBHOOK_REPLACEMENT_CONFIRMED',
        }),
      );
    });

    it('webhook replacement creates payment transaction when payment entity is present in payload', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      prismaMock.employerSubscription.findFirst.mockResolvedValue(null);

      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_new_456',
        status: 'authenticated',
        notes: {
          company_id: mockCompany.id,
          purpose: 'payment_method_replacement',
          previous_subscription_id: 'sub_old_123',
        },
      });

      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.employerSubscription.findUnique.mockResolvedValue(mockActiveSub);
      prismaMock.employerSubscription.update.mockResolvedValue({
        ...mockActiveSub,
        razorpaySubscriptionId: 'sub_new_456',
      });
      prismaMock.paymentTransaction.findUnique.mockImplementation(async ({ where }: any) => {
        if (where?.id) {
          return { id: where.id, amountInr: 7500, status: 'SUCCESS' };
        }
        return null;
      });
      prismaMock.paymentTransaction.create.mockResolvedValue({ id: 'tx-wh-1' });
      razorpayMock.cancelSubscription.mockResolvedValue({});

      const payload = {
        id: 'evt_replacement_wh_2',
        event: 'subscription.authenticated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_new_456',
            },
          },
          payment: {
            entity: {
              id: 'pay_wh_999',
              amount: 750000, // 7500 INR in paise
            },
          },
        },
      };

      const result = await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(result.processed).toBe(true);
      expect(prismaMock.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: mockCompany.id,
            subscriptionId: mockActiveSub.id,
            razorpayPaymentId: 'pay_wh_999',
            amountInr: 7500,
            status: 'SUCCESS',
          }),
        }),
      );
    });

    it('webhook ignores stale replacement session when previous_subscription_id does not match DB', async () => {
      razorpayMock.verifyWebhookSignature.mockReturnValue(true);
      redisMock.set.mockResolvedValue('OK');

      prismaMock.employerSubscription.findFirst.mockResolvedValue(null);

      razorpayMock.fetchSubscription.mockResolvedValue({
        id: 'sub_stale_web_1',
        status: 'authenticated',
        notes: {
          company_id: mockCompany.id,
          purpose: 'payment_method_replacement',
          previous_subscription_id: 'sub_old_123',
        },
      });

      // DB has already moved to sub_latest_999
      prismaMock.employerSubscription.findUnique.mockResolvedValue({
        ...mockActiveSub,
        razorpaySubscriptionId: 'sub_latest_999',
      });

      const payload = {
        id: 'evt_replacement_stale',
        event: 'subscription.authenticated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_stale_web_1',
            },
          },
        },
      };

      const result = await service.handleWebhook(JSON.stringify(payload), 'valid_sig');

      expect(result.processed).toBe(true);
      expect(prismaMock.employerSubscription.update).not.toHaveBeenCalled();
    });
  });

  describe('Employer Billing Invoices (T5)', () => {
    const mockTx = {
      id: 'tx-0000000-0000-0000-0000-000000000001',
      companyId: mockCompany.id,
      subscriptionId: 's0000000-0000-0000-0000-000000000001',
      razorpayPaymentId: 'pay_123456',
      amountInr: 7500,
      status: 'SUCCESS',
      createdAt: new Date('2026-09-26T10:00:00Z'),
    };

    const mockCompanyWithGstin = {
      ...mockCompany,
      gstin: '29ABCDE1234F1Z5',
    };

    const mockInvoice = {
      id: 'inv-0000000-0000-0000-0000-000000000001',
      invoiceNumber: 'INV-202609-00001',
      companyId: mockCompany.id,
      subscriptionId: mockTx.subscriptionId,
      transactionId: mockTx.id,
      subtotalInr: 7500,
      appliedTaxRate: 0,
      taxInr: 0,
      totalInr: 7500,
      gstin: '29ABCDE1234F1Z5',
      status: 'PAID',
      pdfStorageKey: `invoices/${mockCompany.id}/inv-0000000-0000-0000-0000-000000000001.pdf`,
      issuedAt: mockTx.createdAt,
      paidAt: mockTx.createdAt,
      createdAt: mockTx.createdAt,
    };

    describe('createInvoiceForSuccessfulPayment', () => {
      it('creates invoice with correct company GSTIN, status, and PDF storage', async () => {
        prismaMock.employerInvoice.findUnique.mockResolvedValue(null);
        prismaMock.paymentTransaction.findUnique.mockResolvedValue(mockTx);
        prismaMock.company.findUnique.mockResolvedValue(mockCompanyWithGstin);
        redisMock.incr.mockResolvedValue(1);
        prismaMock.employerInvoice.create.mockResolvedValue(mockInvoice);
        prismaMock.employerInvoice.update.mockResolvedValue(mockInvoice);

        const invoice = await service.createInvoiceForSuccessfulPayment(
          mockCompany.id,
          mockTx.id,
          mockTx.subscriptionId,
        );

        expect(invoice.invoiceNumber).toBe('INV-202609-00001');
        expect(invoice.gstin).toBe('29ABCDE1234F1Z5');
        expect(invoice.totalInr).toBe(7500);
        expect(invoice.status).toBe('PAID');
        expect(storageMock.putObjectBuffer).toHaveBeenCalledWith(
          expect.objectContaining({
            contentType: 'application/pdf',
          }),
        );
        expect(auditPublisherMock.record).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'billing.invoice_generated',
            reasonCode: 'INVOICE_CREATED',
          }),
        );
      });

      it('is idempotent: returns existing invoice on repeated call', async () => {
        prismaMock.employerInvoice.findUnique.mockResolvedValue(mockInvoice);

        const invoice = await service.createInvoiceForSuccessfulPayment(
          mockCompany.id,
          mockTx.id,
          mockTx.subscriptionId,
        );

        expect(invoice.id).toBe(mockInvoice.id);
        expect(prismaMock.employerInvoice.create).not.toHaveBeenCalled();
      });

      it('handles P2002 unique constraint race condition gracefully', async () => {
        prismaMock.employerInvoice.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockInvoice);
        prismaMock.paymentTransaction.findUnique.mockResolvedValue(mockTx);
        prismaMock.company.findUnique.mockResolvedValue(mockCompanyWithGstin);
        redisMock.incr.mockResolvedValue(1);

        const p2002Error: any = new Error('Unique constraint failed');
        p2002Error.code = 'P2002';
        prismaMock.employerInvoice.create.mockRejectedValue(p2002Error);

        const invoice = await service.createInvoiceForSuccessfulPayment(
          mockCompany.id,
          mockTx.id,
          mockTx.subscriptionId,
        );

        expect(invoice.id).toBe(mockInvoice.id);
      });
    });

    describe('listInvoices', () => {
      it('lists invoices for company ordered newest first', async () => {
        prismaMock.employerInvoice.findMany.mockResolvedValue([mockInvoice]);

        const invoices = await service.listInvoices(mockCompany.id);

        expect(invoices).toHaveLength(1);
        expect(invoices[0].id).toBe(mockInvoice.id);
        expect(prismaMock.employerInvoice.findMany).toHaveBeenCalledWith({
          where: { companyId: mockCompany.id },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('getInvoice', () => {
      it('retrieves invoice details when owned by company', async () => {
        prismaMock.employerInvoice.findFirst.mockResolvedValue(mockInvoice);

        const invoice = await service.getInvoice(mockCompany.id, mockInvoice.id);

        expect(invoice.id).toBe(mockInvoice.id);
      });

      it('throws 404 when invoice belongs to another company', async () => {
        prismaMock.employerInvoice.findFirst.mockResolvedValue(null);

        await expect(service.getInvoice(mockOtherCompany.id, mockInvoice.id)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getInvoiceDownloadUrl', () => {
      it('generates signed download URL for company invoice', async () => {
        prismaMock.employerInvoice.findFirst.mockResolvedValue({
          ...mockInvoice,
          company: mockCompanyWithGstin,
        });

        const res = await service.getInvoiceDownloadUrl(mockCompany.id, mockInvoice.id);

        expect(res.downloadUrl).toBe('https://storage.local/invoice.pdf');
      });

      it('throws 404 when downloading invoice of another company', async () => {
        prismaMock.employerInvoice.findFirst.mockResolvedValue(null);

        await expect(
          service.getInvoiceDownloadUrl(mockOtherCompany.id, mockInvoice.id),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
