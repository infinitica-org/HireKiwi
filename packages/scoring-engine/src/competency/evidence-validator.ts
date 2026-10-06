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
 * Returns a value in [0, 1].
 */
export function computeInterRaterReliability(ratings: readonly number[]): number {
  if (ratings.length < 2) return 1.0;
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

/**
 * Pure psychometric evidence validation.
 * Defensible, deterministic composite validity evaluation.
 */
export function validateEvidenceMetrics(input: EvidenceValidationInput): EvidenceValidationMetrics {
  const constructCoverage =
    input.totalConstructCompetencyCount > 0
      ? Math.max(0, Math.min(1, input.testedCompetencyCount / input.totalConstructCompetencyCount))
      : 0.5;

  const interRaterReliability = input.raterRatings
    ? computeInterRaterReliability(input.raterRatings)
    : 0.85;

  const sourceReliability = Math.max(0, Math.min(1, input.sourceAuthorityWeight ?? 0.8));
  const decayFactor = computeRecencyDecay(input.ageDays, input.halfLifeDays ?? 365);

  // Composite validity score: 35% construct coverage + 25% inter-rater + 20% source reliability + 20% recency
  const compositeValidityScore =
    0.35 * constructCoverage +
    0.25 * interRaterReliability +
    0.2 * sourceReliability +
    0.2 * decayFactor;

  return {
    evidenceId: input.evidenceId,
    evidenceType: input.evidenceType,
    methodType: input.methodType,
    constructCoverage: Math.round(constructCoverage * 1000) / 1000,
    interRaterReliability: Math.round(interRaterReliability * 1000) / 1000,
    sourceReliability: Math.round(sourceReliability * 1000) / 1000,
    recencyDays: Math.max(0, Math.floor(input.ageDays)),
    decayFactor,
    compositeValidityScore: Math.round(compositeValidityScore * 1000) / 1000,
  };
}
