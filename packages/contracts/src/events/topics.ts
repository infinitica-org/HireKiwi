/**
 * Kafka topic registry.
 *
 * A topic has exactly ONE producer-owner (TEAM.md §3.3). Consuming is free;
 * changing a payload is a `@hirekiwi/contracts` PR that must name every consumer
 * in the body so nobody is surprised at integration time.
 *
 * Owner: Tino (System Architect).
 */

export const HIREKIWI_TOPICS = {
  userCreated: 'hirekiwi.user.created',
  userUpdated: 'hirekiwi.user.updated',
  assessmentStarted: 'hirekiwi.assessment.started',
  assessmentSubmitted: 'hirekiwi.assessment.submitted',
  evalRequested: 'hirekiwi.eval.requested',
  evalCompleted: 'hirekiwi.eval.completed',
  trackUpdated: 'hirekiwi.track.updated',
  certificateIssued: 'hirekiwi.certificate.issued',
  placementMatched: 'hirekiwi.placement.matched',
  applicationStageChanged: 'hirekiwi.application.stage_changed',
  invitationSent: 'hirekiwi.invitation.sent',
  skillVerificationCompleted: 'hirekiwi.skill.verification.completed',
  auditRecorded: 'hirekiwi.audit.recorded',
  aiCompletionRecorded: 'hirekiwi.ai.completion.recorded',
  rateLimitExceeded: 'hirekiwi.rate_limit.exceeded',
  projectSubmitted: 'hirekiwi.project.submitted',
  projectSnapshotReady: 'hirekiwi.project.snapshot.ready',
  projectVerifyCompleted: 'hirekiwi.project.verify.completed',
  projectDefenseCompleted: 'hirekiwi.project.defense.completed',
  proctoringSnapshotReady: 'hirekiwi.proctoring.snapshot.ready',
  candidateSkillsDiscovered: 'hirekiwi.candidate.skills_discovered',
  signalIngested: 'hirekiwi.signal.ingested',
  signalEncoded: 'hirekiwi.signal.encoded',
  corroborationUpdated: 'hirekiwi.corroboration.updated',
  credentialVerified: 'hirekiwi.credential.verified',
  skillInferenceUpdated: 'hirekiwi.skill.inference.updated',
} as const;

export type HireKiwiTopic = (typeof HIREKIWI_TOPICS)[keyof typeof HIREKIWI_TOPICS];

export interface TopicSpec {
  readonly topic: HireKiwiTopic;
  /** The single engineer accountable for this payload shape. */
  readonly producerOwner: string;
  readonly producerModule: string;
  readonly consumerModules: readonly string[];
  readonly partitions: number;
  readonly retentionHours: number;
  /** Partition key so ordering is preserved where it matters. */
  readonly partitionKey: string;
  readonly purpose: string;
}

/**
 * Partition keys are chosen so that events for one entity land on one partition
 * and stay ordered — e.g. all events for an attempt are ordered relative to each
 * other, which is what makes "submitted then evaluated" safe to reason about.
 */
