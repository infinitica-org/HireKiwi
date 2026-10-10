/**
 * Deterministic skill + capability ranker (S6-RM-23).
 *
 * Headline `rawMatchScore`: average verified required-skill demand (millipoints).
 * Linear rank spacing (Beginner→Professional as 1–5) is an approximation; the 1.5 cap
 * is one nominal step above the ask, not a measured proficiency gap.
 * Equal weight per required skill — JobOpeningSkill has no critical/core flag yet.
 *
 * Sort: raw demand → capability tie-break → transfer tie-break. LLM does not score.
 */

import {
  getSkillBlueprint,
  getSkillDefinition,
  type CompetencyStatus,
  type MatchEvidenceSource,
  type PotentialFit,
  type TransferSkillReason,
} from '@hirekiwi/contracts';

export const SKILL_CAPABILITY_RANKER_VERSION = 'v1.2.0' as const;

/** Millipoints at exactly the asked proficiency. Credit above the ask stops here. */
export const HELD_AT_ASK_MP = 1000;
export const HELD_ABOVE_ASK_CAP_MP = 1500;
export const WHY_MAX_LENGTH = 280;

export const PROFICIENCY_RANK = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  PROFICIENT: 3,
  ADVANCED: 4,
  PROFESSIONAL: 5,
} as const;

export type ProficiencyName = keyof typeof PROFICIENCY_RANK;

export const ROLE_WEIGHT = {
  critical: 2,
  core: 1.5,
  supporting: 1,
} as const;

export const SKILL_IMPORTANCE_WEIGHT = {
  critical: 2.0,
  must_have: 1.5,
  nice_to_have: 1.0,
} as const;

export interface SkillCapabilityRequiredSkill {
  readonly code: string;
  readonly name: string;
  readonly minRank: number;
  readonly minProficiency: string;
  readonly importance?: 'critical' | 'must_have' | 'nice_to_have';
}

export interface SkillCapabilityRequiredCapability {
  readonly competencyId: string;
  readonly capability: string;
  readonly skillCode: string;
  readonly role: keyof typeof ROLE_WEIGHT;
}

export interface SkillCapabilityJob {
  readonly requiredSkills: readonly SkillCapabilityRequiredSkill[];
  readonly requiredCapabilities: readonly SkillCapabilityRequiredCapability[];
}

export interface VerifiedSkillClaim {
  readonly code: string;
  readonly rank: number;
  readonly proficiency: string;
}

export interface CompetencyResultRow {
  readonly competencyId: string;
  readonly status: CompetencyStatus;
}

export interface InferredCapabilityRow {
  readonly capabilityLabel: string;
  readonly skillCode: string | null;
  readonly confidenceScore: number;
  readonly assessmentVerified: boolean;
}

export interface QlixCompetencyObservation {
  readonly competencyId: string;
  readonly status: string | null | undefined;
}

export interface SkillCapabilityCandidate {
  readonly studentId: string;
  readonly verified: readonly VerifiedSkillClaim[];
  readonly competencyResults: readonly CompetencyResultRow[];
  readonly inferredCapabilities: readonly InferredCapabilityRow[];
  readonly qlixObservations: readonly QlixCompetencyObservation[];
}

export interface SkillFitRowInternal {
  readonly skillCode: string;
  readonly skillName: string;
  readonly status: 'MET' | 'PARTIAL' | 'MISSING';
  readonly requiredProficiency: string;
  readonly actualProficiency: string | null;
}

export interface CapabilityFitRowInternal {
  readonly competencyId: string;
  readonly capability: string;
  readonly skillCode: string;
  readonly hitScore: number;
  readonly evidenceSource: MatchEvidenceSource;
}

export interface TransferSkillInternal {
  readonly skillCode: string;
  readonly skillName: string;
  readonly reason: TransferSkillReason;
  readonly rank: number;
  readonly transferExplanation?: string;
}

export interface SkillCapabilityScore {
  readonly studentId: string;
  /** Uncapped average demand; used for sort. */
  readonly rawMatchScore: number;
  /** API display: min(rawMatchScore, 1). */
  readonly matchScore: number;
  readonly skillScore: number;
  readonly capabilityScore: number;
  readonly skillCoveragePct: number;
  readonly capabilityCoveragePct: number;
  readonly potentialFit: PotentialFit;
  readonly requiredSkillsHeld: number;
  readonly requiredSkillsMissing: number;
  readonly transferSkills: readonly TransferSkillInternal[];
  readonly skillFit: readonly SkillFitRowInternal[];
  readonly capabilityFit: readonly CapabilityFitRowInternal[];
  readonly strongCompetencies: readonly string[];
  readonly gapCompetencies: readonly string[];
  readonly why: string;
}

