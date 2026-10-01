import { Module } from '@nestjs/common';
import { MailerModule } from '../../platform/mailer/mailer.module.js';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module.js';
import { IntegrationHealthController } from './integration-health.controller.js';
import { IntegrationHealthService } from './integration-health.service.js';

/** S6-VV-129 (#585): third-party integration probes, metrics and the admin view. */
@Module({
  imports: [AiGatewayModule, MailerModule, StorageModule],
  controllers: [IntegrationHealthController],
  providers: [IntegrationHealthService],
})
export class IntegrationHealthModule {}
