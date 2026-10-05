import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CompanyJoinRequestDto,
  ListCompanyJoinRequestsResponse,
  RejectCompanyJoinRequestRequest,
} from '@hirekiwi/contracts';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { toJoinRequestDto } from '../institutions/company-join-request.service.js';
import { requireCompanyActor } from './company-access.js';
import { CompanyTeamService } from './company-team.service.js';

const include = { company: { select: { name: true } } } as const;

function notFound(): NotFoundException {
  return new NotFoundException({
    error: 'not_found',
    message: 'Join request not found.',
    statusCode: 404,
  });
}

/**
 * S6-VV-108 (#341): owners decide on requests to join their company (S6-VV-107). Approving sends
 * the requester the normal EMP-02 recruiter invitation, so seat quota, the domain check, the
 * invite email, set-password and the invite audit all stay in one place. Deciding twice returns the
 * first decision and writes nothing new.
 */
@Injectable()
export class CompanyJoinApprovalService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CompanyTeamService) private readonly team: CompanyTeamService,
  ) {}

  async listPending(userId: string): Promise<ListCompanyJoinRequestsResponse> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.team.invite');
    const rows = await this.prisma.companyJoinRequest.findMany({
      where: { companyId: actor.companyId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include,
    });
    return { requests: rows.map(toJoinRequestDto) };
  }

  async approve(userId: string, joinRequestId: string): Promise<CompanyJoinRequestDto> {
    const { row } = await this.load(userId, joinRequestId);
    if (row.status === 'APPROVED') return toJoinRequestDto(row);
    if (row.status === 'REJECTED') throw this.alreadyDecided();

    // The invite is idempotent on this key, so a retry after a crash re-uses the same invitation.
    const invitation = await this.team.invite(userId, {
      key: `join-request-${row.id}`,
      body: { email: row.email, fullName: row.fullName, allowExternalDomain: false },
    });
    return this.decide(userId, row.id, 'APPROVED', {
      invitationId: invitation.invitationId,
    });
  }

  async reject(
    userId: string,
    joinRequestId: string,
    body: RejectCompanyJoinRequestRequest,
  ): Promise<CompanyJoinRequestDto> {
    const { row } = await this.load(userId, joinRequestId);
    if (row.status === 'REJECTED') return toJoinRequestDto(row);
    if (row.status === 'APPROVED') throw this.alreadyDecided();
    return this.decide(userId, row.id, 'REJECTED', { reason: body.reason || null });
  }

  /** Scoped to the caller's company: another company's request is a 404, not a 403. */
  private async load(userId: string, joinRequestId: string) {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.team.invite');
    const row = await this.prisma.companyJoinRequest.findFirst({
      where: { id: joinRequestId, companyId: actor.companyId },
      include,
    });
    if (!row) throw notFound();
    return { actor, row };
  }

  private async decide(
    userId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    extra: { invitationId?: string; reason?: string | null },
  ): Promise<CompanyJoinRequestDto> {
    return this.prisma.$transaction(async (tx) => {
      // Only a still-pending row moves, so two owners clicking at once write one decision.
      const { count } = await tx.companyJoinRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status, decidedById: userId, decidedAt: new Date(), ...extra },
      });
      const row = await tx.companyJoinRequest.findUniqueOrThrow({ where: { id }, include });
      if (count === 1) {
        await tx.auditLog.create({
          data: {
            actorId: userId,
            action:
              status === 'APPROVED'
                ? 'company.join_request.approved'
                : 'company.join_request.rejected',
            resourceType: 'company',
            resourceId: row.companyId,
            metadata: {
              joinRequestId: id,
              email: row.email,
              previousStatus: 'PENDING',
              nextStatus: status,
              invitationId: extra.invitationId ?? null,
            },
          },
        });
      }
      return toJoinRequestDto(row);
    });
  }

  private alreadyDecided(): ConflictException {
    return new ConflictException({
      error: 'join_request_decided',
      message: 'Another owner has already decided on this request.',
      statusCode: 409,
    });
  }
}
