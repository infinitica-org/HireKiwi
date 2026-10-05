import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { CompanyJoinRequestDto } from '@smart/contracts';
import { env } from '../../platform/config/env.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { requireOnboardingSessionByToken } from './company-onboarding-session.access.js';

type JoinRequestRow = {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  status: CompanyJoinRequestDto['status'];
  reason: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  company: { name: string };
};

export function toJoinRequestDto(row: JoinRequestRow): CompanyJoinRequestDto {
  return {
    joinRequestId: row.id,
    companyId: row.companyId,
    companyName: row.company.name,
    email: row.email,
    fullName: row.fullName,
    status: row.status,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  };
}

/**
 * S6-VV-107 (#340): a second person from an already-registered company used to hit a dead-end
 * "already registered" 409. Once their work email is verified, they can ask to join instead; the
 * company's owners are notified and decide on /team (S6-VV-108).
 */
@Injectable()
export class CompanyJoinRequestService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Optional()
    @Inject(NotificationsService)
    private readonly notifications?: NotificationsService,
  ) {}

  /** The approved, active company whose domain is this email's domain, if any. */
  async joinableCompanyFor(email: string): Promise<{ companyId: string; name: string } | null> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    const company = await this.prisma.company.findFirst({
      where: { domain, verificationStatus: 'APPROVED', deactivatedAt: null, heldAt: null },
      select: { id: true, name: true },
    });
    return company ? { companyId: company.id, name: company.name } : null;
  }

  async latestForSession(sessionId: string): Promise<CompanyJoinRequestDto | null> {
    const row = await this.prisma.companyJoinRequest.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { name: true } } },
    });
    return row ? toJoinRequestDto(row) : null;
  }

  async requestToJoin(rawToken: string): Promise<CompanyJoinRequestDto> {
    const session = await requireOnboardingSessionByToken(this.prisma, rawToken);
    if (!session.emailVerifiedAt) {
      throw new BadRequestException({
        error: 'email_not_verified',
        message: 'Verify your work email before asking to join a company.',
        statusCode: 400,
      });
    }
    const email = session.representativeEmail.toLowerCase();
    const target = await this.joinableCompanyFor(email);
    if (!target) {
      throw new NotFoundException({
        error: 'no_matching_company',
        message:
          'No verified company on SMART uses your email domain. Register your company instead.',
        statusCode: 404,
      });
    }

    const include = { company: { select: { name: true } } } as const;
    const open = await this.prisma.companyJoinRequest.findFirst({
      where: { companyId: target.companyId, email, status: 'PENDING' },
      include,
    });
    if (open) return toJoinRequestDto(open);

    const fullName =
      (session.representativeSnapshot as { fullName?: string } | null)?.fullName ?? email;
    let row;
    try {
      row = await this.prisma.companyJoinRequest.create({
        data: { companyId: target.companyId, sessionId: session.id, email, fullName },
        include,
      });
    } catch (error) {
      // A concurrent click won the one-pending index: answer with that request.
      if ((error as { code?: string }).code !== 'P2002') throw error;
      const raced = await this.prisma.companyJoinRequest.findFirst({
        where: { companyId: target.companyId, email, status: 'PENDING' },
        include,
      });
      if (!raced) throw error;
      return toJoinRequestDto(raced);
    }

    await this.auditPublisher.record({
      actorId: null,
      action: 'company.join_request.created',
      resourceType: 'company',
      resourceId: target.companyId,
      reasonCode: 'requested',
      metadata: { joinRequestId: row.id, email, sessionId: session.id },
    });
    await this.notifyOwners(row.id, target.companyId, fullName, email);
    return toJoinRequestDto(row);
  }

  private async notifyOwners(
    joinRequestId: string,
    companyId: string,
    fullName: string,
    email: string,
  ): Promise<void> {
    if (!this.notifications) return;
    const owners = await this.prisma.user.findMany({
      where: { companyId, companyRole: 'OWNER', deactivatedAt: null },
      select: { id: true },
    });
    for (const owner of owners) {
      await this.notifications.notify({
        userId: owner.id,
        kind: 'INVITATION',
        title: `${fullName} asked to join your company`,
        body: `${email} verified their work email and is waiting for an owner to approve them.`,
        linkUrl: `${env.COMPANY_APP_URL}/team`,
        dedupeKey: `company-join-request:${joinRequestId}:owner:${owner.id}`,
      });
    }
  }
}
