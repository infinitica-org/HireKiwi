import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  API_PREFIX,
  UpdateNotificationPreferencesRequestSchema,
  type NotificationPreferencesResponse,
} from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';

@ApiTags('notifications')
@Controller(`${API_PREFIX}/me/notification-preferences`)
export class NotificationPreferencesController {
  constructor(
    @Inject(NotificationPreferencesService)
    private readonly service: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Notification preferences for every kind and channel.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Kind × channel matrix; unchanged entries are on.' })
  async get(@CurrentUser() user: RequestUser): Promise<NotificationPreferencesResponse> {
    return this.service.get(user.sub);
  }

  @Put()
  @ApiOperation({ summary: 'Turn notification kinds on or off per channel.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The updated matrix.' })
  @ApiResponse({ status: 400, description: 'Tried to turn off a mandatory kind.' })
  async update(
    @CurrentUser() user: RequestUser,
    @Body() body: unknown,
  ): Promise<NotificationPreferencesResponse> {
    return this.service.update(user.sub, UpdateNotificationPreferencesRequestSchema.parse(body));
  }
}
