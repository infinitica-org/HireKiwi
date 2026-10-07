import { SpanStatusCode, trace, type Attributes } from '@opentelemetry/api';
import { queueJobDuration } from './metrics.js';

/** The fields of a BullMQ job this helper reads (kept structural so this package needs no bullmq). */
export interface TracedJob {
  readonly id?: string;
  readonly queueName: string;
  readonly name: string;
  readonly attemptsMade: number;
  readonly opts: { readonly attempts?: number };
}

const tracer = trace.getTracer('hirekiwi-jobs');

/**
 * S6-VV-128 (#580): runs a background job inside its own span. Logs written during the job carry
 * its `trace_id` (the logger mixin reads the active span), so a failed verification can be opened
 * in Tempo and followed to its logs. On failure the span records the exception, is marked ERROR,
 * and says whether BullMQ will retry. Also times every job into
 * `hirekiwi_queue_job_duration_seconds{queue, outcome}`.
 *
 * Without OTEL_EXPORTER_OTLP_ENDPOINT the tracer is a no-op and only the histogram is recorded.
 */
export async function withJobSpan<T>(
  job: TracedJob,
  attributes: Attributes,
  run: () => Promise<T>,
): Promise<T> {
  const attempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts ?? 1;
  const startedAt = performance.now();
  return tracer.startActiveSpan(
    `job ${job.queueName}`,
    {
      attributes: {
        'messaging.system': 'bullmq',
        'messaging.destination.name': job.queueName,
        'messaging.message.id': job.id ?? '',
        'job.name': job.name,
        'job.attempt': attempt,
        'job.max_attempts': maxAttempts,
        ...attributes,
      },
    },
    async (span) => {
      try {
        const result = await run();
        span.setStatus({ code: SpanStatusCode.OK });
        queueJobDuration.observe(
          { queue: job.queueName, outcome: 'completed' },
          (performance.now() - startedAt) / 1000,
        );
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const willRetry = attempt < maxAttempts;
        span.recordException(err);
        span.setAttribute('job.will_retry', willRetry);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        queueJobDuration.observe(
          { queue: job.queueName, outcome: willRetry ? 'retrying' : 'failed' },
          (performance.now() - startedAt) / 1000,
        );
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
