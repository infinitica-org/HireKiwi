import { describe, expect, it, vi } from 'vitest';
import { getQueueToken } from '@nestjs/bullmq';
import { registry } from '@hirekiwi/observability';
import { QueueMetricsCollector } from './queue-metrics.collector.js';

const NOW = Date.parse('2026-10-01T12:00:00.000Z');

function fakeQueue(counts: Record<string, number>, oldestTimestamp?: number) {
  return {
    getJobCounts: vi.fn().mockResolvedValue(counts),
    getWaiting: vi.fn().mockResolvedValue(oldestTimestamp ? [{ timestamp: oldestTimestamp }] : []),
  };
}

function collectorFor(queues: Record<string, ReturnType<typeof fakeQueue> | Error>) {
  const moduleRef = {
    get: vi.fn((token: string) => {
      const name = Object.keys(queues).find((q) => getQueueToken(q) === token);
      const queue = name ? queues[name] : undefined;
      if (!queue || queue instanceof Error) throw queue ?? new Error('missing');
      return queue;
    }),
  };
  return new QueueMetricsCollector(moduleRef as never, Object.keys(queues));
}

async function gauge(name: string, labels: Record<string, string>): Promise<number | undefined> {
  const metric = (await registry.getMetricsAsJSON()).find((m) => m.name === name);
  return metric?.values.find((v) => Object.entries(labels).every(([k, val]) => v.labels[k] === val))
    ?.value;
}

describe('QueueMetricsCollector (S6-VV-127)', () => {
  it('exports job counts per state and the oldest waiting age per queue', async () => {
    const collector = collectorFor({
      skill_verify_grade: fakeQueue({ waiting: 4, active: 1, delayed: 2, failed: 0 }, NOW - 90_000),
      'skill_verify_grade.dlq': fakeQueue({ waiting: 3, active: 0, delayed: 0, failed: 0 }),
    });
    await collector.collect(NOW);

    expect(
      await gauge('hirekiwi_queue_jobs', { queue: 'skill_verify_grade', state: 'waiting' }),
    ).toBe(4);
    expect(
      await gauge('hirekiwi_queue_jobs', { queue: 'skill_verify_grade', state: 'delayed' }),
    ).toBe(2);
    expect(
      await gauge('hirekiwi_queue_oldest_waiting_seconds', { queue: 'skill_verify_grade' }),
    ).toBe(90);
    expect(
      await gauge('hirekiwi_queue_jobs', { queue: 'skill_verify_grade.dlq', state: 'waiting' }),
    ).toBe(3);
    expect(collector.snapshot().get('skill_verify_grade')?.counts.active).toBe(1);
  });

  it('keeps polling the other queues when one is unreachable', async () => {
    const collector = collectorFor({
      broken: new Error('redis down'),
      qlix_poll: fakeQueue({ waiting: 1, active: 0, delayed: 0, failed: 5 }),
    });
    await collector.collect(NOW);
    expect(await gauge('hirekiwi_queue_jobs', { queue: 'qlix_poll', state: 'failed' })).toBe(5);
    expect(collector.snapshot().has('broken')).toBe(false);
  });
});
