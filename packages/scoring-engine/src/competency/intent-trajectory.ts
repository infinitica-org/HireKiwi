/**
 * Student intent trajectory — derived purely from existing progression data.
 *
 * Scope decision: no self-reported goal field, no new student-facing surface.
 * This infers direction and pace from what a student has already done —
 * level completions over time, per track — the same way a human reviewer
 * would read a transcript: not just "what level are they at" but "how fast
 * are they getting there, and is that pace holding, speeding up, or stalling."
 *
 * Pure and deterministic, same constraint as the rest of this package: no
 * I/O, no clock reads. Callers pass "now" in explicitly so a trajectory
 * computed today is reproducible when re-run later against the same data.
 *
 * Owner: Ramansh.
 */

import { TIER_RANK, type Tier } from '@hirekiwi/contracts';
import { mean } from '../statistics.js';

export interface LevelCompletionRecord {
  readonly levelNumber: number;
  readonly tierAwarded: Tier;
  readonly issuedAt: Date;
}

export type TrajectoryDirection = 'ACCELERATING' | 'STEADY' | 'SLOWING' | 'STALLED';
export type TrajectoryConfidence = 'LOW' | 'MODERATE' | 'HIGH';

export interface StudentTrajectory {
  readonly trackCode: string;
  readonly completionsConsidered: number;
  readonly highestLevelCleared: number;
  /** Average days between consecutive level completions. Null when fewer than 2 completions. */
  readonly averageDaysBetweenLevels: number | null;
  /** Positive = tiers improving over time, negative = declining, 0 = flat. Null when fewer than 2 completions. */
  readonly tierTrendSlope: number | null;
  readonly direction: TrajectoryDirection;
  readonly confidence: TrajectoryConfidence;
  /** Days since the most recent level completion, as of the `now` passed in. */
  readonly daysSinceLastCompletion: number;
  readonly reasons: readonly string[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Narrows an index access known-safe by construction, without a `!` assertion. */
function assertDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

/** Simple linear regression slope of tier rank against completion order. */
function tierTrendSlope(completions: readonly LevelCompletionRecord[]): number {
  const xs = completions.map((_, i) => i);
  const ys = completions.map((c) => TIER_RANK[c.tierAwarded] ?? 0);
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - mx;
    numerator += dx * ((ys[i] ?? 0) - my);
    denominator += dx * dx;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

function classifyDirection(
  averageGapDays: number | null,
  recentGapDays: number | null,
  daysSinceLastCompletion: number,
  slope: number | null,
): TrajectoryDirection {
  if (averageGapDays == null || recentGapDays == null) return 'STEADY';
  // Stalled: time elapsed since the last completion already exceeds what their own pace predicts —
  // this must be checked against "now", not just the last historical gap, or a student who simply
  // stopped would still read as whatever their last two completions looked like.
  if (daysSinceLastCompletion > averageGapDays * 2.5) return 'STALLED';
  if (recentGapDays < averageGapDays * 0.75 && (slope ?? 0) >= 0) return 'ACCELERATING';
  if (recentGapDays > averageGapDays * 1.5) return 'SLOWING';
  return 'STEADY';
}

/**
 * Builds a trajectory signal for one student in one track from their level
 * completion history. `now` must be supplied by the caller (no Date.now()
 * inside a pure function), so the same history always yields the same
 * trajectory when re-evaluated against the same reference time.
 */
export function buildStudentTrajectory(
  trackCode: string,
  completions: readonly LevelCompletionRecord[],
  now: Date,
): StudentTrajectory {
  const sorted = [...completions].sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime());

  if (sorted.length === 0) {
    return {
      trackCode,
      completionsConsidered: 0,
      highestLevelCleared: 0,
      averageDaysBetweenLevels: null,
      tierTrendSlope: null,
      direction: 'STEADY',
      confidence: 'LOW',
      daysSinceLastCompletion: Number.POSITIVE_INFINITY,
      reasons: ['No level completions on record for this track.'],
    };
  }

  const highestLevelCleared = Math.max(...sorted.map((c) => c.levelNumber));
  const lastCompletion = assertDefined(sorted[sorted.length - 1], 'sorted is non-empty here');
  const daysSinceLastCompletion = (now.getTime() - lastCompletion.issuedAt.getTime()) / MS_PER_DAY;

  if (sorted.length < 2) {
    return {
      trackCode,
      completionsConsidered: sorted.length,
      highestLevelCleared,
      averageDaysBetweenLevels: null,
      tierTrendSlope: null,
      direction: 'STEADY',
      confidence: 'LOW',
      daysSinceLastCompletion,
      reasons: ['Only one completion on record — not enough history to infer pace or trend.'],
    };
  }

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = assertDefined(sorted[i - 1], 'index within loop bounds');
    const curr = assertDefined(sorted[i], 'index within loop bounds');
    gaps.push((curr.issuedAt.getTime() - prev.issuedAt.getTime()) / MS_PER_DAY);
  }
  const averageDaysBetweenLevels = mean(gaps);
  const recentGapDays = gaps[gaps.length - 1] ?? null;
  const slope = tierTrendSlope(sorted);

  const direction = classifyDirection(
    averageDaysBetweenLevels,
    recentGapDays,
    daysSinceLastCompletion,
    slope,
  );
  const confidence: TrajectoryConfidence =
    sorted.length >= 5 ? 'HIGH' : sorted.length >= 3 ? 'MODERATE' : 'LOW';

  const reasons: string[] = [
    `${sorted.length} completions, ~${averageDaysBetweenLevels.toFixed(1)} days apart on average.`,
  ];
  if (direction === 'STALLED') {
    reasons.push(
      `Last completion was ${daysSinceLastCompletion.toFixed(0)} days ago — well past their own average pace.`,
    );
  } else if (direction === 'ACCELERATING') {
    reasons.push(
      'Recent gap between levels is shorter than their average, and tier trend is flat or rising.',
    );
  } else if (direction === 'SLOWING') {
    reasons.push('Recent gap between levels is longer than their average.');
  }
  if (slope !== 0) {
    reasons.push(`Tier trend is ${slope > 0 ? 'improving' : 'declining'} across completions.`);
  }

  return {
    trackCode,
    completionsConsidered: sorted.length,
    highestLevelCleared,
    averageDaysBetweenLevels,
    tierTrendSlope: slope,
    direction,
    confidence,
    daysSinceLastCompletion,
    reasons,
  };
}
