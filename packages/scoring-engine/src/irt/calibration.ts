/**
 * IRT 2PL item calibration — joint maximum likelihood estimation (JMLE).
 *
 * `two-parameter.ts` answers "given known item parameters, what is this
 * examinee's ability?" This file answers the other half: "given a pool of
 * examinees' right/wrong answers, what are each item's discrimination and
 * difficulty?" Calibration and ability estimation are solved by alternating
 * between them until both stabilize (classic JMLE).
 *
 * Deliberately pure: given the same response matrix, this always converges
 * to the same parameters. No I/O, no clock, no randomness — same constraint
 * as the rest of this package, for the same reason: a calibration run must
 * be reproducible when someone asks why an item's parameters are what they are.
 *
 * Gradient ascent, not analytic Newton, for the per-item (a, b) update: the
 * 2x2 Hessian for the joint update is easy to get subtly wrong, and gradient
 * ascent on a concave log-likelihood with a bounded step count is simple to
 * verify and just as deterministic. `estimateAbility` (Newton-Raphson, 1D)
 * is reused unchanged for the ability half of each iteration.
 *
 * Owner: Ramansh.
 */

import { estimateAbility, probabilityCorrect, type IrtItemParameters } from './two-parameter.js';

/** Playbook: minimum responses an item needs before its parameters are trusted. */
export const IRT_CALIBRATION_MIN_RESPONSES = 100;

const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_TOLERANCE = 1e-4;
const GRADIENT_STEP = 0.02;
const DISCRIMINATION_BOUNDS = { min: 0.1, max: 4 } as const;
const DIFFICULTY_BOUNDS = { min: -4, max: 4 } as const;

export interface IrtRawResponse {
  readonly examineeId: string;
  readonly itemId: string;
  readonly correct: boolean;
}

export type IrtItemCalibrationStatus = 'CALIBRATED' | 'INSUFFICIENT_DATA' | 'NON_INFORMATIVE';

export interface IrtItemCalibrationResult {
  readonly itemId: string;
  readonly status: IrtItemCalibrationStatus;
  readonly discrimination: number | null;
  readonly difficulty: number | null;
  readonly sampleSize: number;
}

export interface IrtCalibrationRunResult {
  readonly items: readonly IrtItemCalibrationResult[];
  readonly examineeThetas: ReadonlyMap<string, number>;
  readonly iterations: number;
  readonly converged: boolean;
  readonly totalResponses: number;
}

export interface IrtCalibrationOptions {
  readonly minResponsesPerItem?: number;
  readonly maxIterations?: number;
  readonly tolerance?: number;
}

/** Group raw responses by item and by examinee for the alternating steps. */
function indexResponses(responses: readonly IrtRawResponse[]) {
  const byItem = new Map<string, IrtRawResponse[]>();
  const byExaminee = new Map<string, IrtRawResponse[]>();
  for (const response of responses) {
    const itemBucket = byItem.get(response.itemId) ?? [];
    itemBucket.push(response);
    byItem.set(response.itemId, itemBucket);

    const examineeBucket = byExaminee.get(response.examineeId) ?? [];
    examineeBucket.push(response);
    byExaminee.set(response.examineeId, examineeBucket);
  }
  return { byItem, byExaminee };
}