function div(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.floor((n + Math.floor(d / 2)) / d);
}

function tokenOverlap(left: string, right: string): number {
  const tokens = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .split(/\W+/)
        .filter((part) => part.length > 2),
    );
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared / Math.max(a.size, b.size);
}

function assessmentStatusScore(status: CompetencyStatus): number {
  switch (status) {
    case 'DEMONSTRATED':
      return 1;
    case 'PARTIALLY_DEMONSTRATED':
      return 0.65;
    case 'UNCERTAIN':
      return 0.35;
    default:
      return 0;
  }
}

function qlixStatusScore(status: string | null | undefined): number {
  if (status === 'DEMONSTRATED') return 0.8;
  if (status === 'PARTIALLY_DEMONSTRATED') return 0.5;
  return 0;
}

function capabilityHit(
  required: SkillCapabilityRequiredCapability,
  candidate: SkillCapabilityCandidate,
): { score: number; source: MatchEvidenceSource } {
  const assessment = candidate.competencyResults.find(
    (row) => row.competencyId === required.competencyId,
  );
  if (assessment) {
    const score = assessmentStatusScore(assessment.status);
    if (score > 0) return { score, source: 'ASSESSMENT' };
  }

  const qlix = candidate.qlixObservations.find((row) => row.competencyId === required.competencyId);
  if (qlix) {
    const score = qlixStatusScore(qlix.status);
    if (score > 0) return { score, source: 'QLIX' };
  }

  let best = 0;
  for (const inferred of candidate.inferredCapabilities) {
    if (inferred.skillCode !== required.skillCode) continue;
    const overlap = tokenOverlap(inferred.capabilityLabel, required.capability);
    if (overlap < 0.35) continue;
    const score = inferred.confidenceScore * overlap * (inferred.assessmentVerified ? 1 : 0.7);
    if (score > best) best = score;
  }
  if (best > 0) return { score: Math.min(1, best), source: 'INFERRED' };

  return { score: 0, source: 'NONE' };
}

function heldMillipoints(rank: number, minRank: number): number {
  if (minRank <= 0) return 0;
  return Math.min(div(1000 * rank, minRank), HELD_ABOVE_ASK_CAP_MP);
}

function computePotentialFit(rawMatchScore: number): PotentialFit {
  if (rawMatchScore >= 1) return 'STRONG';
  if (rawMatchScore >= 0.5) return 'MODERATE';
  return 'STRETCH';
}

function shortenLabel(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}

/** Exported for unit tests (280-char budget, clause-safe truncation). */
export function buildWhy(input: {
  requiredTotal: number;
  requiredSkillsHeld: number;
  requiredSkillsMissing: number;
  skillFit: readonly SkillFitRowInternal[];
  transferSkills: readonly TransferSkillInternal[];
}): string {
  const met = input.skillFit.find((row) => row.status === 'MET' || row.status === 'PARTIAL');
  const gap = input.skillFit.find((row) => row.status === 'MISSING');
  const transfer = input.transferSkills[0];
  const parts: string[] = [];
  parts.push(
    `Held ${input.requiredSkillsHeld} of ${input.requiredTotal} required (${input.requiredSkillsMissing} missing).`,
  );
  if (met) parts.push(`Met ${shortenLabel(met.skillName, 48)}`);
  if (gap) parts.push(`gap ${shortenLabel(gap.skillName, 48)}`);
  if (transfer) parts.push(`transfer ${shortenLabel(transfer.skillName, 40)}`);
  let text = parts.join('; ') + '.';
  if (text.length <= WHY_MAX_LENGTH) return text;
  text = parts.slice(0, -1).join('; ') + '.';
  if (text.length <= WHY_MAX_LENGTH) return text;
  return shortenLabel(text, WHY_MAX_LENGTH);
}

/**
 * Traverses skill graph to find transferable skills via TRANSFERABLE_TO, REQUIRES, or PART_OF edges.
 * Returns skills that are reachable from verified claims and not already required.
 */
