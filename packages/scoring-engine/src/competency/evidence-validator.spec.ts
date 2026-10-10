import { describe, expect, it } from 'vitest';
import {
  computeCompositeValidityScore,
  computeInterRaterReliability,
  computeRecencyDecay,
  validateEvidenceMetrics,
} from './evidence-validator.js';
import { calculatePersonJobFit } from './person-job-fit.js';

describe('Evidence Validation Psychometric Tests', () => {
  it('computes inter-rater reliability with low variance leading to high agreement', () => {
    const perfectAgreement = computeInterRaterReliability([4, 4, 4]);
    expect(perfectAgreement).toBe(1.0);

    const moderateVariance = computeInterRaterReliability([3, 4, 5]);
    expect(moderateVariance).toBeGreaterThan(0.7);
    expect(moderateVariance).toBeLessThan(1.0);

    const highDisagreement = computeInterRaterReliability([1, 5]);
    expect(highDisagreement).toBeLessThan(0.3);
  });

  it('reports reliability as unknown (null), not perfect, for fewer than 2 ratings', () => {
    expect(computeInterRaterReliability([])).toBeNull();
    expect(computeInterRaterReliability([5])).toBeNull();
  });

  it('computes exponential recency decay correctly across half-lives', () => {
    const fresh = computeRecencyDecay(0, 365);
    expect(fresh).toBe(1.0);

    const halfLife = computeRecencyDecay(365, 365);
    expect(halfLife).toBeCloseTo(0.5, 2);

    const twoHalfLives = computeRecencyDecay(730, 365);
    expect(twoHalfLives).toBeCloseTo(0.25, 2);
  });

  it('evaluates comprehensive evidence validation metrics deterministically', () => {
    const metrics = validateEvidenceMetrics({
      evidenceId: 'ev-123',
      evidenceType: 'ASSESSMENT',
      methodType: 'PROCTORED_CODING_SIMULATION',
      testedCompetencyCount: 4,
      totalConstructCompetencyCount: 5,
      raterRatings: [4, 4, 5],
      sourceAuthorityWeight: 0.9,
      ageDays: 180,
      halfLifeDays: 365,
    });

    expect(metrics.constructCoverage).toBe(0.8);
    expect(metrics.interRaterReliability).toBeGreaterThan(0.9);
    expect(metrics.sourceAuthorityWeight).toBe(0.9);
    expect(metrics.decayFactor).toBeGreaterThan(0.7);
    expect(metrics.compositeValidityScore).toBeGreaterThan(0.7);
    expect(metrics.compositeValidityScore).toBeLessThanOrEqual(1.0);
  });

  const base = {
    evidenceId: 'ev-unknown',
    evidenceType: 'PROJECT' as const,
    methodType: 'PROJECT_WORK',
    testedCompetencyCount: 4,
    totalConstructCompetencyCount: 5,
    sourceAuthorityWeight: 0.9,
    ageDays: 0,
  };

  it('reports null reliability and renormalises the composite when ratings are absent', () => {
    const metrics = validateEvidenceMetrics(base);
    expect(metrics.interRaterReliability).toBeNull();
    // (0.35*0.8 + 0.2*0.9 + 0.2*1) / 0.75
    expect(metrics.compositeValidityScore).toBeCloseTo(0.88, 3);
  });

  it('treats a single rater the same as absent ratings', () => {
    const single = validateEvidenceMetrics({ ...base, raterRatings: [5] });
    expect(single.interRaterReliability).toBeNull();
    expect(single.compositeValidityScore).toBe(
      validateEvidenceMetrics(base).compositeValidityScore,
    );
  });

  it('does not let unknown reliability outscore known high reliability', () => {
    const known = validateEvidenceMetrics({ ...base, raterRatings: [4, 4, 4] });
    expect(known.interRaterReliability).toBe(1);
    expect(known.compositeValidityScore).toBeGreaterThanOrEqual(
      validateEvidenceMetrics(base).compositeValidityScore,
    );
  });
});

describe('computeCompositeValidityScore', () => {
  it('uses the 0.35/0.25/0.2/0.2 weights when every component is known', () => {
    expect(
      computeCompositeValidityScore({
        constructCoverage: 1,
        interRaterReliability: 0,
        sourceAuthorityWeight: 1,
        decayFactor: 1,
      }),
    ).toBeCloseTo(0.75, 6);
  });

  it('returns null when no component is known', () => {
    expect(
      computeCompositeValidityScore({
        constructCoverage: null,
        interRaterReliability: null,
        sourceAuthorityWeight: null,
        decayFactor: null,
      }),
    ).toBeNull();
  });
});

