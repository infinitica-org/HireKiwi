import { CreateEmployerJobRequestSchema, SKILL_CODES } from '@hirekiwi/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS } from '../company-profile/test-utils.js';
import { EmployerJobsService } from './employer-jobs.service.js';

const CAMPUS = '33333333-3333-4333-8333-333333333333';
const OTHER_CAMPUS = '44444444-4444-4444-8444-444444444444';
const JOB = '55555555-5555-4555-8555-555555555555';
const skillCode = SKILL_CODES[0] as string;

function jobRow(over: Record<string, unknown> = {}) {
  return {
    id: JOB,
    institutionId: CAMPUS,
    companyId: IDS.companyA,
    placementEmployerId: null,
    companyName: 'Acme',
    roleTitle: 'Frontend Engineer',
    domainCode: 'SOFTWARE_IT',
    categoryCode: null,
    minYearsExperience: 0,
    maxYearsExperience: 2,
    location: 'Bengaluru',
    employmentType: 'FULL_TIME',
    workMode: 'HYBRID',
    headcount: 1,
    companyLogoUrl: null,
    attachedDocuments: null,
    aboutCompany: null,
    companyOffers: null,
    additionalCompanyDetails: null,
    roleDetails: null,
    salaryDetails: null,
    roundDetails: null,
    hiringDetails: null,
    driveSpoc: null,
    driveDate: null,
    lastDateToApply: null,
    minSscPercentage: null,
    minHscPercentage: null,
    minCollegePercentage: null,
    backlogsAllowed: true,
    status: 'DRAFT',
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    rawText: null,
    requiredSkills: [{ minProficiency: 'INTERMEDIATE', skill: { code: skillCode } }],
    _count: { applications: 0 },
    ...over,
  };
}

