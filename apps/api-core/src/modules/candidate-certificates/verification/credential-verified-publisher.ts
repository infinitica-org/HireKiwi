import { HIREKIWI_TOPICS, type CredentialVerifiedEvent } from '@hirekiwi/contracts';
import type { KafkaOutboxService } from '../../../platform/kafka/kafka-outbox.service.js';

/**
 * Shared publish helper for hirekiwi.credential.verified (S6-VV-74).
 *
 * Emitted from every place a CandidateCertificate or ProfessionalCredential
 * reaches a verified state (endorsement decision, admin override, agenda
 * assessment pass, or automated issuer/URL verification) so signal-encoder
 * can vectorize it into corroboration fusion without each caller knowing
 * anything about that downstream pipeline.
 *
 * Owner: Ramansh.
 */
export async function publishCredentialVerified(
  outbox: KafkaOutboxService,
  source: string,
  data: CredentialVerifiedEvent['data'],
): Promise<void> {
  await outbox.enqueueEnvelope({
    topic: HIREKIWI_TOPICS.credentialVerified,
    partitionKey: data.userId,
    eventType: HIREKIWI_TOPICS.credentialVerified,
    source,
    data,
  });
}
