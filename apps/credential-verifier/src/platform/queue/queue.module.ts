import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { env } from '../config/env.js';
import { DEFAULT_JOB_OPTIONS, VERIFICATION_DLQ, VERIFICATION_QUEUE } from './queue.names.js';

@Global()
@Module({
  imports: [
    BullModule.forRoot({ connection: { url: env.REDIS_URL } }),
    BullModule.registerQueue(
      { name: VERIFICATION_QUEUE, defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: VERIFICATION_DLQ },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
