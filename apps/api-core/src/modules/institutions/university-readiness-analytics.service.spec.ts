import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { READINESS_TARGET_SCORE, SKILL_DEFINITIONS } from '@hirekiwi/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import {
  UniversityReadinessAnalyticsService,
  allocatePercents,
  buildAnalyticsRows,
  domainScoresOf,
  markWeakest,
  tierOf,
  type AnalyticsSourceStudent,
} from './university-readiness-analytics.service.js';
import type { UniversityStudentsService } from './university-students.service.js';

const institutionId = randomUUID();
const otherInstitutionId = randomUUID();
const staff: RequestUser = { sub: randomUUID(), role: 'PLACEMENT_STAFF', inst: institutionId };

/** Throws instead of returning undefined, so tests fail loudly on missing fixtures. */
function must<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing test fixture');
  return value;
}

const SKILL = must(SKILL_DEFINITIONS[0]);
const OTHER_CATEGORY_SKILL = must(SKILL_DEFINITIONS.find((s) => s.categoryId !== SKILL.categoryId));

function student(over: Partial<AnalyticsSourceStudent> = {}): AnalyticsSourceStudent {
  return {
    id: randomUUID(),
    groupLabel: 'Main',
    graduationYear: 2026,
    onboardingDetails: { academicProgram: { studyProgram: 'CSE' } },
    skillClaims: [],
    certificates: [],
    ...over,
  };
}

describe('tierOf', () => {
  it('uses the best ISSUED certificate and ignores revoked ones', () => {
    expect(
      tierOf([
        { headlineTier: 'BRONZE', status: 'ISSUED' },
        { headlineTier: 'GOLD', status: 'REVOKED' },
        { headlineTier: 'SILVER', status: 'ISSUED' },
      ]),
    ).toBe('SILVER');
    expect(tierOf([{ headlineTier: 'GOLD', status: 'ISSUED' }])).toBe('GOLD');
  });

  it('is NEEDS_IMPROVEMENT with no issued certificate', () => {
    expect(tierOf([])).toBe('NEEDS_IMPROVEMENT');
    expect(tierOf([{ headlineTier: 'GOLD', status: 'PENDING_ISSUE' }])).toBe('NEEDS_IMPROVEMENT');
  });
});

describe('domainScoresOf', () => {
  it('averages verified skills per domain and skips unverified ones', () => {
    const scores = domainScoresOf([
      { skillCode: SKILL.code, status: 'VERIFIED', proficiency: 'ADVANCED' },
      { skillCode: SKILL.code, status: 'VERIFIED', proficiency: 'INTERMEDIATE' },
      { skillCode: OTHER_CATEGORY_SKILL.code, status: 'DECLARED', proficiency: 'PROFESSIONAL' },
    ]);
    expect(scores.get(SKILL.categoryId)).toBe((85 + 50) / 2);
    expect(scores.has(OTHER_CATEGORY_SKILL.categoryId)).toBe(false);
  });
});

