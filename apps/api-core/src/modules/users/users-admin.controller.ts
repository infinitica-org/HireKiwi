import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  API_PREFIX,
  AssignRoleRequestSchema,
  ListActiveUsersQuerySchema,
  TenantActionReasonSchema,
} from '@smart/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../../common/guards/permissions.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { UserAdminService } from './user-admin.service.js';

@Controller(`${API_PREFIX}/admin/users`)
@UseGuards(TenantScopeGuard)
export class UsersAdminController {
  constructor(@Inject(UserAdminService) private readonly userAdmin: UserAdminService) {}

  /** Admin dashboard — users signed in right now, filterable by Student / TPO / Company. */
  @Get('active')
  @Roles('SUPER_ADMIN')
  listActive(@Query() query: Record<string, string | undefined>) {
    return this.userAdmin.listActiveUsers(ListActiveUsersQuerySchema.parse(query));
  }

  @Post(':userId/role')
  @RequirePermission('user.role.assign')
  assignRole(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @CurrentUser() actor: RequestUser,
  ) {
    const parsed = AssignRoleRequestSchema.parse(body);
    return this.userAdmin.assignRole(userId, parsed.role, parsed.reason, actor.sub);
  }

  @Post(':userId/hold')
  @RequirePermission('user.access.manage')
  holdUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @CurrentUser() actor: RequestUser,
  ) {
    const parsed = TenantActionReasonSchema.parse(body);
    return this.userAdmin.holdUser(userId, parsed.reason, actor.sub);
  }

  @Post(':userId/release-hold')
  @RequirePermission('user.access.manage')
  releaseUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @CurrentUser() actor: RequestUser,
  ) {
    const parsed = TenantActionReasonSchema.parse(body);
    return this.userAdmin.releaseUser(userId, parsed.reason, actor.sub);
  }
}
