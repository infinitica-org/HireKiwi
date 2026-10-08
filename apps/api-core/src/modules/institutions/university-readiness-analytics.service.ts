import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/index.js';
import {
  READINESS_TARGET_SCORE,
  READINESS_TIERS,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_IDS,
  SKILL_DEFINITIONS,
  type ReadinessHeatmapCell,
  type ReadinessTier,
  type UniversityReadinessAnalyticsQuery,
  type UniversityReadinessAnalyticsResponse,
} from '@hirekiwi/contracts';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { programOf, UniversityStudentsService } from './university-students.service.js';

/** The cache is rebuilt in the background once it is older than this. */
export const READINESS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const WEAKEST_CELL_COUNT = 3;
const STUDENT_INSERT_CHUNK = 5000;
const REFRESH_PAGE = 2000;

/** Score (0-100) a verified skill contributes, by proficiency. */
export const PROFICIENCY_SCORE: Readonly<Record<string, number>> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  PROFICIENT: 70,
  ADVANCED: 85,
  PROFESSIONAL: 100,
};

const CATEGORY_BY_SKILL_CODE: ReadonlyMap<string, string> = new Map(
  SKILL_DEFINITIONS.map((skill) => [skill.code, skill.categoryId]),
);

const TIER_RANK: Readonly<Record<string, number>> = { GOLD: 3, SILVER: 2, BRONZE: 1 };

export interface AnalyticsSourceStudent {
  readonly id: string;
  readonly groupLabel: string | null;
  readonly graduationYear: number | null;
  readonly onboardingDetails: Prisma.JsonValue | null;
  readonly skillClaims: readonly { skillCode: string; status: string; proficiency: string }[];
  readonly certificates: readonly { headlineTier: string; status: string }[];
}

export interface AnalyticsStudentRow {
  userId: string;
  institutionId: string;
  campus: string;
  department: string;
  gradYear: number;
  tier: ReadinessTier;
}

export interface AnalyticsCellRow {
  institutionId: string;
  department: string;
  campus: string;
  gradYear: number;
  domainId: string;
  studentCount: number;
  scoreSum: number;
  belowTargetCount: number;
}

/** Best issued certificate tier, or NEEDS_IMPROVEMENT when the student has none. */
export function tierOf(certificates: AnalyticsSourceStudent['certificates']): ReadinessTier {
  let best = 0;
  for (const certificate of certificates) {
    if (certificate.status !== 'ISSUED') continue;
    best = Math.max(best, TIER_RANK[certificate.headlineTier] ?? 0);
  }
  if (best === 3) return 'GOLD';
  if (best === 2) return 'SILVER';
  if (best === 1) return 'BRONZE';
  return 'NEEDS_IMPROVEMENT';
}

/** Average verified-skill score per skill domain; domains with no verified skill are absent. */
export function domainScoresOf(claims: AnalyticsSourceStudent['skillClaims']): Map<string, number> {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const claim of claims) {
    if (claim.status !== 'VERIFIED') continue;
    const domain = CATEGORY_BY_SKILL_CODE.get(claim.skillCode);
    const score = PROFICIENCY_SCORE[claim.proficiency];
    if (!domain || score === undefined) continue;
    const entry = totals.get(domain) ?? { sum: 0, count: 0 };
    entry.sum += score;
    entry.count += 1;
    totals.set(domain, entry);
  }
  return new Map([...totals].map(([domain, { sum, count }]) => [domain, sum / count]));
}

/** Whole-number shares that always add up to exactly 100 (largest remainder); all 0 when empty. */
export function allocatePercents(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count / total) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    remaining -= 1;
  }
  return floors;
}

/** Turns raw students into the two cache tables' rows. Pure, so it is cheap to test at scale. */
export function buildAnalyticsRows(
  institutionId: string,
  students: readonly AnalyticsSourceStudent[],
): { studentRows: AnalyticsStudentRow[]; cellRows: AnalyticsCellRow[] } {
  const studentRows: AnalyticsStudentRow[] = [];
  const cells = new Map<string, AnalyticsCellRow>();
  for (const student of students) {
    const campus = student.groupLabel?.trim() ?? '';
    const department = programOf(student.onboardingDetails) ?? 'Unspecified';
    const gradYear = student.graduationYear ?? 0;
    studentRows.push({
      userId: student.id,
      institutionId,
      campus,
      department,
      gradYear,
      tier: tierOf(student.certificates),
    });
    for (const [domainId, score] of domainScoresOf(student.skillClaims)) {
      const key = `${department}\u0000${campus}\u0000${gradYear}\u0000${domainId}`;
      const cell = cells.get(key) ?? {
        institutionId,
        department,
        campus,
        gradYear,
        domainId,
        studentCount: 0,
        scoreSum: 0,
        belowTargetCount: 0,
      };
      cell.studentCount += 1;
      cell.scoreSum += score;
      if (score < READINESS_TARGET_SCORE) cell.belowTargetCount += 1;
      cells.set(key, cell);
    }
  }
  return { studentRows, cellRows: [...cells.values()] };
}

