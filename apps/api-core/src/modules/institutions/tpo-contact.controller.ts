import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  API_PREFIX,
  ApproveTpoContactRequestSchema,
  CreateTpoContactRequestSchema,
  ListTpoContactRequestsQuerySchema,
  UpdateTpoContactRequestStatusSchema,
} from '@hirekiwi/contracts';
import { Public } from '../../common/guards/public.decorator.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { TpoContactService } from './tpo-contact.service.js';

@Controller(API_PREFIX)
export class TpoContactController {
  constructor(@Inject(TpoContactService) private readonly contact: TpoContactService) {}

  /** The landing page's "Let's Connect" form. */
  @Public()
  @Post('partnerships/contact')
  create(@Body() body: unknown) {
    return this.contact.create(CreateTpoContactRequestSchema.parse(body));
  }

  @Roles('SUPER_ADMIN')
  @Get('admin/partnerships/contact-requests')
  list(@Query() query: Record<string, string | undefined>) {
    const cleaned = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
    );
    return this.contact.list(ListTpoContactRequestsQuerySchema.parse(cleaned));
  }

  @Roles('SUPER_ADMIN')
  @Post('admin/partnerships/contact-requests/:id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contact.approve(id, ApproveTpoContactRequestSchema.parse(body ?? {}), user.sub);
  }

  @Roles('SUPER_ADMIN')
  @Patch('admin/partnerships/contact-requests/:id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.contact.updateStatus(id, UpdateTpoContactRequestStatusSchema.parse(body).status);
  }
}
