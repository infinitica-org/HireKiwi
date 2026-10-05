import type { PersonJobFitScore, SkillImportance } from '@hirekiwi/contracts';

export interface RequiredSkillDemand {
  readonly skillCode: string;
  readonly requiredRank: number; // 1 to 5
  readonly importance: SkillImportance;
}

export interface CandidateDemonstratedSkill {
  readonly skillCode: string;
  readonly demonstratedRank: number; // 0 to 5
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly hasConflict?: boolean;
}

export interface PersonJobFitInput {
  readonly requiredSkills: readonly RequiredSkillDemand[];
  readonly candidateSkills: readonly CandidateDemonstratedSkill[];
  /** Optional ratio of exploration vs exploitation (e.g. 0.2 means exploration candidate if growth criteria met) */
  readonly isExplorationCandidate?: boolean;
  readonly explorationRationale?: string;
}

export interface PersonJobFitParameters {
  readonly version: string;
  readonly importanceWeights: Record<SkillImportance, number>;
  readonly mustHaveGatingThreshold: number;
  readonly mustHaveWeightInOverall: number;
  readonly accuracyWeightInOverall: number;
  readonly gatingMissPenaltyMultiplier: number;
}

export const DEFAULT_PERSON_JOB_FIT_PARAMS: PersonJobFitParameters = {
  version: 'pjf-v1-schmidt-hunter-prior',
  importanceWeights: {
    critical: 2.0,
    must_have: 1.5,
    nice_to_have: 1.0,
  },
  mustHaveGatingThreshold: 0.8,
  mustHaveWeightInOverall: 0.4,
  accuracyWeightInOverall: 0.6,
  gatingMissPenaltyMultiplier: 0.5,
};

/**
 * Pure person-job fit psychometric algorithm.
 *
 * Computes:
 * 1. Must-have/critical gate coverage (cannot place if hard must-haves are completely missing).
 * 2. Importance-weighted proficiency accuracy.
 * 3. Dual-track fit score (Exploitation top matches vs calibrated Exploration).
 */
export function calculatePersonJobFit(
  input: PersonJobFitInput,
  params: PersonJobFitParameters = DEFAULT_PERSON_JOB_FIT_PARAMS,
): PersonJobFitScore {
  if (input.requiredSkills.length === 0) {
    return {
      overallFitScore: 1.0,
      mustHavesMet: true,
      coverageOfMustHaves: 1.0,
      weightedProficiencyAccuracy: 1.0,
      skillFitBreakdown: [],
      matchStrategy: 'EXPLOITATION',
    };
  }

  const candidateSkillMap = new Map(input.candidateSkills.map((s) => [s.skillCode, s]));

  let mustHavesTotal = 0;
  let mustHavesSatisfied = 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;

  const breakdown: PersonJobFitScore['skillFitBreakdown'] = [];

  for (const req of input.requiredSkills) {
    const candidateSkill = candidateSkillMap.get(req.skillCode);
    const demonstratedRank = candidateSkill?.demonstratedRank ?? 0;
    const confidence = candidateSkill?.confidence ?? 'LOW';
    const isMet = demonstratedRank >= req.requiredRank;

    const isMustHave = req.importance === 'critical' || req.importance === 'must_have';
    if (isMustHave) {
      mustHavesTotal++;
      if (isMet) {
        mustHavesSatisfied++;
      }
    }

    const weight = params.importanceWeights[req.importance] ?? 1.0;
    totalWeight += weight;

    // Accuracy ratio capped between 0 and 1.2 (capped credit for exceeding)
    const ratio = Math.min(1.2, demonstratedRank / Math.max(1, req.requiredRank));
    totalWeightedScore += ratio * weight;

    breakdown.push({
      skillCode: req.skillCode,
      importance: req.importance,
      requiredRank: req.requiredRank,
      demonstratedRank,
      isMet,
      confidence,
      sourceDiscrepancy: candidateSkill?.hasConflict ?? false,
    });
  }

  const coverageOfMustHaves = mustHavesTotal > 0 ? mustHavesSatisfied / mustHavesTotal : 1.0;
  const weightedProficiencyAccuracy =
    totalWeight > 0 ? Math.min(1, totalWeightedScore / totalWeight) : 0;

  const mustHavesMet = coverageOfMustHaves >= params.mustHaveGatingThreshold;

  let overallFitScore =
    params.accuracyWeightInOverall * weightedProficiencyAccuracy +
    params.mustHaveWeightInOverall * coverageOfMustHaves;

  // Severe penalty if must-haves are drastically missed
  if (!mustHavesMet) {
    overallFitScore *= params.gatingMissPenaltyMultiplier;
  }

  const matchStrategy: PersonJobFitScore['matchStrategy'] = input.isExplorationCandidate
    ? 'EXPLORATION'
    : 'EXPLOITATION';

  return {
    overallFitScore: Math.round(overallFitScore * 1000) / 1000,
    mustHavesMet,
    coverageOfMustHaves: Math.round(coverageOfMustHaves * 1000) / 1000,
    weightedProficiencyAccuracy: Math.round(weightedProficiencyAccuracy * 1000) / 1000,
    skillFitBreakdown: breakdown,
    matchStrategy,
    explorationRationale: input.explorationRationale,
  };
}
