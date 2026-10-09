import { z } from 'zod';
import { TaxonomySkillCodeSchema } from '../../dto/catalog.dto.js';
import { UuidSchema } from '../../dto/common.js';
import { EvidenceTypeSchema } from './enums.js';

export const SKILL_GRAPH_EDGE_TYPES = [
  'REQUIRES',
  'PART_OF',
  'TRANSFERABLE_TO',
  'DEMONSTRATES',
  'HAS_ROLE',
] as const;
export const SkillGraphEdgeTypeSchema = z.enum(SKILL_GRAPH_EDGE_TYPES);
export type SkillGraphEdgeType = z.infer<typeof SkillGraphEdgeTypeSchema>;

export const SkillImportanceSchema = z.enum(['critical', 'must_have', 'nice_to_have']);
export type SkillImportance = z.infer<typeof SkillImportanceSchema>;

/**
 * Directed edge in the Multidimensional Graph.
 *
 * Examples:
 * - Company -[HAS_ROLE]-> Job
 * - Job -[REQUIRES {skill, required_level, importance}]-> Skill
 * - Student -[HAS_EVIDENCE]-> Evidence -[DEMONSTRATES]-> Skill
 * - Competency -[PART_OF]-> Skill
 * - Skill -[TRANSFERABLE_TO {transferPenalty, sharedCapabilities}]-> Skill
 */
export const SkillGraphEdgeSchema = z.object({
  id: z.string().min(1),
  sourceType: z.enum(['COMPANY', 'JOB', 'STUDENT', 'EVIDENCE', 'SKILL', 'COMPETENCY']),
  sourceId: z.string().min(1),
  edgeType: SkillGraphEdgeTypeSchema,
  targetType: z.enum(['JOB', 'SKILL', 'COMPETENCY', 'EVIDENCE']),
  targetId: z.string().min(1),
  weight: z.number().min(0).max(1).default(1.0),
  metadata: z
    .object({
      importance: SkillImportanceSchema.optional(),
      minProficiency: z.string().optional(),
      transferPenalty: z.number().min(0).max(1).optional(),
      constructCoverage: z.number().min(0).max(1).optional(),
      interRaterReliability: z.number().min(0).max(1).optional(),
      sourceReliability: z.number().min(0).max(1).optional(),
      recencyDays: z.number().int().nonnegative().optional(),
    })
    .default({}),
});
export type SkillGraphEdge = z.infer<typeof SkillGraphEdgeSchema>;

export const EvidenceValidationMetricsSchema = z.object({
  evidenceId: UuidSchema,
  evidenceType: EvidenceTypeSchema,
  methodType: z.string().min(1),
  constructCoverage: z.number().min(0).max(1),
  /** null = unknown (absent or single-rater evidence); excluded from compositeValidityScore. */
  interRaterReliability: z.number().min(0).max(1).nullable(),
  /** Declared policy weight for the evidence source (trust tier), not a measured reliability. */
  sourceAuthorityWeight: z.number().min(0).max(1),
  recencyDays: z.number().int().nonnegative(),
  decayFactor: z.number().min(0).max(1),
  compositeValidityScore: z.number().min(0).max(1),
});
export type EvidenceValidationMetrics = z.infer<typeof EvidenceValidationMetricsSchema>;

export const PersonJobFitScoreSchema = z.object({
  overallFitScore: z.number().min(0).max(1),
  mustHavesMet: z.boolean(),
  coverageOfMustHaves: z.number().min(0).max(1),
  weightedProficiencyAccuracy: z.number().min(0).max(1),
  skillFitBreakdown: z.array(
    z.object({
      skillCode: TaxonomySkillCodeSchema,
      importance: SkillImportanceSchema,
      requiredRank: z.number().min(1).max(5),
      demonstratedRank: z.number().min(0).max(5),
      isMet: z.boolean(),
      confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      sourceDiscrepancy: z.boolean().default(false),
    }),
  ),
  matchStrategy: z.enum(['EXPLOITATION', 'EXPLORATION']),
  explorationRationale: z.string().max(300).optional(),
});
export type PersonJobFitScore = z.infer<typeof PersonJobFitScoreSchema>;