/** Marks the lowest-scoring below-target cells so the UI can highlight them. */
export function markWeakest(
  rows: { cells: ReadinessHeatmapCell[] }[],
  limit = WEAKEST_CELL_COUNT,
): void {
  const candidates = rows
    .flatMap((row) => row.cells)
    .filter((cell) => cell.averageScore !== null && cell.averageScore < READINESS_TARGET_SCORE)
    .sort(
      (a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0) || b.studentCount - a.studentCount,
    )
    .slice(0, limit);
  for (const cell of candidates) cell.weakest = true;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Th6-607 - cohort readiness dashboard. Reads two indexed cache tables (students + pre-aggregated
 * heatmap cells), never the live skill-claim / certificate tables, so the response time does not
 * grow with the cohort. The university comes from the caller's token, never from the query.
 */
@Injectable()
export class UniversityReadinessAnalyticsService {
  private readonly logger = new Logger(UniversityReadinessAnalyticsService.name);
  private readonly refreshing = new Map<string, Promise<void>>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UniversityStudentsService) private readonly students: UniversityStudentsService,
  ) {}

  async getReadiness(
    user: RequestUser,
    query: UniversityReadinessAnalyticsQuery,
  ): Promise<UniversityReadinessAnalyticsResponse> {
    const scope = await this.students.resolveScope(user);
    // Campus-bound staff only ever see their own campus.
    if (scope.groupLabel && query.campus && query.campus !== scope.groupLabel) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'You can only view your own campus.',
        statusCode: 403,
      });
    }
    const campus = scope.groupLabel ?? query.campus;
    const institutionId = scope.institutionId;

    const generatedAt = await this.ensureFresh(institutionId);

    const studentWhere: Prisma.ReadinessAnalyticsStudentWhereInput = {
      institutionId,
      ...(query.department ? { department: query.department } : {}),
      ...(campus ? { campus } : {}),
      ...(query.gradYear !== undefined ? { gradYear: query.gradYear } : {}),
    };
    const cellWhere: Prisma.ReadinessAnalyticsCellWhereInput = {
      institutionId,
      ...(query.department ? { department: query.department } : {}),
      ...(campus ? { campus } : {}),
      ...(query.gradYear !== undefined ? { gradYear: query.gradYear } : {}),
    };
    const optionWhere: Prisma.ReadinessAnalyticsStudentWhereInput = {
      institutionId,
      ...(scope.groupLabel ? { campus: scope.groupLabel } : {}),
    };

    const [tierGroups, departmentGroups, cellGroups, departments, campuses, gradYears] =
      await Promise.all([
        this.prisma.readinessAnalyticsStudent.groupBy({
          by: ['tier'],
          where: studentWhere,
          _count: { _all: true },
        }),
        this.prisma.readinessAnalyticsStudent.groupBy({
          by: ['department'],
          where: studentWhere,
          _count: { _all: true },
        }),
        this.prisma.readinessAnalyticsCell.groupBy({
          by: ['department', 'domainId'],
          where: cellWhere,
          _sum: { studentCount: true, scoreSum: true, belowTargetCount: true },
        }),
        this.prisma.readinessAnalyticsStudent.groupBy({ by: ['department'], where: optionWhere }),
        this.prisma.readinessAnalyticsStudent.groupBy({ by: ['campus'], where: optionWhere }),
        this.prisma.readinessAnalyticsStudent.groupBy({ by: ['gradYear'], where: optionWhere }),
      ]);

    const countByTier = new Map(tierGroups.map((group) => [group.tier, group._count._all]));
    const tierCounts = READINESS_TIERS.map((tier) => countByTier.get(tier) ?? 0);
    const percents = allocatePercents(tierCounts);
    const totalStudents = tierCounts.reduce((sum, count) => sum + count, 0);

    const cellByKey = new Map(
      cellGroups.map((group) => [`${group.department}\u0000${group.domainId}`, group._sum]),
    );
    const domains = SKILL_CATEGORY_IDS.map((id) => ({ id, name: SKILL_CATEGORIES[id].name }));
    const rows = departmentGroups
      .map((group) => ({
        department: group.department,
        studentCount: group._count._all,
        cells: domains.map<ReadinessHeatmapCell>(({ id }) => {
          const sum = cellByKey.get(`${group.department}\u0000${id}`);
          const scored = sum?.studentCount ?? 0;
          return {
            domainId: id,
            studentCount: scored,
            averageScore: scored > 0 ? round1((sum?.scoreSum ?? 0) / scored) : null,
            belowTargetPercent:
              scored > 0 ? round1(((sum?.belowTargetCount ?? 0) / scored) * 100) : null,
            weakest: false,
          };
        }),
      }))
      .sort((a, b) => a.department.localeCompare(b.department));
    markWeakest(rows);

    return {
      generatedAt: generatedAt.toISOString(),
      totalStudents,
      targetScore: READINESS_TARGET_SCORE,
      tiers: READINESS_TIERS.map((tier, index) => ({
        tier,
        count: tierCounts[index] ?? 0,
        percent: percents[index] ?? 0,
      })),
      heatmap: { domains, rows },
      filterOptions: {
        departments: departments.map((row) => row.department).sort((a, b) => a.localeCompare(b)),
        campuses: campuses
          .map((row) => row.campus)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
        gradYears: gradYears
          .map((row) => row.gradYear)
          .filter((year) => year > 0)
          .sort((a, b) => b - a),
      },
    };
  }

  /**
   * Returns when the cache was last built. An empty cache is built right away (first visit); an
   * old one is served as is while a background rebuild runs.
   */
  private async ensureFresh(institutionId: string): Promise<Date> {
    const latest = await this.prisma.readinessAnalyticsStudent.aggregate({
      where: { institutionId },
      _max: { computedAt: true },
    });
    const computedAt = latest._max.computedAt;
    if (!computedAt) {
      await this.refreshInstitution(institutionId);
      return new Date();
    }
    if (Date.now() - computedAt.getTime() > READINESS_CACHE_MAX_AGE_MS) {
      void this.refreshInstitution(institutionId).catch((error: unknown) =>
        this.logger.warn(`Readiness cache refresh failed: ${String(error)}`),
      );
    }
    return computedAt;
  }

  /** Rebuilds both cache tables for one institution. Safe to call from a job or on a change. */
  refreshInstitution(institutionId: string): Promise<void> {
    const running = this.refreshing.get(institutionId);
    if (running) return running;
    const job = this.rebuild(institutionId).finally(() => this.refreshing.delete(institutionId));
    this.refreshing.set(institutionId, job);
    return job;
  }

  private async rebuild(institutionId: string): Promise<void> {
    const students: AnalyticsSourceStudent[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = await this.prisma.user.findMany({
        where: { institutionId, role: 'STUDENT' },
        orderBy: { id: 'asc' },
        take: REFRESH_PAGE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          groupLabel: true,
          graduationYear: true,
          onboardingDetails: true,
          skillClaims: {
            select: { status: true, proficiency: true, skill: { select: { code: true } } },
          },
          certificates: { select: { headlineTier: true, status: true } },
        },
      });
      for (const row of page) {
        students.push({
          ...row,
          skillClaims: row.skillClaims.map((claim) => ({
            skillCode: claim.skill.code,
            status: claim.status,
            proficiency: claim.proficiency,
          })),
        });
      }
      if (page.length < REFRESH_PAGE) break;
      cursor = page[page.length - 1]?.id;
    }

    const { studentRows, cellRows } = buildAnalyticsRows(institutionId, students);
    const computedAt = new Date();
    await this.prisma.$transaction(
      async (tx) => {
        await tx.readinessAnalyticsStudent.deleteMany({ where: { institutionId } });
        await tx.readinessAnalyticsCell.deleteMany({ where: { institutionId } });
        for (let i = 0; i < studentRows.length; i += STUDENT_INSERT_CHUNK) {
          await tx.readinessAnalyticsStudent.createMany({
            data: studentRows
              .slice(i, i + STUDENT_INSERT_CHUNK)
              .map((row) => ({ ...row, computedAt })),
          });
        }
        for (let i = 0; i < cellRows.length; i += STUDENT_INSERT_CHUNK) {
          await tx.readinessAnalyticsCell.createMany({
            data: cellRows.slice(i, i + STUDENT_INSERT_CHUNK),
          });
        }
      },
      { timeout: 60_000 },
    );
  }
}
