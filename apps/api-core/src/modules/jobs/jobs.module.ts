import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { EmployerJobsController } from './employer-jobs.controller.js';
import { EmployerJobsService } from './employer-jobs.service.js';

/** JOB-01 — employer job management. Owns the `JobOpening` mapper shared with placement. */
@Module({
  imports: [BillingModule, MatchingModule],
  controllers: [EmployerJobsController],
  providers: [EmployerJobsService],
})
export class JobsModule {}
