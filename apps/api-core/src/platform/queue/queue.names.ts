export const SANDBOX_EXECUTION_QUEUE = 'sandbox_execution' as const;
export const AUDIO_EVALUATION_QUEUE = 'audio_evaluation' as const;
export const PDF_GENERATION_QUEUE = 'pdf_generation' as const;
/** S6-VV-118 — replaces the old `audit_log_purge` queue. */
export const RETENTION_SWEEP_QUEUE = 'retention_sweep' as const;
export const MESSAGE_MODERATION_PURGE_QUEUE = 'message_moderation_purge' as const;
export const CREDENTIAL_VERIFICATION_QUEUE = 'credential_verification' as const;
export const QLIX_POLL_QUEUE = 'qlix_poll' as const;
export const QLIX_RECALIBRATION_QUEUE = 'qlix_recalibration' as const;
export const MATCH_RUN_QUEUE = 'match_run' as const;
export const JD_PARSE_QUEUE = 'jd_parse' as const;
export const SKILL_VERIFY_GRADE_QUEUE = 'skill_verify_grade' as const;
export const ASSESSMENT_FORCE_SUBMIT_QUEUE = 'assessment_force_submit' as const;
export const SCORE_RECALCULATION_QUEUE = 'score_recalculation' as const;
export const DSR_EXPORT_QUEUE = 'dsr_export' as const;
export const DSR_ERASURE_QUEUE = 'dsr_erasure' as const;
/** Th6-I606 — background processing for bulk CSV/XLSX whitelist uploads. */
export const BULK_WHITELIST_IMPORT_QUEUE = 'bulk_whitelist_import' as const;

export const SANDBOX_EXECUTION_DLQ = 'sandbox_execution.dlq' as const;
export const AUDIO_EVALUATION_DLQ = 'audio_evaluation.dlq' as const;
export const PDF_GENERATION_DLQ = 'pdf_generation.dlq' as const;
export const CREDENTIAL_VERIFICATION_DLQ = 'credential_verification.dlq' as const;
export const QLIX_POLL_DLQ = 'qlix_poll.dlq' as const;
export const QLIX_RECALIBRATION_DLQ = 'qlix_recalibration.dlq' as const;
export const MATCH_RUN_DLQ = 'match_run.dlq' as const;
export const JD_PARSE_DLQ = 'jd_parse.dlq' as const;
export const SKILL_VERIFY_GRADE_DLQ = 'skill_verify_grade.dlq' as const;
export const ASSESSMENT_FORCE_SUBMIT_DLQ = 'assessment_force_submit.dlq' as const;
export const SCORE_RECALCULATION_DLQ = 'score_recalculation.dlq' as const;
export const DSR_EXPORT_DLQ = 'dsr_export.dlq' as const;
export const DSR_ERASURE_DLQ = 'dsr_erasure.dlq' as const;
export const BULK_WHITELIST_IMPORT_DLQ = 'bulk_whitelist_import.dlq' as const;

/** Playbook OQ-5: monthly batch — never intra-week. */
export const QLIX_RECALIBRATION_JOB_ID = 'qlix-recalibration-monthly' as const;
export const QLIX_RECALIBRATION_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

/** S6-VV-118 — windows live in platform/retention/retention-sweep.service.ts (RETENTION_POLICIES). */
export const RETENTION_SWEEP_JOB_ID = 'retention-sweep-daily' as const;
export const RETENTION_SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const EVIDENCE_EXPIRATION_QUEUE = 'evidence_expiration' as const;
export const EVIDENCE_EXPIRATION_JOB_ID = 'evidence-expiration-daily' as const;
export const EVIDENCE_EXPIRATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const EVIDENCE_RECONCILIATION_QUEUE = 'evidence_reconciliation' as const;

export const BILLING_GRACE_EXPIRY_QUEUE = 'billing_grace_expiry' as const;
export const BILLING_GRACE_EXPIRY_JOB_ID = 'billing-grace-expiry-hourly' as const;
export const BILLING_GRACE_EXPIRY_INTERVAL_MS = 60 * 60 * 1000;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: { count: 1_000 },
  removeOnFail: false,
};
