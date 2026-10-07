import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import type {
  ApproveTpoContactRequest,
  ApproveTpoContactResponse,
  CreateTpoContactRequest,
  CreateTpoContactResponse,
  ListTpoContactRequestsQuery,
  ListTpoContactRequestsResponse,
  TpoContactRequestDto,
  TpoContactRequestStatus,
} from '@hirekiwi/contracts';
import { env } from '../../platform/config/env.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { InstitutionsService } from './institutions.service.js';
import {
  EMAIL_QUEUE,
  type EmailJobPayload,
  type PartnershipRequestEmailData,
} from '../../platform/mailer/mailer.types.js';

interface TpoContactRow {
  id: string;
  institutionName: string;
  location: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  message: string | null;
  status: TpoContactRequestStatus;
  institutionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function fullNameOf(row: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}): string {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');
}

function toDto(row: TpoContactRow): TpoContactRequestDto {
  return {
    id: row.id,
    institutionName: row.institutionName,
    location: row.location,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    message: row.message,
    status: row.status,
    institutionId: row.institutionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The landing site's "Let's Connect" form: saved, acknowledged to the sender, and flagged to admins. */
@Injectable()
export class TpoContactService {
  private readonly logger = new Logger(TpoContactService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(InstitutionsService) private readonly institutions: InstitutionsService,
    @Optional()
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue?: Queue<EmailJobPayload>,
  ) {}

  async create(body: CreateTpoContactRequest): Promise<CreateTpoContactResponse> {
    const row = await this.prisma.tpoContactRequest.create({
      data: {
        institutionName: body.institutionName,
        location: body.location,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        message: body.message || null,
      },
    });
    this.logger.log(`TPO contact request ${row.id} saved for ${row.institutionName}`);
    // The request is already saved, so a mail problem is logged and never shown to the sender.
    await this.notify(row).catch((error: unknown) => {
      this.logger.error(
        `TPO contact request ${row.id}: emails not queued: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
    return { id: row.id, received: true };
  }

  async list(query: ListTpoContactRequestsQuery): Promise<ListTpoContactRequestsResponse> {
    const q = query.query?.trim();
    const rows = await this.prisma.tpoContactRequest.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(q
          ? {
              OR: [
                { institutionName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const newCount = await this.prisma.tpoContactRequest.count({ where: { status: 'NEW' } });
    return { items: rows.map(toDto), total: rows.length, newCount };
  }

  private async requireRow(id: string): Promise<TpoContactRow> {
    const row = await this.prisma.tpoContactRequest.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        error: 'contact_request_not_found',
        message: 'Contact request not found.',
        statusCode: 404,
      });
    }
    return row;
  }

  /**
   * Approve: create the university, then email the contact an invitation to set their own
   * password and become its placement admin. Safe to retry: a retry reuses the university the
   * first attempt created.
   */
  async approve(
    id: string,
    body: ApproveTpoContactRequest,
    adminUserId: string,
  ): Promise<ApproveTpoContactResponse> {
    const row = await this.requireRow(id);
    if (row.status === 'APPROVED') {
      throw new ConflictException({
        error: 'already_approved',
        message: 'This request is already approved.',
        statusCode: 409,
      });
    }
    const domain = (body.domain ?? row.email.split('@')[1] ?? '').toLowerCase();
    if (!domain) {
      throw new UnprocessableEntityException({
        error: 'domain_required',
        message: 'Enter the university email domain, for example anna.edu.',
        statusCode: 422,
      });
    }

    let institutionId = row.institutionId;
    let institutionName = row.institutionName;
    if (!institutionId) {
      const created = await this.institutions.createInstitution(
        { name: row.institutionName, domain },
        adminUserId,
      );
      institutionId = created.institutionId;
      institutionName = created.name;
      // Remember it straight away so a failed invite can be retried without a second university.
      await this.prisma.tpoContactRequest.update({ where: { id }, data: { institutionId } });
    }

    await this.institutions.inviteInstitutionAdmin(
      institutionId,
      { fullName: fullNameOf(row), email: row.email },
      adminUserId,
    );
    const updated = await this.prisma.tpoContactRequest.update({
      where: { id },
      data: { status: 'APPROVED', institutionId },
    });
    this.logger.log(`TPO contact request ${id} approved by ${adminUserId}: ${institutionName}`);
    return {
      request: toDto(updated),
      institutionId,
      institutionName,
      domain,
      inviteSentTo: row.email,
    };
  }

  async updateStatus(id: string, status: TpoContactRequestStatus): Promise<TpoContactRequestDto> {
    const existing = await this.requireRow(id);
    if (status === 'APPROVED') {
      throw new UnprocessableEntityException({
        error: 'use_approve',
        message: 'Use Approve to create the university and send the invitation.',
        statusCode: 422,
      });
    }
    if (existing.status === 'APPROVED') {
      throw new ConflictException({
        error: 'already_approved',
        message: 'An approved request cannot be changed.',
        statusCode: 409,
      });
    }
    const row = await this.prisma.tpoContactRequest.update({ where: { id }, data: { status } });
    return toDto(row);
  }

  private async notify(row: TpoContactRow): Promise<void> {
    if (!this.emailQueue) {
      this.logger.warn('Email queue unavailable; partnership request emails not sent.');
      return;
    }
    const data: PartnershipRequestEmailData = {
      fullName: fullNameOf(row),
      institutionName: row.institutionName,
      location: row.location,
      email: row.email,
      phone: row.phone,
      role: row.role,
      message: row.message,
    };
    await this.emailQueue.add('send', {
      to: row.email,
      template: 'partnership-request-received',
      data,
    });

    const admins = await this.prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', passwordHash: { not: null } },
      select: { email: true },
    });
    const adminUrl = `${env.ADMIN_APP_URL.replace(/\/$/, '')}/admin/partnership-requests`;
    for (const admin of admins) {
      await this.emailQueue.add('send', {
        to: admin.email,
        template: 'partnership-request-admin-alert',
        data: { ...data, adminUrl },
      });
    }
  }
}
