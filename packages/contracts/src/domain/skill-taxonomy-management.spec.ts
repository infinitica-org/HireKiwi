import { describe, expect, it } from 'vitest';
import {
  bumpTaxonomyVersion,
  createManagedSkill,
  defineSkillCompetency,
  getProficiencyCompetencyBar,
  isSkillActive,
  mapSkillToJobRole,
  mergeSkillAliases,
  registerSkillAlias,
  resolveCanonicalSkillCode,
  retainScoreRubricVersion,
  retireSkill,
  updateManagedSkill,
} from './skill-taxonomy-management.js';
import { DEFAULT_COMPETENCY_BARS, levels } from './skill-levels.js';

describe('SKL-01: Skill and Competency Taxonomy Epic', () => {
  describe('Th6-I297: Create and manage skills', () => {
    it('creates a new active managed skill definition with default values', () => {
      const skill = createManagedSkill({
        code: 'RUST_SYSTEMS_ENGINEERING',
        name: 'Rust Systems Engineering',
        categoryId: 'PROGRAMMING_LANGUAGES',
        categoryName: 'Programming Languages',
      });

      expect(skill.code).toBe('RUST_SYSTEMS_ENGINEERING');
      expect(skill.name).toBe('Rust Systems Engineering');
      expect(skill.status).toBe('ACTIVE');
      expect(skill.version).toBe('1.0.0');
      expect(skill.corroborationEligible).toBe(true);
    });

    it('updates an existing managed skill definition', () => {
      const initial = createManagedSkill({
        code: 'GO_BACKEND',
        name: 'Go Backend',
        categoryId: 'PROGRAMMING_LANGUAGES',
        categoryName: 'Programming Languages',
      });

      const updated = updateManagedSkill(initial, {
        name: 'Go High Performance Services',
        version: '1.1.0',
        aliases: ['Golang', 'GoLang Backend'],
      });

      expect(updated.name).toBe('Go High Performance Services');
      expect(updated.version).toBe('1.1.0');
      expect(updated.aliases).toContain('Golang');
    });
  });

  describe('Th6-I298: Merge duplicate skill names and aliases', () => {
    it('registers an alias mapping to a canonical skill code', () => {
      const aliasRecord = registerSkillAlias('JS', 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT');
      expect(aliasRecord.alias).toBe('JS');
      expect(aliasRecord.canonicalCode).toBe('JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT');
    });

    it('resolves alias or code to the canonical skill code', () => {
      const aliases = [
        registerSkillAlias('Golang', 'GO_GOLANG_FOR_HIGH_PERFORMANCE_SERVICES'),
        registerSkillAlias('JS', 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT'),
      ];

      expect(resolveCanonicalSkillCode('Golang', aliases)).toBe(
        'GO_GOLANG_FOR_HIGH_PERFORMANCE_SERVICES',
      );
      expect(resolveCanonicalSkillCode('js', aliases)).toBe(
        'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
      );
      expect(resolveCanonicalSkillCode('PYTHON', aliases)).toBe('PYTHON');
    });

    it('merges duplicate skill codes into a target canonical skill code', () => {
      const { aliasRecord, retirementInput } = mergeSkillAliases(
        'PYTHON_3',
        'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        'Duplicate skill consolidation',
      );

      expect(aliasRecord.alias).toBe('PYTHON_3');
      expect(aliasRecord.canonicalCode).toBe('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
      expect(retirementInput.code).toBe('PYTHON_3');
      expect(retirementInput.replacementCode).toBe('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
    });
  });

  describe('Th6-I299: Map skills to job roles', () => {
    it('maps a skill requirement to a job role or track', () => {
      const mapping = mapSkillToJobRole({
        roleId: 'TECH_FULLSTACK',
        skillCode: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
        minimumProficiency: 'PROFICIENT',
        importance: 'REQUIRED',
        version: '2026.1',
      });

      expect(mapping.roleId).toBe('TECH_FULLSTACK');
      expect(mapping.skillCode).toBe('JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT');
      expect(mapping.minimumProficiency).toBe('PROFICIENT');
      expect(mapping.importance).toBe('REQUIRED');
    });
  });

  describe('Th6-I300: Define competencies under a skill', () => {
    it('defines a competency entry under a skill definition', () => {
      const competency = defineSkillCompetency({
        competencyId: 'comp-python-async-01',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        capability: 'Asynchronous Programming with asyncio',
        observableBehaviours: [
          'Writes non-blocking coroutines',
          'Handles async event loops and concurrency limits',
        ],
        difficulty: 'PROFICIENT',
        assessmentCriteria: ['Demonstrates correct event loop usage in timed task'],
        prerequisites: ['comp-python-core-01'],
        role: 'critical',
      });

      expect(competency.competencyId).toBe('comp-python-async-01');
      expect(competency.skillCode).toBe('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
      expect(competency.difficulty).toBe('PROFICIENT');
      expect(competency.role).toBe('critical');
    });
  });

  describe('Th6-I301: Define Beginner-to-Pro proficiency criteria', () => {
    it('defines criteria across all 5 proficiency levels', () => {
      expect(getProficiencyCompetencyBar('BEGINNER')).toBe(
        'Conceptual understanding; supervised tasks',
      );
      expect(getProficiencyCompetencyBar('INTERMEDIATE')).toBe(
        'Independent, bounded-scope execution',
      );
      expect(getProficiencyCompetencyBar('PROFICIENT')).toBe(
        'Consistent independent delivery; typical production scenarios',
      );
      expect(getProficiencyCompetencyBar('ADVANCED')).toBe(
        'Owns a component end-to-end; trade-off reasoning',
      );
      expect(getProficiencyCompetencyBar('PROFESSIONAL')).toBe(
        'Sets standards / architecture / strategy',
      );
    });
  });

  describe('Th6-I302: Version skill and competency definitions', () => {
    it('tracks taxonomy version bumps and change audit logs', () => {
      const record = bumpTaxonomyVersion({
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        newVersion: '1.2.0',
        changes: ['Added async IO competency bar', 'Updated L3 question distribution'],
        author: 'Vedika Gowda',
      });

      expect(record.skillCode).toBe('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
      expect(record.version).toBe('1.2.0');
      expect(record.changes).toHaveLength(2);
      expect(record.author).toBe('Vedika Gowda');
    });
  });

  describe('Th6-I303: Retain the rubric version used for historical scores', () => {
    it('snapshots the rubric version and threshold configuration alongside historical score', () => {
      const historicalRecord = retainScoreRubricVersion({
        scoreId: 'score-val-101',
        candidateId: 'cand-456',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        score: 82.5,
        levelAchieved: 'PROFICIENT',
        rubricVersion: 'skill@1-v1.0.0',
        competencyBars: DEFAULT_COMPETENCY_BARS,
        levelThresholds: levels(DEFAULT_COMPETENCY_BARS),
      });

      expect(historicalRecord.scoreId).toBe('score-val-101');
      expect(historicalRecord.levelAchieved).toBe('PROFICIENT');
      expect(historicalRecord.rubricSnapshot.rubricVersion).toBe('skill@1-v1.0.0');
      expect(historicalRecord.rubricSnapshot.competencyBars.PROFICIENT).toBe(
        'Consistent independent delivery; typical production scenarios',
      );
    });
  });

  describe('Th6-I304: Retire outdated skills without deleting history', () => {
    it('marks a skill as RETIRED while retaining historical record and metadata', () => {
      const skill = createManagedSkill({
        code: 'OLD_LEGACY_SKILL',
        name: 'Legacy Tech',
        categoryId: 'PROGRAMMING_LANGUAGES',
        categoryName: 'Programming Languages',
      });

      expect(isSkillActive(skill)).toBe(true);

      const retired = retireSkill(skill, {
        code: 'OLD_LEGACY_SKILL',
        reason: 'Superceded by modern framework',
        replacementCode: 'MODERN_FRAMEWORK',
      });

      expect(retired.status).toBe('RETIRED');
      expect(isSkillActive(retired)).toBe(false);
      expect(retired.retirementReason).toBe('Superceded by modern framework');
      expect(retired.replacementCode).toBe('MODERN_FRAMEWORK');
      expect(retired.code).toBe('OLD_LEGACY_SKILL');
    });
  });
});
