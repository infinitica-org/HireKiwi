import type {
  AssessmentPerformanceEntry,
  AssessmentPerformanceVector,
  ProficiencyLevel,
  SignalWeightModel,
  TrustWeightedReadoutEntry,
  VectorizedSignal,
  VectorizedSignalEntry,
} from '@hirekiwi/contracts';
import { roundTo } from '../statistics.js';
import { resolveSignalWeight } from './default-weights.js';
import { DEFAULT_CORROBORATION_POLICY, type CorroborationPolicy } from './policy.js';

export interface FuseSignalsInput {
  /** One signal, several (one per source), or none — all are fused together per dimension. */
  readonly passiveX: VectorizedSignal | readonly VectorizedSignal[] | null;
  readonly assessmentY: AssessmentPerformanceVector | null;
  readonly weights: SignalWeightModel;
  readonly policy?: CorroborationPolicy;
}

export interface FuseSignalsResult {
  readonly readouts: readonly TrustWeightedReadoutEntry[];
  readonly contradictionDimensions: readonly string[];
}

function dimensionKey(ref: { dimensionKey: string; taxonomyVersion: string }): string {
  return `${ref.taxonomyVersion}:${ref.dimensionKey}`;
}

function aggregatePassiveByDimension(
  entries: readonly VectorizedSignalEntry[],
  weights: SignalWeightModel,
  policy: CorroborationPolicy = DEFAULT_CORROBORATION_POLICY,
): Map<
  string,
  {
    passiveScore: number;
    confidence: number;
    dimension: VectorizedSignalEntry['dimension'];
    internalPassiveConflict: boolean;
  }
> {
  const maxPassiveDiscrepancy = policy.maxPassiveDiscrepancy ?? 0.4;
  const penaltyMultiplier = policy.conflictConfidencePenaltyMultiplier ?? 0.6;

  // Group entries by dimension to check pairwise agreement across independent passive sources
  const grouped = new Map<string, { entry: VectorizedSignalEntry; weighted: number }[]>();

  for (const entry of entries) {
    const key = dimensionKey(entry.dimension);
    const weight = resolveSignalWeight(weights, entry.sourceId, entry.dimension.dimensionKey);
    const weighted = entry.score * weight;
    const list = grouped.get(key) ?? [];
    list.push({ entry, weighted });
    grouped.set(key, list);
  }

  const map = new Map<
    string,
    {
      passiveScore: number;
      confidence: number;
      dimension: VectorizedSignalEntry['dimension'];
      internalPassiveConflict: boolean;
    }
  >();

  for (const [key, items] of grouped.entries()) {
    if (items.length === 0) continue;

    // Detect internal disagreement between independent passive sources
    let internalPassiveConflict = false;
    if (items.length >= 2) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const itemA = items[i];
          const itemB = items[j];
          if (!itemA || !itemB) continue;
          // If both sources carry at least moderate confidence and their scores diverge strongly
          if (
            itemA.entry.confidence >= 0.2 &&
            itemB.entry.confidence >= 0.2 &&
            Math.abs(itemA.weighted - itemB.weighted) > maxPassiveDiscrepancy
          ) {
            internalPassiveConflict = true;
            break;
          }
        }
        if (internalPassiveConflict) break;
      }
    }

    // Resolution rule:
    // Multi-source consensus & clustering:
    // If 3+ sources are present and a cluster of 2+ independent sources agree (delta <= discrepancy),
    // the agreeing cluster represents genuine Campbell & Fiske corroboration and outvotes an isolated outlier.
    let selectedPassiveScore = 0;
    let selectedConfidence = 0;
    const first = items[0];
    if (!first) continue;

    if (internalPassiveConflict) {
      // Find agreement clusters
      type SourceCluster = { items: typeof items; totalReliability: number; avgScore: number };
      const clusters: SourceCluster[] = [];

      for (let i = 0; i < items.length; i++) {
        const base = items[i];
        if (!base) continue;
        const clusterItems = [base];
        let totalRel =
          base.entry.confidence *
          resolveSignalWeight(weights, base.entry.sourceId, base.entry.dimension.dimensionKey);

        for (let j = 0; j < items.length; j++) {
          if (i === j) continue;
          const other = items[j];
          if (!other) continue;
          if (Math.abs(base.weighted - other.weighted) <= maxPassiveDiscrepancy) {
            clusterItems.push(other);
            totalRel +=
              other.entry.confidence *
              resolveSignalWeight(
                weights,
                other.entry.sourceId,
                other.entry.dimension.dimensionKey,
              );
          }
        }

        const avgScore =
          clusterItems.reduce((acc, it) => acc + it.weighted, 0) / clusterItems.length;
        clusters.push({ items: clusterItems, totalReliability: totalRel, avgScore });
      }

      // Sort clusters: multi-source agreement (count >= 2) first, then total reliability
      clusters.sort((a, b) => {
        if (a.items.length >= 2 && b.items.length < 2) return -1;
        if (b.items.length >= 2 && a.items.length < 2) return 1;
        return b.totalReliability - a.totalReliability;
      });

      const bestCluster = clusters[0];
      if (!bestCluster) continue;
      selectedPassiveScore = bestCluster.avgScore;

      // Max confidence within winning cluster, dampened by versioned policy penalty
      const clusterMaxConf = Math.max(...bestCluster.items.map((it) => it.entry.confidence));
      selectedConfidence = roundTo(clusterMaxConf * penaltyMultiplier, 2);
    } else {
      // Concordant sources: select strongest demonstrated weighted signal with highest confidence
      let maxWeighted = 0;
      let maxConfidence = 0;

      for (const item of items) {
        if (item.weighted > maxWeighted) {
          maxWeighted = item.weighted;
        }
        if (item.entry.confidence > maxConfidence) {
          maxConfidence = item.entry.confidence;
        }
      }
      selectedPassiveScore = maxWeighted;
      selectedConfidence = maxConfidence;
    }

    map.set(key, {
      passiveScore: Math.min(1, selectedPassiveScore),
      confidence: selectedConfidence,
      dimension: first.entry.dimension,
      internalPassiveConflict,
    });
  }

  return map;
}

