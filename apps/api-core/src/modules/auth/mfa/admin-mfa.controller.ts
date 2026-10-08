import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { API_PREFIX, TenantActionReasonSchema } from '@hirekiwi/contracts';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../../../common/guards/permissions.js';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard.js';
import { AuditPublisherService } from '../../../platform/audit/audit-publisher.service.js';
import { AuthService } from '../auth.service.js';
import { MfaService } from './mfa.service.js';

/** SUPER_ADMIN override: view or force-disable a user's MFA when they're locked out. */
@Controller(`${API_PREFIX}/admin/users/:userId/mfa`)
export class AdminMfaController {
  constructor(
    @Inject(MfaService) private readonly mfa: MfaService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
  ) {}

  @Get()
  @RequirePermission('user.mfa.manage')
  status(@Param('userId') userId: string) {
    return this.mfa.adminStatus(userId);
  }

  @Post('reset')
  @RequirePermission('user.mfa.manage')
  async reset(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @CurrentUser() actor: RequestUser,
  ) {
    const { reason } = TenantActionReasonSchema.parse(body);
    const { wasEnabled } = await this.mfa.adminReset(userId);
    if (wasEnabled) {
      await this.auditPublisher.record({
        actorId: actor.sub,
        action: 'user.mfa_reset',
        resourceType: 'user',
        resourceId: userId,
        reasonCode: reason,
        metadata: {},
      });
      // The removed factor could still be held by an attacker with a live session; force
      // re-authentication so the account isn't left reachable on the old session alone.
      await this.auth.revokeAllForUser(userId);
    }
    return { wasEnabled };
  }
}
