import { describe, expect, it, vi } from 'vitest';
import { SMART_TOPICS, TrackUpdatedEventSchema } from '@smart/contracts';
import { env } from '../config/env.js';
import type { KafkaService } from './kafka.service.js';
import type { RedisService } from '../redis/redis.service.js';
import { TrackUpdatedConsumer } from './track-updated.consumer.js';

describe('TrackUpdatedConsumer', () => {
  it('validates track.updated schema for CUT_SCORES_PUBLISHED', () => {
    const payload = {
      meta: {
        eventId: '11111111-1111-4111-8111-111111111111',
        eventType: SMART_TOPICS.trackUpdated,
        version: 1,
        occurredAt: '2026-09-30T10:00:00.000Z',
        traceId: '22222222-2222-4222-8222-222222222222',
        source: 'assessment',
      },
      data: {
        trackCode: 'TECH_FULLSTACK',
        changeKind: 'CUT_SCORES_PUBLISHED',
        affectedLevels: [1],
        invalidateKeys: ['cut_scores:track:track-123', 'cut_scores:level:level-456'],
      },
    };

    const parsed = TrackUpdatedEventSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('subscribes to SMART_TOPICS.trackUpdated and invalidates all keys in Redis', async () => {
    let handler: ((payload: unknown, headers: Record<string, string>) => Promise<void>) | undefined;

    const mockKafka: Partial<KafkaService> = {
      subscribe: vi.fn().mockImplementation(async (sub) => {
        if (sub.topic === SMART_TOPICS.trackUpdated) {
          handler = sub.handler;
        }
      }),
    };

    const mockRedis: Partial<RedisService> = {
      del: vi.fn().mockResolvedValue(1),
    };

    const consumer = new TrackUpdatedConsumer(mockKafka as KafkaService, mockRedis as RedisService);

    const originalNodeEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'development';
    await consumer.onModuleInit();
    (env as any).NODE_ENV = originalNodeEnv;

    expect(mockKafka.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: SMART_TOPICS.trackUpdated,
        module: 'platform',
      }),
    );

    expect(handler).toBeDefined();

    const sampleEvent = {
      meta: {
        eventId: '11111111-1111-4111-8111-111111111111',
        eventType: SMART_TOPICS.trackUpdated,
        version: 1,
        occurredAt: '2026-09-30T10:00:00.000Z',
        traceId: 'trace-1',
        source: 'assessment',
      },
      data: {
        trackCode: 'TECH_FULLSTACK',
        changeKind: 'CUT_SCORES_PUBLISHED',
        affectedLevels: [1],
        invalidateKeys: ['cut_scores:track:t1', 'cut_scores:level:l1'],
      },
    };

    if (handler) {
      await handler(sampleEvent, {});
    }

    expect(mockRedis.del).toHaveBeenCalledWith('cut_scores:track:t1');
    expect(mockRedis.del).toHaveBeenCalledWith('cut_scores:level:l1');
  });

  it('handles Redis deletion errors gracefully without throwing', async () => {
    let handler: ((payload: unknown, headers: Record<string, string>) => Promise<void>) | undefined;

    const mockKafka: Partial<KafkaService> = {
      subscribe: vi.fn().mockImplementation(async (sub) => {
        if (sub.topic === SMART_TOPICS.trackUpdated) {
          handler = sub.handler;
        }
      }),
    };

    const mockRedis: Partial<RedisService> = {
      del: vi.fn().mockRejectedValue(new Error('Redis connection lost')),
    };

    const consumer = new TrackUpdatedConsumer(mockKafka as KafkaService, mockRedis as RedisService);

    const originalNodeEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'development';
    await consumer.onModuleInit();
    (env as any).NODE_ENV = originalNodeEnv;

    const sampleEvent = {
      meta: {
        eventId: '11111111-1111-4111-8111-111111111111',
        eventType: SMART_TOPICS.trackUpdated,
        version: 1,
        occurredAt: '2026-09-30T10:00:00.000Z',
        traceId: 'trace-1',
        source: 'assessment',
      },
      data: {
        trackCode: 'TECH_FULLSTACK',
        changeKind: 'CUT_SCORES_PUBLISHED',
        affectedLevels: [1],
        invalidateKeys: ['cut_scores:track:t1'],
      },
    };

    if (handler) {
      await expect(handler(sampleEvent, {})).resolves.not.toThrow();
    }
  });
});
