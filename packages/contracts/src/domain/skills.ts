/**
 * Skill taxonomy barrel — level types plus skill@1 catalog registry.
 */

export type {
  ProficiencyLevel,
  QuestionType,
  QuestionCounts,
  LevelThreshold,
} from './skill-levels.js';
export {
  LEVEL_QUESTION_TOTALS,
  LEVEL_VERIFICATION_METHOD,
  DEFAULT_COMPETENCY_BARS,
  levels,
  assertSkillQuestionCounts,
} from './skill-levels.js';

export type {
  SkillCategoryId,
  SkillTaxonomyDomain,
  SkillTaxonomyTier,
  SkillDefinition,
  SkillCategoryGroup,
  SkillTierGroup,
} from './skill-taxonomy.js';
export {
  SKILL_TAXONOMY_VERSION,
  SKILL_TAXONOMY_DOMAINS,
  SKILL_TAXONOMY_TIERS,
  SKILL_TAXONOMY_TIER_DEFINITIONS,
  SKILL_CATEGORY_IDS,
  SKILL_CATEGORIES,
  SKILL_DEFINITIONS,
  SKILL_CODES,
  SKILL_CODE_SET,
  groupSkillsByCategory,
  groupSkillsByTier,
  getSkillsByTier,
  getSkillDefinition,
} from './skill-taxonomy.js';
