import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const NOTIFICATION_KINDS = [
  'OPPORTUNITY',
  'STAGE_CHANGE',
  'VERIFICATION_RESULT',
  'INVITATION',
  'TRUST_ENFORCEMENT',
  'APPLICATION',
  'MESSAGE',
  'ACCOUNT',
  'CAMPUS_ACCESS',
  'EVENT',
] as const;

export const NotificationKindSchema = z.enum(NOTIFICATION_KINDS);
export type NotificationKind = z.infer<typeof NotificationKindSchema>;

export const NotificationDtoSchema = z.object({
  notificationId: UuidSchema,
  kind: NotificationKindSchema,
  title: z.string(),
  body: z.string(),
  /** Absolute URL, or an app-relative path such as `/events/<id>` (several producers store paths). */
  linkUrl: z.union([z.string().url(), z.string().startsWith('/')]).nullable(),
  readAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

export const ListNotificationsResponseSchema = z.object({
  notifications: z.array(NotificationDtoSchema),
  unreadCount: z.number().int().min(0),
});
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;

/** S6-VV-121 (#434) — where a notification is delivered. */
export const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL'] as const;
export const NotificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

/**
 * Account/privacy notices (DSR updates, export ready) and trust-enforcement notices always reach
 * the user on every channel; their preferences are reported as enabled and can't be changed.
 */
export const MANDATORY_NOTIFICATION_KINDS: readonly NotificationKind[] = [
  'ACCOUNT',
  'TRUST_ENFORCEMENT',
];

export const NotificationPreferenceSchema = z.object({
  kind: NotificationKindSchema,
  channel: NotificationChannelSchema,
  enabled: z.boolean(),
  mandatory: z.boolean(),
});
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

/** Every kind × channel; anything the user never changed is enabled. */
export const NotificationPreferencesResponseSchema = z.object({
  preferences: z.array(NotificationPreferenceSchema),
});
export type NotificationPreferencesResponse = z.infer<typeof NotificationPreferencesResponseSchema>;

export const UpdateNotificationPreferencesRequestSchema = z.object({
  preferences: z
    .array(
      z.object({
        kind: NotificationKindSchema,
        channel: NotificationChannelSchema,
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(NOTIFICATION_KINDS.length * NOTIFICATION_CHANNELS.length),
});
export type UpdateNotificationPreferencesRequest = z.infer<
  typeof UpdateNotificationPreferencesRequestSchema
>;
