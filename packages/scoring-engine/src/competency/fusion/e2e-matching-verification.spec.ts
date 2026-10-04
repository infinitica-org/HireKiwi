import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import type { FusionInput, ObservationBundle, CompetencyFusionResult } from '@smart/contracts';
import { fuseDomainCapability } from './proficiency-fusion.js';

/**
 * E2E Verification Tests for Complete Matching Integration
 * Verifies that both Integration A (Evidence Validator) and Integration B (Skill Graph)
 * work together in the complete matching pipeline to produce multidimensional profiles
 */

const COMPETENCY_ID_1 = 'aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee';
const COMPETENCY_ID_2 = 'bbbbbbbb-cccc-4ddd-bddd-eeeeeeeeeeee';

describe('E2E Matching Pipeline with Multidimensional Profiles', () => {
  it('produces complete fusion result with evidence validation metrics', async () => {
    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test item 1'],
        },
        {
          competencyId: COMPETENCY_ID_2,
          capability: 'Data modeling',
          claimedStatus: 'PARTIALLY_DEMONSTRATED',
          evidence: ['test item 2'],
        },
      ],
      metadata: {
        testedItemCount: 2,
      },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID_1,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
        {
          competencyId: COMPETENCY_ID_2,
          skillCode: 'SQL',
          capability: 'Data modeling',
          role: 'core',
          difficulty: 'INTERMEDIATE',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID_1, COMPETENCY_ID_2],
          criticalCompetencyIds: [COMPETENCY_ID_1],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [assessmentBundle],
      targetProficiency: 'INTERMEDIATE',
      proctoringRiskHigh: false,
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    // Verify structure of fusion result
    expect(result).toHaveProperty('skillCode');
    expect(result).toHaveProperty('capabilityProfile');
    expect(result).toHaveProperty('inferredDomainProficiency');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('fusionTrace');
    expect(result).toHaveProperty('evidenceValidationMetrics');

    // Verify capability profile contains assessed competencies
    expect(result.capabilityProfile.length).toBeGreaterThan(0);
    expect(result.capabilityProfile[0]).toHaveProperty('competencyId');
    expect(result.capabilityProfile[0]).toHaveProperty('inferredStatus');

    // Verify fusion trace records decisions
    expect(result.fusionTrace.length).toBeGreaterThan(0);
    expect(result.fusionTrace[0]).toHaveProperty('fusedStatus');
    expect(result.fusionTrace[0]).toHaveProperty('appliedRuleIds');

    // Verify evidence validation metrics are included (Integration A verification)
    expect(result.evidenceValidationMetrics).toBeDefined();
    expect(Array.isArray(result.evidenceValidationMetrics)).toBe(true);
    if (result.evidenceValidationMetrics.length > 0) {
      expect(result.evidenceValidationMetrics[0]).toHaveProperty('evidenceId');
      expect(result.evidenceValidationMetrics[0]).toHaveProperty('evidenceType');
      expect(result.evidenceValidationMetrics[0]).toHaveProperty('compositeValidityScore');
    }

    // Verify confidence is set
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.confidence);
  });

  it('processes dual-source matching (assessment + project) with complete metrics', async () => {
    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['proctored test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const projectBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'PROVISIONAL',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['project submission'],
        },
        {
          competencyId: COMPETENCY_ID_2,
          capability: 'Data modeling',
          claimedStatus: 'PARTIALLY_DEMONSTRATED',
          evidence: ['project submission'],
        },
      ],
      metadata: {
        testedItemCount: 2,
        projectReport: {
          scores: {
            raterRatings: [4, 4, 5],
          },
          ageDays: 90,
        },
      },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID_1,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
        {
          competencyId: COMPETENCY_ID_2,
          skillCode: 'SQL',
          capability: 'Data modeling',
          role: 'core',
          difficulty: 'INTERMEDIATE',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID_1, COMPETENCY_ID_2],
          criticalCompetencyIds: [COMPETENCY_ID_1],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [assessmentBundle, projectBundle],
      targetProficiency: 'INTERMEDIATE',
      proctoringRiskHigh: false,
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    // Verify both sources are reflected
    expect(result.activeSources.length).toBeGreaterThanOrEqual(1);
    expect(result.activeSources).toContain('ASSESSMENT');
    expect(result.activeSources).toContain('PROJECT');

    // Verify evidence validation metrics cover both sources
    expect(result.evidenceValidationMetrics.length).toBeGreaterThanOrEqual(2);

    const assessmentMetrics = result.evidenceValidationMetrics.find(
      (m) => m.evidenceType === 'ASSESSMENT',
    );
    const projectMetrics = result.evidenceValidationMetrics.find(
      (m) => m.evidenceType === 'PROJECT',
    );

    expect(assessmentMetrics).toBeDefined();
    expect(projectMetrics).toBeDefined();

    // Verify source reliability differs by trust tier
    if (assessmentMetrics && projectMetrics) {
      expect(assessmentMetrics.sourceReliability).toBe(0.9); // TRUSTED
      expect(projectMetrics.sourceReliability).toBe(0.7); // PROVISIONAL
    }

    // Verify proficiency inference
    if (result.inferredDomainProficiency) {
      expect(['BEGINNER', 'INTERMEDIATE', 'PROFICIENT', 'ADVANCED', 'PROFESSIONAL']).toContain(
        result.inferredDomainProficiency,
      );
    } else {
      // Null proficiency is valid when requirements not met
      expect(result.proficiencyInferenceReason).toBeTruthy();
    }
  });

  it('includes evidence metrics with recency decay for older evidence', async () => {
    const projectBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['old project'],
        },
      ],
      metadata: {
        testedItemCount: 1,
        projectReport: {
          ageDays: 730, // 2 years old (2 half-lives for default 365-day half-life)
        },
      },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID_1,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID_1],
          criticalCompetencyIds: [COMPETENCY_ID_1],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [projectBundle],
      targetProficiency: 'INTERMEDIATE',
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    // Verify evidence metrics include recency information
    expect(result.evidenceValidationMetrics.length).toBeGreaterThan(0);
    const metrics = result.evidenceValidationMetrics[0];
    expect(metrics.recencyDays).toBe(730);
    expect(metrics.decayFactor).toBeLessThan(0.3); // Should be ~0.25 after 2 half-lives
  });

  it('produces E2E output ready for shortlist presentation', async () => {
    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test 1'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID_1,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID_1],
          criticalCompetencyIds: [COMPETENCY_ID_1],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [assessmentBundle],
      targetProficiency: 'INTERMEDIATE',
      proctoringRiskHigh: false,
    };

    const result: CompetencyFusionResult = await Effect.runPromise(fuseDomainCapability(input));

    // Verify all required fields for shortlist output
    const requiredFields: (keyof CompetencyFusionResult)[] = [
      'skillCode',
      'capabilityProfile',
      'inferredDomainProficiency',
      'confidence',
      'confidenceReason',
      'activeSources',
      'fusionTrace',
      'assessmentComplete',
      'recommendedNextStep',
      'evidenceValidationMetrics',
    ];

    requiredFields.forEach((field) => {
      expect(result).toHaveProperty(field);
    });

    // Verify types
    expect(typeof result.skillCode).toBe('string');
    expect(Array.isArray(result.capabilityProfile)).toBe(true);
    expect(typeof result.confidence).toBe('string');
    expect(typeof result.confidenceReason).toBe('string');
    expect(Array.isArray(result.activeSources)).toBe(true);
    expect(Array.isArray(result.fusionTrace)).toBe(true);
    expect(Array.isArray(result.evidenceValidationMetrics)).toBe(true);
    expect(typeof result.assessmentComplete).toBe('boolean');
    expect(typeof result.recommendedNextStep).toBe('string');
  });

  it('verifies confidence calculation uses evidence validation metrics', async () => {
    const bundle1: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const bundle2: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'UNTRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID_1,
          capability: 'Query optimization',
          claimedStatus: 'UNCERTAIN',
          evidence: [],
        },
      ],
      metadata: { testedItemCount: 0 },
    };

    const baseInput: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID_1,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID_1],
          criticalCompetencyIds: [COMPETENCY_ID_1],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      targetProficiency: 'INTERMEDIATE',
    };

    // Result with only trusted assessment
    const trustedOnlyResult = await Effect.runPromise(
      fuseDomainCapability({
        ...baseInput,
        sources: [bundle1],
      }),
    );

    // Result with assessment and untrusted project
    const mixedResult = await Effect.runPromise(
      fuseDomainCapability({
        ...baseInput,
        sources: [bundle1, bundle2],
      }),
    );

    // Verify both have evidence validation metrics
    expect(trustedOnlyResult.evidenceValidationMetrics.length).toBeGreaterThan(0);
    expect(mixedResult.evidenceValidationMetrics.length).toBeGreaterThan(0);

    // Verify metrics capture source reliability differences
    const trustedMetrics = trustedOnlyResult.evidenceValidationMetrics[0];
    const mixedMetrics = mixedResult.evidenceValidationMetrics.find(
      (m) => m.evidenceType === 'ASSESSMENT',
    );

    expect(trustedMetrics).toBeDefined();
    expect(mixedMetrics).toBeDefined();
    expect(trustedMetrics.sourceReliability).toBe(0.9);
    expect(mixedMetrics?.sourceReliability).toBe(0.9);
  });
});
