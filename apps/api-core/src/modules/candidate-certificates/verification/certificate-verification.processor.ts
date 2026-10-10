import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { withJobSpan } from '@hirekiwi/observability';
import { DlqAwareProcessor } from '../../../platform/queue/async-job.processor.js';
import {
  CERTIFICATE_VERIFICATION_DLQ,
  CERTIFICATE_VERIFICATION_QUEUE,
} from '../../../platform/queue/queue.names.js';
import { CertificateSourceVerificationService } from './certificate-source-verification.service.js';

export interface CertificateVerificationJobPayload {
  certificateId: string;
  /** Re-ask the issuer instead of reusing the engine's cached answer. */
  refresh?: boolean;
  /** Scheduled re-check: only a revocation changes the certificate. */
  recheck?: boolean;
  /**
   * The certificate's `verificationGeneration` when this run was queued. The result is only
   * written while it is still current, so a run for an old link or file can't overwrite a newer
   * one. Absent on jobs queued before the fence existed.
   */
  generation?: number;
}

/**
 * Runs `CertificateSourceVerificationService.runVerification` off the request thread. Create/
 * upload/agenda-edit and the admin re-verify actions all just enqueue here now, instead of
 * awaiting the (sometimes slow, Tier-1-engine-bound) verification inline.
 */
@Processor(CERTIFICATE_VERIFICATION_QUEUE)
export class CertificateVerificationProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(CertificateVerificationProcessor.name);

  constructor(
    @Inject(CertificateSourceVerificationService)
    private readonly verificationService: CertificateSourceVerificationService,
    @InjectQueue(CERTIFICATE_VERIFICATION_DLQ) protected readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<CertificateVerificationJobPayload>): Promise<void> {
    await withJobSpan(
      job,
      { 'verification.kind': 'candidate_certificate', 'subject.id': job.data.certificateId },
      () =>
        this.verificationService.runVerification(job.data.certificateId, {
          refresh: job.data.refresh,
          recheck: job.data.recheck,
          generation: job.data.generation,
        }),
    );
  }
}
