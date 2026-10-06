import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoHttpOptions } from '@hirekiwi/observability';
import { PrismaModule } from './platform/prisma/prisma.module.js';
import { RedisModule } from './platform/redis/redis.module.js';
import { QueueModule } from './platform/queue/queue.module.js';
import { VerificationModule } from './verification/verification.module.js';
import { env } from './platform/config/env.js';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: buildPinoHttpOptions({ serviceName: env.APP_NAME }) }),
    PrismaModule,
    RedisModule,
    QueueModule,
    VerificationModule,
  ],
})
export class AppModule {}
