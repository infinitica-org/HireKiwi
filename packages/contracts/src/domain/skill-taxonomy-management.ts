import { z } from 'zod';
import {
  DEFAULT_COMPETENCY_BARS,
  PROFICIENCY_LEVEL_ORDER,
  type LevelThreshold,
  type ProficiencyLevel,
} from './skill-levels.js';
import type { SkillCategoryId, SkillTaxonomyDomain } from './skill-taxonomy.js';

/* -------------------------------------------------------------------------- */
/* 1. Skill Status & Definition (Th6-I297, Th6-I304)                          */
/* -------------------------------------------------------------------------- */

export const SKILL_STATUSES = ['ACTIVE', 'RETIRED', 'DEPRECATED'] as const;
export const SkillStatusSchema = z.enum(SKILL_STATUSES);
export type SkillStatus = z.infer<typeof SkillStatusSchema>;

export interface ManagedSkillDefinition {
  readonly code: string;
  readonly name: string;
  readonly categoryId: SkillCategoryId;
  readonly categoryName: string;
  readonly domain: SkillTaxonomyDomain;
  readonly status: SkillStatus;
  readonly version: string;
  readonly aliases: readonly string[];
  readonly corroborationEligible: boolean;
  readonly assessmentRequiredForClaim: boolean;
  readonly retiredAt?: string;
  readonly retirementReason?: string;
  readonly replacementCode?: string;
}

export const CreateSkillInputSchema = z.object({
  code: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  categoryId: z.string(),
  categoryName: z.string(),
  domain: z.string().default('SOFTWARE_IT'),
  version: z.string().default('1.0.0'),
  aliases: z.array(z.string()).default([]),
  corroborationEligible: z.boolean().default(true),
  assessmentRequiredForClaim: z.boolean().default(true),
});
export type CreateSkillInput = z.infer<typeof CreateSkillInputSchema>;

export const UpdateSkillInputSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  status: SkillStatusSchema.optional(),
  version: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  corroborationEligible: z.boolean().optional(),
  assessmentRequiredForClaim: z.boolean().optional(),
});
export type UpdateSkillInput = z.infer<typeof UpdateSkillInputSchema>;

export function createManagedSkill(input: CreateSkillInput): ManagedSkillDefinition {
  const parsed = CreateSkillInputSchema.parse(input);
  return {
    code: parsed.code.toUpperCase(),
    name: parsed.name,
    categoryId: parsed.categoryId as SkillCategoryId,
    categoryName: parsed.categoryName,
    domain: parsed.domain as SkillTaxonomyDomain,
    status: 'ACTIVE',
    version: parsed.version,
    aliases: parsed.aliases,
    corroborationEligible: parsed.corroborationEligible,
    assessmentRequiredForClaim: parsed.assessmentRequiredForClaim,
  };
}

