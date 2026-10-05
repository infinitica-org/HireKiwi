import { Module } from '@nestjs/common';
import { NotificationPreferencesController } from './notification-preferences.controller.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationsService, NotificationPreferencesService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
