import { z } from 'zod';
import { EmailSchema, IsoDateTimeSchema, UuidSchema } from './common.js';
import { InstitutionDomainSchema } from './onboarding.dto.js';

export const TpoContactRequestStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'APPROVED',
  'REJECTED',
  'CLOSED',
]);
export type TpoContactRequestStatus = z.infer<typeof TpoContactRequestStatusSchema>;

/** The landing site's "Let's Connect" form, filled in by a placement officer. */
export const CreateTpoContactRequestSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1).max(80),
  email: EmailSchema,
  phone: z.string().trim().min(5).max(30),
  role: z.string().trim().min(2).max(120),
  message: z.string().trim().max(2000).optional(),
});
export type CreateTpoContactRequest = z.infer<typeof CreateTpoContactRequestSchema>;

export const TpoContactRequestDtoSchema = z.object({
  id: UuidSchema,
  institutionName: z.string(),
  location: z.string(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.string(),
  message: z.string().nullable(),
  status: TpoContactRequestStatusSchema,
  /** Set once the request is approved: the university created for it. */
  institutionId: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type TpoContactRequestDto = z.infer<typeof TpoContactRequestDtoSchema>;

export const ListTpoContactRequestsQuerySchema = z.object({
  status: TpoContactRequestStatusSchema.optional(),
  query: z.string().trim().max(100).optional(),
});
export type ListTpoContactRequestsQuery = z.infer<typeof ListTpoContactRequestsQuerySchema>;

export const ListTpoContactRequestsResponseSchema = z.object({
  items: z.array(TpoContactRequestDtoSchema),
  total: z.number().int().nonnegative(),
  newCount: z.number().int().nonnegative(),
});
export type ListTpoContactRequestsResponse = z.infer<typeof ListTpoContactRequestsResponseSchema>;

export const UpdateTpoContactRequestStatusSchema = z.object({
  status: TpoContactRequestStatusSchema,
});
export type UpdateTpoContactRequestStatus = z.infer<typeof UpdateTpoContactRequestStatusSchema>;

/** Approving creates the university and emails the contact a link to set their own password. */
export const ApproveTpoContactRequestSchema = z.object({
  /** Defaults to the domain of the contact's work email. */
  domain: InstitutionDomainSchema.optional(),
});
export type ApproveTpoContactRequest = z.infer<typeof ApproveTpoContactRequestSchema>;

export const ApproveTpoContactResponseSchema = z.object({
  request: TpoContactRequestDtoSchema,
  institutionId: UuidSchema,
  institutionName: z.string(),
  domain: z.string(),
  inviteSentTo: z.string(),
});
export type ApproveTpoContactResponse = z.infer<typeof ApproveTpoContactResponseSchema>;

export const CreateTpoContactResponseSchema = z.object({
  id: UuidSchema,
  received: z.literal(true),
});
export type CreateTpoContactResponse = z.infer<typeof CreateTpoContactResponseSchema>;
