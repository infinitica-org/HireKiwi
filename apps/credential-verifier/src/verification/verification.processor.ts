import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { DlqAwareProcessor } from '../platform/queue/dlq-aware.processor.js';
import { VERIFICATION_DLQ, VERIFICATION_QUEUE } from '../platform/queue/queue.names.js';
import { VerificationOrchestratorService } from './verification-orchestrator.service.js';

export interface VerificationJobPayload {
  verificationId: string;
}

@Processor(VERIFICATION_QUEUE)
export class VerificationProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(VerificationProcessor.name);

  constructor(
    @Inject(VerificationOrchestratorService)
    private readonly orchestrator: VerificationOrchestratorService,
    @InjectQueue(VERIFICATION_DLQ) protected readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<VerificationJobPayload>): Promise<void> {
    await this.orchestrator.run(job.data.verificationId);
  }
}
