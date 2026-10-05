import { describe, expect, it, vi } from 'vitest';
import { ConsumerInbox, eventIdOf } from './consumer-inbox.js';

/** In-memory consumed_events with the (consumer_group, event_id) primary key. */
function inbox() {
  const rows = new Set<string>();
  const prisma = {
    consumedEvent: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { consumerGroup_eventId: { consumerGroup: string; eventId: string } };
        }) => {
          const { consumerGroup, eventId } = where.consumerGroup_eventId;
          return rows.has(`${consumerGroup}|${eventId}`) ? { eventId } : null;
        },
      ),
      createMany: vi.fn(
        async ({ data }: { data: Array<{ consumerGroup: string; eventId: string }> }) => {
          for (const row of data) rows.add(`${row.consumerGroup}|${row.eventId}`);
          return { count: data.length };
        },
      ),
    },
  };
  return { service: new ConsumerInbox(prisma as never), prisma, rows };
}

const EVENT_ID = '7d0f0d64-5a51-4b38-9a3c-0f3a4f1d2e11';
const envelope = { meta: { eventId: EVENT_ID, eventType: 'x', version: 1 }, data: {} };

describe('ConsumerInbox (S6-VV-123)', () => {
  it('reads the envelope eventId and ignores anything that is not a uuid', () => {
    expect(eventIdOf(envelope)).toBe(EVENT_ID);
    expect(eventIdOf({ meta: { eventId: 'not-a-uuid' } })).toBeNull();
    expect(eventIdOf({ original: {} })).toBeNull();
    expect(eventIdOf(null)).toBeNull();
  });

  it('runs a redelivered event once per consumer group', async () => {
    const { service } = inbox();
    const score = vi.fn().mockResolvedValue(undefined);

    expect(await service.handle('evaluation.assessment', envelope, score)).toBe('processed');
    expect(await service.handle('evaluation.assessment', envelope, score)).toBe('duplicate');
    expect(await service.handle('evaluation.assessment', envelope, score)).toBe('duplicate');
    expect(score).toHaveBeenCalledOnce();
  });

  it('keeps consumer groups independent: each fan-out consumer still sees the event', async () => {
    const { service } = inbox();
    const run = vi.fn().mockResolvedValue(undefined);
    await service.handle('evaluation.assessment', envelope, run);
    await service.handle('notifications.assessment', envelope, run);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('records nothing when the handler fails, so a redelivery or DLQ replay runs it again', async () => {
    const { service, rows } = inbox();
    const flaky = vi
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce(undefined);

    await expect(service.handle('g', envelope, flaky)).rejects.toThrow('db down');
    expect(rows.size).toBe(0);
    expect(await service.handle('g', envelope, flaky)).toBe('processed');
    expect(flaky).toHaveBeenCalledTimes(2);
  });

  it('does not fail a handled event when the marker write fails', async () => {
    const { service, prisma } = inbox();
    prisma.consumedEvent.createMany.mockRejectedValueOnce(new Error('pool exhausted'));
    const run = vi.fn().mockResolvedValue(undefined);
    await expect(service.handle('g', envelope, run)).resolves.toBe('processed');
  });

  it('always runs payloads without an envelope eventId (legacy and DLQ wrappers)', async () => {
    const { service, prisma } = inbox();
    const run = vi.fn().mockResolvedValue(undefined);
    await service.handle('g', { foo: 1 }, run);
    await service.handle('g', { foo: 1 }, run);
    expect(run).toHaveBeenCalledTimes(2);
    expect(prisma.consumedEvent.findUnique).not.toHaveBeenCalled();
  });
});
