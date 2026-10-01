import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX, type IntegrationHealthResponse } from '@smart/contracts';
import { Roles } from '../../common/guards/roles.decorator.js';
import { IntegrationHealthService } from './integration-health.service.js';

@ApiTags('health')
@ApiBearerAuth()
@Controller(`${API_PREFIX}/admin/health`)
@Roles('SUPER_ADMIN')
export class IntegrationHealthController {
  constructor(
    @Inject(IntegrationHealthService) private readonly health: IntegrationHealthService,
  ) {}

  @Get('integrations')
  @ApiOperation({ summary: 'Last probe result for each third-party integration (S6-VV-129).' })
  integrations(): IntegrationHealthResponse {
    return this.health.snapshot();
  }
}
