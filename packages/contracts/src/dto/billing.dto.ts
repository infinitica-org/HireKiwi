import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*                               Billing Enums                                */
/* -------------------------------------------------------------------------- */

export const BILLING_INTERVALS = ['MONTHLY', 'ANNUAL'] as const;
export const BillingIntervalSchema = z.enum(BILLING_INTERVALS);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const EMPLOYER_SUBSCRIPTION_STATUSES = [
  'PENDING',
  'ACTIVE',
  'PAST_DUE',
  'GRACE_PERIOD',
  'CANCELED',
  'EXPIRED',
] as const;
export const EmployerSubscriptionStatusSchema = z.enum(EMPLOYER_SUBSCRIPTION_STATUSES);
export type EmployerSubscriptionStatus = z.infer<typeof EmployerSubscriptionStatusSchema>;

export const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const;
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const INVOICE_STATUSES = ['DRAFT', 'PAID', 'UNPAID', 'VOID'] as const;
export const InvoiceStatusSchema = z.enum(INVOICE_STATUSES);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const QUOTA_DIMENSIONS = [
  'ACTIVE_JOBS',
  'CANDIDATE_SEARCHES',
  'DIRECT_MESSAGES',
  'EMPLOYER_SEATS',
] as const;
export const QuotaDimensionSchema = z.enum(QUOTA_DIMENSIONS);
export type QuotaDimension = z.infer<typeof QuotaDimensionSchema>;

/* -------------------------------------------------------------------------- */
/*                            Quota & Usage DTOs                              */
/* -------------------------------------------------------------------------- */

export const QuotaLimitSchema = z.object({
  dimension: QuotaDimensionSchema,
  used: z.number().int().min(0),
  limit: z.number().int().min(0).nullable(), // null means unlimited or unconfigured
  remaining: z.number().int().min(0).nullable(),
});
export type QuotaLimitDto = z.infer<typeof QuotaLimitSchema>;

export const CompanyQuotaOverviewSchema = z.object({
  activeJobs: QuotaLimitSchema,
  candidateSearches: QuotaLimitSchema,
  directMessages: QuotaLimitSchema,
  employerSeats: QuotaLimitSchema,
});
export type CompanyQuotaOverviewDto = z.infer<typeof CompanyQuotaOverviewSchema>;

/* -------------------------------------------------------------------------- */
/*                             Subscription DTOs                              */
/* -------------------------------------------------------------------------- */

export const EmployerSubscriptionSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  planId: z.string().uuid(),
  planCode: z.string(),
  planName: z.string(),
  pendingPlanId: z.string().uuid().nullable().optional(),
  pendingPlanCode: z.string().nullable().optional(),
  razorpaySubscriptionId: z.string().nullable().optional(),
  status: EmployerSubscriptionStatusSchema,
  billingInterval: BillingIntervalSchema,
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.string().datetime().nullable().optional(),
  gracePeriodEndsAt: z.string().datetime().nullable().optional(),
  isEnterpriseContract: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EmployerSubscriptionDto = z.infer<typeof EmployerSubscriptionSchema>;

/* -------------------------------------------------------------------------- */
/*                             Checkout & Verify                              */
/* -------------------------------------------------------------------------- */

export const CreateCheckoutSessionSchema = z.object({
  planCode: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  billingInterval: BillingIntervalSchema.default('MONTHLY'),
  gstin: z.string().trim().max(15).optional(),
});
export type CreateCheckoutSessionDto = z.infer<typeof CreateCheckoutSessionSchema>;

export const CheckoutSessionResponseSchema = z.object({
  subscriptionId: z.string(),
  razorpaySubscriptionId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayKeyId: z.string(),
  amountInr: z.number().int(),
  currency: z.string().default('INR'),
  companyName: z.string(),
});
export type CheckoutSessionResponseDto = z.infer<typeof CheckoutSessionResponseSchema>;

export const VerifyPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpaySubscriptionId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;

export const UpgradePlanSchema = z.object({
  planCode: z.enum(['BASIC', 'PRO']),
  billingInterval: BillingIntervalSchema.optional(),
});
export type UpgradePlanDto = z.infer<typeof UpgradePlanSchema>;

/* -------------------------------------------------------------------------- */
/*                              Invoice DTOs                                  */
/* -------------------------------------------------------------------------- */

export const EmployerInvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  companyId: z.string().uuid(),
  subtotalInr: z.number().int(),
  appliedTaxRate: z.number(),
  taxInr: z.number().int(),
  totalInr: z.number().int(),
  gstin: z.string().nullable().optional(),
  status: InvoiceStatusSchema,
  pdfStorageKey: z.string().nullable().optional(),
  issuedAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type EmployerInvoiceDto = z.infer<typeof EmployerInvoiceSchema>;

/* -------------------------------------------------------------------------- */
/*                         Enterprise Contract DTOs                           */
/* -------------------------------------------------------------------------- */

export const CreateEnterpriseContractSchema = z.object({
  companyId: z.string().uuid(),
  contractNumber: z.string().min(3).max(50),
  customPriceInr: z.number().int().min(0),
  billingInterval: BillingIntervalSchema,
  maxActiveJobs: z.number().int().min(0).nullable().optional(),
  maxCandidateSearches: z.number().int().min(0).nullable().optional(),
  maxDirectMessages: z.number().int().min(0).nullable().optional(),
  maxEmployerSeats: z.number().int().min(0).nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  termsNotes: z.string().max(2000).optional(),
});
export type CreateEnterpriseContractDto = z.infer<typeof CreateEnterpriseContractSchema>;

export const EnterpriseContractSchema = CreateEnterpriseContractSchema.extend({
  id: z.string().uuid(),
  approvedById: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EnterpriseContractDto = z.infer<typeof EnterpriseContractSchema>;
