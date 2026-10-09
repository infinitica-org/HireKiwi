import {
  APPLICANT_SORT_KEYS,
  ListEmployerApplicantsQuerySchema,
  SKILL_DEFINITIONS,
} from '@hirekiwi/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS } from '../company-profile/test-utils.js';
import {
  EmployerApplicantsService,
  decodeApplicantCursor,
  sortKeyFor,
} from './employer-applicants.service.js';

const JOB = '00000000-0000-4000-8000-000000000001';
const [skillA] = SKILL_DEFINITIONS as [(typeof SKILL_DEFINITIONS)[number]];
const query = (over: Record<string, unknown> = {}) => ListEmployerApplicantsQuerySchema.parse(over);

function row(n: number, over: Record<string, unknown> = {}) {
  return {
    id: `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    studentId: `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    stage: 'APPLIED',
    createdAt: new Date(Date.UTC(2026, 8, n)),
    snapshot: {
      profileJson: { fullName: `Candidate ${n}` },
      fitJson: { band: 'STRONG', matchPercent: 50 + n, topReason: null },
    },
    ...over,
  };
}

const snap = (name: string, fit: { band: string; matchPercent: number } | null) => ({
  profileJson: { fullName: name },
  fitJson: fit ? { ...fit, topReason: null } : null,
});

