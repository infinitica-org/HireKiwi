import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { env } from '../../../platform/config/env.js';
import { PrismaService } from '../../../platform/prisma/prisma.service.js';
import {
  CERTIFICATE_RECHECK_INTERVAL_MS,
  CERTIFICATE_RECHECK_JOB_ID,
  CERTIFICATE_RECHECK_QUEUE,
  CERTIFICATE_VERIFICATION_QUEUE,
} from '../../../platform/queue/queue.names.js';
import type { CertificateVerificationJobPayload } from './certificate-verification.processor.js';

/** A verified certificate is re-asked at most this often. */
export const RECHECK_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** Bounded per daily run so the issuers we ask aren't hammered; the rest wait a day. */
export const RECHECK_BATCH_SIZE = 200;

/**
 * Nothing re-checked a certificate once it was source-verified, so a badge revoked a month later
 * stayed on the profile. Daily, this re-queues link-verified certificates whose last check is
 * older than RECHECK_AFTER_MS, as `recheck` runs: only a revocation (or the issuer no longer
 * finding it) changes them — see CertificateSourceVerificationService.runVerification.
 */
@Processor(CERTIFICATE_RECHECK_QUEUE)
export class CertificateRecheckProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(CertificateRecheckProcessor.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @InjectQueue(CERTIFICATE_RECHECK_QUEUE) private readonly queue: Queue,
    @InjectQueue(CERTIFICATE_VERIFICATION_QUEUE)
    private readonly verificationQueue: Queue<CertificateVerificationJobPayload>,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      await this.queue.upsertJobScheduler(
        CERTIFICATE_RECHECK_JOB_ID,
        { every: CERTIFICATE_RECHECK_INTERVAL_MS },
        { name: 'recheck-verified-certificates' },
      );
    } catch (error) {
      this.logger.warn(
        `Could not schedule certificate re-check job: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async process(job: { name?: string }): Promise<void> {
    if (job.name !== 'recheck-verified-certificates') return;
    const queued = await this.queueDueRechecks(new Date());
    if (queued > 0) this.logger.log(`Queued ${queued} certificate re-check(s).`);
  }

  /** Queues re-checks for verified, link-backed certificates not checked since the cutoff. */
  async queueDueRechecks(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - RECHECK_AFTER_MS);
    const due = await this.prisma.candidateCertificate.findMany({
      where: {
        sourceStatus: 'source_verified',
        verificationUrl: { not: null },
        status: { notIn: ['VOIDED', 'REJECTED'] },
        events: { none: { createdAt: { gte: cutoff } } },
      },
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: RECHECK_BATCH_SIZE,
    });
    for (const { id } of due) {
      await this.verificationQueue.add(
        'verify-certificate',
        { certificateId: id, refresh: true, recheck: true },
        // One pending re-check per certificate per day, however often this runs.
        { jobId: `recheck-${id}-${now.toISOString().slice(0, 10)}` },
      );
    }
    return due.length;
  }
}
