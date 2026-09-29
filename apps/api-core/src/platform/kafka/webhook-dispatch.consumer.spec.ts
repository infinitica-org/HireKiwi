import { describe, expect, it, vi } from 'vitest';
import { CertificateIssuedEventSchema, SMART_TOPICS } from '@smart/contracts';
import { env } from '../config/env.js';
import { WebhookDispatchConsumer } from './webhook-dispatch.consumer.js';
import type { KafkaService } from './kafka.service.js';
import type { WebhooksService } from '../../modules/webhooks/webhooks.service.js';

describe('WebhookDispatchConsumer', () => {
  it('16. Validates certificate.issued schema and dispatches to student institution webhook', async () => {
    let certificateHandler:
      ((payload: unknown, headers: Record<string, string>) => Promise<void>) | undefined;

    const mockKafka: Partial<KafkaService> = {
      subscribe: vi.fn().mockImplementation(async (sub) => {
        if (sub.topic === SMART_TOPICS.certificateIssued) {
          certificateHandler = sub.handler;
        }
      }),
    };

    const mockWebhooks: Partial<WebhooksService> = {
      resolveStudentInstitution: vi.fn().mockResolvedValue({ institutionId: 'inst-1111' }),
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    const consumer = new WebhookDispatchConsumer(
      mockKafka as KafkaService,
      mockWebhooks as WebhooksService,
    );

    const originalNodeEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'development';
    await consumer.onModuleInit();
    (env as any).NODE_ENV = originalNodeEnv;

    expect(mockKafka.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: SMART_TOPICS.certificateIssued,
        module: 'webhooks',
      }),
    );

    expect(certificateHandler).toBeDefined();

    const sampleIssuedEvent = {
      meta: {
        eventId: '11111111-1111-4111-8111-111111111111',
        eventType: SMART_TOPICS.certificateIssued,
        version: 1 as const,
        occurredAt: '2026-09-29T12:00:00.000Z',
        traceId: 'trace-1111',
        source: 'certificate',
      },
      data: {
        certificateId: '11111111-1111-4111-8111-111111111111',
        studentId: '22222222-2222-4222-8222-222222222222',
        trackCode: 'TECH_FULLSTACK' as const,
        highestLevelCleared: 2 as const,
        headlineTier: 'GOLD' as const,
        tierTrail: { L1: 'GOLD', L2: 'GOLD' },
        verificationUrl:
          'https://verify.smart.com/cert/11111111-1111-4111-8111-111111111111?sig=abcdef',
        issuedAt: '2026-09-29T12:00:00.000Z',
      },
    };

    expect(CertificateIssuedEventSchema.safeParse(sampleIssuedEvent).success).toBe(true);

    if (certificateHandler) {
      await certificateHandler(sampleIssuedEvent, {});
    }

    expect(mockWebhooks.resolveStudentInstitution).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(mockWebhooks.dispatch).toHaveBeenCalledWith({
      institutionId: 'inst-1111',
      eventType: SMART_TOPICS.certificateIssued,
      payload: sampleIssuedEvent,
    });
  });
});
