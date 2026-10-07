import { Module } from '@nestjs/common';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { ReadinessModule } from '../readiness/readiness.module.js';
import { AuditLogExportService } from './audit-log-export.service.js';
import { CompaniesAdminController } from './companies-admin.controller.js';
import { CompanyOnboardingDocumentService } from './company-onboarding-document.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CompanyJoinRequestService } from './company-join-request.service.js';
import { CompanyOnboardingService } from './company-onboarding.service.js';
import { CompaniesService } from './companies.service.js';
import { PublicCompanyOnboardingController } from './public-company-onboarding.controller.js';
import { PlansController } from './plans.controller.js';
import { InstitutionsAdminController } from './institutions-admin.controller.js';
import { InstitutionsPublicController } from './institutions-public.controller.js';
import { InstitutionsPartnershipController } from './institutions-partnership.controller.js';
import { InstitutionsStudentController } from './institutions-student.controller.js';
import { InstitutionsTpoController } from './institutions-tpo.controller.js';
import { UniversityReadinessAnalyticsController } from './university-readiness-analytics.controller.js';
import { UniversityReadinessAnalyticsService } from './university-readiness-analytics.service.js';
import { UniversityStudentsController } from './university-students.controller.js';
import { IdempotencyService } from '../company-profile/idempotency.service.js';
import { UniversityStudentsService } from './university-students.service.js';
import { InstitutionsCampusesController } from './institutions-campuses.controller.js';
import { CampusesService } from './campuses.service.js';
import { InstitutionsService } from './institutions.service.js';
import { OrganizationsService } from './organizations.service.js';
import { BulkWhitelistImportProcessor } from './bulk-whitelist-import.processor.js';

@Module({
  imports: [
    InvitationsModule,
    StorageModule,
    MessagingModule,
    ReadinessModule,
    NotificationsModule,
  ],
  controllers: [
    PlansController,
    InstitutionsAdminController,
    InstitutionsTpoController,
    UniversityStudentsController,
    UniversityReadinessAnalyticsController,
    InstitutionsCampusesController,
    InstitutionsStudentController,
    InstitutionsPublicController,
    InstitutionsPartnershipController,
    CompaniesAdminController,
    PublicCompanyOnboardingController,
  ],
  providers: [
    InstitutionsService,
    UniversityStudentsService,
    UniversityReadinessAnalyticsService,
    CampusesService,
    AuditLogExportService,
    CompaniesService,
    OrganizationsService,
    CompanyOnboardingDocumentService,
    CompanyOnboardingService,
    CompanyJoinRequestService,
    IdempotencyService,
    BulkWhitelistImportProcessor,
  ],
  exports: [
    InstitutionsService,
    CompaniesService,
    OrganizationsService,
    CompanyOnboardingDocumentService,
    CompanyOnboardingService,
  ],
})
export class InstitutionsModule {}
