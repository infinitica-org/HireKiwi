import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const RateLimitOverrideDtoSchema = z.object({
  institutionId: UuidSchema,
  policyKey: z.string().min(1).max(128),
  limit: z.number().int().positive().max(50_000),
  burst: z.number().int().nonnegative().max(10_000),
  windowSeconds: z.number().int().positive().max(86_400),
  reason: z.string().trim().min(8).max(500),
  updatedBy: UuidSchema.optional(),
  updatedAt: IsoDateTimeSchema,
});
export type RateLimitOverrideDto = z.infer<typeof RateLimitOverrideDtoSchema>;

export const SetRateLimitOverrideRequestSchema = z.object({
  limit: z.number().int().positive().max(50_000),
  burst: z.number().int().nonnegative().max(10_000).optional(),
  windowSeconds: z.number().int().positive().max(86_400).optional(),
  reason: z.string().trim().min(8).max(500),
});
export type SetRateLimitOverrideRequest = z.infer<typeof SetRateLimitOverrideRequestSchema>;

export const RateLimitPolicyItemDtoSchema = z.object({
  key: z.string(),
  scope: z.enum(['IP', 'USER', 'ATTEMPT', 'INSTITUTION', 'API_KEY', 'SERVICE_WORKER']),
  limit: z.number().int().positive(),
  windowSeconds: z.number().int().positive(),
  burst: z.number().int().nonnegative(),
  rationale: z.string(),
  activeOverride: RateLimitOverrideDtoSchema.nullable().optional(),
});
export type RateLimitPolicyItemDto = z.infer<typeof RateLimitPolicyItemDtoSchema>;

export const ListRateLimitPoliciesResponseSchema = z.object({
  policies: z.array(RateLimitPolicyItemDtoSchema),
  overrides: z.array(RateLimitOverrideDtoSchema),
});
export type ListRateLimitPoliciesResponse = z.infer<typeof ListRateLimitPoliciesResponseSchema>;