/** True when every response for an item has the same outcome — no information to fit a slope. */
function isNonInformative(responses: readonly IrtRawResponse[]): boolean {
  const first = responses[0]?.correct;
  return responses.every((r) => r.correct === first);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Narrows a map lookup known-safe by construction (already checked with .has()), without `!`. */
function assertDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

/**
 * One gradient-ascent step on item (a, b) given current ability estimates.
 * Returns the updated parameters and the magnitude of the step taken (for
 * convergence checks).
 */
function updateItemParameters(
  current: IrtItemParameters,
  responses: readonly { readonly theta: number; readonly correct: boolean }[],
): { params: IrtItemParameters; delta: number } {
  let gradA = 0;
  let gradB = 0;

  for (const { theta, correct } of responses) {
    const p = probabilityCorrect(theta, current);
    const residual = (correct ? 1 : 0) - p;
    const z = theta - current.difficulty;
    gradA += residual * z;
    gradB += -residual * current.discrimination;
  }

  // Normalize by sample size so the step size doesn't depend on item exposure.
  const n = responses.length;
  const nextA = clamp(
    current.discrimination + (GRADIENT_STEP * gradA) / n,
    DISCRIMINATION_BOUNDS.min,
    DISCRIMINATION_BOUNDS.max,
  );
  const nextB = clamp(
    current.difficulty + (GRADIENT_STEP * gradB) / n,
    DIFFICULTY_BOUNDS.min,
    DIFFICULTY_BOUNDS.max,
  );

  const delta = Math.abs(nextA - current.discrimination) + Math.abs(nextB - current.difficulty);
  return { params: { itemId: current.itemId, discrimination: nextA, difficulty: nextB }, delta };
}

/**
 * Calibrates 2PL item parameters from a response matrix via alternating
 * item-parameter and ability estimation (JMLE).
 *
 * Items with fewer than `minResponsesPerItem` responses, or whose responses
 * are all-correct/all-incorrect, are reported as not calibrated — never
 * fabricated from too little evidence.
 */
export function calibrateItems(
  responses: readonly IrtRawResponse[],
  options: IrtCalibrationOptions = {},
): IrtCalibrationRunResult {
  const minResponsesPerItem = options.minResponsesPerItem ?? IRT_CALIBRATION_MIN_RESPONSES;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;

  const { byItem, byExaminee } = indexResponses(responses);

  const eligibleItemIds: string[] = [];
  const results = new Map<string, IrtItemCalibrationResult>();

  for (const [itemId, itemResponses] of byItem) {
    if (itemResponses.length < minResponsesPerItem) {
      results.set(itemId, {
        itemId,
        status: 'INSUFFICIENT_DATA',
        discrimination: null,
        difficulty: null,
        sampleSize: itemResponses.length,
      });
      continue;
    }
    if (isNonInformative(itemResponses)) {
      results.set(itemId, {
        itemId,
        status: 'NON_INFORMATIVE',
        discrimination: null,
        difficulty: null,
        sampleSize: itemResponses.length,
      });
      continue;
    }
    eligibleItemIds.push(itemId);
  }

  if (eligibleItemIds.length === 0) {
    return {
      items: [...results.values()],
      examineeThetas: new Map(),
      iterations: 0,
      converged: true,
      totalResponses: responses.length,
    };
  }

  let itemParams = new Map<string, IrtItemParameters>(
    eligibleItemIds.map((itemId) => [itemId, { itemId, discrimination: 1, difficulty: 0 }]),
  );
  let thetas = new Map<string, number>([...byExaminee.keys()].map((id) => [id, 0]));

  let iterations = 0;
  let converged = false;

  for (; iterations < maxIterations; iterations++) {
    // Ability step: re-estimate each examinee's theta against current item params,
    // restricted to eligible (calibrated-this-run) items.
    const nextThetas = new Map<string, number>();
    for (const [examineeId, examineeResponses] of byExaminee) {
      const usable = examineeResponses
        .filter((r) => itemParams.has(r.itemId))
        .map((r) => ({
          item: assertDefined(itemParams.get(r.itemId), 'filtered by itemParams.has above'),
          correct: r.correct,
        }));
      const estimate = estimateAbility(usable);
      nextThetas.set(examineeId, estimate ?? thetas.get(examineeId) ?? 0);
    }
    thetas = nextThetas;

    // Item step: one gradient-ascent update per eligible item.
    const nextItemParams = new Map<string, IrtItemParameters>();
    let maxDelta = 0;
    for (const itemId of eligibleItemIds) {
      const current = assertDefined(itemParams.get(itemId), 'itemId drawn from itemParams keys');
      const itemResponses = (byItem.get(itemId) ?? [])
        .filter((r) => thetas.has(r.examineeId))
        .map((r) => ({
          theta: assertDefined(thetas.get(r.examineeId), 'filtered by thetas.has above'),
          correct: r.correct,
        }));
      const { params, delta } = updateItemParameters(current, itemResponses);
      nextItemParams.set(itemId, params);
      maxDelta = Math.max(maxDelta, delta);
    }
    itemParams = nextItemParams;

    if (maxDelta < tolerance) {
      converged = true;
      iterations += 1;
      break;
    }
  }

  for (const itemId of eligibleItemIds) {
    const params = assertDefined(itemParams.get(itemId), 'itemId drawn from itemParams keys');
    results.set(itemId, {
      itemId,
      status: 'CALIBRATED',
      discrimination: params.discrimination,
      difficulty: params.difficulty,
      sampleSize: (byItem.get(itemId) ?? []).length,
    });
  }

  return {
    items: [...results.values()],
    examineeThetas: thetas,
    iterations,
    converged,
    totalResponses: responses.length,
  };
}
