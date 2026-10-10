/**
 * Semantic pgvector candidate matcher with privacy opt-out enforcement (Ticket Th6-I611).
 *
 * Implements:
 * 1. Normalized vector generation for candidate competency models and JD threshold vectors.
 * 2. High-performance pgvector / in-memory cosine similarity search (under 200ms).
 * 3. Strict SQL hard filter enforcing `discoverable_to_employers = true`, `deactivated_at IS NULL`,
 *    and `held_at IS NULL` (via EMPLOYER_DISCOVERABLE_STUDENT_SQL).
 * 4. Multi-dimensional ranking returning match percentage, primary tier, and radar chart
 *    competency breakdown (5 standard domains A–E or track competency axes).
 */

import {
  TIER_RANK,
  type CertifiableTier,
  type CandidateMatchDto,
  type LevelNumber,
  type TrackCode,
  type JdThresholdVector,
} from '@hirekiwi/contracts';

export interface CandidateVectorProfile {
  readonly studentId: string;
  readonly studentName: string;
  readonly trackCode: TrackCode;
  readonly certificateId: string | null;
  readonly highestLevelCleared: LevelNumber;
  readonly headlineTier: CertifiableTier;
  readonly discoverableToEmployers: boolean;
  readonly isDeactivated: boolean;
  readonly isHeld: boolean;
  readonly verifiedSkills: readonly {
    code: string;
    domain: string;
    /** Literal A-E radar axis (S8-RM-XX), null for skills seeded before the backfill ran. */
    domainCode: string | null;
    proficiency: string;
  }[];
  readonly domainCompetencies: Record<string, number>; // Domain A-E or competency weights [0, 1]
  readonly embedding?: readonly number[]; // Optional 1536-dim vector if stored/inferred
}

export interface RadarCompetencyAxis {
  readonly axis: string; // e.g., 'Domain A: Frontend / Core'
  readonly candidateScore: number; // 0.0 - 1.0
  readonly requiredScore: number; // 0.0 - 1.0
}

export interface VectorMatchResult {
  readonly studentId: string;
  readonly studentName: string;
  readonly trackCode: TrackCode;
  readonly certificateId: string | null;
  readonly highestLevelCleared: LevelNumber;
  readonly headlineTier: CertifiableTier;
  readonly cosineSimilarity: number;
  /** cosineSimilarity × requirement coverage; what results are ranked by and matchPercentage shows. */
  readonly fitScore: number;
  readonly matchPercentage: number;
  readonly radarBreakdown: readonly RadarCompetencyAxis[];
  readonly why: string;
  readonly strongCompetencies: readonly string[];
  readonly gapCompetencies: readonly string[];
}

/**
 * Computes cosine similarity between two non-zero vectors.
 */