export function updateManagedSkill(
  current: ManagedSkillDefinition,
  input: UpdateSkillInput,
): ManagedSkillDefinition {
  const parsed = UpdateSkillInputSchema.parse(input);
  return {
    ...current,
    name: parsed.name ?? current.name,
    categoryId: (parsed.categoryId as SkillCategoryId) ?? current.categoryId,
    categoryName: parsed.categoryName ?? current.categoryName,
    status: parsed.status ?? current.status,
    version: parsed.version ?? current.version,
    aliases: parsed.aliases ?? current.aliases,
    corroborationEligible: parsed.corroborationEligible ?? current.corroborationEligible,
    assessmentRequiredForClaim:
      parsed.assessmentRequiredForClaim ?? current.assessmentRequiredForClaim,
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Merging & Aliasing Skills (Th6-I298)                                    */
/* -------------------------------------------------------------------------- */

export interface SkillAliasRecord {
  readonly alias: string;
  readonly canonicalCode: string;
  readonly registeredAt: string;
}

export const RegisterAliasInputSchema = z.object({
  alias: z.string().min(1),
  canonicalCode: z.string().min(1),
});
export type RegisterAliasInput = z.infer<typeof RegisterAliasInputSchema>;

export const MergeSkillsInputSchema = z.object({
  sourceCode: z.string().min(1),
  targetCode: z.string().min(1),
  reason: z.string().min(1),
});
export type MergeSkillsInput = z.infer<typeof MergeSkillsInputSchema>;

export function registerSkillAlias(
  alias: string,
  canonicalCode: string,
  registeredAt?: string,
): SkillAliasRecord {
  const parsed = RegisterAliasInputSchema.parse({ alias, canonicalCode });
  return {
    alias: parsed.alias.trim(),
    canonicalCode: parsed.canonicalCode.toUpperCase(),
    registeredAt: registeredAt ?? new Date().toISOString(),
  };
}

export function resolveCanonicalSkillCode(
  codeOrAlias: string,
  aliases: readonly SkillAliasRecord[],
): string {
  const trimmed = codeOrAlias.trim();
  const match = aliases.find(
    (a) =>
      a.alias.toLowerCase() === trimmed.toLowerCase() || a.canonicalCode === trimmed.toUpperCase(),
  );
  return match ? match.canonicalCode : trimmed.toUpperCase();
}

export function mergeSkillAliases(
  sourceCode: string,
  targetCode: string,
  reason: string,
): { aliasRecord: SkillAliasRecord; retirementInput: RetireSkillInput } {
  const parsed = MergeSkillsInputSchema.parse({ sourceCode, targetCode, reason });
  const canonical = parsed.targetCode.toUpperCase();
  const source = parsed.sourceCode.toUpperCase();
  return {
    aliasRecord: {
      alias: source,
      canonicalCode: canonical,
      registeredAt: new Date().toISOString(),
    },
    retirementInput: {
      code: source,
      reason: `Merged into ${canonical}: ${parsed.reason}`,
      replacementCode: canonical,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Role-to-Skill Mapping (Th6-I299)                                        */
/* -------------------------------------------------------------------------- */

export const ROLE_SKILL_IMPORTANCE = ['REQUIRED', 'PREFERRED'] as const;
export const RoleSkillImportanceSchema = z.enum(ROLE_SKILL_IMPORTANCE);
export type RoleSkillImportance = z.infer<typeof RoleSkillImportanceSchema>;

export interface RoleSkillMapping {
  readonly roleId: string;
  readonly skillCode: string;
  readonly minimumProficiency: ProficiencyLevel;
  readonly importance: RoleSkillImportance;
  readonly mappedAt: string;
  readonly version: string;
}

export const MapSkillToRoleInputSchema = z.object({
  roleId: z.string().min(1),
  skillCode: z.string().min(1),
  minimumProficiency: z.enum(PROFICIENCY_LEVEL_ORDER),
  importance: RoleSkillImportanceSchema.default('REQUIRED'),
  version: z.string().default('1.0.0'),
});
export type MapSkillToRoleInput = z.infer<typeof MapSkillToRoleInputSchema>;

export function mapSkillToJobRole(input: MapSkillToRoleInput, mappedAt?: string): RoleSkillMapping {
  const parsed = MapSkillToRoleInputSchema.parse(input);
  return {
    roleId: parsed.roleId,
    skillCode: parsed.skillCode.toUpperCase(),
    minimumProficiency: parsed.minimumProficiency,
    importance: parsed.importance,
    mappedAt: mappedAt ?? new Date().toISOString(),
    version: parsed.version,
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Skill Competencies Definition (Th6-I300)                                */
/* -------------------------------------------------------------------------- */

export const COMPETENCY_ROLE_TYPES = ['core', 'supporting', 'critical'] as const;
export const CompetencyRoleTypeSchema = z.enum(COMPETENCY_ROLE_TYPES);
export type CompetencyRoleType = z.infer<typeof CompetencyRoleTypeSchema>;

export interface ManagedCompetencyDefinition {
  readonly competencyId: string;
  readonly skillCode: string;
  readonly capability: string;
  readonly observableBehaviours: readonly string[];
  readonly difficulty: ProficiencyLevel;
  readonly assessmentCriteria: readonly string[];
  readonly prerequisites: readonly string[];
  readonly role: CompetencyRoleType;
  readonly version: string;
}

export const DefineCompetencyInputSchema = z.object({
  competencyId: z.string().min(1),
  skillCode: z.string().min(1),
  capability: z.string().min(1),
  observableBehaviours: z.array(z.string()).min(1),
  difficulty: z.enum(PROFICIENCY_LEVEL_ORDER),
  assessmentCriteria: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).default([]),
  role: CompetencyRoleTypeSchema.default('core'),
  version: z.string().default('1.0.0'),
});
export type DefineCompetencyInput = z.infer<typeof DefineCompetencyInputSchema>;

export function defineSkillCompetency(input: DefineCompetencyInput): ManagedCompetencyDefinition {
  const parsed = DefineCompetencyInputSchema.parse(input);
  return {
    competencyId: parsed.competencyId,
    skillCode: parsed.skillCode.toUpperCase(),
    capability: parsed.capability,
    observableBehaviours: parsed.observableBehaviours,
    difficulty: parsed.difficulty,
    assessmentCriteria: parsed.assessmentCriteria,
    prerequisites: parsed.prerequisites,
    role: parsed.role,
    version: parsed.version,
  };
}

/* -------------------------------------------------------------------------- */
/* 5. 5-Level Proficiency Criteria (Th6-I301)                                 */
/* -------------------------------------------------------------------------- */

export function getProficiencyCompetencyBar(level: ProficiencyLevel): string {
  return DEFAULT_COMPETENCY_BARS[level];
}

/* -------------------------------------------------------------------------- */
/* 6. Versioning & Taxonomy History (Th6-I302)                                */
/* -------------------------------------------------------------------------- */

export interface TaxonomyVersionRecord {
  readonly version: string;
  readonly skillCode: string;
  readonly changes: readonly string[];
  readonly createdAt: string;
  readonly author: string;
}

export const BumpTaxonomyVersionInputSchema = z.object({
  skillCode: z.string().min(1),
  newVersion: z.string().min(1),
  changes: z.array(z.string()).min(1),
  author: z.string().default('system'),
});
export type BumpTaxonomyVersionInput = z.infer<typeof BumpTaxonomyVersionInputSchema>;

export function bumpTaxonomyVersion(
  input: BumpTaxonomyVersionInput,
  createdAt?: string,
): TaxonomyVersionRecord {
  const parsed = BumpTaxonomyVersionInputSchema.parse(input);
  return {
    version: parsed.newVersion,
    skillCode: parsed.skillCode.toUpperCase(),
    changes: parsed.changes,
    createdAt: createdAt ?? new Date().toISOString(),
    author: parsed.author,
  };
}

/* -------------------------------------------------------------------------- */
/* 7. Historical Score Rubric Retention (Th6-I303)                            */
/* -------------------------------------------------------------------------- */

export interface ScoreRubricSnapshot {
  readonly rubricVersion: string;
  readonly skillCode: string;
  readonly competencyBars: Readonly<Record<ProficiencyLevel, string>>;
  readonly levelThresholds: Readonly<Record<string, LevelThreshold>>;
  readonly snapshottedAt: string;
}

export interface CandidateHistoricalScoreRecord {
  readonly scoreId: string;
  readonly candidateId: string;
  readonly skillCode: string;
  readonly score: number;
  readonly levelAchieved: ProficiencyLevel;
  readonly rubricSnapshot: ScoreRubricSnapshot;
  readonly evaluatedAt: string;
}

export const RetainScoreRubricInputSchema = z.object({
  scoreId: z.string().min(1),
  candidateId: z.string().min(1),
  skillCode: z.string().min(1),
  score: z.number().min(0).max(100),
  levelAchieved: z.enum(PROFICIENCY_LEVEL_ORDER),
  rubricVersion: z.string().min(1),
  competencyBars: z.record(z.string(), z.string()),
  levelThresholds: z.record(z.string(), z.any()),
  evaluatedAt: z.string().optional(),
});
export type RetainScoreRubricInput = z.infer<typeof RetainScoreRubricInputSchema>;

export function retainScoreRubricVersion(
  input: RetainScoreRubricInput,
): CandidateHistoricalScoreRecord {
  const parsed = RetainScoreRubricInputSchema.parse(input);
  const now = new Date().toISOString();
  return {
    scoreId: parsed.scoreId,
    candidateId: parsed.candidateId,
    skillCode: parsed.skillCode.toUpperCase(),
    score: parsed.score,
    levelAchieved: parsed.levelAchieved,
    rubricSnapshot: {
      rubricVersion: parsed.rubricVersion,
      skillCode: parsed.skillCode.toUpperCase(),
      competencyBars: parsed.competencyBars as Record<ProficiencyLevel, string>,
      levelThresholds: parsed.levelThresholds as Record<string, LevelThreshold>,
      snapshottedAt: now,
    },
    evaluatedAt: parsed.evaluatedAt ?? now,
  };
}

/* -------------------------------------------------------------------------- */
/* 8. Skill Retirement without deleting history (Th6-I304)                    */
/* -------------------------------------------------------------------------- */

export const RetireSkillInputSchema = z.object({
  code: z.string().min(1),
  reason: z.string().min(1),
  replacementCode: z.string().optional(),
  retiredAt: z.string().optional(),
});
export type RetireSkillInput = z.infer<typeof RetireSkillInputSchema>;

export function retireSkill(
  skill: ManagedSkillDefinition,
  input: RetireSkillInput,
): ManagedSkillDefinition {
  const parsed = RetireSkillInputSchema.parse(input);
  return {
    ...skill,
    status: 'RETIRED',
    retiredAt: parsed.retiredAt ?? new Date().toISOString(),
    retirementReason: parsed.reason,
    replacementCode: parsed.replacementCode?.toUpperCase(),
  };
}

export function isSkillActive(skill: ManagedSkillDefinition): boolean {
  return skill.status === 'ACTIVE';
}
