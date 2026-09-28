import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { env } from '../../platform/config/env.js';
import {
  BILLING_GRACE_EXPIRY_INTERVAL_MS,
  BILLING_GRACE_EXPIRY_JOB_ID,
  BILLING_GRACE_EXPIRY_QUEUE,
} from '../../platform/queue/queue.names.js';
import { BillingService } from './billing.service.js';

@Processor(BILLING_GRACE_EXPIRY_QUEUE)
export class BillingGraceExpiryProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(BillingGraceExpiryProcessor.name);

  constructor(
    @Inject(BillingService) private readonly billingService: BillingService,
    @InjectQueue(BILLING_GRACE_EXPIRY_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      await this.queue.upsertJobScheduler(
        BILLING_GRACE_EXPIRY_JOB_ID,
        { every: BILLING_GRACE_EXPIRY_INTERVAL_MS },
        { name: 'grace-expiry' },
      );
    } catch (error) {
      this.logger.warn(
        `Could not schedule billing grace expiry sweep: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async process(): Promise<void> {
    const { reconciledCount } = await this.billingService.reconcileExpiredGracePeriods();
    if (reconciledCount > 0) {
      this.logger.log(`Reconciled ${reconciledCount} expired grace periods to PAST_DUE status.`);
    }
  }
}
