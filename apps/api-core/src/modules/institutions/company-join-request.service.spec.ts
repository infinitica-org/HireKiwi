import { describe, expect, it, vi } from 'vitest';
import { hashOnboardingSecret } from './company-onboarding.util.js';
import { CompanyJoinRequestService } from './company-join-request.service.js';

const COMPANY = { id: '11111111-1111-4111-8111-111111111111', name: 'Acme' };
const SESSION_ID = '22222222-2222-4222-8222-222222222222';

function setup(opts: { verified?: boolean; company?: typeof COMPANY | null } = {}) {
  const rows: Array<Record<string, unknown>> = [];
  const session = {
    id: SESSION_ID,
    sessionTokenHash: hashOnboardingSecret('tok'),
    expiresAt: new Date(Date.now() + 60_000),
    emailVerifiedAt: opts.verified === false ? null : new Date(),
    representativeEmail: 'riya@acme.com',
    representativeSnapshot: { fullName: 'Riya Rao', workEmail: 'riya@acme.com' },
    company: null,
  };
  const withCompany = (row: Record<string, unknown>) => ({ ...row, company: { name: 'Acme' } });
  const prisma = {
    companyOnboardingSession: { findUnique: vi.fn().mockResolvedValue(session) },
    company: {
      findFirst: vi.fn().mockResolvedValue(opts.company === undefined ? COMPANY : opts.company),
    },
    companyJoinRequest: {
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const hit = rows.find((r) => r.email === where.email && r.status === where.status);
        return hit ? withCompany(hit) : null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `jr-${rows.length + 1}`,
          status: 'PENDING',
          reason: null,
          createdAt: new Date(),
          decidedAt: null,
          ...data,
        };
        rows.push(row);
        return withCompany(row);
      }),
    },
    user: { findMany: vi.fn().mockResolvedValue([{ id: 'owner-1' }, { id: 'owner-2' }]) },
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const notifications = { notify: vi.fn().mockResolvedValue({}) };
  const service = new CompanyJoinRequestService(
    prisma as never,
    audit as never,
    notifications as never,
  );
  return { service, prisma, audit, notifications, rows };
}

describe('CompanyJoinRequestService (S6-VV-107)', () => {
  it('finds the approved company on the email domain, active ones only', async () => {
    const { service, prisma } = setup();
    expect(await service.joinableCompanyFor('Riya@Acme.com')).toEqual({
      companyId: COMPANY.id,
      name: 'Acme',
    });
    expect(prisma.company.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          domain: 'acme.com',
          verificationStatus: 'APPROVED',
          deactivatedAt: null,
          heldAt: null,
        },
      }),
    );
  });

  it('creates one pending request, audits it and notifies every owner', async () => {
    const { service, audit, notifications } = setup();
    const dto = await service.requestToJoin('tok');

    expect(dto).toMatchObject({ status: 'PENDING', companyName: 'Acme', fullName: 'Riya Rao' });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'company.join_request.created', resourceId: COMPANY.id }),
    );
    expect(notifications.notify).toHaveBeenCalledTimes(2);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner-1', kind: 'INVITATION' }),
    );
  });

  it('returns the open request on a repeat click instead of creating a second', async () => {
    const { service, prisma, notifications } = setup();
    const first = await service.requestToJoin('tok');
    const second = await service.requestToJoin('tok');
    expect(second.joinRequestId).toBe(first.joinRequestId);
    expect(prisma.companyJoinRequest.create).toHaveBeenCalledOnce();
    expect(notifications.notify).toHaveBeenCalledTimes(2);
  });

  it('requires a verified work email', async () => {
    const { service } = setup({ verified: false });
    await expect(service.requestToJoin('tok')).rejects.toMatchObject({
      response: { error: 'email_not_verified' },
    });
  });

  it('refuses when no approved company uses the domain', async () => {
    const { service } = setup({ company: null });
    await expect(service.requestToJoin('tok')).rejects.toMatchObject({
      response: { error: 'no_matching_company' },
    });
  });
});
