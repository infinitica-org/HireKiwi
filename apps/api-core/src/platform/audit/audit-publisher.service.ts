import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { securityEventsTotal } from '@hirekiwi/observability';
import { AuditRecordedDataSchema, HIREKIWI_TOPICS } from '@hirekiwi/contracts';
import { KafkaOutboxService } from '../kafka/kafka-outbox.service.js';

export interface AuditRecordParams {
  readonly actorId: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly reasonCode: string | null;
  readonly metadata?: Record<string, unknown>;
}

/** S6-VV-126: audit actions that also feed `hirekiwi_security_events_total` (and the security alerts). */
export const SECURITY_EVENT_ACTIONS: ReadonlySet<string> = new Set([
  'auth.login_failed',
  'auth.account_locked',
  'auth.refresh_reuse_detected',
  'support.access_granted',
  'user.role_changed',
]);

const LOGIN_FAILURE_REASONS: ReadonlySet<string> = new Set([
  'unknown_email',
  'no_password',
  'bad_password',
  'locked',
  'tenant_blocked',
  'deactivated',
]);

export function countSecurityEvent(action: string, reasonCode: string | null | undefined): void {
  if (!SECURITY_EVENT_ACTIONS.has(action)) return;
  // Only login failures get a reason label; other reason codes are free text (ticket ids, notes).
  const reason =
    action === 'auth.login_failed' && reasonCode && LOGIN_FAILURE_REASONS.has(reasonCode)
      ? reasonCode
      : '';
  securityEventsTotal.inc({ action, reason });
}

/**
 * Publishes audit events to Kafka; the consumer persists to audit_logs.
 */
@Injectable()
export class AuditPublisherService {
  constructor(@Inject(KafkaOutboxService) private readonly outbox: KafkaOutboxService) {}

  async record(params: AuditRecordParams): Promise<void> {
    countSecurityEvent(params.action, params.reasonCode);
    const data = AuditRecordedDataSchema.parse({
      actorId: params.actorId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      reasonCode: params.reasonCode,
      metadata: params.metadata ?? {},
      recordedAt: new Date().toISOString(),
    });

    await this.outbox.enqueueEnvelope({
      topic: HIREKIWI_TOPICS.auditRecorded,
      partitionKey: params.resourceId ?? params.actorId ?? randomUUID(),
      eventType: HIREKIWI_TOPICS.auditRecorded,
      source: 'audit',
      data,
    });
  }
}
