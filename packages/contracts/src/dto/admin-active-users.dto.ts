import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';

/**
 * Admin dashboard — users who are signed in right now, i.e. hold a refresh-token session that is
 * neither revoked nor expired. Grouped the way the dashboard filters them.
 */
export const ACTIVE_USER_GROUPS = ['STUDENT', 'TPO', 'COMPANY'] as const;
export const ActiveUserGroupSchema = z.enum(ACTIVE_USER_GROUPS);
export type ActiveUserGroup = z.infer<typeof ActiveUserGroupSchema>;

export const ListActiveUsersQuerySchema = z.object({
  group: ActiveUserGroupSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(5),
});
export type ListActiveUsersQuery = z.infer<typeof ListActiveUsersQuerySchema>;

export const ActiveUserDtoSchema = z.object({
  userId: UuidSchema,
  fullName: z.string(),
  email: z.string(),
  group: ActiveUserGroupSchema,
  /** Institution (students, TPO) or company (company users) name, when linked. */
  organizationName: z.string().nullable(),
  /** Start of the user's most recent live session. */
  lastSignedInAt: IsoDateTimeSchema,
});
export type ActiveUserDto = z.infer<typeof ActiveUserDtoSchema>;

export const ListActiveUsersResponseSchema = z.object({
  counts: z.object({
    total: z.number().int().nonnegative(),
    STUDENT: z.number().int().nonnegative(),
    TPO: z.number().int().nonnegative(),
    COMPANY: z.number().int().nonnegative(),
  }),
  users: z.array(ActiveUserDtoSchema),
  /** Matching users for the selected group (or all groups). */
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type ListActiveUsersResponse = z.infer<typeof ListActiveUsersResponseSchema>;
