import type { EvidenceValidationMetrics } from '@hirekiwi/contracts';

export interface EvidenceValidationInput {
  evidenceId: string;
  evidenceType:
    | 'WORK_EXPERIENCE'
    | 'PROJECT'
    | 'CREDENTIAL'
    | 'PASSIVE_SIGNAL'
    | 'ASSESSMENT'
    | 'INTERVIEW'
    | 'ARTIFACT'
    | 'SELF_REPORT';
  methodType: string;
  testedCompetencyCount: number;
  totalConstructCompetencyCount: number;
  raterRatings?: readonly number[];
  sourceAuthorityWeight?: number;
  ageDays: number;
  halfLifeDays?: number;
}

/**
 * Computes inter-rater reliability using Intra-class correlation approximation or Fleiss/Cohen proxy.
 * Returns a value in [0, 1], or `null` when fewer than 2 ratings exist: agreement between
 * raters is undefined for a single rater, so it is reported as unknown rather than perfect.
 */
export function computeInterRaterReliability(ratings: readonly number[]): number | null {
  if (ratings.length < 2) return null;
  const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  const variance =
    ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (ratings.length - 1);

  // Maximum standard deviation for normalized 1-5 ratings is ~2.0
  const maxVar = 4.0;
  const normalizedAgreement = Math.max(0, Math.min(1, 1 - variance / maxVar));
  return Math.round(normalizedAgreement * 1000) / 1000;
}

/**
 * Computes time decay using exponential attenuation: e^(-lambda * t)
 */
export function computeRecencyDecay(ageDays: number, halfLifeDays: number = 365): number {
  if (ageDays <= 0) return 1.0;
  const lambda = Math.LN2 / Math.max(1, halfLifeDays);
  const factor = Math.exp(-lambda * ageDays);
  return Math.round(Math.max(0, Math.min(1, factor)) * 1000) / 1000;
}

export interface CompositeValidityComponents {
  constructCoverage: number | null;
  interRaterReliability: number | null;
  sourceAuthorityWeight: number | null;
  decayFactor: number | null;
}

/**
 * Composite validity: 35% construct coverage + 25% inter-rater + 20% source reliability
 * + 20% recency. Unknown (null) components are dropped and the remaining weights
 * renormalised, so missing data neither inflates nor deflates the score. Returns null
 * when no component is known. Single definition: callers must not reimplement the weights.
 */
export function computeCompositeValidityScore(c: CompositeValidityComponents): number | null {
  const components: Array<[number, number | null]> = [
    [0.35, c.constructCoverage],
    [0.25, c.interRaterReliability],
    [0.2, c.sourceAuthorityWeight],
    [0.2, c.decayFactor],
  ];
  let weightSum = 0;
  let weighted = 0;
  for (const [weight, value] of components) {
    if (value === null) continue;
    weightSum += weight;
    weighted += weight * value;
  }
  return weightSum === 0 ? null : weighted / weightSum;
}

/**
 * Pure psychometric evidence validation.
 * Defensible, deterministic composite validity evaluation.
 */
export function validateEvidenceMetrics(input: EvidenceValidationInput): EvidenceValidationMetrics {
  const constructCoverage =
    input.totalConstructCompetencyCount > 0
      ? Math.max(0, Math.min(1, input.testedCompetencyCount / input.totalConstructCompetencyCount))
      : 0.5;

  // null = unknown (no ratings or a single rater); never substituted with a default.
  const interRaterReliability = input.raterRatings
    ? computeInterRaterReliability(input.raterRatings)
    : null;

  const sourceAuthorityWeight = Math.max(0, Math.min(1, input.sourceAuthorityWeight ?? 0.8));
  const decayFactor = computeRecencyDecay(input.ageDays, input.halfLifeDays ?? 365);

  const compositeValidityScore = computeCompositeValidityScore({
    constructCoverage,
    interRaterReliability,
    sourceAuthorityWeight,
    decayFactor,
  }) as number;

  return {
    evidenceId: input.evidenceId,
    evidenceType: input.evidenceType,
    methodType: input.methodType,
    constructCoverage: Math.round(constructCoverage * 1000) / 1000,
    interRaterReliability:
      interRaterReliability === null ? null : Math.round(interRaterReliability * 1000) / 1000,
    sourceAuthorityWeight: Math.round(sourceAuthorityWeight * 1000) / 1000,
    recencyDays: Math.max(0, Math.floor(input.ageDays)),
    decayFactor,
    compositeValidityScore: Math.round(compositeValidityScore * 1000) / 1000,
  };
}
