import { describe, expect, it, vi } from 'vitest';
import { CompanyJoinApprovalService } from './company-join-approval.service.js';

const COMPANY_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const REQUEST_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/** One join request for company A; the caller is an owner of `callerCompany`. */
function setup(callerCompany = COMPANY_A) {
  const row: Record<string, unknown> = {
    id: REQUEST_ID,
    companyId: COMPANY_A,
    email: 'riya@acme.com',
    fullName: 'Riya Rao',
    status: 'PENDING',
    reason: null,
    createdAt: new Date(),
    decidedAt: null,
    company: { name: 'Acme' },
  };
  const auditLog = { create: vi.fn().mockResolvedValue({}) };
  const companyJoinRequest = {
    findMany: vi.fn(async () => (row.status === 'PENDING' ? [row] : [])),
    findFirst: vi.fn(async ({ where }: { where: { id: string; companyId: string } }) =>
      where.id === row.id && where.companyId === row.companyId ? { ...row } : null,
    ),
    findUniqueOrThrow: vi.fn(async () => ({ ...row })),
    updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      if (row.status !== 'PENDING') return { count: 0 };
      Object.assign(row, data, { decidedAt: data.decidedAt });
      return { count: 1 };
    }),
  };
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        role: 'COMPANY',
        companyId: callerCompany,
        companyRole: 'OWNER',
        deactivatedAt: null,
      }),
    },
    companyJoinRequest,
    auditLog,
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({ companyJoinRequest, auditLog }),
    ),
  };
  const team = {
    invite: vi.fn().mockResolvedValue({ invitationId: 'inv-1', email: 'riya@acme.com' }),
  };
  const service = new CompanyJoinApprovalService(prisma as never, team as never);
  return { service, team, auditLog, row };
}

describe('CompanyJoinApprovalService (S6-VV-108)', () => {
  it('lists pending requests for the owner company', async () => {
    const { service } = setup();
    const { requests } = await service.listPending('owner-a');
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ companyName: 'Acme', status: 'PENDING' });
  });

  it('approves by sending the normal recruiter invitation, and audits prior and next status', async () => {
    const { service, team, auditLog, row } = setup();
    const dto = await service.approve('owner-a', REQUEST_ID);

    expect(team.invite).toHaveBeenCalledWith('owner-a', {
      key: `join-request-${REQUEST_ID}`,
      body: { email: 'riya@acme.com', fullName: 'Riya Rao', allowExternalDomain: false },
    });
    expect(dto.status).toBe('APPROVED');
    expect(row.invitationId).toBe('inv-1');
    expect(auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'company.join_request.approved',
        metadata: expect.objectContaining({ previousStatus: 'PENDING', nextStatus: 'APPROVED' }),
      }),
    });
  });

  it('is idempotent: a second approve returns the same result with no new invite or audit', async () => {
    const { service, team, auditLog } = setup();
    await service.approve('owner-a', REQUEST_ID);
    const again = await service.approve('owner-a', REQUEST_ID);
    expect(again.status).toBe('APPROVED');
    expect(team.invite).toHaveBeenCalledOnce();
    expect(auditLog.create).toHaveBeenCalledOnce();
  });

  it("hides another company's request (404), so an owner of B can't act on A", async () => {
    const { service, team } = setup(COMPANY_B);
    await expect(service.approve('owner-b', REQUEST_ID)).rejects.toMatchObject({ status: 404 });
    await expect(service.reject('owner-b', REQUEST_ID, {})).rejects.toMatchObject({ status: 404 });
    expect(team.invite).not.toHaveBeenCalled();
  });

  it('rejects with a reason, and refuses to approve once rejected', async () => {
    const { service, team } = setup();
    const dto = await service.reject('owner-a', REQUEST_ID, { reason: 'Not on our team.' });
    expect(dto).toMatchObject({ status: 'REJECTED', reason: 'Not on our team.' });
    await expect(service.approve('owner-a', REQUEST_ID)).rejects.toMatchObject({
      response: { error: 'join_request_decided' },
    });
    expect(team.invite).not.toHaveBeenCalled();
  });
});
