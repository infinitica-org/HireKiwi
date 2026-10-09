export const VERIFICATION_QUEUE = 'verification' as const;
export const VERIFICATION_DLQ = 'verification_dlq' as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 60 * 60 },
  removeOnFail: false,
} as const;