export const TOPIC_SPECS: readonly TopicSpec[] = [
  {
    topic: HIREKIWI_TOPICS.userCreated,
    producerOwner: 'Vishal V',
    producerModule: 'auth',
    consumerModules: ['analytics'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose: 'New identity provisioned via SSO or invitation.',
  },
  {
    topic: HIREKIWI_TOPICS.userUpdated,
    producerOwner: 'Vishal V',
    producerModule: 'users',
    consumerModules: ['analytics'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose: 'Profile or track enrolment change.',
  },
  {
    topic: HIREKIWI_TOPICS.assessmentStarted,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'assessment',
    consumerModules: ['analytics', 'catalog'],
    partitions: 12,
    retentionHours: 72,
    partitionKey: 'attemptId',
    purpose: 'Attempt opened; drives item-exposure tracking and live dashboards.',
  },
  {
    topic: HIREKIWI_TOPICS.assessmentSubmitted,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'assessment',
    consumerModules: ['evaluation', 'platform', 'analytics'],
    partitions: 12,
    retentionHours: 168,
    partitionKey: 'attemptId',
    purpose:
      'THE handoff from delivery to grading. This event is the only coupling between ' +
      'assessment and evaluation — no direct service call in either direction.',
  },
  {
    topic: HIREKIWI_TOPICS.evalRequested,
    producerOwner: 'Ramansh',
    producerModule: 'evaluation',
    consumerModules: ['ai-gateway'],
    partitions: 12,
    retentionHours: 72,
    partitionKey: 'responseId',
    purpose: 'One rubric-scored response queued for LLM grading.',
  },
  {
    topic: HIREKIWI_TOPICS.evalCompleted,
    producerOwner: 'Ramansh',
    producerModule: 'evaluation',
    consumerModules: ['certificate', 'placement', 'analytics'],
    partitions: 12,
    retentionHours: 336,
    partitionKey: 'attemptId',
    purpose: 'Level scored and tier assigned; triggers certificate and match recomputation.',
  },
  {
    topic: HIREKIWI_TOPICS.trackUpdated,
    producerOwner: 'Vedika G',
    producerModule: 'calibration',
    consumerModules: ['platform', 'certificate', 'catalog'],
    partitions: 3,
    retentionHours: 720,
    partitionKey: 'trackCode',
    purpose: 'Cut scores or rubrics republished; invalidates cut-score and item caches.',
  },
  {
    topic: HIREKIWI_TOPICS.certificateIssued,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'certificate',
    consumerModules: ['webhooks', 'analytics', 'platform', 'notifications'],
    partitions: 6,
    retentionHours: 720,
    partitionKey: 'certificateId',
    purpose: 'Certificate live; fans out to institutional ERP webhooks and refreshes verify cache.',
  },
  {
    topic: HIREKIWI_TOPICS.placementMatched,
    producerOwner: 'Vedika G',
    producerModule: 'placement',
    consumerModules: ['webhooks', 'analytics', 'notifications'],
    partitions: 6,
    retentionHours: 336,
    partitionKey: 'jdId',
    purpose: 'Shortlist generated; fans out to employer webhooks.',
  },
  {
    topic: HIREKIWI_TOPICS.applicationStageChanged,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'placement',
    consumerModules: ['placement', 'platform', 'users', 'notifications'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'applicationId',
    purpose: 'ATS column change; candidate My Applications stays in sync (idempotent).',
  },
  {
    topic: HIREKIWI_TOPICS.invitationSent,
    producerOwner: 'Vishal V',
    producerModule: 'invitations',
    consumerModules: ['notifications'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'invitationId',
    purpose: 'Invitation email queued; consumer writes in-app notification and BullMQ email job.',
  },
  {
    topic: HIREKIWI_TOPICS.skillVerificationCompleted,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'assessment',
    consumerModules: ['notifications'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'claimId',
    purpose: 'Skill claim status finalized; consumer notifies student of pass/fail/lock.',
  },
  {
    topic: HIREKIWI_TOPICS.auditRecorded,
    producerOwner: 'Vishal V',
    producerModule: 'platform',
    consumerModules: ['platform'],
    partitions: 3,
    retentionHours: 720,
    partitionKey: 'resourceId',
    purpose: 'Admin audit trail; consumer persists to audit_logs.',
  },
  {
    topic: HIREKIWI_TOPICS.aiCompletionRecorded,
    producerOwner: 'Ramansh',
    producerModule: 'ai-gateway',
    consumerModules: ['ai-gateway'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'responseId',
    purpose: 'LLM completion audit; consumer persists to ai_evaluation_audits.',
  },
  {
    topic: HIREKIWI_TOPICS.rateLimitExceeded,
    producerOwner: 'Vishal V',
    producerModule: 'rate-limit',
    consumerModules: ['observability', 'assessment'],
    partitions: 6,
    retentionHours: 72,
    partitionKey: 'identifier',
    purpose: 'Throttle violation; feeds abuse alerting and session integrity logging.',
  },
  {
    topic: HIREKIWI_TOPICS.projectSubmitted,
    producerOwner: 'Vishal V',
    producerModule: 'platform',
    consumerModules: ['platform', 'evaluation'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'projectId',
    purpose: 'CN-T08 project row created; VV fetches a GitHub snapshot. Not hirekiwi.eval.*.',
  },
  {
    topic: HIREKIWI_TOPICS.projectSnapshotReady,
    producerOwner: 'Vishal V',
    producerModule: 'platform',
    consumerModules: ['evaluation'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'projectId',
    purpose: 'Snapshot JSON is in Postgres; evaluation may score. Payload is not on the bus.',
  },
  {
    topic: HIREKIWI_TOPICS.projectVerifyCompleted,
    producerOwner: 'Ramansh',
    producerModule: 'evaluation',
    consumerModules: ['analytics', 'platform'],
    partitions: 6,
    retentionHours: 336,
    partitionKey: 'projectId',
    purpose: 'SE-T03 report written. Never auto-rejects. Do not treat as a cert tier.',
  },
  {
    topic: HIREKIWI_TOPICS.projectDefenseCompleted,
    producerOwner: 'Ramansh',
    producerModule: 'evaluation',
    consumerModules: ['analytics', 'platform'],
    partitions: 6,
    retentionHours: 336,
    partitionKey: 'projectId',
    purpose: 'Voice ownership defense completed; may route to human review.',
  },
  {
    topic: HIREKIWI_TOPICS.proctoringSnapshotReady,
    producerOwner: 'Ramansh',
    producerModule: 'proctoring',
    consumerModules: ['proctoring'],
    partitions: 6,
    retentionHours: 24,
    partitionKey: 'attemptId',
    purpose: 'Webcam checkpoint object is ready for the CV sidecar. Not continuous video.',
  },
  {
    topic: HIREKIWI_TOPICS.candidateSkillsDiscovered,
    producerOwner: 'Vishal V',
    producerModule: 'users',
    consumerModules: ['assessment', 'signal-encoder'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'CN-T01 candidate confirmed GitHub-derived skill suggestions at onboarding completion; ' +
      'consumer best-effort matches languages against the Software & IT catalog and auto-declares ' +
      'BEGINNER SkillClaims tagged source=GITHUB_DERIVED. Never overwrites an existing claim.',
  },
  {
    topic: HIREKIWI_TOPICS.signalIngested,
    producerOwner: 'Vishal Bharath R',
    producerModule: 'signal-ingestion',
    consumerModules: ['signal-encoder', 'analytics'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'Normalized raw passive signal fetched from an external platform adapter. Encoder consumes and vectorizes.',
  },
  {
    topic: HIREKIWI_TOPICS.signalEncoded,
    producerOwner: 'Ramansh',
    producerModule: 'signal-encoder',
    consumerModules: ['corroboration', 'analytics'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'Passive signal vectorized from external platform data. Observability + downstream fuse.',
  },
  {
    topic: HIREKIWI_TOPICS.corroborationUpdated,
    producerOwner: 'Ramansh',
    producerModule: 'corroboration',
    consumerModules: ['analytics'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'Trust-weighted competency readout refreshed. Never promotes SkillClaim status; may carry review flags.',
  },
  {
    topic: HIREKIWI_TOPICS.skillInferenceUpdated,
    producerOwner: 'Ramansh',
    producerModule: 'evidence',
    consumerModules: ['notifications', 'analytics'],
    partitions: 6,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'Evidence-to-skill fusion snapshot changed (proficiency or confidence). Not a verified claim.',
  },
  {
    topic: HIREKIWI_TOPICS.credentialVerified,
    producerOwner: 'Ramansh',
    // Emitted from candidate-certificates (endorsement/admin/assessment paths) and
    // evidence (professional credential auto-verification) — the shared payload
    // shape is owned by whoever's on this TopicSpec, per any of those modules.
    producerModule: 'candidate-certificates',
    consumerModules: ['signal-encoder'],
    partitions: 3,
    retentionHours: 168,
    partitionKey: 'userId',
    purpose:
      'A CandidateCertificate or ProfessionalCredential reached a verified status. ' +
      'signal-encoder consumes to vectorize it as an EXTERNALCERT/PROFESSIONALCREDENTIAL ' +
      'passive signal and feed corroboration fusion.',
  },
] as const;

export function getTopicSpec(topic: HireKiwiTopic): TopicSpec {
  const found = TOPIC_SPECS.find((spec) => spec.topic === topic);
  if (!found) {
    throw new Error(`Topic ${topic} is not registered in TOPIC_SPECS.`);
  }
  return found;
}

/** Consumer group naming: `hirekiwi.<module>.<topic-suffix>` — stable across deploys. */
export function consumerGroupFor(module: string, topic: HireKiwiTopic): string {
  return `hirekiwi.${module}.${topic.replace(/^hirekiwi\./, '')}`;
}

/** Dead-letter topic convention. Every consumer registers one. */
export function deadLetterTopicFor(topic: HireKiwiTopic): string {
  return `${topic}.dlq`;
}
