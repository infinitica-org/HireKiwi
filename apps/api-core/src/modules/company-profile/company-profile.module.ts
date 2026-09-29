import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { CompanyProfileService } from './company-profile.service.js';
import { CompanyReviewsService } from './company-reviews.service.js';
import { CompanyTeamService } from './company-team.service.js';
import { CompaniesPublicController } from './companies-public.controller.js';
import { CompanyMembersAdminController } from './company-members-admin.controller.js';
import { EmployerController } from './employer.controller.js';
import { IdempotencyService } from './idempotency.service.js';
import { LocationSearchService } from './location-search.service.js';
import { MeCompanyReviewsController } from './me-company-reviews.controller.js';
import { StudentCompanyReviewsService } from './student-company-reviews.service.js';
import { LocationsController } from './locations.controller.js';

@Module({
  imports: [InvitationsModule, BillingModule],
  controllers: [
    CompaniesPublicController,
    CompanyMembersAdminController,
    EmployerController,
    LocationsController,
    MeCompanyReviewsController,
  ],
  providers: [
    StudentCompanyReviewsService,
    CompanyProfileService,
    CompanyReviewsService,
    CompanyTeamService,
    IdempotencyService,
    LocationSearchService,
  ],
})
export class CompanyProfileModule {}
