/**
 * IRT recalibration — versions a calibration run against the previous one.
 *
 * Mirrors `corroboration/qlix-recalibration.ts`'s shape deliberately: a
 * minimum-sample gate per item, a frozen/published distinction, and a
 * reason string attached to every outcome so "why didn't this item's
 * parameters change" is always answerable without re-running anything.
 *
 * Owner: Ramansh.
 */

import { createHash } from 'node:crypto';
import {
  calibrateItems,
  IRT_CALIBRATION_MIN_RESPONSES,
  type IrtCalibrationOptions,
  type IrtItemCalibrationResult,
  type IrtRawResponse,
} from './calibration.js';

export interface IrtItemParameterRecord {
  readonly itemId: string;
  readonly discrimination: number;
  readonly difficulty: number;
  readonly sampleSize: number;
  readonly modelVersion: string;
}

export interface IrtRecalibrationItemOutcome {
  readonly itemId: string;
  readonly published: boolean;
  readonly previous: IrtItemParameterRecord | null;
  readonly next: IrtItemParameterRecord | null;
  readonly reason: string;
}

export interface IrtRecalibrationReport {
  readonly levelId: string;
  readonly modelVersion: string;
  readonly trainedAt: string;
  readonly totalResponses: number;
  readonly iterations: number;
  readonly converged: boolean;
  readonly items: readonly IrtRecalibrationItemOutcome[];
  readonly checksum: string;
}

function checksumFor(levelId: string, items: readonly IrtItemCalibrationResult[]): string {
  const payload = JSON.stringify({
    levelId,
    items: items
      .filter((i) => i.status === 'CALIBRATED')
      .map((i) => ({ itemId: i.itemId, a: i.discrimination, b: i.difficulty }))
      .sort((x, y) => x.itemId.localeCompare(y.itemId)),
  });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Runs calibration for one level's item pool and reconciles the result
 * against whatever parameters are currently published for those items.
 *
 * An item only gets a published update when this run actually calibrated it
 * (enough responses, informative pattern). An item that drops below the
 * threshold on a later run (e.g. retired, low exposure) keeps its last
 * published parameters rather than being blanked out — recalibration should
 * only improve or hold, never silently erase a working item.
 */
export function recalibrateLevel(
  levelId: string,
  responses: readonly IrtRawResponse[],
  previousParameters: ReadonlyMap<string, IrtItemParameterRecord>,
  options: IrtCalibrationOptions & { modelVersion?: string; trainedAt?: string } = {},
): IrtRecalibrationReport {
  const minResponsesPerItem = options.minResponsesPerItem ?? IRT_CALIBRATION_MIN_RESPONSES;
  const run = calibrateItems(responses, { ...options, minResponsesPerItem });
  const modelVersion = options.modelVersion ?? 'irt-2pl-jmle-v1';
  const trainedAt = options.trainedAt ?? new Date().toISOString();

  const outcomes: IrtRecalibrationItemOutcome[] = run.items.map((item) => {
    const previous = previousParameters.get(item.itemId) ?? null;

    if (item.status !== 'CALIBRATED' || item.discrimination == null || item.difficulty == null) {
      return {
        itemId: item.itemId,
        published: false,
        previous,
        next: previous,
        reason:
          item.status === 'INSUFFICIENT_DATA'
            ? `Frozen: need ${minResponsesPerItem} responses (have ${item.sampleSize}).`
            : `Frozen: all responses identical (n=${item.sampleSize}) — no slope to fit.`,
      };
    }

    const next: IrtItemParameterRecord = {
      itemId: item.itemId,
      discrimination: item.discrimination,
      difficulty: item.difficulty,
      sampleSize: item.sampleSize,
      modelVersion,
    };

    return {
      itemId: item.itemId,
      published: true,
      previous,
      next,
      reason: `Published from n=${item.sampleSize} responses.`,
    };
  });

  return {
    levelId,
    modelVersion,
    trainedAt,
    totalResponses: run.totalResponses,
    iterations: run.iterations,
    converged: run.converged,
    items: outcomes,
    checksum: checksumFor(levelId, run.items),
  };
}
