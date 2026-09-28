import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuditModule } from '../../platform/audit/audit.module.js';
import { PrismaModule } from '../../platform/prisma/prisma.module.js';
import { BILLING_GRACE_EXPIRY_QUEUE } from '../../platform/queue/queue.names.js';
import { RedisModule } from '../../platform/redis/redis.module.js';
import { BillingGraceExpiryProcessor } from './billing-grace-expiry.processor.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { EnterpriseContractAdminController } from './enterprise-contract-admin.controller.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuditModule,
    BullModule.registerQueue({ name: BILLING_GRACE_EXPIRY_QUEUE }),
  ],
  controllers: [BillingController, EnterpriseContractAdminController],
  providers: [BillingService, RazorpayProvider, BillingGraceExpiryProcessor],
  exports: [BillingService, RazorpayProvider],
})
export class BillingModule {}
