import { z } from 'zod';
import { EmailSchema, IsoDateTimeSchema, UuidSchema } from './common.js';
import { InstitutionDomainSchema } from './onboarding.dto.js';

export const PartnershipRequestStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'MORE_INFO_NEEDED',
  'PROVISIONED',
]);
export type PartnershipRequestStatus = z.infer<typeof PartnershipRequestStatusSchema>;

export const CreatePartnershipRequestSchema = z.object({
  name: z.string().trim().min(2).max(200),
  domain: InstitutionDomainSchema,
  contactName: z.string().trim().min(2).max(100),
  contactEmail: EmailSchema,
  contactPhone: z.string().trim().max(30).optional(),
  estimatedStudents: z.number().int().min(1).max(500000).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CreatePartnershipRequest = z.infer<typeof CreatePartnershipRequestSchema>;

export const PartnershipRequestSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  domain: z.string(),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string().optional(),
  estimatedStudents: z.number().optional(),
  notes: z.string().optional(),
  status: PartnershipRequestStatusSchema,
  reviewNotes: z.string().optional(),
  provisionedInstitutionId: z.string().optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type PartnershipRequest = z.infer<typeof PartnershipRequestSchema>;

export const ListPartnershipRequestsQuerySchema = z.object({
  status: PartnershipRequestStatusSchema.optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListPartnershipRequestsQuery = z.infer<typeof ListPartnershipRequestsQuerySchema>;

export const ReviewPartnershipRequestSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'MORE_INFO_NEEDED']),
  reviewNotes: z.string().trim().max(2000).optional(),
});
export type ReviewPartnershipRequest = z.infer<typeof ReviewPartnershipRequestSchema>;

export const PartnershipDecisionResponseSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  domain: z.string(),
  status: PartnershipRequestStatusSchema,
  reviewNotes: z.string().optional(),
  decisionDate: IsoDateTimeSchema.optional(),
  nextSteps: z.string(),
  provisionedInstitutionId: z.string().optional(),
  activationToken: z.string().optional(),
  activationUrl: z.string().optional(),
});
export type PartnershipDecisionResponse = z.infer<typeof PartnershipDecisionResponseSchema>;

export const SMART_ORG_PROVISIONED_ACTION = 'smart.org.provisioned' as const;

export const ActivationTokenDetailsSchema = z.object({
  token: z.string(),
  partnershipRequestId: UuidSchema,
  name: z.string(),
  domain: z.string(),
  contactName: z.string(),
  contactEmail: EmailSchema,
  expiresAt: IsoDateTimeSchema,
});
export type ActivationTokenDetails = z.infer<typeof ActivationTokenDetailsSchema>;

export const ActivatePartnershipAccountRequestSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  confirmCollegeName: z.string().trim().min(2).max(200),
  confirmDomain: InstitutionDomainSchema,
  primaryCampus: z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(1).max(40).optional(),
    city: z.string().trim().min(2).max(120).optional(),
  }),
  regionalCampuses: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        code: z.string().trim().min(1).max(40).optional(),
        city: z.string().trim().min(2).max(120).optional(),
      }),
    )
    .optional()
    .default([]),
});
export type ActivatePartnershipAccountRequest = z.infer<
  typeof ActivatePartnershipAccountRequestSchema
>;

export const ActivatePartnershipAccountResponseSchema = z.object({
  institutionId: UuidSchema,
  name: z.string(),
  domain: z.string(),
  primaryCampusId: UuidSchema,
  campusIds: z.array(UuidSchema),
  tpoUser: z.object({
    userId: UuidSchema,
    email: EmailSchema,
    fullName: z.string(),
    role: z.string(),
  }),
  auditLog: z.object({
    action: z.literal(SMART_ORG_PROVISIONED_ACTION),
    timestamp: IsoDateTimeSchema,
    provisionerId: UuidSchema,
    ipAddress: z.string(),
  }),
});
export type ActivatePartnershipAccountResponse = z.infer<
  typeof ActivatePartnershipAccountResponseSchema
>;
