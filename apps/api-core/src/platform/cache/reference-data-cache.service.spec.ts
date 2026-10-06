import { describe, expect, it, vi } from 'vitest';
import type { RedisService } from '../redis/redis.service.js';
import { ReferenceDataCache } from './reference-data-cache.service.js';

function buildRedisMock() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, ..._rest: unknown[]) => {
      if (store.has(key) && _rest.includes('NX')) return null;
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    store,
  };
}

describe('ReferenceDataCache', () => {
  it('populates the cache on a miss and serves a hit from it on the next call', async () => {
    const redis = buildRedisMock();
    const cache = new ReferenceDataCache(redis as unknown as RedisService);
    const loader = vi.fn().mockResolvedValue({ value: 42 });

    const first = await cache.getOrLoad('key', loader, { namespace: 'test', ttlSeconds: 60 });
    const second = await cache.getOrLoad('key', loader, { namespace: 'test', ttlSeconds: 60 });

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('releases the lock after loading so a later miss can repopulate', async () => {
    const redis = buildRedisMock();
    const cache = new ReferenceDataCache(redis as unknown as RedisService);
    await cache.getOrLoad('key', vi.fn().mockResolvedValue('v1'), {
      namespace: 'test',
      ttlSeconds: 60,
    });

    expect(redis.store.has('ref:v1:test:key:lock')).toBe(false);
  });

  it('a concurrent caller that loses the lock race waits for the winner instead of hitting the loader', async () => {
    const redis = buildRedisMock();
    const cache = new ReferenceDataCache(redis as unknown as RedisService);
    const winnerLoader = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve('winner-result'), 20)),
    );
    const loserLoader = vi.fn().mockResolvedValue('loser-result');

    const [winner, loser] = await Promise.all([
      cache.getOrLoad('race-key', winnerLoader, { namespace: 'test', ttlSeconds: 60 }),
      (async () => {
        // Let the winner acquire the lock first.
        await new Promise((resolve) => setTimeout(resolve, 5));
        return cache.getOrLoad('race-key', loserLoader, { namespace: 'test', ttlSeconds: 60 });
      })(),
    ]);

    expect(winner).toBe('winner-result');
    expect(loser).toBe('winner-result');
    expect(loserLoader).not.toHaveBeenCalled();
  });

  it('fails open to the loader when Redis is unavailable', async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error('down')),
      set: vi.fn().mockRejectedValue(new Error('down')),
      del: vi.fn().mockRejectedValue(new Error('down')),
    };
    const cache = new ReferenceDataCache(redis as unknown as RedisService);
    const result = await cache.getOrLoad('key', vi.fn().mockResolvedValue('fallback'), {
      namespace: 'test',
      ttlSeconds: 60,
    });

    expect(result).toBe('fallback');
  });
});