describe('EmployerJobsService (JOB-01)', () => {
  let actor: Record<string, unknown>;
  let prisma: any;
  let audit: { record: ReturnType<typeof vi.fn> };
  let billing: { assertQuotaAvailable: ReturnType<typeof vi.fn> };
  let service: EmployerJobsService;

  beforeEach(() => {
    actor = {
      role: 'COMPANY',
      companyId: IDS.companyA,
      companyRole: 'RECRUITER',
      deactivatedAt: null,
    };
    prisma = {
      user: { findUnique: vi.fn(async () => actor) },
      company: {
        findUnique: vi.fn(async () => ({
          name: 'Acme Pvt Ltd',
          profile: { displayName: 'Acme', about: 'We build things.', logoFileId: null },
          verificationStatus: 'APPROVED',
          deactivatedAt: null,
          heldAt: null,
        })),
      },
      universityEmployerAccess: { findUnique: vi.fn(async () => ({ status: 'ACTIVE' })) },
      skill: { findMany: vi.fn(async () => [{ id: 'skill-1', code: skillCode }]) },
      jobOpening: {
        findFirst: vi.fn(async () => jobRow()),
        findMany: vi.fn(async () => [jobRow()]),
        create: vi.fn(async () => jobRow()),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => jobRow(data)),
        delete: vi.fn(async () => undefined),
      },
      jobOpeningSkill: { deleteMany: vi.fn(), createMany: vi.fn() },
    };
    prisma.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma));
    audit = { record: vi.fn(async () => undefined) };
    billing = { assertQuotaAvailable: vi.fn(async () => undefined) };
    service = new EmployerJobsService(
      prisma as never,
      audit as never,
      billing as never,
      { add: vi.fn() } as never,
    );
  });

  const createBody = () =>
    CreateEmployerJobRequestSchema.parse({
      institutionId: CAMPUS,
      roleTitle: 'Frontend Engineer',
      domain: 'SOFTWARE_IT',
      requiredSkills: [{ skillCode, minProficiency: 'INTERMEDIATE' }],
      minYearsExperience: 0,
      maxYearsExperience: 2,
      location: 'Bengaluru',
      employmentType: 'FULL_TIME',
    });

  it('creates a DRAFT under the caller company with the company profile identity', async () => {
    const job = await service.create(IDS.recruiter, createBody());
    const data = prisma.jobOpening.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      institutionId: CAMPUS,
      companyId: IDS.companyA,
      createdById: IDS.recruiter,
      companyName: 'Acme',
      aboutCompany: 'We build things.',
    });
    expect(data.status).toBeUndefined();
    expect(job).toMatchObject({ companyId: IDS.companyA, status: 'DRAFT', applicantCount: 0 });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'employer_job.created', resourceId: JOB }),
    );
  });

  it('refuses a campus that has not approved the company', async () => {
    prisma.universityEmployerAccess.findUnique.mockResolvedValueOnce({ status: 'REVOKED' });
    await expect(service.create(IDS.recruiter, createBody())).rejects.toMatchObject({
      status: 403,
    });
    expect(prisma.jobOpening.create).not.toHaveBeenCalled();
  });

  it("scopes every read to the caller's company, so another company's job is a 404", async () => {
    prisma.jobOpening.findFirst.mockResolvedValueOnce(null);
    await expect(service.get(IDS.recruiter, JOB)).rejects.toMatchObject({ status: 404 });
    expect(prisma.jobOpening.findFirst.mock.calls[0][0].where).toEqual({
      id: JOB,
      companyId: IDS.companyA,
    });
  });

  it('publishes a draft only after verification, campus access and the ACTIVE_JOBS quota', async () => {
    const job = await service.publish(IDS.recruiter, JOB);
    expect(billing.assertQuotaAvailable).toHaveBeenCalledWith(IDS.companyA, 'ACTIVE_JOBS');
    expect(prisma.jobOpening.update.mock.calls[0][0].data).toEqual({ status: 'OPEN' });
    expect(job.status).toBe('OPEN');
  });

  it('blocks publishing for an unverified company (EMP-01.08)', async () => {
    prisma.company.findUnique.mockResolvedValueOnce({
      verificationStatus: 'PENDING',
      deactivatedAt: null,
      heldAt: null,
    });
    await expect(service.publish(IDS.recruiter, JOB)).rejects.toMatchObject({ status: 403 });
    expect(prisma.jobOpening.update).not.toHaveBeenCalled();
  });

  it('only publishes drafts and only closes open jobs', async () => {
    prisma.jobOpening.findFirst.mockResolvedValueOnce(jobRow({ status: 'OPEN' }));
    await expect(service.publish(IDS.recruiter, JOB)).rejects.toMatchObject({ status: 409 });
    await expect(service.close(IDS.recruiter, JOB)).rejects.toMatchObject({ status: 409 });
  });

  it('refuses to edit a closed job', async () => {
    prisma.jobOpening.findFirst.mockResolvedValueOnce(jobRow({ status: 'CLOSED' }));
    await expect(service.update(IDS.recruiter, JOB, { roleTitle: 'X Y' })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('deletes only a draft with no applications (JOB-01.10)', async () => {
    prisma.jobOpening.findFirst.mockResolvedValueOnce(jobRow({ _count: { applications: 2 } }));
    await expect(service.remove(IDS.recruiter, JOB)).rejects.toMatchObject({ status: 409 });
    await service.remove(IDS.recruiter, JOB);
    expect(prisma.jobOpening.delete).toHaveBeenCalledWith({ where: { id: JOB } });
  });

  it('duplicates into a new draft for another approved campus', async () => {
    await service.duplicate(IDS.recruiter, JOB, { institutionId: OTHER_CAMPUS });
    expect(prisma.universityEmployerAccess.findUnique.mock.calls[0][0].where).toEqual({
      institutionId_companyId: { institutionId: OTHER_CAMPUS, companyId: IDS.companyA },
    });
    const data = prisma.jobOpening.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ institutionId: OTHER_CAMPUS, companyId: IDS.companyA });
    expect(data.status).toBeUndefined();
  });

  it('403s a deactivated member before touching any job', async () => {
    actor.deactivatedAt = new Date();
    await expect(service.list(IDS.recruiter, {})).rejects.toMatchObject({ status: 403 });
    expect(prisma.jobOpening.findMany).not.toHaveBeenCalled();
  });
});
