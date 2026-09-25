import { Module } from '@nestjs/common';
import { AuditModule } from '../../platform/audit/audit.module.js';
import { PrismaModule } from '../../platform/prisma/prisma.module.js';
import { RedisModule } from '../../platform/redis/redis.module.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

@Module({
  imports: [PrismaModule, RedisModule, AuditModule],
  controllers: [BillingController],
  providers: [BillingService, RazorpayProvider],
  exports: [BillingService, RazorpayProvider],
})
export class BillingModule {}
