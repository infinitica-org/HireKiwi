import { describe, expect, it } from 'vitest';
import {
  IRT_VALIDATION_MIN_PAIRS,
  validateIrtAgainstV1,
  type IrtValidationPair,
} from './validation.js';

function makePairs(n: number, correlated: boolean): IrtValidationPair[] {
  return Array.from({ length: n }, (_, i) => {
    const theta = (i % 10) - 5;
    const v1Score = correlated ? theta * 10 + 50 : (i * 37) % 97;
    return { attemptId: `a${i}`, theta, v1Score };
  });
}

describe('validateIrtAgainstV1', () => {
  it('refuses to validate below the minimum sample size', () => {
    const report = validateIrtAgainstV1(makePairs(5, true));
    expect(report.meetsMinimumSample).toBe(false);
    expect(report.readyToProposePromotion).toBe(false);
    expect(report.correlation).toBeNull();
  });

  it('recommends promotion when correlation is strong and sample is sufficient', () => {
    const report = validateIrtAgainstV1(makePairs(IRT_VALIDATION_MIN_PAIRS + 10, true));
    expect(report.meetsMinimumSample).toBe(true);
    expect(report.correlation).toBeGreaterThan(0.6);
    expect(report.readyToProposePromotion).toBe(true);
  });

  it('does not recommend promotion when the model does not track v1 scoring', () => {
    const report = validateIrtAgainstV1(makePairs(IRT_VALIDATION_MIN_PAIRS + 10, false));
    expect(report.meetsMinimumSample).toBe(true);
    expect(report.readyToProposePromotion).toBe(false);
  });
});
