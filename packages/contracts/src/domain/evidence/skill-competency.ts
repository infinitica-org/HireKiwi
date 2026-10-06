import { z } from 'zod';
import { UuidSchema } from '../../dto/common.js';
import { TaxonomySkillCodeSchema } from '../../dto/catalog.dto.js';

export const CompetencyDifficultySchema = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'PROFICIENT',
  'ADVANCED',
  'PROFESSIONAL',
]);
export type CompetencyDifficulty = z.infer<typeof CompetencyDifficultySchema>;

export const CompetencyRoleSchema = z.enum(['core', 'supporting', 'critical']);
export type CompetencyRole = z.infer<typeof CompetencyRoleSchema>;

/**
 * Minimum number of scored items a competency must receive before its status
 * can be trusted for a proficiency decision. A critical competency gates an
 * entire level (meetsProficiency requires it to reach DEMONSTRATED), so a
 * single item deciding it carries disproportionate consequence -- it gets a
 * higher floor than a merely-required competency. Derived from the
 * Spearman-Brown prophecy formula against an assumed single-item reliability;
 * see the "Item-Count Proposal" validation report for the full derivation.
 * These are provisional floors pending real per-item reliability calibration
 * (the assumed r11 = 0.25 is a textbook default, not measured from this item
 * bank) -- treat as a starting hypothesis, not a final specification.
 */
export const MINIMUM_ITEM_COUNT_BY_ROLE: Readonly<Record<CompetencyRole, number>> = {
  core: 2,
  supporting: 2,
  critical: 3,
};

export const SkillCompetencySchema = z.object({
  competencyId: UuidSchema,
  skillCode: TaxonomySkillCodeSchema,
  capability: z.string().min(1).max(500),
  observableBehaviours: z.array(z.string().max(500)).max(30).default([]),
  difficulty: CompetencyDifficultySchema.optional(),
  assessmentCriteria: z.array(z.string().max(500)).max(30).default([]),
  prerequisites: z.array(UuidSchema).max(10).default([]),
  role: CompetencyRoleSchema.default('supporting'),
});
export type SkillCompetency = z.infer<typeof SkillCompetencySchema>;
