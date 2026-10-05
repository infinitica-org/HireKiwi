import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { withJobSpan } from '@smart/observability';
import { DlqAwareProcessor } from '../../platform/queue/async-job.processor.js';
import {
  SKILL_VERIFY_GRADE_DLQ,
  SKILL_VERIFY_GRADE_QUEUE,
} from '../../platform/queue/queue.names.js';
import { SkillVerificationService } from './skill-verification.service.js';

export interface SkillVerifyGradeJobPayload {
  sessionId: string;
  userId: string;
}

@Processor(SKILL_VERIFY_GRADE_QUEUE)
export class SkillVerifyGradeProcessor extends DlqAwareProcessor {
  protected readonly logger = new Logger(SkillVerifyGradeProcessor.name);

  constructor(
    @Inject(SkillVerificationService) private readonly skillVerify: SkillVerificationService,
    @InjectQueue(SKILL_VERIFY_GRADE_DLQ) protected readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<SkillVerifyGradeJobPayload>): Promise<void> {
    await withJobSpan(
      job,
      { 'verification.kind': 'skill_verify_grade', 'subject.id': job.data.sessionId },
      () => this.skillVerify.processQueuedComplete(job.data.sessionId, job.data.userId),
    );
  }
}
