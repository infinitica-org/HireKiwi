import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import {
  AUDIO_EVALUATION_DLQ,
  AUDIO_EVALUATION_QUEUE,
  PDF_GENERATION_DLQ,
  PDF_GENERATION_QUEUE,
  SANDBOX_EXECUTION_DLQ,
  SANDBOX_EXECUTION_QUEUE,
} from './queue.names.js';

export abstract class DlqAwareProcessor extends WorkerHost {
  protected abstract readonly logger: Logger;
  protected abstract readonly dlq: Queue;

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    void this.dlq
      .add('dead', {
        originalQueue: job.queueName,
        originalJobId: job.id,
        data: job.data,
        error: error.message,
      })
      .catch((dlqError: unknown) => {
        this.logger.error(
          `Failed to write DLQ for ${job.queueName}:${job.id ?? '?'}: ${dlqError instanceof Error ? dlqError.message : 'unknown'}`,
        );
      });
  }
}

@Processor(SANDBOX_EXECUTION_QUEUE)
export class SandboxExecutionProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(SandboxExecutionProcessor.name);

  constructor(@InjectQueue(SANDBOX_EXECUTION_DLQ) protected readonly dlq: Queue) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.warn(`sandbox_execution ${job.id ?? ''} is not implemented yet`);
    throw new Error('Sandbox runner is not wired yet');
  }
}

@Processor(AUDIO_EVALUATION_QUEUE)
export class AudioEvaluationProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(AudioEvaluationProcessor.name);

  constructor(@InjectQueue(AUDIO_EVALUATION_DLQ) protected readonly dlq: Queue) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.warn(`audio_evaluation ${job.id ?? ''} is not implemented yet`);
    throw new Error('Audio evaluation worker is not wired yet');
  }
}

import { Inject } from '@nestjs/common';
import { env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { buildCertificateVerificationUrl } from '../../modules/certificate/certificate-crypto.util.js';
import {
  certificatePdfStorageKey,
  generateCertificateQrPng,
} from '../../modules/certificate/certificate-qr.util.js';
import { generateCertificatePdfBuffer } from '../../modules/certificate/certificate-pdf.generator.js';

@Processor(PDF_GENERATION_QUEUE)
export class PdfGenerationProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(PdfGenerationProcessor.name);

  constructor(
    @InjectQueue(PDF_GENERATION_DLQ) protected readonly dlq: Queue,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<{ certificateId: string }>): Promise<void> {
    const certificateId = job.data?.certificateId;
    if (!certificateId) {
      this.logger.warn(`PDF generation job ${job.id ?? ''} is missing certificateId`);
      return;
    }

    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { user: true, track: true },
    });

    if (!cert) {
      this.logger.warn(`Certificate ${certificateId} not found for PDF generation`);
      return;
    }

    try {
      const verificationUrl = buildCertificateVerificationUrl(
        env.VERIFY_APP_URL,
        cert.id,
        cert.signature ?? '',
      );
      const qrPngBuffer = await generateCertificateQrPng(verificationUrl);

      const candidateName = cert.user?.fullName || cert.user?.email || 'Candidate';
      const trackName = cert.track?.name || cert.track?.code || 'Readiness Track';
      const tierTrail =
        cert.tierTrail && typeof cert.tierTrail === 'object'
          ? (cert.tierTrail as Record<string, string>)
          : {};

      const pdfBuffer = await generateCertificatePdfBuffer({
        certificateId: cert.id,
        candidateName,
        trackName,
        highestLevelCleared: cert.highestLevelCleared,
        headlineTier: cert.headlineTier,
        tierTrail,
        issuedAt: cert.issuedAt ?? cert.createdAt,
        signature: cert.signature ?? '',
        verificationUrl,
        qrPngBuffer,
      });

      const pdfKey = certificatePdfStorageKey(cert.id);
      await this.storage.putObjectBuffer({
        objectKey: pdfKey,
        buffer: pdfBuffer,
        contentType: 'application/pdf',
      });

      await this.prisma.certificate.update({
        where: { id: cert.id },
        data: { pdfKey },
      });

      this.logger.log(`Generated and persisted certificate PDF artifact: ${pdfKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate certificate PDF for ${certificateId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
