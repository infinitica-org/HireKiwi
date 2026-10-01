import { describe, expect, it, vi } from 'vitest';
import { IdempotencyService, STALE_RESERVATION_MS } from './idempotency.service.js';

type Row = { requestHash: string; responseBody: unknown; createdAt: Date };

/** In-memory idempotency_records with the unique (userId, scope, key) constraint. */
function ledger() {
  const rows = new Map<string, Row>();
  const id = (w: { userId: string; scope: string; key: string }) =>
    `${w.userId}|${w.scope}|${w.key}`;
  const prisma = {
    idempotencyRecord: {
      create: vi.fn(
        async ({ data }: { data: Row & { userId: string; scope: string; key: string } }) => {
          if (rows.has(id(data))) throw Object.assign(new Error('unique'), { code: 'P2002' });
          rows.set(id(data), {
            requestHash: data.requestHash,
            responseBody: data.responseBody,
            createdAt: new Date(),
          });
          return data;
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { userId_scope_key: { userId: string; scope: string; key: string } };
        }) => rows.get(id(where.userId_scope_key)) ?? null,
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { userId_scope_key: { userId: string; scope: string; key: string } };
          data: { responseBody: unknown };
        }) => {
          const row = rows.get(id(where.userId_scope_key)) as Row;
          row.responseBody = data.responseBody;
          return row;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { userId: string; scope: string; key: string; createdAt: Date };
          data: { createdAt: Date };
        }) => {
          const row = rows.get(id(where));
          if (!row || row.createdAt.getTime() !== where.createdAt.getTime()) return { count: 0 };
          row.createdAt = data.createdAt;
          return { count: 1 };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { userId: string; scope: string; key: string } }) => {
          rows.delete(id(where));
          return { count: 1 };
        },
      ),
    },
  };
  return { service: new IdempotencyService(prisma as never), rows };
}

const base = { userId: 'u-1', scope: 'account.data-requests.create', request: { type: 'EXPORT' } };

describe('IdempotencyService.once (S6-VV-124)', () => {
  it('runs every time when no key is sent', async () => {
    const { service, rows } = ledger();
    const execute = vi.fn().mockResolvedValue({ id: 'r-1' });
    await service.once({ ...base, key: undefined, execute });
    await service.once({ ...base, key: '  ', execute });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(rows.size).toBe(0);
  });

  it('replays the first response for a repeated key without running again', async () => {
    const { service } = ledger();
    const execute = vi.fn().mockResolvedValue({ id: 'r-1' });
    const first = await service.once({ ...base, key: 'k1', execute });
    const second = await service.once({ ...base, key: 'k1', execute });
    expect(second).toEqual(first);
    expect(execute).toHaveBeenCalledOnce();
  });

  it('answers 409 request_in_progress to a double submit that arrives while the first runs', async () => {
    const { service } = ledger();
    let release: (value: unknown) => void = () => undefined;
    const slow = vi.fn(() => new Promise((resolve) => (release = resolve)));
    const first = service.once({ ...base, key: 'k2', execute: slow });
    await Promise.resolve();

    await expect(service.once({ ...base, key: 'k2', execute: slow })).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ error: 'request_in_progress' }),
    });
    release({ id: 'r-2' });
    await expect(first).resolves.toEqual({ id: 'r-2' });
    expect(slow).toHaveBeenCalledOnce();
  });

  it('releases the key when the work fails, so the same key can retry', async () => {
    const { service } = ledger();
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('queue down'))
      .mockResolvedValueOnce({ id: 'r-3' });
    await expect(service.once({ ...base, key: 'k3', execute })).rejects.toThrow('queue down');
    await expect(service.once({ ...base, key: 'k3', execute })).resolves.toEqual({ id: 'r-3' });
  });

  it('refuses the same key with a different request', async () => {
    const { service } = ledger();
    await service.once({ ...base, key: 'k4', execute: async () => ({ id: 'r-4' }) });
    await expect(
      service.once({
        ...base,
        key: 'k4',
        request: { type: 'DELETION' },
        execute: async () => ({ id: 'other' }),
      }),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ error: 'idempotency_key_reused' }),
    });
  });

  it('takes over a reservation stranded by a crashed request (S6-VV-158)', async () => {
    const { service, rows } = ledger();
    const hung = service.once({ ...base, key: 'k5', execute: () => new Promise(() => undefined) });
    await Promise.resolve();
    void hung;
    const row = rows.get('u-1|account.data-requests.create|k5') as Row;
    row.createdAt = new Date(Date.now() - STALE_RESERVATION_MS - 1000);

    const execute = vi.fn().mockResolvedValue({ id: 'r-5' });
    await expect(service.once({ ...base, key: 'k5', execute })).resolves.toEqual({ id: 'r-5' });
    expect(execute).toHaveBeenCalledOnce();
    await expect(service.once({ ...base, key: 'k5', execute })).resolves.toEqual({ id: 'r-5' });
    expect(execute).toHaveBeenCalledOnce();
  });

  it('lets only one of two racing retries take over a stale reservation', async () => {
    const { service, rows } = ledger();
    void service.once({ ...base, key: 'k6', execute: () => new Promise(() => undefined) });
    await Promise.resolve();
    (rows.get('u-1|account.data-requests.create|k6') as Row).createdAt = new Date(0);

    const slow = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ id: 'r-6' }), 5)));
    const results = await Promise.allSettled([
      service.once({ ...base, key: 'k6', execute: slow }),
      service.once({ ...base, key: 'k6', execute: slow }),
    ]);
    expect(slow).toHaveBeenCalledOnce();
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
  });
});