function assessmentByDimension(
  entries: readonly AssessmentPerformanceEntry[],
): Map<string, AssessmentPerformanceEntry> {
  const map = new Map<string, AssessmentPerformanceEntry>();
  for (const entry of entries) {
    map.set(dimensionKey(entry.dimension), entry);
  }
  return map;
}

function computeAgreement(passiveNorm: number, assessmentNorm: number): number {
  return roundTo((1 - Math.abs(passiveNorm - assessmentNorm)) * 100, 2);
}

function passiveOnlyScore(passiveNorm: number, confidence: number): number {
  return roundTo(passiveNorm * confidence * 100, 2);
}

function shouldFlagContradiction(
  passed: boolean,
  passiveNorm: number,
  confidence: number,
  proficiency: ProficiencyLevel | undefined,
  policy: CorroborationPolicy,
): boolean {
  if (!passed || confidence < policy.minPassiveConfidence) return false;
  const level = proficiency ?? 'BEGINNER';
  const floor = policy.contradictionFloor[level];
  return passiveNorm < floor;
}

/**
 * Fuses passive (X) and assessment (Y) signals into trust-weighted readouts.
 * Never mutates verification status — callers persist readouts and optional review flags.
 */
export function fuseSignals(input: FuseSignalsInput): FuseSignalsResult {
  const policy = input.policy ?? DEFAULT_CORROBORATION_POLICY;
  const passiveSignals = input.passiveX
    ? Array.isArray(input.passiveX)
      ? input.passiveX
      : [input.passiveX as VectorizedSignal]
    : [];
  const passiveMap = aggregatePassiveByDimension(
    passiveSignals.flatMap((signal) => signal.entries),
    input.weights,
    policy,
  );
  const assessmentMap = input.assessmentY
    ? assessmentByDimension(input.assessmentY.entries)
    : new Map();

  const allKeys = new Set([...passiveMap.keys(), ...assessmentMap.keys()]);
  const readouts: TrustWeightedReadoutEntry[] = [];
  const contradictionDimensions: string[] = [];

  for (const key of allKeys) {
    const passive = passiveMap.get(key);
    const assessment = assessmentMap.get(key);
    const dimension = passive?.dimension ?? assessment?.dimension;
    if (!dimension) continue;

    const passiveNorm = passive?.passiveScore ?? null;
    const passiveConfidence = passive?.confidence ?? 0;
    const assessmentScore = assessment?.scorePercent ?? null;
    const assessmentNorm = assessmentScore !== null ? assessmentScore / 100 : null;

    let corroborationScore: number;
    let confidence: number;
    // An internal conflict between independent passive sources also flags contradiction!
    let contradictionFlag = passive?.internalPassiveConflict ?? false;

    if (assessmentNorm !== null && passiveNorm !== null) {
      corroborationScore = computeAgreement(passiveNorm, assessmentNorm);
      confidence = roundTo(Math.min(1, passiveConfidence + 0.5), 2);
      if (!contradictionFlag) {
        contradictionFlag = shouldFlagContradiction(
          assessment.passed,
          passiveNorm,
          passiveConfidence,
          assessment.proficiencyLevel,
          policy,
        );
      }
    } else if (passiveNorm !== null) {
      corroborationScore = passiveOnlyScore(passiveNorm, passiveConfidence);
      confidence = passiveConfidence;
    } else if (assessmentScore !== null) {
      corroborationScore = assessmentScore;
      confidence = 0.9;
    } else {
      continue;
    }

    if (contradictionFlag) {
      contradictionDimensions.push(dimension.dimensionKey);
    }

    readouts.push({
      dimension,
      passiveScore: passiveNorm,
      assessmentScore: assessmentScore,
      corroborationScore,
      confidence,
      contradictionFlag,
    });
  }

  return { readouts, contradictionDimensions };
}
