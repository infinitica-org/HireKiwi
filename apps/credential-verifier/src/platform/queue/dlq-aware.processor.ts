import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import type { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';

/** Shared DLQ-forwarding behavior for queue processors in this service. */
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
          `Failed to write DLQ for ${job.queueName}:${job.id ?? '?'}: ${
            dlqError instanceof Error ? dlqError.message : 'unknown'
          }`,
        );
      });
  }
}
