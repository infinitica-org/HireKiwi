import { describe, expect, it } from 'vitest';
import { resolveVerificationDecision } from './verification-settlement.js';

describe('resolveVerificationDecision', () => {
  it('returns VERIFIED when assessment is strong and evidence verified', () => {
    const result = resolveVerificationDecision({
      assessmentComplete: true,
      confidence: 'HIGH',
      requiresEvidence: true,
      hasVerifiedEvidence: true,
      hasProvisionalEvidence: false,
      interviewRequired: true,
      interviewPassed: true,
      reconciliationReviewRequired: false,
    });
    expect(result?.decision).toBe('VERIFIED');
    expect(result?.confidence).toBeGreaterThan(0.8);
  });

  it('returns PROVISIONAL when only provisional evidence exists', () => {
    const result = resolveVerificationDecision({
      assessmentComplete: true,
      confidence: 'MEDIUM',
      requiresEvidence: true,
      hasVerifiedEvidence: false,
      hasProvisionalEvidence: true,
      interviewRequired: true,
      interviewPassed: true,
      reconciliationReviewRequired: false,
    });
    expect(result?.decision).toBe('PROVISIONAL');
    expect(result?.reasons[0]).toContain('provisional');
  });

  it('returns PROVISIONAL for low-confidence assessment-only verification', () => {
    const result = resolveVerificationDecision({
      assessmentComplete: true,
      confidence: 'LOW',
      requiresEvidence: false,
      hasVerifiedEvidence: false,
      hasProvisionalEvidence: false,
      interviewRequired: false,
      reconciliationReviewRequired: false,
    });
    expect(result?.decision).toBe('PROVISIONAL');
    expect(result?.confidence).toBeLessThanOrEqual(0.6);
  });

  it('returns PROVISIONAL when competency coverage is incomplete, even with strong evidence', () => {
    const result = resolveVerificationDecision({
      assessmentComplete: true,
      confidence: 'HIGH',
      requiresEvidence: true,
      hasVerifiedEvidence: true,
      hasProvisionalEvidence: false,
      interviewRequired: false,
      reconciliationReviewRequired: false,
      fullCompetencyCoverage: false,
      coverageRatio: 0.5,
    });
    expect(result?.decision).toBe('PROVISIONAL');
    expect(
      result?.reasons.some((reason) => reason.includes('Competency coverage incomplete')),
    ).toBe(true);
  });

  it('returns VERIFIED when coverage is full and nothing else is flagged', () => {
    const result = resolveVerificationDecision({
      assessmentComplete: true,
      confidence: 'HIGH',
      requiresEvidence: false,
      hasVerifiedEvidence: false,
      hasProvisionalEvidence: false,
      interviewRequired: false,
      reconciliationReviewRequired: false,
      fullCompetencyCoverage: true,
      coverageRatio: 1,
    });
    expect(result?.decision).toBe('VERIFIED');
  });

  it('returns null when interview is still required', () => {
    expect(
      resolveVerificationDecision({
        assessmentComplete: true,
        confidence: 'HIGH',
        requiresEvidence: false,
        hasVerifiedEvidence: false,
        hasProvisionalEvidence: false,
        interviewRequired: true,
        interviewPassed: false,
        reconciliationReviewRequired: false,
      }),
    ).toBeNull();
  });
});
