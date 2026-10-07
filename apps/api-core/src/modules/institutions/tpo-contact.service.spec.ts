import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { TpoContactService, fullNameOf } from './tpo-contact.service.js';

const NOW = new Date('2026-10-07T09:00:00.000Z');

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    institutionName: 'Anna University',
    location: 'Chennai, Tamil Nadu, India',
    firstName: 'Kristen',
    middleName: 'Ann',
    lastName: 'Smith',
    email: 'kristen@anna.edu',
    phone: '+91 98765 43210',
    role: 'Placement Officer / TPO',
    message: 'We have 1200 students.',
    status: 'NEW',
    institutionId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function build(options: { queue?: boolean; admins?: string[] } = {}) {
  const prisma = {
    tpoContactRequest: {
      create: vi.fn().mockResolvedValue(row()),
      findMany: vi.fn().mockResolvedValue([row()]),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockResolvedValue(row()),
      update: vi.fn().mockResolvedValue(row({ status: 'CONTACTED' })),
    },
    user: {
      findMany: vi.fn().mockResolvedValue((options.admins ?? []).map((email) => ({ email }))),
    },
  };
  const queue = { add: vi.fn().mockResolvedValue({}) };
  const institutions = {
    createInstitution: vi
      .fn()
      .mockResolvedValue({ institutionId: 'inst-1', name: 'Anna University' }),
    inviteInstitutionAdmin: vi.fn().mockResolvedValue({}),
  };
  const service = new TpoContactService(
    prisma as never,
    institutions as never,
    (options.queue === false ? undefined : queue) as never,
  );
  return { service, prisma, queue, institutions };
}

const BODY = {
  institutionName: 'Anna University',
  location: 'Chennai, Tamil Nadu, India',
  firstName: 'Kristen',
  middleName: 'Ann',
  lastName: 'Smith',
  email: 'kristen@anna.edu',
  phone: '+91 98765 43210',
  role: 'Placement Officer / TPO',
};

describe('TpoContactService', () => {
  it('joins first, middle and last name, skipping an empty middle name', () => {
    expect(fullNameOf({ firstName: 'A', middleName: 'B', lastName: 'C' })).toBe('A B C');
    expect(fullNameOf({ firstName: 'A', middleName: null, lastName: 'C' })).toBe('A C');
  });

  it('saves the request, thanks the sender, and alerts every admin', async () => {
    const { service, prisma, queue } = build({ admins: ['a@hirekiwi.local', 'b@hirekiwi.local'] });

    const result = await service.create(BODY);

    expect(result).toEqual({ id: row().id, received: true });
    expect(prisma.tpoContactRequest.create).toHaveBeenCalledTimes(1);
    const jobs = queue.add.mock.calls.map(([, payload]) => payload);
    expect(jobs).toHaveLength(3);
    expect(jobs[0]).toMatchObject({
      to: 'kristen@anna.edu',
      template: 'partnership-request-received',
      data: { fullName: 'Kristen Ann Smith', institutionName: 'Anna University' },
    });
    expect(jobs.slice(1).map((job) => job.to)).toEqual(['a@hirekiwi.local', 'b@hirekiwi.local']);
    expect(jobs[1]).toMatchObject({
      template: 'partnership-request-admin-alert',
      data: { adminUrl: expect.stringContaining('/admin/partnership-requests') },
    });
  });

  it('still saves and answers when the email queue is missing or fails', async () => {
    const noQueue = build({ queue: false });
    await expect(noQueue.service.create(BODY)).resolves.toMatchObject({ received: true });

    const failing = build({ admins: ['a@hirekiwi.local'] });
    failing.queue.add.mockRejectedValue(new Error('redis down'));
    await expect(failing.service.create(BODY)).resolves.toMatchObject({ received: true });
    expect(failing.prisma.tpoContactRequest.create).toHaveBeenCalledTimes(1);
  });

  it('lists newest first with the number still waiting', async () => {
    const { service, prisma } = build();
    const result = await service.list({ status: 'NEW', query: 'anna' });
    expect(result).toMatchObject({ total: 1, newCount: 1 });
    expect(result.items[0]).toMatchObject({ institutionName: 'Anna University', status: 'NEW' });
    expect(prisma.tpoContactRequest.findMany.mock.calls[0]?.[0]).toMatchObject({
      orderBy: { createdAt: 'desc' },
      where: { status: 'NEW' },
    });
  });

  it('updates the status, and says so when the request does not exist', async () => {
    const { service, prisma } = build();
    expect((await service.updateStatus(row().id, 'CONTACTED')).status).toBe('CONTACTED');

    prisma.tpoContactRequest.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus(row().id, 'CLOSED')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('approves: creates the university from the email domain, then invites the contact', async () => {
    const { service, prisma, institutions } = build();
    prisma.tpoContactRequest.update.mockResolvedValue(
      row({ status: 'APPROVED', institutionId: 'inst-1' }),
    );

    const result = await service.approve(row().id, {}, 'admin-1');

    expect(institutions.createInstitution).toHaveBeenCalledWith(
      { name: 'Anna University', domain: 'anna.edu' },
      'admin-1',
    );
    expect(institutions.inviteInstitutionAdmin).toHaveBeenCalledWith(
      'inst-1',
      { fullName: 'Kristen Ann Smith', email: 'kristen@anna.edu' },
      'admin-1',
    );
    expect(result).toMatchObject({
      institutionId: 'inst-1',
      domain: 'anna.edu',
      inviteSentTo: 'kristen@anna.edu',
    });
    expect(result.request.status).toBe('APPROVED');
  });

  it('uses the domain the admin typed when the email is a personal address', async () => {
    const { service, prisma, institutions } = build();
    prisma.tpoContactRequest.findUnique.mockResolvedValue(row({ email: 'kristen@gmail.com' }));
    prisma.tpoContactRequest.update.mockResolvedValue(row({ status: 'APPROVED' }));
    await service.approve(row().id, { domain: 'anna.edu' }, 'admin-1');
    expect(institutions.createInstitution.mock.calls[0]?.[0]).toMatchObject({ domain: 'anna.edu' });
  });

  it('retries without creating a second university when the first invite failed', async () => {
    const { service, prisma, institutions } = build();
    prisma.tpoContactRequest.findUnique.mockResolvedValue(row({ institutionId: 'inst-1' }));
    prisma.tpoContactRequest.update.mockResolvedValue(row({ status: 'APPROVED' }));
    await service.approve(row().id, {}, 'admin-1');
    expect(institutions.createInstitution).not.toHaveBeenCalled();
    expect(institutions.inviteInstitutionAdmin).toHaveBeenCalledTimes(1);
  });

  it('keeps the university id when the invite fails, so the admin can retry', async () => {
    const { service, prisma, institutions } = build();
    institutions.inviteInstitutionAdmin.mockRejectedValue(new ConflictException('exists'));
    await expect(service.approve(row().id, {}, 'admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.tpoContactRequest.update).toHaveBeenCalledWith({
      where: { id: row().id },
      data: { institutionId: 'inst-1' },
    });
  });

  it('refuses to approve twice, and to set Approved by hand', async () => {
    const { service, prisma } = build();
    prisma.tpoContactRequest.findUnique.mockResolvedValue(row({ status: 'APPROVED' }));
    await expect(service.approve(row().id, {}, 'a')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.updateStatus(row().id, 'CLOSED')).rejects.toBeInstanceOf(
      ConflictException,
    );

    prisma.tpoContactRequest.findUnique.mockResolvedValue(row());
    await expect(service.updateStatus(row().id, 'APPROVED')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