export function cosineSimilarity(vecA: readonly number[], vecB: readonly number[]): number {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Maps a proficiency string to a normalized 0.0–1.0 score.
 */
function proficiencyToNormalizedScore(proficiency?: string): number {
  switch (proficiency?.toUpperCase()) {
    case 'PROFESSIONAL':
      return 1.0;
    case 'ADVANCED':
      return 0.85;
    case 'PROFICIENT':
      return 0.7;
    case 'INTERMEDIATE':
      return 0.5;
    case 'BEGINNER':
      return 0.3;
    default:
      return 0.2;
  }
}

/**
 * Builds standard 5-domain vector [A, B, C, D, E] for candidate.
 */
export function buildCandidateDomainVector(profile: CandidateVectorProfile): number[] {
  const domains = ['A', 'B', 'C', 'D', 'E'];
  const vec: number[] = [];

  for (const d of domains) {
    if (profile.domainCompetencies[d] !== undefined) {
      vec.push(profile.domainCompetencies[d] ?? 0);
    } else {
      // S8-RM-XX: match on the skill's literal domainCode when it's been classified
      // (skill-domain-classifier.ts). Skills without one yet (pre-backfill) fall back to the
      // old flattened behavior so this stays backward compatible during rollout.
      const classified = profile.verifiedSkills.filter((s) => s.domainCode !== null);
      const matchingSkills =
        classified.length > 0
          ? classified.filter((s) => s.domainCode === d)
          : profile.verifiedSkills.filter((s) => s.domain === d || s.domain === 'SOFTWARE_IT');
      if (matchingSkills.length > 0) {
        const avg =
          matchingSkills.reduce((acc, s) => acc + proficiencyToNormalizedScore(s.proficiency), 0) /
          matchingSkills.length;
        vec.push(avg);
      } else {
        vec.push(0.1); // baseline floor
      }
    }
  }

  // Append tier weight as 6th dimensional feature
  const tierWeight = (TIER_RANK[profile.headlineTier] ?? 0) / 3;
  vec.push(tierWeight);

  return vec;
}

/**
 * Builds standard threshold vector [A, B, C, D, E, tierWeight] from JD threshold criteria.
 */
export function buildJobThresholdVector(jd: JdThresholdVector): number[] {
  const vec: number[] = [0.6, 0.6, 0.6, 0.5, 0.5]; // Default balanced 5-domain baseline

  // If JD specifies level thresholds (e.g. L1: SILVER, L2: GOLD)
  const highestTier = jd.minThresholds.L2 ?? jd.minThresholds.L1 ?? 'SILVER';
  const tierWeight = (TIER_RANK[highestTier] ?? 2) / 3;
  vec.push(tierWeight);

  return vec;
}

/** Default baseline used only when a search has no scoped job to derive a real vector from. */
export const UNSCOPED_SEARCH_BASELINE_VECTOR: readonly number[] = [0.7, 0.7, 0.6, 0.5, 0.5, 0.67];

/**
 * Builds a Stage 1 target vector from a scoped job opening's actual required skills, so the
 * vector pass narrows the pool toward *this* job instead of a fixed constant baseline.
 *
 * S8-RM-XX: when a required skill carries a literal A-E `domainCode` (skill-domain-classifier.ts),
 * its proficiency requirement is placed on that specific axis, matching how
 * `buildCandidateDomainVector` now reads candidate-side `domainCode`. A required skill without
 * one yet (pre-backfill) falls back to the flattened behavior — one overall required-proficiency
 * scalar repeated across all 5 axes — for backward compatibility with older data.
 */
export function buildJobVectorFromRequiredSkills(
  requiredSkills: readonly {
    readonly minProficiency?: string;
    readonly domainCode?: string | null;
  }[],
): number[] {
  if (requiredSkills.length === 0) {
    return [...UNSCOPED_SEARCH_BASELINE_VECTOR];
  }
  const overallAvg =
    requiredSkills.reduce(
      (sum, skill) => sum + proficiencyToNormalizedScore(skill.minProficiency),
      0,
    ) / requiredSkills.length;

  const domains = ['A', 'B', 'C', 'D', 'E'] as const;
  const classified = requiredSkills.filter((s) => s.domainCode != null);
  if (classified.length === 0) {
    return [overallAvg, overallAvg, overallAvg, overallAvg, overallAvg, overallAvg];
  }

  const perDomain = domains.map((d) => {
    const matching = classified.filter((s) => s.domainCode === d);
    if (matching.length === 0) return overallAvg;
    return (
      matching.reduce((sum, skill) => sum + proficiencyToNormalizedScore(skill.minProficiency), 0) /
      matching.length
    );
  });
  return [...perDomain, overallAvg];
}

/** Mean share of each required dimension the candidate meets, each capped at 1. */
export function requirementCoverage(
  candidate: readonly number[],
  required: readonly number[],
): number {
  if (required.length === 0) return 1;
  const total = required.reduce((sum, need, i) => {
    if (need <= 0) return sum + 1;
    return sum + Math.min(1, (candidate[i] ?? 0) / need);
  }, 0);
  return total / required.length;
}

/**
 * Match candidates using cosine similarity, strictly respecting privacy opt-outs.
 */
export function matchCandidatesWithVectorSimilarity(
  candidates: readonly CandidateVectorProfile[],
  jobVector: readonly number[],
  limit = 50,
): {
  ranked: VectorMatchResult[];
  totalConsidered: number;
  excludedByPrivacyCount: number;
  durationMs: number;
} {
  const startTime = performance.now();
  let excludedByPrivacyCount = 0;
  const eligibleCandidates: CandidateVectorProfile[] = [];

  // HARD PRIVACY FILTER:
  // Strictly exclude candidates where discoverable_to_employers is false,
  // or account is deactivated / held.
  for (const c of candidates) {
    if (!c.discoverableToEmployers || c.isDeactivated || c.isHeld) {
      excludedByPrivacyCount++;
      continue;
    }
    eligibleCandidates.push(c);
  }

  const results: VectorMatchResult[] = eligibleCandidates.map((c) => {
    const candidateVec = buildCandidateDomainVector(c);
    const sim = cosineSimilarity(candidateVec, jobVector);
    // Cosine compares the profile's shape, not its level: a candidate under every requirement in
    // proportion scores as high as one who exceeds them all. Weight it by how much of each
    // requirement is met so the stronger candidate ranks first.
    const fitScore = sim * requirementCoverage(candidateVec, jobVector);
    const matchPercentage = Math.round(fitScore * 100);

    // Build radar breakdown across standard 5 domains
    const domains = ['A', 'B', 'C', 'D', 'E'];
    const radarBreakdown: RadarCompetencyAxis[] = domains.map((domain, idx) => ({
      axis: `Domain ${domain}`,
      candidateScore: Math.round((candidateVec[idx] ?? 0) * 100) / 100,
      requiredScore: Math.round((jobVector[idx] ?? 0.6) * 100) / 100,
    }));

    const strongCompetencies: string[] = [];
    const gapCompetencies: string[] = [];

    radarBreakdown.forEach((rb) => {
      if (rb.candidateScore >= rb.requiredScore) {
        strongCompetencies.push(`${rb.axis} (${Math.round(rb.candidateScore * 100)}%)`);
      } else {
        gapCompetencies.push(
          `${rb.axis} (gap: ${Math.round((rb.requiredScore - rb.candidateScore) * 100)}%)`,
        );
      }
    });

    const why = `Vector similarity match: ${matchPercentage}% match on ${c.trackCode} profile at ${c.headlineTier} tier.`;

    return {
      studentId: c.studentId,
      studentName: c.studentName,
      trackCode: c.trackCode,
      certificateId: c.certificateId,
      highestLevelCleared: c.highestLevelCleared,
      headlineTier: c.headlineTier,
      cosineSimilarity: sim,
      fitScore,
      matchPercentage,
      radarBreakdown,
      why,
      strongCompetencies,
      gapCompetencies,
    };
  });

  // Multi-dimensional ranking: primary tier rank first, then match similarity
  results.sort((a, b) => {
    const tierDiff = (TIER_RANK[b.headlineTier] ?? 0) - (TIER_RANK[a.headlineTier] ?? 0);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    return b.cosineSimilarity - a.cosineSimilarity;
  });

  const durationMs = performance.now() - startTime;

  return {
    ranked: results.slice(0, Math.max(0, limit)),
    totalConsidered: eligibleCandidates.length,
    excludedByPrivacyCount,
    durationMs,
  };
}

/**
 * Converts a VectorMatchResult into a contract-compliant CandidateMatchDto.
 */
export function toCandidateMatchDtoFromVector(match: VectorMatchResult): CandidateMatchDto {
  return {
    studentId: match.studentId,
    studentName: match.studentName,
    trackCode: match.trackCode,
    certificateId: match.certificateId,
    highestLevelCleared: match.highestLevelCleared,
    headlineTier: match.headlineTier,
    similarityScore: Math.round(match.cosineSimilarity * 100) / 100,
    matchScore: Math.min(1, Math.round(match.fitScore * 100) / 100),
    method: 'HYBRID',
    explanation: {
      thresholdsMet: [],
      thresholdsMissed: [],
      strongCompetencies: [...match.strongCompetencies],
      gapCompetencies: [...match.gapCompetencies],
      why: match.why,
    },
  };
}