describe('allocatePercents', () => {
  it('always adds up to exactly 100 when there are students', () => {
    const cases = [
      [1, 1, 1, 0],
      [1, 1, 1, 1],
      [7, 3, 3, 1],
      [0, 0, 0, 5],
      [33, 33, 33, 1],
    ];
    for (let i = 0; i < 200; i += 1) {
      cases.push([1, 2, 3, 4].map((n) => Math.floor(Math.random() * 50 * n)));
    }
    for (const counts of cases) {
      const total = counts.reduce((a, b) => a + b, 0);
      const sum = allocatePercents(counts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(total === 0 ? 0 : 100);
    }
  });

  it('is all zero for an empty cohort', () => {
    expect(allocatePercents([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
  });
});

describe('buildAnalyticsRows', () => {
  it('builds one student row each and aggregates heatmap cells per department/domain', () => {
    const students = [
      student({
        skillClaims: [{ skillCode: SKILL.code, status: 'VERIFIED', proficiency: 'BEGINNER' }],
      }),
      student({
        skillClaims: [{ skillCode: SKILL.code, status: 'VERIFIED', proficiency: 'PROFESSIONAL' }],
      }),
    ];
    const { studentRows, cellRows } = buildAnalyticsRows(institutionId, students);
    expect(studentRows).toHaveLength(2);
    expect(studentRows.every((row) => row.institutionId === institutionId)).toBe(true);
    expect(cellRows).toHaveLength(1);
    expect(cellRows[0]).toMatchObject({
      department: 'CSE',
      domainId: SKILL.categoryId,
      studentCount: 2,
      scoreSum: 125,
      belowTargetCount: 1,
    });
  });

  it('handles a large seeded cohort quickly', () => {
    const departments = ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL'];
    const skills = SKILL_DEFINITIONS.slice(0, 40);
    const proficiencies = ['BEGINNER', 'INTERMEDIATE', 'PROFICIENT', 'ADVANCED', 'PROFESSIONAL'];
    const cohort = Array.from({ length: 20_000 }, (_, i) =>
      student({
        graduationYear: 2024 + (i % 4),
        onboardingDetails: { academicProgram: { studyProgram: departments[i % 5] } },
        certificates: [
          { headlineTier: must(['GOLD', 'SILVER', 'BRONZE'][i % 3]), status: 'ISSUED' },
        ],
        skillClaims: [0, 1, 2, 3].map((n) => ({
          skillCode: must(skills[(i + n * 7) % skills.length]).code,
          status: 'VERIFIED',
          proficiency: must(proficiencies[(i + n) % 5]),
        })),
      }),
    );
    const started = performance.now();
    const { studentRows, cellRows } = buildAnalyticsRows(institutionId, cohort);
    const elapsed = performance.now() - started;
    expect(studentRows).toHaveLength(20_000);
    expect(cellRows.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(300);
  });
});

describe('markWeakest', () => {
  it('flags only below-target cells, lowest first', () => {
    const cell = (averageScore: number | null) => ({
      domainId: 'd',
      studentCount: 5,
      averageScore,
      belowTargetPercent: null,
      weakest: false,
    });
    const scores = [20, READINESS_TARGET_SCORE + 10, 40, null, 30, 50];
    const rows = [{ cells: scores.map(cell) }];
    markWeakest(rows, 3);
    // Lowest three below-target scores: 20, 30 and 40.
    expect(must(rows[0]).cells.map((c) => c.weakest)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
  });
});

type Where = Record<string, unknown>;

function build(
  over: { groupLabel?: string | null; deny?: boolean; computedAt?: Date | null } = {},
) {
  const groupBy = vi.fn(async (args: { by: string[] }) => {
    if (args.by[0] === 'tier') {
      return [
        { tier: 'GOLD', _count: { _all: 1 } },
        { tier: 'SILVER', _count: { _all: 1 } },
        { tier: 'BRONZE', _count: { _all: 1 } },
      ];
    }
    if (args.by.join() === 'department,domainId') return [];
    if (args.by[0] === 'department') return [{ department: 'CSE', _count: { _all: 3 } }];
    if (args.by[0] === 'campus') return [{ campus: 'Main' }];
    return [{ gradYear: 2026 }];
  });
  const prisma = {
    readinessAnalyticsStudent: {
      groupBy,
      aggregate: vi.fn(async () => ({
        _max: { computedAt: over.computedAt === undefined ? new Date() : over.computedAt },
      })),
    },
    readinessAnalyticsCell: { groupBy },
  };
  const students = {
    resolveScope: vi.fn(async () => {
      if (over.deny) {
        throw new ForbiddenException({
          error: 'forbidden',
          message: 'staff only',
          statusCode: 403,
        });
      }
      return { institutionId, groupLabel: over.groupLabel ?? null };
    }),
  };
  const service = new UniversityReadinessAnalyticsService(
    prisma as never,
    students as unknown as UniversityStudentsService,
  );
  return { service, prisma, groupBy, students };
}

describe('UniversityReadinessAnalyticsService.getReadiness', () => {
  it('returns tier shares that add up to 100', async () => {
    const { service } = build();
    const result = await service.getReadiness(staff, {});
    expect(result.totalStudents).toBe(3);
    expect(result.tiers.map((t) => t.tier)).toEqual([
      'GOLD',
      'SILVER',
      'BRONZE',
      'NEEDS_IMPROVEMENT',
    ]);
    expect(result.tiers.reduce((sum, t) => sum + t.percent, 0)).toBe(100);
  });

  it('applies department, campus and graduation year together', async () => {
    const { service, groupBy } = build();
    await service.getReadiness(staff, { department: 'CSE', campus: 'Main', gradYear: 2026 });
    const tierCall = groupBy.mock.calls.find((c) => (c[0] as { by: string[] }).by[0] === 'tier');
    expect((must(tierCall)[0] as { where: Where }).where).toEqual({
      institutionId,
      department: 'CSE',
      campus: 'Main',
      gradYear: 2026,
    });
    const cellCall = groupBy.mock.calls.find(
      (c) => (c[0] as { by: string[] }).by.join() === 'department,domainId',
    );
    expect((must(cellCall)[0] as { where: Where }).where).toMatchObject({
      department: 'CSE',
      campus: 'Main',
      gradYear: 2026,
    });
  });

  it("only ever reads the caller's own university", async () => {
    const { service, groupBy } = build();
    await service.getReadiness(staff, {});
    for (const call of groupBy.mock.calls) {
      expect((call[0] as { where: Where }).where.institutionId).toBe(institutionId);
      expect((call[0] as { where: Where }).where.institutionId).not.toBe(otherInstitutionId);
    }
  });

  it('blocks accounts that are not staff of a university', async () => {
    const { service, groupBy } = build({ deny: true });
    await expect(service.getReadiness(staff, {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(groupBy).not.toHaveBeenCalled();
  });

  it('keeps campus-bound staff on their own campus', async () => {
    const { service, groupBy } = build({ groupLabel: 'North' });
    await expect(service.getReadiness(staff, { campus: 'South' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await service.getReadiness(staff, {});
    const tierCall = groupBy.mock.calls.find((c) => (c[0] as { by: string[] }).by[0] === 'tier');
    expect((must(tierCall)[0] as { where: Where }).where.campus).toBe('North');
  });
});
