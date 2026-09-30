import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import type { FusionInput, ObservationBundle } from '@smart/contracts';
import { fuseDomainCapability } from './proficiency-fusion.js';

/**
 * Comprehensive tests for Integration A: Evidence Validator in Proficiency Fusion
 * Tests that validateEvidenceMetrics() is called during fuseDomainCapability()
 * and that evidence validation metrics flow through to the matching output
 */

const COMPETENCY_ID = 'aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee';

describe('Evidence Validator Integration in Proficiency Fusion', () => {
  it('computes evidence validation metrics for assessment bundles', async () => {
    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['proctored test item 1'],
        },
      ],
      metadata: {
        testedItemCount: 1,
      },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
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

    expect(result.evidenceValidationMetrics).toBeDefined();
    expect(result.evidenceValidationMetrics.length).toBeGreaterThan(0);

    const assessmentMetrics = result.evidenceValidationMetrics[0];
    expect(assessmentMetrics.evidenceId).toBe('assessment');
    expect(assessmentMetrics.evidenceType).toBe('ASSESSMENT');
    expect(assessmentMetrics.constructCoverage).toBeGreaterThanOrEqual(0);
    expect(assessmentMetrics.constructCoverage).toBeLessThanOrEqual(1);
    expect(assessmentMetrics.compositeValidityScore).toBeGreaterThanOrEqual(0);
    expect(assessmentMetrics.compositeValidityScore).toBeLessThanOrEqual(1);
  });

  it('computes evidence validation metrics for project bundles with trust tier', async () => {
    const projectBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'PROVISIONAL',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['project submission 1'],
        },
      ],
      metadata: {
        testedItemCount: 1,
        projectReport: {
          scores: {
            raterRatings: [4, 4, 5],
          },
          ageDays: 180,
        },
      },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [projectBundle],
      targetProficiency: 'INTERMEDIATE',
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    expect(result.evidenceValidationMetrics.length).toBeGreaterThan(0);
    const projectMetrics = result.evidenceValidationMetrics[0];
    expect(projectMetrics.evidenceType).toBe('PROJECT');
    expect(projectMetrics.interRaterReliability).toBeGreaterThan(0.7);
    expect(projectMetrics.sourceReliability).toBe(0.7); // PROVISIONAL = 0.7
    expect(projectMetrics.recencyDays).toBe(180);
  });

  it('includes metrics for both assessment and project bundles when both available', async () => {
    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const projectBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['project'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [assessmentBundle, projectBundle],
      targetProficiency: 'INTERMEDIATE',
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    expect(result.evidenceValidationMetrics.length).toBe(2);
    expect(result.evidenceValidationMetrics[0].evidenceType).toBe('ASSESSMENT');
    expect(result.evidenceValidationMetrics[1].evidenceType).toBe('PROJECT');
  });

  it('excludes unavailable bundles from evidence validation metrics', async () => {
    const unavailableBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: false,
      trustTier: 'UNAVAILABLE',
      observations: [],
    };

    const assessmentBundle: ObservationBundle = {
      sourceId: 'ASSESSMENT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [unavailableBundle, assessmentBundle],
      targetProficiency: 'INTERMEDIATE',
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    expect(result.evidenceValidationMetrics.length).toBe(1);
    expect(result.evidenceValidationMetrics[0].evidenceType).toBe('ASSESSMENT');
  });

  it('returns empty metrics array when no bundles available', async () => {
    const input: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [],
      targetProficiency: 'INTERMEDIATE',
    };

    const result = await Effect.runPromise(fuseDomainCapability(input));

    expect(result.evidenceValidationMetrics).toBeDefined();
    expect(result.evidenceValidationMetrics.length).toBe(0);
  });

  it('reflects source authority weight from trust tier in validation metrics', async () => {
    const trustedBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'TRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const untrustedBundle: ObservationBundle = {
      sourceId: 'PROJECT',
      available: true,
      trustTier: 'UNTRUSTED',
      observations: [
        {
          competencyId: COMPETENCY_ID,
          capability: 'Query optimization',
          claimedStatus: 'DEMONSTRATED',
          evidence: ['test'],
        },
      ],
      metadata: { testedItemCount: 1 },
    };

    const trustedInput: FusionInput = {
      competencyModel: [
        {
          competencyId: COMPETENCY_ID,
          skillCode: 'SQL',
          capability: 'Query optimization',
          role: 'critical',
          difficulty: 'ADVANCED',
        },
      ],
      proficiencyRequirements: [
        {
          level: 'INTERMEDIATE',
          requiredCompetencyIds: [COMPETENCY_ID],
          criticalCompetencyIds: [COMPETENCY_ID],
          realWorldApplicationRequired: false,
          substantialApplicationRequired: false,
          interviewRequired: false,
        },
      ],
      sources: [trustedBundle],
      targetProficiency: 'INTERMEDIATE',
    };

    const untrustedInput: FusionInput = {
      ...trustedInput,
      sources: [untrustedBundle],
    };

    const trustedResult = await Effect.runPromise(fuseDomainCapability(trustedInput));
    const untrustedResult = await Effect.runPromise(fuseDomainCapability(untrustedInput));

    expect(trustedResult.evidenceValidationMetrics[0].sourceReliability).toBe(0.9);
    expect(untrustedResult.evidenceValidationMetrics[0].sourceReliability).toBe(0.5);
  });
});
