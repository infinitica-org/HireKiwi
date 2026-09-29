import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { API_PREFIX, AssignCompanyOwnerRequestSchema } from '@smart/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CompanyTeamService } from './company-team.service.js';

/** S6-VV-109 (#167): platform-side view of a company's team and the ownership override. */
@Controller(`${API_PREFIX}/admin/companies/:companyId`)
@Roles('SUPER_ADMIN')
export class CompanyMembersAdminController {
  constructor(@Inject(CompanyTeamService) private readonly team: CompanyTeamService) {}

  @Get('members')
  list(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.team.listForAdmin(companyId);
  }

  @Post('owner')
  assignOwner(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() body: unknown,
    @CurrentUser() user: RequestUser,
  ) {
    return this.team.assignOwnerAsAdmin(
      companyId,
      AssignCompanyOwnerRequestSchema.parse(body),
      user.sub,
    );
  }
}
