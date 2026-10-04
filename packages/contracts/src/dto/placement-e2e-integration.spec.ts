import { describe, expect, it } from 'vitest';
import {
  CandidateMatchDtoSchema,
  EvidenceQualityMetricsSchema,
  TransferSkillRowSchema,
  CapabilityFitRowSchema,
} from './placement.dto';

/**
 * Integration tests for E2E matching pipeline DTOs
 * Validates that evidence metrics and transfer skills flow correctly through API contracts
 */

describe('Evidence Quality Metrics DTO', () => {
  it('validates psychometric components', () => {
    const metrics = {
      constructCoverage: 0.8,
      interRaterReliability: 0.92,
      sourceReliability: 0.9,
      recencyDays: 30,
      decayFactor: 0.98,
      compositeValidityScore: 0.895,
    };

    const result = EvidenceQualityMetricsSchema.parse(metrics);
    expect(result.compositeValidityScore).toBe(0.895);
  });

  it('accepts valid ranges (0-1)', () => {
    const metrics = {
      constructCoverage: 0.85,
      interRaterReliability: 0.9,
      sourceReliability: 0.9,
      recencyDays: 15,
      decayFactor: 0.99,
      compositeValidityScore: 0.9,
    };

    const result = EvidenceQualityMetricsSchema.parse(metrics);
    expect(result.compositeValidityScore).toBe(0.9);
  });
});

describe('Transfer Skill Row DTO', () => {
  it('validates with all three reasons', () => {
    const reasons = ['SAME_CATEGORY', 'CAPABILITY_OVERLAP', 'GRAPH_BASED'] as const;

    reasons.forEach((reason) => {
      const skill = {
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        skillName: 'Python',
        reason,
      };
      const result = TransferSkillRowSchema.parse(skill);
      expect(result.reason).toBe(reason);
    });
  });

  it('includes rank and transfer explanation', () => {
    const skill = {
      skillCode: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
      skillName: 'JavaScript / TypeScript',
      reason: 'GRAPH_BASED' as const,
      rank: 4,
      transferExplanation: 'Shared async patterns',
    };

    const result = TransferSkillRowSchema.parse(skill);
    expect(result.rank).toBe(4);
    expect(result.transferExplanation).toBe('Shared async patterns');
  });
});

describe('Capability Fit Row with Evidence Source', () => {
  it('includes evidence source label', () => {
    const row = {
      competencyId: '550e8400-e29b-41d4-a716-446655440000',
      capability: 'API Design',
      skillCode: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
      hitScore: 0.85,
      evidenceSource: 'ASSESSMENT' as const,
      evidenceSourceLabel: 'Assessment',
    };

    const result = CapabilityFitRowSchema.parse(row);
    expect(result.evidenceSourceLabel).toBe('Assessment');
  });

  it('accepts valid evidence source types', () => {
    const sources = [
      { source: 'ASSESSMENT' as const, label: 'Assessment' },
      { source: 'INFERRED' as const, label: 'Inferred' },
      { source: 'NONE' as const, label: 'None' },
    ];

    sources.forEach(({ source, label }) => {
      const row = {
        competencyId: '550e8400-e29b-41d4-a716-446655440001',
        capability: 'API Design',
        skillCode: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
        hitScore: 0.75,
        evidenceSource: source,
        evidenceSourceLabel: label,
      };
      const result = CapabilityFitRowSchema.parse(row);
      expect(result.evidenceSourceLabel).toBe(label);
    });
  });
});

describe('CandidateMatchDto with E2E Data', () => {
  it('validates with evidence metrics and transfer skills', () => {
    const candidate = {
      studentId: '550e8400-e29b-41d4-a716-446655440000',
      studentName: 'Alice Johnson',
      trackCode: 'TECH_FULLSTACK',
      certificateId: null,
      highestLevelCleared: 3,
      headlineTier: 'SILVER' as const,
      similarityScore: 0.85,
      matchScore: 0.92,
      method: 'SKILL_CAPABILITY' as const,
      explanation: {
        thresholdsMet: [],
        thresholdsMissed: [],
        strongCompetencies: ['API Design'],
        gapCompetencies: [],
        why: 'Strong match',
        skillFit: [],
        capabilityFit: [],
        transferSkills: [
          {
            skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
            skillName: 'Python',
            reason: 'SAME_CATEGORY' as const,
            rank: 4,
          },
          {
            skillCode: 'JAVA_ENTERPRISE_APPLICATION_DEVELOPMENT',
            skillName: 'Java',
            reason: 'GRAPH_BASED' as const,
            rank: 3,
          },
        ],
        evidenceQualityMetrics: [
          {
            constructCoverage: 0.85,
            interRaterReliability: 0.94,
            sourceReliability: 0.9,
            recencyDays: 15,
            decayFactor: 0.99,
            compositeValidityScore: 0.906,
          },
        ],
      },
    };

    const result = CandidateMatchDtoSchema.parse(candidate);
    expect(result.matchScore).toBe(0.92);
    expect(result.explanation.transferSkills).toHaveLength(2);
    expect(result.explanation.evidenceQualityMetrics).toHaveLength(1);
    expect(result.explanation.evidenceQualityMetrics?.[0].compositeValidityScore).toBe(0.906);
  });

  it('handles optional evidence metrics', () => {
    const candidate = {
      studentId: '550e8400-e29b-41d4-a716-446655440000',
      studentName: 'Bob Smith',
      trackCode: 'TECH_FULLSTACK',
      certificateId: null,
      highestLevelCleared: 2,
      headlineTier: 'BRONZE' as const,
      similarityScore: 0.65,
      matchScore: 0.72,
      method: 'RULES' as const,
      explanation: {
        thresholdsMet: [],
        thresholdsMissed: [],
        strongCompetencies: [],
        gapCompetencies: [],
        why: 'Partial match',
      },
    };

    const result = CandidateMatchDtoSchema.parse(candidate);
    expect(result.explanation.evidenceQualityMetrics).toBeUndefined();
  });
});
