import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SMART_TOPICS, TrackUpdatedEventSchema } from '@hirekiwi/contracts';
import { runKafkaHandler } from '@hirekiwi/observability';
import { env } from '../config/env.js';
import { RedisService } from '../redis/redis.service.js';
import { KafkaService } from './kafka.service.js';

@Injectable()
export class TrackUpdatedConsumer implements OnModuleInit {
  private readonly logger = new Logger(TrackUpdatedConsumer.name);

  constructor(
    @Inject(KafkaService) private readonly kafka: KafkaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      await this.kafka.subscribe({
        topic: SMART_TOPICS.trackUpdated,
        module: 'platform',
        handler: async (payload, headers) => {
          await runKafkaHandler(headers, async () => {
            const parsed = TrackUpdatedEventSchema.safeParse(payload);
            if (!parsed.success) {
              this.logger.warn('Ignored malformed smart.track.updated payload');
              return;
            }

            const { invalidateKeys, changeKind, trackCode } = parsed.data.data;
            this.logger.log(
              `Processing track.updated event for ${trackCode} (${changeKind}), invalidating ${invalidateKeys.length} cache keys`,
            );

            for (const key of invalidateKeys) {
              try {
                await this.redis.del(key);
              } catch (delError) {
                this.logger.warn(
                  `Failed to invalidate Redis key "${key}": ${delError instanceof Error ? delError.message : 'unknown'}`,
                );
              }
            }
          });
        },
      });
    } catch (error) {
      this.logger.warn(
        `smart.track.updated consumer not started: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
