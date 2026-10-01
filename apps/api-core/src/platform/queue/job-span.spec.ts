import { SpanStatusCode, trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { registry, withJobSpan } from '@smart/observability';

const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });

const job = (attemptsMade: number, attempts = 5) => ({
  id: 'job-1',
  queueName: 'credential_verification',
  name: 'verify',
  attemptsMade,
  opts: { attempts },
});

async function durationCount(outcome: string): Promise<number> {
  const metric = (await registry.getMetricsAsJSON()).find(
    (m) => m.name === 'smart_queue_job_duration_seconds',
  );
  return (
    metric?.values.find(
      (v) =>
        v.metricName === 'smart_queue_job_duration_seconds_count' &&
        v.labels.queue === 'credential_verification' &&
        v.labels.outcome === outcome,
    )?.value ?? 0
  );
}

describe('withJobSpan (S6-VV-128)', () => {
  beforeAll(() => {
    trace.setGlobalTracerProvider(provider);
  });
  afterAll(() => {
    trace.disable();
  });
  beforeEach(() => exporter.reset());

  it('records a completed job as an OK span with the job and subject attributes', async () => {
    const before = await durationCount('completed');
    const result = await withJobSpan(job(0), { 'subject.id': 'cred-1' }, async () => 'done');

    expect(result).toBe('done');
    const [span] = exporter.getFinishedSpans();
    expect(span?.name).toBe('job credential_verification');
    expect(span?.status.code).toBe(SpanStatusCode.OK);
    expect(span?.attributes).toMatchObject({
      'messaging.destination.name': 'credential_verification',
      'job.attempt': 1,
      'subject.id': 'cred-1',
    });
    expect(await durationCount('completed')).toBe(before + 1);
  });

  it('marks a failure ERROR with the exception, says it will retry, and rethrows', async () => {
    await expect(
      withJobSpan(job(1), {}, async () => {
        throw new Error('issuer unreachable');
      }),
    ).rejects.toThrow('issuer unreachable');

    const [span] = exporter.getFinishedSpans();
    expect(span?.status).toEqual({ code: SpanStatusCode.ERROR, message: 'issuer unreachable' });
    expect(span?.events.some((e) => e.name === 'exception')).toBe(true);
    expect(span?.attributes['job.will_retry']).toBe(true);
  });

  it('counts the last attempt as failed, not retrying', async () => {
    const before = await durationCount('failed');
    await expect(
      withJobSpan(job(4, 5), {}, async () => {
        throw new Error('gave up');
      }),
    ).rejects.toThrow('gave up');
    expect(exporter.getFinishedSpans()[0]?.attributes['job.will_retry']).toBe(false);
    expect(await durationCount('failed')).toBe(before + 1);
  });
});
