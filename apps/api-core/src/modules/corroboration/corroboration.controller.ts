import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CorroborationService } from './corroboration.service.js';

@ApiTags('corroboration')
@Controller(`${API_PREFIX}/corroboration`)
export class CorroborationController {
  constructor(@Inject(CorroborationService) private readonly service: CorroborationService) {}

  @Get('me')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Passive-signal corroboration readout for the signed-in student.' })
  @ApiResponse({
    status: 200,
    description: 'Trust-weighted readouts; no raw third-party payloads.',
  })
  getMyCorroboration(@CurrentUser() user: RequestUser) {
    return this.service.getStudentSnapshot(user.sub);
  }
}
