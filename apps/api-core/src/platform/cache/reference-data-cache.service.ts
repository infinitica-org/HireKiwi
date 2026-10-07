import { Inject, Injectable } from '@nestjs/common';
import { cacheOperations } from '@hirekiwi/observability';
import { RedisService } from '../redis/redis.service.js';

const LOCK_WAIT_MS = 50;
const LOCK_RETRIES = 20;
const LOCK_TTL_SECONDS = 10;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** +/-10% jitter so every replica's TTLs don't expire at the same instant. */
function jitteredTtl(ttlSeconds: number): number {
  const jitter = ttlSeconds * 0.1;
  return Math.round(ttlSeconds - jitter + Math.random() * jitter * 2);
}

export interface GetOrLoadOptions {
  /** Namespace label on `hirekiwi_cache_operations_total` and the versioned key prefix. */
  readonly namespace: string;
  readonly ttlSeconds: number;
  /**
   * Bump to invalidate every key in this namespace at once (e.g. after an admin edit).
   * Defaults to 1 — most reference data here has no write path at all.
   */
  readonly version?: number;
}

/**
 * S6-VV-130 (#589): a shared cache-aside helper for read-mostly, non-tenant-scoped reference
 * data (career domains, target roles, skill taxonomy, plans). Never use this for per-user or
 * per-tenant data — there is no tenant dimension in the key.
 *
 * Single-flight: on a miss, the first caller takes a short Redis lock and populates the cache;
 * concurrent callers poll for the result instead of all hitting the loader at once. If the lock
 * can't be acquired within the wait budget, the caller runs the loader directly (fail open) —
 * a cache being briefly ineffective under extreme load is better than every request stalling.
 */
@Injectable()
export class ReferenceDataCache {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async getOrLoad<T>(key: string, loader: () => Promise<T>, options: GetOrLoadOptions): Promise<T> {
    const versionedKey = `ref:v${String(options.version ?? 1)}:${options.namespace}:${key}`;

    const cached = await this.readCache<T>(versionedKey);
    if (cached !== undefined) {
      cacheOperations.inc({ namespace: options.namespace, result: 'hit' });
      return cached;
    }
    cacheOperations.inc({ namespace: options.namespace, result: 'miss' });

    const lockKey = `${versionedKey}:lock`;
    const gotLock = await this.tryLock(lockKey);

    if (!gotLock) {
      const awaited = await this.awaitPeer<T>(versionedKey);
      if (awaited !== undefined) return awaited;
      // Lock holder died, or still loading past our wait budget: fail open.
      return loader();
    }

    try {
      const fresh = await loader();
      await this.writeCache(versionedKey, fresh, options.ttlSeconds);
      return fresh;
    } finally {
      await this.redis.del(lockKey).catch(() => undefined);
    }
  }

  private async readCache<T>(versionedKey: string): Promise<T | undefined> {
    try {
      const raw = await this.redis.get(versionedKey);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  private async writeCache<T>(versionedKey: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(versionedKey, JSON.stringify(value), 'EX', jitteredTtl(ttlSeconds));
    } catch {
      // Redis down: serve this one response uncached rather than failing the request.
    }
  }

  private async tryLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
      return result === 'OK';
    } catch {
      return false;
    }
  }

  private async awaitPeer<T>(versionedKey: string): Promise<T | undefined> {
    for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
      await delay(LOCK_WAIT_MS);
      const cached = await this.readCache<T>(versionedKey);
      if (cached !== undefined) return cached;
    }
    return undefined;
  }
}