describe('EmployerApplicantsService (Th6-390/391)', () => {
  let rows: ReturnType<typeof row>[];
  let actor: any;
  let ownJob: unknown;
  let prisma: any;
  let storage: any;
  let service: EmployerApplicantsService;

  beforeEach(() => {
    rows = [];
    actor = { role: 'COMPANY', companyId: IDS.companyA, companyRole: 'OWNER', deactivatedAt: null };
    ownJob = {
      id: JOB,
      roleTitle: 'Backend Engineer',
      domainCode: skillA.domain,
      minYearsExperience: null,
      maxYearsExperience: null,
      location: null,
      requiredSkills: [{ minProficiency: 'INTERMEDIATE', skill: { code: skillA.code } }],
    };
    prisma = {
      user: {
        findUnique: vi.fn(async () => actor),
        findMany: vi.fn(async (): Promise<unknown[]> => []),
      },
      jobOpening: {
        findFirst: vi.fn(async ({ where }: any) =>
          where.companyId === IDS.companyA && where.id === JOB ? ownJob : null,
        ),
      },
      application: {
        findMany: vi.fn(async () => rows),
        findFirst: vi.fn(async (): Promise<unknown> => null),
      },
      skillClaim: { findMany: vi.fn(async () => []) },
    };
    storage = { getSignedDownloadUrl: vi.fn(async (key: string) => `https://files.test/${key}`) };
    service = new EmployerApplicantsService(prisma, storage);
  });

  it('lists applicants from the snapshot with status, fit and applied date', async () => {
    rows = [row(1), row(2, { stage: 'SHORTLISTED' })];
    const result = await service.list(IDS.owner, JOB, query());
    expect(result.job).toEqual({ id: JOB, roleTitle: 'Backend Engineer' });
    expect(result.total).toBe(2);
    expect(result.applicants[0]).toMatchObject({
      candidateName: 'Candidate 2',
      fit: { band: 'STRONG', matchPercent: 52 },
      status: 'REVIEWING',
      statusLabel: 'Reviewing',
    });
  });

  it("never lists another company's job (404) and never a non-company user (403)", async () => {
    ownJob = null;
    await expect(service.list(IDS.owner, JOB, query())).rejects.toMatchObject({ status: 404 });
    actor = { ...actor, role: 'STUDENT', companyId: null, companyRole: null };
    await expect(service.list(IDS.owner, JOB, query())).rejects.toMatchObject({ status: 403 });
    actor = {
      role: 'COMPANY',
      companyId: IDS.companyA,
      companyRole: 'OWNER',
      deactivatedAt: new Date(),
    };
    await expect(service.list(IDS.owner, JOB, query())).rejects.toMatchObject({ status: 403 });
  });

  it('scopes the query to the caller company and to snapshot-backed applications', async () => {
    await service.list(IDS.owner, JOB, query());
    expect(prisma.jobOpening.findFirst.mock.calls[0]?.[0].where).toEqual({
      id: JOB,
      companyId: IDS.companyA,
    });
    expect(prisma.application.findMany.mock.calls[0]?.[0].where).toMatchObject({
      openingId: JOB,
      snapshot: { isNot: null },
    });
  });

  it('lets a recruiter view applicants (owner and recruiter both have the permission)', async () => {
    actor = { ...actor, companyRole: 'RECRUITER' };
    await expect(service.list(IDS.recruiter, JOB, query())).resolves.toBeDefined();
  });

  it('shows the empty state for a job nobody applied to', async () => {
    expect(await service.list(IDS.owner, JOB, query())).toMatchObject({
      applicants: [],
      total: 0,
      nextCursor: null,
    });
  });

  it('shows withdrawn applicants as Withdrawn and can filter by status', async () => {
    rows = [row(1, { stage: 'WITHDRAWN' })];
    const result = await service.list(IDS.owner, JOB, query({ status: 'WITHDRAWN' }));
    expect(result.applicants[0]).toMatchObject({ status: 'WITHDRAWN', statusLabel: 'Withdrawn' });
    expect(prisma.application.findMany.mock.calls[0]?.[0].where.stage).toEqual({
      in: ['WITHDRAWN'],
    });
    await service.list(IDS.owner, JOB, query({ status: 'REVIEWING' }));
    expect(prisma.application.findMany.mock.calls[1]?.[0].where.stage).toEqual({
      in: ['SHORTLISTED', 'AI_VERIFIED'],
    });
  });

  it('sorts by fit (snapshot), applied date, or status', async () => {
    rows = [
      row(1, { snapshot: snap('A', { band: 'MODERATE', matchPercent: 60 }) }),
      row(2, { stage: 'INTERVIEW', snapshot: snap('B', { band: 'STRONG', matchPercent: 95 }) }),
      row(3, { snapshot: snap('C', null) }),
    ];
    const names = async (sort: string) =>
      (await service.list(IDS.owner, JOB, query({ sort }))).applicants.map((a) => a.candidateName);
    expect(await names('fit')).toEqual(['B', 'A', 'C']); // best fit first, unscored last
    expect(await names('applied')).toEqual(['C', 'B', 'A']); // newest first
    expect(await names('status')).toEqual(['C', 'A', 'B']); // earlier pipeline stages first
  });

  it('accepts only whitelisted sort keys: never a personal or protected attribute', () => {
    expect([...APPLICANT_SORT_KEYS]).toEqual(['fit', 'applied', 'status']);
    for (const bad of ['name', 'gender', 'age', 'email', 'college', 'cgpa', 'candidateName']) {
      expect(ListEmployerApplicantsQuerySchema.safeParse({ sort: bad }).success).toBe(false);
    }
    expect(ListEmployerApplicantsQuerySchema.safeParse({ status: 'NOPE' }).success).toBe(false);
  });

  it('hints "recalculated" when the fit today differs from the fit at apply time, without re-sorting', async () => {
    rows = [row(1, { snapshot: snap('A', { band: 'STRONG', matchPercent: 60 }) })];
    // No verified skills today, so no current fit: it differs from the stored STRONG fit.
    const result = await service.list(IDS.owner, JOB, query());
    expect(result.applicants[0]).toMatchObject({
      fitRecalculated: true,
      fit: { matchPercent: 60 },
    });
  });

  it('reads the name from the snapshot, not the live profile', async () => {
    rows = [row(1, { student: { fullName: 'Renamed Later' } })];
    const result = await service.list(IDS.owner, JOB, query());
    expect(result.applicants[0]?.candidateName).toBe('Candidate 1');
  });

  it('paginates with a stable cursor: no repeats or gaps, same order as one page', async () => {
    rows = Array.from({ length: 7 }, (_, i) => row(i + 1));
    const full = (await service.list(IDS.owner, JOB, query({ limit: 50 }))).applicants.map(
      (a) => a.applicationId,
    );
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let guard = 0; guard < 10; guard += 1) {
      const page = await service.list(IDS.owner, JOB, query({ limit: 3, cursor }));
      seen.push(...page.applicants.map((a) => a.applicationId));
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
    expect(seen).toEqual(full);
    expect(new Set(seen).size).toBe(7);
  });

  it('rejects a malformed cursor with 422', async () => {
    await expect(service.list(IDS.owner, JOB, query({ cursor: 'garbage' }))).rejects.toMatchObject({
      status: 422,
    });
    expect(() => decodeApplicantCursor('garbage')).toThrow();
  });

  it('builds sort keys only from fit, applied date and status', () => {
    const base = { fitPercent: 80, appliedAt: 1000, status: 'APPLIED' as const, id: 'x' };
    expect(sortKeyFor('fit', base)).toEqual({ a: -80, b: -1000, id: 'x' });
    expect(sortKeyFor('applied', base)).toEqual({ a: -1000, b: 0, id: 'x' });
    expect(sortKeyFor('status', base)).toEqual({ a: 0, b: -1000, id: 'x' });
  });

  it('shows each applicant photo as a fresh signed link, and null when they have none', async () => {
    rows = [row(1), row(2)];
    prisma.user.findMany.mockResolvedValue([
      { id: '50000000-0000-4000-8000-000000000001', profilePhotoObjectKey: 'photos/one.png' },
      { id: '50000000-0000-4000-8000-000000000002', profilePhotoObjectKey: null },
    ]);
    const result = await service.list(IDS.owner, JOB, query());
    const byName = new Map(result.applicants.map((card) => [card.candidateName, card.photoUrl]));
    expect(byName.get('Candidate 1')).toBe('https://files.test/photos/one.png');
    expect(byName.get('Candidate 2')).toBeNull();
  });

  describe('applicant detail', () => {
    const APPLICATION = 'a0000000-0000-4000-8000-000000000001';
    const fullProfile = {
      fullName: 'Asha Rao',
      profilePhotoUrl: null,
      trackName: null,
      trackCategory: null,
      skills: [],
      declaredSkillsCount: 0,
      projects: [],
      workExperience: [],
      certificate: null,
      externalCertificates: [],
    };

    it('returns the snapshot profile with a fresh photo link, scoped to the caller company', async () => {
      prisma.application.findFirst.mockResolvedValue({
        id: APPLICATION,
        studentId: 's1',
        stage: 'APPLIED',
        coverNote: 'Keen to join.',
        createdAt: new Date(Date.UTC(2026, 9, 1)),
        opening: { id: JOB, roleTitle: 'Backend Engineer' },
        snapshot: { profileJson: fullProfile, fitJson: null },
        student: { profilePhotoObjectKey: 'photos/asha.png' },
      });
      const detail = await service.detail(IDS.owner, APPLICATION);
      expect(detail.profile.fullName).toBe('Asha Rao');
      expect(detail.photoUrl).toBe('https://files.test/photos/asha.png');
      expect(detail.coverNote).toBe('Keen to join.');
      expect(detail.statusLabel).toBeTruthy();
      expect(prisma.application.findFirst.mock.calls[0]?.[0].where).toMatchObject({
        id: APPLICATION,
        opening: { companyId: IDS.companyA },
      });
    });

    it('answers 404 for an applicant of another company or without a usable snapshot', async () => {
      await expect(service.detail(IDS.owner, APPLICATION)).rejects.toMatchObject({ status: 404 });
      prisma.application.findFirst.mockResolvedValue({
        id: APPLICATION,
        snapshot: { profileJson: { broken: true }, fitJson: null },
        opening: { id: JOB, roleTitle: 'x' },
        student: { profilePhotoObjectKey: null },
      });
      await expect(service.detail(IDS.owner, APPLICATION)).rejects.toMatchObject({ status: 404 });
    });
  });
});