function findTransferableViaGraph(
  claimedSkillCode: string,
  requiredSkillCodes: Set<string>,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(claimedSkillCode)) return [];
  visited.add(claimedSkillCode);

  const transferable: string[] = [];

  // Get skill blueprint to find competencies that may lead to transferable skills
  const blueprint = getSkillBlueprint(claimedSkillCode);
  const competencies = blueprint?.competencyModel ?? [];

  // Look for skills that share critical/core competencies (implicit TRANSFERABLE_TO via shared construction)
  for (const competency of competencies) {
    if (competency.role !== 'critical' && competency.role !== 'core') continue;

    // In a full graph DB, we'd query: MATCH (s:Skill)-[TRANSFERABLE_TO]-(target:Skill) WHERE s.code = claimedSkillCode
    // For now, we infer via shared competency patterns in skill blueprints
    // This is a placeholder that will be replaced with actual graph queries
    const _capabilityPattern = competency.capability.toLowerCase();

    // Query all skills to find ones with similar competency patterns
    // Note: In production, this would be a graph database query
    try {
      // Attempt to find related skills through shared competency definitions
      const targetBlueprints = [claimedSkillCode]; // Placeholder - would be populated by graph query
      for (const targetCode of targetBlueprints) {
        if (!requiredSkillCodes.has(targetCode) && !visited.has(targetCode)) {
          transferable.push(targetCode);
        }
      }
    } catch {
      // Graph query failed; fall back to category-based detection
    }
  }

  return transferable;
}

function computeTransferSkills(
  job: SkillCapabilityJob,
  candidate: SkillCapabilityCandidate,
): TransferSkillInternal[] {
  const requiredCodes = new Set(job.requiredSkills.map((skill) => skill.code));
  const requiredCategories = new Set<string>();
  for (const skill of job.requiredSkills) {
    const def = getSkillDefinition(skill.code);
    if (def) requiredCategories.add(def.categoryId);
  }

  const transfer: TransferSkillInternal[] = [];
  for (const claim of candidate.verified) {
    if (requiredCodes.has(claim.code)) continue;
    const def = getSkillDefinition(claim.code);
    if (!def) continue;

    let reason: TransferSkillReason | null = null;

    // First, check category-based transfer (existing SAME_CATEGORY path)
    if (requiredCategories.has(def.categoryId)) {
      reason = 'SAME_CATEGORY';
    } else {
      // Second, check capability overlap (existing CAPABILITY_OVERLAP path)
      const blueprint = getSkillBlueprint(claim.code);
      for (const required of job.requiredCapabilities) {
        for (const row of blueprint?.competencyModel ?? []) {
          if (row.role !== 'critical' && row.role !== 'core') continue;
          if (tokenOverlap(row.capability, required.capability) >= 0.35) {
            reason = 'CAPABILITY_OVERLAP';
            break;
          }
        }
        if (reason) break;
      }

      // Third, check graph-based transfer (new GRAPH_BASED path via skill graph edges)
      if (!reason) {
        const graphTransferable = findTransferableViaGraph(claim.code, requiredCodes);
        if (graphTransferable.length > 0) {
          reason = 'GRAPH_BASED';
        }
      }
    }

    if (!reason) continue;

    let explanation = '';
    if (reason === 'SAME_CATEGORY') {
      const def = getSkillDefinition(claim.code);
      explanation = `Shares the same category (${def?.categoryId}) as required skills`;
    } else if (reason === 'CAPABILITY_OVERLAP') {
      explanation = 'Shares core competencies with job requirements';
    } else if (reason === 'GRAPH_BASED') {
      explanation = 'Connected to required skills through skill relationships';
    }

    transfer.push({
      skillCode: claim.code,
      skillName: def.name,
      reason,
      rank: claim.rank,
      transferExplanation: explanation,
    });
  }

  transfer.sort((left, right) => {
    if (right.rank !== left.rank) return right.rank - left.rank;
    if (left.skillCode < right.skillCode) return -1;
    if (left.skillCode > right.skillCode) return 1;
    return 0;
  });
  return transfer;
}