describe('Person-Job Fit Scoring Engine Tests', () => {
  it('correctly calculates importance-weighted fit and gate thresholds', () => {
    const result = calculatePersonJobFit({
      requiredSkills: [
        { skillCode: 'REACT_CORE', requiredRank: 3, importance: 'critical' },
        { skillCode: 'TYPESCRIPT', requiredRank: 3, importance: 'must_have' },
        { skillCode: 'DOCKER', requiredRank: 2, importance: 'nice_to_have' },
      ],
      candidateSkills: [
        { skillCode: 'REACT_CORE', demonstratedRank: 4, confidence: 'HIGH' },
        { skillCode: 'TYPESCRIPT', demonstratedRank: 3, confidence: 'HIGH' },
        { skillCode: 'DOCKER', demonstratedRank: 1, confidence: 'MEDIUM' },
      ],
    });

    expect(result.mustHavesMet).toBe(true);
    expect(result.coverageOfMustHaves).toBe(1.0);
    expect(result.matchStrategy).toBe('EXPLOITATION');
    expect(result.overallFitScore).toBeGreaterThan(0.8);
    expect(result.skillFitBreakdown).toHaveLength(3);
  });

  it('penalizes candidates heavily when critical / must-have gates are failed', () => {
    const result = calculatePersonJobFit({
      requiredSkills: [
        { skillCode: 'REACT_CORE', requiredRank: 4, importance: 'critical' },
        { skillCode: 'SYSTEM_DESIGN', requiredRank: 4, importance: 'must_have' },
      ],
      candidateSkills: [
        // Completely misses system design
        { skillCode: 'REACT_CORE', demonstratedRank: 4, confidence: 'HIGH' },
      ],
    });

    expect(result.mustHavesMet).toBe(false);
    expect(result.coverageOfMustHaves).toBe(0.5);
    // Severe penalty applied: overall score multiplied by 0.5
    expect(result.overallFitScore).toBeLessThan(0.4);
  });

  it('supports exploration match strategy with rationale', () => {
    const result = calculatePersonJobFit({
      requiredSkills: [{ skillCode: 'REACT_CORE', requiredRank: 3, importance: 'must_have' }],
      candidateSkills: [{ skillCode: 'REACT_CORE', demonstratedRank: 2, confidence: 'MEDIUM' }],
      isExplorationCandidate: true,
      explorationRationale:
        'Candidate shows exceptional transfer potential from Angular and high learning rate.',
    });

    expect(result.matchStrategy).toBe('EXPLORATION');
    expect(result.explorationRationale).toContain('exceptional transfer potential');
  });

  it('accepts versioned PersonJobFitParameters to calibrate thresholds and multipliers without code changes', () => {
    const customParams = {
      version: 'pjf-v2-recalibrated-experiment',
      importanceWeights: {
        critical: 3.0,
        must_have: 2.0,
        nice_to_have: 0.5,
      },
      mustHaveGatingThreshold: 0.6, // Relaxed gate from 80% to 60%
      mustHaveWeightInOverall: 0.5,
      accuracyWeightInOverall: 0.5,
      gatingMissPenaltyMultiplier: 0.2, // Harsher penalty if missed
    };

    const result = calculatePersonJobFit(
      {
        requiredSkills: [
          { skillCode: 'REACT_CORE', requiredRank: 3, importance: 'critical' },
          { skillCode: 'TYPESCRIPT', requiredRank: 3, importance: 'must_have' },
        ],
        candidateSkills: [
          // 1 out of 2 satisfied = 50%, below 60%
          { skillCode: 'REACT_CORE', demonstratedRank: 3, confidence: 'HIGH' },
        ],
      },
      customParams,
    );

    expect(result.mustHavesMet).toBe(false);
    expect(result.overallFitScore).toBeLessThan(0.2); // severely penalized by 0.2x multiplier
  });

  it('discounts accuracy credit for LOW-confidence claims versus the same rank at HIGH confidence', () => {
    const high = calculatePersonJobFit({
      requiredSkills: [{ skillCode: 'REACT_CORE', requiredRank: 3, importance: 'must_have' }],
      candidateSkills: [{ skillCode: 'REACT_CORE', demonstratedRank: 3, confidence: 'HIGH' }],
    });
    const low = calculatePersonJobFit({
      requiredSkills: [{ skillCode: 'REACT_CORE', requiredRank: 3, importance: 'must_have' }],
      candidateSkills: [{ skillCode: 'REACT_CORE', demonstratedRank: 3, confidence: 'LOW' }],
    });

    // Same demonstrated rank, same gating outcome (LOW confidence doesn't flip a gate on its
    // own) — but LOW-confidence evidence must score strictly lower on accuracy than HIGH.
    expect(low.mustHavesMet).toBe(true);
    expect(low.weightedProficiencyAccuracy).toBeLessThan(high.weightedProficiencyAccuracy);
    expect(low.overallFitScore).toBeLessThan(high.overallFitScore);
  });

  it('treats an unresolved corroboration contradiction as not-met for must-have gating, even at full rank', () => {
    const contested = calculatePersonJobFit({
      requiredSkills: [{ skillCode: 'REACT_CORE', requiredRank: 3, importance: 'must_have' }],
      candidateSkills: [
        { skillCode: 'REACT_CORE', demonstratedRank: 5, confidence: 'HIGH', hasConflict: true },
      ],
    });

    expect(contested.mustHavesMet).toBe(false);
    expect(contested.coverageOfMustHaves).toBe(0);
    expect(contested.skillFitBreakdown[0]?.isMet).toBe(false);
    expect(contested.skillFitBreakdown[0]?.sourceDiscrepancy).toBe(true);
    // Still earns some accuracy credit — the claim isn't treated as entirely absent, just disputed.
    expect(contested.weightedProficiencyAccuracy).toBeGreaterThan(0);
  });
});
