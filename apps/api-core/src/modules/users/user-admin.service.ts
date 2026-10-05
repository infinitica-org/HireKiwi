import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  INSTITUTION_STAFF_ROLES,
  type ActiveUserGroup,
  type AssignRoleRequest,
  type ListActiveUsersQuery,
  type ListActiveUsersResponse,
} from '@smart/contracts';
import type { UserRole } from '../../generated/prisma/index.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';

type AssignableRole = AssignRoleRequest['role'];

/** Which user roles each admin-dashboard "active users" filter covers. */
const ACTIVE_GROUP_ROLES: Record<ActiveUserGroup, UserRole[]> = {
  STUDENT: ['STUDENT'],
  TPO: ['INSTITUTION_ADMIN', 'PLACEMENT_STAFF'],
  COMPANY: ['COMPANY'],
};

function groupForRole(role: string): ActiveUserGroup {
  if (role === 'STUDENT') return 'STUDENT';
  if (role === 'COMPANY') return 'COMPANY';
  return 'TPO';
}

export interface HeldUserDto {
  readonly userId: string;
  readonly heldAt: string | null;
}

@Injectable()
export class UserAdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
  ) {}

  async assignRole(
    userId: string,
    role: AssignableRole,
    reason: string,
    actorId: string,
  ): Promise<{ userId: string; role: AssignableRole }> {
    if (userId === actorId) {
      throw new UnprocessableEntityException({
        error: 'cannot_change_own_role',
        message: 'Ask another administrator to change your role.',
        statusCode: 422,
      });
    }
    const user = await this.requireUser(userId);
    // Only moves between institution staff roles: students, company users and platform admins
    // get their role from how their account was created, never from this switch.
    const staffRoles: readonly string[] = INSTITUTION_STAFF_ROLES;
    if (!staffRoles.includes(user.role) || !staffRoles.includes(role)) {
      throw new UnprocessableEntityException({
        error: 'role_not_assignable',
        message: `Only ${INSTITUTION_STAFF_ROLES.join(' and ')} can be switched between institution staff.`,
        statusCode: 422,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { role: role as any },
    });
    // S6-VV-100 (#172): permission changes are audited with who did it, the before and after
    // role, and why, so /admin/audit-logs?action=user.role_changed answers "who made them admin?".
    await this.auditPublisher.record({
      actorId,
      action: 'user.role_changed',
      resourceType: 'user',
      resourceId: user.id,
      reasonCode: reason,
      metadata: { prior: { role: user.role }, next: { role: updated.role } },
    });
    // The role is baked into access tokens; revoke them so the new role applies now.
    await this.auth.revokeAllForUser(user.id);
    return { userId: updated.id, role: updated.role as AssignableRole };
  }

  async holdUser(userId: string, reason: string, actorId: string): Promise<HeldUserDto> {
    const user = await this.requireUser(userId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { heldAt: new Date(), heldReason: reason },
    });
    await this.auditPublisher.record({
      actorId,
      action: 'user.held',
      resourceType: 'user',
      resourceId: user.id,
      reasonCode: reason,
      metadata: { role: user.role },
    });
    // Held users must lose access immediately, not on their next request's
    // SessionHoldGuard check — an already-issued access token stays valid
    // until it expires otherwise.
    await this.auth.revokeAllForUser(user.id);
    return { userId: updated.id, heldAt: updated.heldAt?.toISOString() ?? null };
  }

  async releaseUser(userId: string, reason: string, actorId: string): Promise<HeldUserDto> {
    const user = await this.requireUser(userId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { heldAt: null, heldReason: null },
    });
    await this.auditPublisher.record({
      actorId,
      action: 'user.hold_released',
      resourceType: 'user',
      resourceId: user.id,
      reasonCode: reason,
      metadata: { role: user.role },
    });
    return { userId: updated.id, heldAt: null };
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'User not found.',
        statusCode: 404,
      });
    }
    return user;
  }

  /**
   * Admin dashboard — users signed in right now: they hold a refresh-token session that is
   * neither revoked nor expired. Ordered by their most recent session start.
   */
  async listActiveUsers(query: ListActiveUsersQuery): Promise<ListActiveUsersResponse> {
    const now = new Date();
    const liveSession = { revokedAt: null, expiresAt: { gt: now } };
    const activeIn = (roles: UserRole[]) => ({
      role: { in: roles },
      refreshTokens: { some: liveSession },
    });

    const [students, tpo, company] = await Promise.all([
      this.prisma.user.count({ where: activeIn(ACTIVE_GROUP_ROLES.STUDENT) }),
      this.prisma.user.count({ where: activeIn(ACTIVE_GROUP_ROLES.TPO) }),
      this.prisma.user.count({ where: activeIn(ACTIVE_GROUP_ROLES.COMPANY) }),
    ]);

    const roles = query.group
      ? ACTIVE_GROUP_ROLES[query.group]
      : [...ACTIVE_GROUP_ROLES.STUDENT, ...ACTIVE_GROUP_ROLES.TPO, ...ACTIVE_GROUP_ROLES.COMPANY];

    // Latest live session per user, newest first; paginate on that ordering.
    const sessions = await this.prisma.refreshToken.groupBy({
      by: ['userId'],
      where: { ...liveSession, user: { role: { in: roles } } },
      _max: { createdAt: true },
    });
    sessions.sort(
      (a, b) => (b._max?.createdAt?.getTime() ?? 0) - (a._max?.createdAt?.getTime() ?? 0),
    );
    const start = (query.page - 1) * query.pageSize;
    const pageSessions = sessions.slice(start, start + query.pageSize);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pageSessions.map((row) => row.userId) } },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        institution: { select: { name: true } },
        company: { select: { name: true } },
      },
    });
    const byId = new Map(users.map((user) => [user.id, user]));

    return {
      counts: { total: students + tpo + company, STUDENT: students, TPO: tpo, COMPANY: company },
      users: pageSessions.flatMap((row) => {
        const user = byId.get(row.userId);
        const lastSignedInAt = row._max?.createdAt;
        if (!user || !lastSignedInAt) return [];
        return [
          {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            group: groupForRole(user.role),
            organizationName: user.company?.name ?? user.institution?.name ?? null,
            lastSignedInAt: lastSignedInAt.toISOString(),
          },
        ];
      }),
      total: sessions.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