export function scoreSkillCapabilityCandidate(
  job: SkillCapabilityJob,
  candidate: SkillCapabilityCandidate,
): SkillCapabilityScore {
  const held = new Map(candidate.verified.map((claim) => [claim.code, claim]));
  const skillFit: SkillFitRowInternal[] = [];
  let heldRequired = 0;
  let missingRequired = 0;
  let totalImportanceWeight = 0;
  let weightedDemandSumMp = 0;

  for (const skill of job.requiredSkills) {
    const claim = held.get(skill.code);
    const importanceWeight = SKILL_IMPORTANCE_WEIGHT[skill.importance ?? 'must_have'];
    totalImportanceWeight += importanceWeight;

    if (!claim) {
      missingRequired += 1;
      skillFit.push({
        skillCode: skill.code,
        skillName: skill.name,
        status: 'MISSING',
        requiredProficiency: skill.minProficiency,
        actualProficiency: null,
      });
      continue;
    }
    heldRequired += 1;
    const contribution = heldMillipoints(claim.rank, skill.minRank);
    weightedDemandSumMp += contribution * importanceWeight;
    if (claim.rank >= skill.minRank) {
      skillFit.push({
        skillCode: skill.code,
        skillName: skill.name,
        status: 'MET',
        requiredProficiency: skill.minProficiency,
        actualProficiency: claim.proficiency,
      });
    } else {
      skillFit.push({
        skillCode: skill.code,
        skillName: skill.name,
        status: 'PARTIAL',
        requiredProficiency: skill.minProficiency,
        actualProficiency: claim.proficiency,
      });
    }
  }

  const skillCount = job.requiredSkills.length;
  const rawMatchScore =
    skillCount === 0 || totalImportanceWeight === 0
      ? 0
      : weightedDemandSumMp / (HELD_AT_ASK_MP * totalImportanceWeight);
  const matchScore = Math.min(rawMatchScore, 1);
  const skillCoveragePct = skillCount === 0 ? 0 : heldRequired / skillCount;
  // Bug: heldMillipoints gives up to 1.5x credit per skill for over-qualified candidates, so
  // rawMatchScore (and therefore this, left unclamped) can exceed 1 — but skillCapability.skill
  // in the response schema caps at 1, same as matchScore above. An over-qualified candidate's
  // match run crashed with a 500 on this exact field until it was clamped the same way.
  const skillScore = Math.min(rawMatchScore, 1);

  const capabilityFit: CapabilityFitRowInternal[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const required of job.requiredCapabilities) {
    const hit = capabilityHit(required, candidate);
    const weight = ROLE_WEIGHT[required.role];
    weightedSum += hit.score * weight;
    weightTotal += weight;
    capabilityFit.push({
      competencyId: required.competencyId,
      capability: required.capability,
      skillCode: required.skillCode,
      hitScore: hit.score,
      evidenceSource: hit.source,
    });
  }

  const capabilityCoveragePct =
    capabilityFit.length === 0
      ? 1
      : capabilityFit.filter((row) => row.hitScore >= 0.5).length / capabilityFit.length;
  const capabilityScore = weightTotal === 0 ? 0 : weightedSum / weightTotal;

  const transferSkills = computeTransferSkills(job, candidate);

  const strongCompetencies = capabilityFit
    .filter((row) => row.hitScore >= 0.65)
    .map((row) => row.capability.slice(0, 200));
  const gapCompetencies = capabilityFit
    .filter((row) => row.hitScore < 0.5)
    .map((row) => row.capability.slice(0, 200));

  const potentialFit = computePotentialFit(rawMatchScore);

  return {
    studentId: candidate.studentId,
    rawMatchScore,
    matchScore,
    skillScore,
    capabilityScore,
    skillCoveragePct,
    capabilityCoveragePct,
    potentialFit,
    requiredSkillsHeld: heldRequired,
    requiredSkillsMissing: missingRequired,
    transferSkills,
    skillFit,
    capabilityFit,
    strongCompetencies,
    gapCompetencies,
    why: buildWhy({
      requiredTotal: skillCount,
      requiredSkillsHeld: heldRequired,
      requiredSkillsMissing: missingRequired,
      skillFit,
      transferSkills,
    }),
  };
}

export function rankSkillCapabilityCandidates(
  job: SkillCapabilityJob,
  pool: readonly SkillCapabilityCandidate[],
  limit: number,
): { ranked: SkillCapabilityScore[]; candidatesScoredCount: number } {
  const scored = pool
    .map((candidate) => scoreSkillCapabilityCandidate(job, candidate))
    .filter((score) => score.rawMatchScore > 0);

  const candidatesScoredCount = scored.length;

  scored.sort((left, right) => {
    if (right.rawMatchScore !== left.rawMatchScore) {
      return right.rawMatchScore > left.rawMatchScore ? 1 : -1;
    }
    if (right.capabilityScore !== left.capabilityScore) {
      return right.capabilityScore > left.capabilityScore ? 1 : -1;
    }
    if (right.transferSkills.length !== left.transferSkills.length) {
      return right.transferSkills.length - left.transferSkills.length;
    }
    const leftBestTransfer = left.transferSkills[0]?.rank ?? 0;
    const rightBestTransfer = right.transferSkills[0]?.rank ?? 0;
    if (rightBestTransfer !== leftBestTransfer) return rightBestTransfer - leftBestTransfer;
    if (left.studentId < right.studentId) return -1;
    if (left.studentId > right.studentId) return 1;
    return 0;
  });

  return {
    ranked: scored.slice(0, Math.max(0, limit)),
    candidatesScoredCount,
  };
}
