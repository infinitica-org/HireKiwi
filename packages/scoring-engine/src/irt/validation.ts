/**
 * IRT shadow validation — does the calibrated model agree with v1 scoring?
 *
 * This never decides anything by itself. It produces a report; a human (or a
 * promotion job gated on this report's thresholds) decides whether a track's
 * calibration is trustworthy enough to leave shadow mode. That decision is
 * deliberately out of this file, same reasoning as `qlix-recalibration.ts`:
 * pure statistics in, a judged recommendation out, never an automatic switch.
 *
 * Owner: Ramansh.
 */

import { pearson } from '../statistics.js';

/** Playbook: minimum paired (theta, v1 score) observations before a correlation is trusted. */
export const IRT_VALIDATION_MIN_PAIRS = 30;

/** Below this, shadow IRT is not considered ready to be proposed for promotion. */
export const IRT_VALIDATION_CORRELATION_THRESHOLD = 0.6;

export interface IrtValidationPair {
  readonly attemptId: string;
  /** Shadow IRT ability estimate for this attempt. */
  readonly theta: number;
  /** The v1 weighted-item score for the same attempt, on its native scale (e.g. 0–100). */
  readonly v1Score: number;
}

export interface IrtValidationReport {
  readonly sampleSize: number;
  readonly correlation: number | null;
  readonly meetsMinimumSample: boolean;
  readonly meetsCorrelationThreshold: boolean;
  /** True only when both gates pass — a recommendation, never an instruction to switch anything live. */
  readonly readyToProposePromotion: boolean;
  readonly reason: string;
}

/**
 * Compares shadow IRT ability estimates against the live v1 score for the
 * same attempts. A strong correlation means IRT is measuring the same thing
 * v1 measures (a necessary, not sufficient, condition to trust it) — it does
 * not by itself mean IRT is *better*, only that it isn't measuring something
 * unrelated.
 */
export function validateIrtAgainstV1(
  pairs: readonly IrtValidationPair[],
  options: { minPairs?: number; correlationThreshold?: number } = {},
): IrtValidationReport {
  const minPairs = options.minPairs ?? IRT_VALIDATION_MIN_PAIRS;
  const correlationThreshold = options.correlationThreshold ?? IRT_VALIDATION_CORRELATION_THRESHOLD;

  const sampleSize = pairs.length;
  const meetsMinimumSample = sampleSize >= minPairs;

  if (!meetsMinimumSample) {
    return {
      sampleSize,
      correlation: null,
      meetsMinimumSample: false,
      meetsCorrelationThreshold: false,
      readyToProposePromotion: false,
      reason: `Need ${minPairs} paired attempts to validate, have ${sampleSize}.`,
    };
  }

  const correlation = pearson(
    pairs.map((p) => p.theta),
    pairs.map((p) => p.v1Score),
  );
  const meetsCorrelationThreshold = correlation >= correlationThreshold;

  return {
    sampleSize,
    correlation,
    meetsMinimumSample,
    meetsCorrelationThreshold,
    readyToProposePromotion: meetsCorrelationThreshold,
    reason: meetsCorrelationThreshold
      ? `Correlation ${correlation.toFixed(3)} meets threshold ${correlationThreshold} on n=${sampleSize}.`
      : `Correlation ${correlation.toFixed(3)} below threshold ${correlationThreshold} on n=${sampleSize} — stays in shadow.`,
  };
}
