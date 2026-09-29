import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { DlqAwareProcessor } from '../../platform/queue/async-job.processor.js';
import {
  ASSESSMENT_FORCE_SUBMIT_DLQ,
  ASSESSMENT_FORCE_SUBMIT_QUEUE,
} from '../../platform/queue/queue.names.js';
import { AssessmentService } from './assessment.service.js';

export interface AssessmentForceSubmitJobPayload {
  attemptId: string;
  studentId: string;
}

@Processor(ASSESSMENT_FORCE_SUBMIT_QUEUE)
export class AssessmentForceSubmitProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(AssessmentForceSubmitProcessor.name);

  constructor(
    @Inject(AssessmentService) private readonly assessmentService: AssessmentService,
    @InjectQueue(ASSESSMENT_FORCE_SUBMIT_DLQ) protected readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<AssessmentForceSubmitJobPayload>): Promise<void> {
    const { attemptId } = job.data;
    this.logger.log({ attemptId, jobId: job.id }, 'Processing assessment force-submission');
    await this.assessmentService.forceSubmitAttempt(attemptId);
  }
}
