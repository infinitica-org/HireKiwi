import { z } from 'zod';
import { IsoDateTimeSchema } from './common.js';

/**
 * Th6-607 - TPO cohort readiness dashboard: tier distribution and the department x skill-domain
 * heatmap. Served from an indexed cache (`readiness_analytics_*`), never a live heavy query.
 */

export const READINESS_TIERS = ['GOLD', 'SILVER', 'BRONZE', 'NEEDS_IMPROVEMENT'] as const;
export const ReadinessTierSchema = z.enum(READINESS_TIERS);
export type ReadinessTier = z.infer<typeof ReadinessTierSchema>;

/** A domain score at or above this (0-100) counts as meeting the target. */
export const READINESS_TARGET_SCORE = 60;

export const UniversityReadinessAnalyticsQuerySchema = z.object({
  department: z.string().trim().min(1).max(120).optional(),
  campus: z.string().trim().min(1).max(120).optional(),
  gradYear: z.coerce.number().int().min(1950).max(2100).optional(),
});
export type UniversityReadinessAnalyticsQuery = z.infer<
  typeof UniversityReadinessAnalyticsQuerySchema
>;

export const ReadinessTierShareSchema = z.object({
  tier: ReadinessTierSchema,
  count: z.number().int().min(0),
  /** Whole-number share; the four tiers always add up to exactly 100 when there are students. */
  percent: z.number().int().min(0).max(100),
});
export type ReadinessTierShare = z.infer<typeof ReadinessTierShareSchema>;

export const ReadinessHeatmapCellSchema = z.object({
  domainId: z.string(),
  /** Students in this department with a verified score in the domain. */
  studentCount: z.number().int().min(0),
  /** Average readiness 0-100, or null when nobody has a score in this domain. */
  averageScore: z.number().min(0).max(100).nullable(),
  /** Share (0-100) of scored students below the target, or null when nobody is scored. */
  belowTargetPercent: z.number().min(0).max(100).nullable(),
  /** True for the weakest cells, so the UI can highlight them. */
  weakest: z.boolean(),
});
export type ReadinessHeatmapCell = z.infer<typeof ReadinessHeatmapCellSchema>;

export const UniversityReadinessAnalyticsResponseSchema = z.object({
  generatedAt: IsoDateTimeSchema,
  totalStudents: z.number().int().min(0),
  targetScore: z.number(),
  tiers: z.array(ReadinessTierShareSchema),
  heatmap: z.object({
    domains: z.array(z.object({ id: z.string(), name: z.string() })),
    rows: z.array(
      z.object({
        department: z.string(),
        studentCount: z.number().int().min(0),
        cells: z.array(ReadinessHeatmapCellSchema),
      }),
    ),
  }),
  /** Values to offer in the filter dropdowns (for the caller's own university only). */
  filterOptions: z.object({
    departments: z.array(z.string()),
    campuses: z.array(z.string()),
    gradYears: z.array(z.number().int()),
  }),
});
export type UniversityReadinessAnalyticsResponse = z.infer<
  typeof UniversityReadinessAnalyticsResponseSchema
>;
