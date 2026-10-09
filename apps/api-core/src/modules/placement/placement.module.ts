import { Module } from '@nestjs/common';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { ApplicationsModule } from '../applications/applications.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { MeApplicationsController } from './me-applications.controller.js';
import { PlacementCalendarController } from './placement-calendar.controller.js';
import { PlacementCalendarService } from './placement-calendar.service.js';
import { PlacementEmployersService } from './placement-employers.service.js';
import { PlacementController } from './placement.controller.js';
import { PlacementService } from './placement.service.js';
import { TpoShortlistController } from './tpo-shortlist.controller.js';
import { TpoShortlistService } from './tpo-shortlist.service.js';

@Module({
  imports: [StorageModule, MatchingModule, ApplicationsModule, BillingModule],
  controllers: [
    PlacementController,
    MeApplicationsController,
    PlacementCalendarController,
    TpoShortlistController,
  ],
  providers: [
    PlacementService,
    PlacementEmployersService,
    PlacementCalendarService,
    TpoShortlistService,
  ],
  exports: [
    PlacementService,
    PlacementEmployersService,
    PlacementCalendarService,
    TpoShortlistService,
  ],
})
export class PlacementModule {}
