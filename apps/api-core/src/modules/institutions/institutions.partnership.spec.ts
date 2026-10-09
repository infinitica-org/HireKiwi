import { describe, expect, it, beforeEach, vi } from 'vitest';
import { InstitutionsService } from './institutions.service.js';

describe('InstitutionsService Partnership Workflow', () => {
  let service: InstitutionsService;
  let mockPrisma: any;
  let mockInvitations: any;
  let mockAudit: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      institution: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'inst-123',
            name: data.name,
            domain: data.domain,
            planId: 'plan-1',
            plan: { code: 'FREE' },
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        update: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'inst-123', ...data })),
      },
      subscriptionPlan: {
        findUnique: vi.fn().mockResolvedValue({ id: 'plan-1', code: 'FREE' }),
        findFirst: vi.fn().mockResolvedValue({ id: 'plan-1', code: 'FREE' }),
      },
      institutionAdmin: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findFirstOrThrow: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockResolvedValue([]),
        create: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'user-1', ...data })),
        update: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'user-1', ...data })),
      },
      invitation: {
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      batch: {
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      campus: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'campus-1', ...data })),
      },
      attempt: {
        groupBy: vi.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue(undefined),
      },
    };
    mockInvitations = {
      createAndEnqueue: vi.fn().mockResolvedValue({
        invitation: { status: 'PENDING', lastSentAt: new Date(), acceptedAt: null },
      }),
    };
    mockAudit = { publish: vi.fn(), record: vi.fn().mockResolvedValue(undefined) };
    mockRedis = { getJson: vi.fn(), setJson: vi.fn() };

    service = new InstitutionsService(
      mockPrisma,
      mockInvitations as any,
      mockAudit as any,
      mockRedis as any,
    );
  });

  it('Th6-I182: creates a partnership request', async () => {
    const req = await service.createPartnershipRequest({
      name: 'Stanford University',
      domain: 'stanford.edu',
      contactName: 'Jane Doe',
      contactEmail: 'jane@stanford.edu',
      contactPhone: '+16507232300',
      estimatedStudents: 15000,
      notes: 'Partnership inquiry',
    });

    expect(req.id).toBeDefined();
    expect(req.status).toBe('PENDING');
    expect(req.name).toBe('Stanford University');
  });

  it('Th6-I182: rejects duplicate pending partnership request for same domain', async () => {
    await service.createPartnershipRequest({
      name: 'Stanford University',
      domain: 'stanford.edu',
      contactName: 'Jane Doe',
      contactEmail: 'jane@stanford.edu',
    });

    await expect(
      service.createPartnershipRequest({
        name: 'Stanford University Duplicate',
        domain: 'stanford.edu',
        contactName: 'John Smith',
        contactEmail: 'john@stanford.edu',
      }),
    ).rejects.toThrow('A pending partnership request for this domain already exists.');
  });

  it('Th6-I183: lists and retrieves partnership requests', async () => {
    const created = await service.createPartnershipRequest({
      name: 'MIT',
      domain: 'mit.edu',
      contactName: 'Tim Berners',
      contactEmail: 'tim@mit.edu',
    });

    const list = await service.listPartnershipRequests({ status: 'PENDING' } as any);
    expect(list.total).toBe(1);
    expect(list.items[0].id).toBe(created.id);

    const fetched = await service.getPartnershipRequestById(created.id);
    expect(fetched.domain).toBe('mit.edu');
  });

  it('Th6-I184: reviews partnership request decision (APPROVED / REJECTED / MORE_INFO_NEEDED)', async () => {
    const created = await service.createPartnershipRequest({
      name: 'Harvard University',
      domain: 'harvard.edu',
      contactName: 'Admin',
      contactEmail: 'admin@harvard.edu',
    });

    const reviewed = await service.reviewPartnershipRequest(
      created.id,
      { decision: 'APPROVED', reviewNotes: 'Verified domain and accreditation' },
      'admin-user-1',
    );

    expect(reviewed.status).toBe('APPROVED');
    expect(reviewed.reviewNotes).toBe('Verified domain and accreditation');
  });

  it('Th6-I185: provisions university account from partnership request', async () => {
    const created = await service.createPartnershipRequest({
      name: 'Oxford University',
      domain: 'ox.ac.uk',
      contactName: 'TPO Oxford',
      contactEmail: 'tpo@ox.ac.uk',
    });

    const createdInstitution = {
      id: 'inst-oxford-1',
      name: 'Oxford University',
      domain: 'ox.ac.uk',
      verificationStatus: 'APPROVED',
      plan: { code: 'FREE' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.institution.create = vi.fn().mockResolvedValue(createdInstitution);
    mockPrisma.institution.findUnique = vi.fn().mockResolvedValue(createdInstitution);
    mockPrisma.institution.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.subscriptionPlan.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'plan-free', code: 'FREE' });
    mockPrisma.campus.create = vi
      .fn()
      .mockResolvedValue({ id: 'campus-oxford-main', name: 'Main Campus', isPrimary: true });
    mockPrisma.user.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.user.create = vi.fn().mockResolvedValue({
      id: 'user-tpo-oxford',
      email: 'tpo@ox.ac.uk',
      fullName: 'TPO Oxford',
      role: 'INSTITUTION_ADMIN',
    });

    const provisionResult = await service.provisionUniversityAccount(created.id, 'admin-user-1');
    expect(provisionResult.partnershipRequest.status).toBe('PROVISIONED');
    expect(provisionResult.institution.name).toBe('Oxford University');
    expect(provisionResult.institution.domain).toBe('ox.ac.uk');
  });

  it('Th6-I605 AC1: generates activation token link upon admin approval', async () => {
    const created = await service.createPartnershipRequest({
      name: 'Anna University',
      domain: 'annauniv.edu',
      contactName: 'Dr. Ramesh TPO',
      contactEmail: 'tpo@annauniv.edu',
    });

    await service.reviewPartnershipRequest(
      created.id,
      { decision: 'APPROVED', reviewNotes: 'Verified engineering college accreditation' },
      'admin-1',
    );

    const decision = await service.getPartnershipDecision(created.id);
    expect(decision.status).toBe('APPROVED');
    expect(decision.activationToken).toBeDefined();
    expect(decision.activationUrl).toContain('activate?token=');

    if (!decision.activationToken) throw new Error('Expected activationToken to be defined');
    const tokenDetails = await service.getActivationTokenDetails(decision.activationToken);
    expect(tokenDetails.domain).toBe('annauniv.edu');
    expect(tokenDetails.contactEmail).toBe('tpo@annauniv.edu');
  });

  it('Th6-I605 AC2 & AC4: activates account, configures primary/regional campuses, and records hirekiwi.org.provisioned audit log', async () => {
    const created = await service.createPartnershipRequest({
      name: 'PSG College of Technology',
      domain: 'psgtech.ac.in',
      contactName: 'Prof. Sundar TPO',
      contactEmail: 'tpo@psgtech.ac.in',
    });

    await service.reviewPartnershipRequest(created.id, { decision: 'APPROVED' }, 'admin-super');

    const decision = await service.getPartnershipDecision(created.id);
    if (!decision.activationToken) throw new Error('Expected activationToken to be defined');
    const token = decision.activationToken;

    mockPrisma.institution.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.subscriptionPlan.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'plan-free', code: 'FREE' });
    mockPrisma.institution.create = vi.fn().mockResolvedValue({
      id: 'inst-psg-1',
      name: 'PSG College of Technology',
      domain: 'psgtech.ac.in',
      verificationStatus: 'APPROVED',
    });
    mockPrisma.campus.create = vi
      .fn()
      .mockImplementationOnce(({ data }) => Promise.resolve({ id: 'campus-main-1', ...data }))
      .mockImplementationOnce(({ data }) => Promise.resolve({ id: 'campus-regional-2', ...data }));
    mockPrisma.user.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.user.create = vi.fn().mockResolvedValue({
      id: 'user-tpo-psg',
      email: 'tpo@psgtech.ac.in',
      fullName: 'Prof. Sundar TPO',
      role: 'INSTITUTION_ADMIN',
      institutionId: 'inst-psg-1',
    });
    mockAudit.record = vi.fn().mockResolvedValue(undefined);

    const res = await service.activatePartnershipAccount(
      {
        token,
        password: 'SecurePassword123!',
        confirmCollegeName: 'PSG College of Technology',
        confirmDomain: 'psgtech.ac.in',
        primaryCampus: { name: 'Peelamedu Main Campus', code: 'MAIN', city: 'Coimbatore' },
        regionalCampuses: [{ name: 'Neelambur Regional Campus', code: 'NEEL', city: 'Coimbatore' }],
      },
      '192.168.1.100',
      'admin-super',
    );

    expect(res.institutionId).toBe('inst-psg-1');
    expect(res.primaryCampusId).toBe('campus-main-1');
    expect(res.campusIds.length).toBe(2);
    expect(res.tpoUser.role).toBe('INSTITUTION_ADMIN');
    expect(res.auditLog.action).toBe('hirekiwi.org.provisioned');
    expect(res.auditLog.ipAddress).toBe('192.168.1.100');

    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hirekiwi.org.provisioned',
        actorId: 'admin-super',
        resourceType: 'INSTITUTION',
        resourceId: 'inst-psg-1',
        metadata: expect.objectContaining({
          ipAddress: '192.168.1.100',
          institutionName: 'PSG College of Technology',
        }),
      }),
    );
  });

  it('Th6-I605 AC3: assigns departmental advisor role and enforces campus isolation', async () => {
    mockPrisma.institution.findUnique = vi.fn().mockResolvedValue({ id: 'inst-1' });
    mockPrisma.campus.findFirst = vi.fn().mockImplementation(({ where }) => {
      if (where.id === 'campus-ece') {
        return Promise.resolve({
          id: 'campus-ece',
          name: 'ECE Block Campus',
          institutionId: 'inst-1',
        });
      }
      return Promise.resolve(null);
    });
    mockInvitations.createAndEnqueue = vi.fn().mockResolvedValue({
      invitation: { status: 'PENDING', lastSentAt: new Date(), acceptedAt: null },
    });
    mockPrisma.user.findFirstOrThrow = vi.fn().mockResolvedValue({
      id: 'user-faculty-1',
      email: 'faculty.ece@psgtech.ac.in',
      fullName: 'Dr. Anand ECE Advisor',
      groupLabel: 'ECE',
      createdAt: new Date(),
    });
    mockPrisma.auditLog = { create: vi.fn() };

    const staffRes = await service.inviteStaff(
      'inst-1',
      {
        firstName: 'Dr. Anand',
        lastName: 'ECE Advisor',
        email: 'faculty.ece@psgtech.ac.in',
        role: 'DEPARTMENTAL_ADVISOR' as any,
        department: 'ECE',
        campusId: 'campus-ece',
      },
      'tpo-admin-user',
    );

    expect(staffRes.role).toBe('DEPARTMENTAL_ADVISOR');
    expect(staffRes.campusId).toBe('campus-ece');
    expect(staffRes.campusName).toBe('ECE Block Campus');

    // Multi-campus isolation validation check
    const facultyUser = { role: 'DEPARTMENTAL_ADVISOR', campusId: 'campus-ece' };
    expect(() => service.validateCampusAccess(facultyUser, 'campus-ece')).not.toThrow();
    expect(() => service.validateCampusAccess(facultyUser, 'campus-cse')).toThrow(
      'Cross-campus data access denied.',
    );
  });
});
