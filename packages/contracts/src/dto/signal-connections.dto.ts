import { z } from 'zod';
import { IsoDateTimeSchema } from './common.js';

/**
 * External signal connection HTTP DTOs (S6-VB-01).
 *
 * Owner: Vishal Bharath R.
 */

export const CONNECTABLE_SIGNAL_SOURCE_IDS = [
  'GITHUB',
  'HACKERRANK',
  'LEETCODE',
  'LINKEDIN',
  'CREDLY',
] as const;
export type ConnectableSignalSourceId = (typeof CONNECTABLE_SIGNAL_SOURCE_IDS)[number];

export const ConnectableSignalSourceIdSchema = z.enum(CONNECTABLE_SIGNAL_SOURCE_IDS);

export const SIGNAL_CONNECTION_STATUSES = ['ACTIVE', 'ERROR', 'REVOKED'] as const;
export type SignalConnectionStatus = (typeof SIGNAL_CONNECTION_STATUSES)[number];

export const SignalConnectionStatusSchema = z.enum(SIGNAL_CONNECTION_STATUSES);

export const SignalConnectionSummarySchema = z.object({
  sourceId: ConnectableSignalSourceIdSchema,
  externalAccountId: z.string().min(1).max(120),
  consentScopes: z.array(z.string().min(1).max(120)).max(10),
  connectedAt: IsoDateTimeSchema,
  lastFetchedAt: IsoDateTimeSchema.nullable(),
  status: SignalConnectionStatusSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type SignalConnectionSummary = z.infer<typeof SignalConnectionSummarySchema>;

export const ListSignalConnectionsResponseSchema = z.object({
  connections: z.array(SignalConnectionSummarySchema).max(10),
});
export type ListSignalConnectionsResponse = z.infer<typeof ListSignalConnectionsResponseSchema>;

export const ConnectGithubSignalRequestSchema = z.object({
  githubUrl: z.string().min(1).max(2048),
  selectedRepoFullNames: z.array(z.string().min(1).max(200)).max(20).optional(),
  selectedSkillNames: z.array(z.string().min(1).max(80)).max(30).optional(),
});
export type ConnectGithubSignalRequest = z.infer<typeof ConnectGithubSignalRequestSchema>;

export const SelectRepositoriesRequestSchema = z.object({
  selectedRepoFullNames: z.array(z.string().min(1).max(200)).min(1).max(50),
});
export type SelectRepositoriesRequest = z.infer<typeof SelectRepositoriesRequestSchema>;

export const ConnectHackerrankSignalRequestSchema = z.object({
  hackerrankUsername: z.string().min(1).max(80),
});
export type ConnectHackerrankSignalRequest = z.infer<typeof ConnectHackerrankSignalRequestSchema>;

export const ConnectLeetcodeSignalRequestSchema = z.object({
  leetcodeUsername: z.string().min(1).max(80),
});
export type ConnectLeetcodeSignalRequest = z.infer<typeof ConnectLeetcodeSignalRequestSchema>;

export const ConnectLinkedinSignalRequestSchema = z.object({
  linkedinUrl: z.string().min(1).max(2048),
  importedSections: z
    .array(z.enum(['workHistory', 'education', 'skills', 'certifications']))
    .optional(),
});
export type ConnectLinkedinSignalRequest = z.infer<typeof ConnectLinkedinSignalRequestSchema>;

export const ConnectCredentialProviderRequestSchema = z.object({
  providerId: z.enum(['CREDLY', 'COURSERA', 'EDX', 'AWS', 'GOOGLE_CLOUD']),
  badgeIdOrUrl: z.string().min(1).max(2048),
});
export type ConnectCredentialProviderRequest = z.infer<
  typeof ConnectCredentialProviderRequestSchema
>;

export const ConnectSignalSourceRequestSchema = z.union([
  ConnectGithubSignalRequestSchema,
  ConnectHackerrankSignalRequestSchema,
  ConnectLeetcodeSignalRequestSchema,
  ConnectLinkedinSignalRequestSchema,
  ConnectCredentialProviderRequestSchema,
]);
export type ConnectSignalSourceRequest = z.infer<typeof ConnectSignalSourceRequestSchema>;

export const ConnectSignalSourceResponseSchema = z.object({
  connection: SignalConnectionSummarySchema,
  fetchQueued: z.boolean(),
  verificationStatus: z.literal('UNVERIFIED').default('UNVERIFIED'),
});
export type ConnectSignalSourceResponse = z.infer<typeof ConnectSignalSourceResponseSchema>;

export const RefreshSignalsRequestSchema = z.object({
  sourceIds: z.array(ConnectableSignalSourceIdSchema).max(5).optional(),
});
export type RefreshSignalsRequest = z.infer<typeof RefreshSignalsRequestSchema>;

export const RefreshSignalsResponseSchema = z.object({
  queued: z.array(ConnectableSignalSourceIdSchema),
  skippedCooldown: z.array(ConnectableSignalSourceIdSchema),
});
export type RefreshSignalsResponse = z.infer<typeof RefreshSignalsResponseSchema>;

/** Path param validation for /signals/connect/:sourceId */
export const SignalConnectPathParamsSchema = z.object({
  sourceId: ConnectableSignalSourceIdSchema,
});

/** Ensures request body matches the path sourceId. */
export function assertConnectBodyMatchesSource(
  sourceId: ConnectableSignalSourceId,
  body: ConnectSignalSourceRequest,
): void {
  if (sourceId === 'GITHUB' && !('githubUrl' in body)) {
    throw new Error('GITHUB connect requires githubUrl');
  }
  if (sourceId === 'HACKERRANK' && !('hackerrankUsername' in body)) {
    throw new Error('HACKERRANK connect requires hackerrankUsername');
  }
  if (sourceId === 'LEETCODE' && !('leetcodeUsername' in body)) {
    throw new Error('LEETCODE connect requires leetcodeUsername');
  }
  if (sourceId === 'LINKEDIN' && !('linkedinUrl' in body)) {
    throw new Error('LINKEDIN connect requires linkedinUrl');
  }
  if (sourceId === 'CREDLY' && !('badgeIdOrUrl' in body)) {
    throw new Error('CREDLY connect requires badgeIdOrUrl');
  }
}

/**
 * Check a username BEFORE connecting: does the public profile exist, and whose is it?
 * Shown to the student so they can confirm it is really their account.
 */
export const LookupSignalProfileRequestSchema = z.object({
  username: z.string().trim().min(1).max(80),
});
export type LookupSignalProfileRequest = z.infer<typeof LookupSignalProfileRequestSchema>;

export const SignalProfilePreviewSchema = z.object({
  sourceId: ConnectableSignalSourceIdSchema,
  username: z.string().min(1).max(120),
  /** The name shown on the public profile, when the platform shares one. */
  displayName: z.string().max(200).nullable(),
  /** https only, so a profile can never make the page load a non-secure image. */
  avatarUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), 'avatarUrl must be https')
    .nullable(),
  profileUrl: z.string().url(),
  /** One short line of public stats, e.g. "312 problems solved". */
  summary: z.string().max(200).nullable(),
});
export type SignalProfilePreview = z.infer<typeof SignalProfilePreviewSchema>;
