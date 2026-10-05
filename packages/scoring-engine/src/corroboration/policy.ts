import type { ProficiencyLevel } from '@hirekiwi/contracts';

/**
 * Practitioner-frozen corroboration policy defaults (S6-RM-10).
 * Learned weights replace these via SignalWeightModel when cohort data exists.
 *
 * Owner: Ramansh.
 *
 * PHASE 1 DIFFERENTIAL-VALIDITY & SUBGROUP AUDIT CHECKLIST:
 * Before outcome-driven recalibration goes live, audit whether default parameters
 * introduce disparate impact across demographic / access subgroups:
 * 1. conflictConfidencePenaltyMultiplier (e.g. 0.6): Verify penalty rate does not
 *    systematically disfavor candidates whose primary accessible channels produce higher variance.
 * 2. Consensus Clustering Mechanics: Test whether cluster-selection outcomes differ
 *    systematically across demographic cohorts where institutional access to high-reliability
 *    channels (e.g., extensive public GitHub histories) varies significantly.
 * 3. Cross-validate alongside PersonJobFitParameters (importanceWeights, mustHaveGatingThreshold).
 */

export interface CorroborationPolicy {
  /** Passive score floor (0–1) below which a passed assessment triggers review. */
  readonly contradictionFloor: Readonly<Record<ProficiencyLevel, number>>;
  /** Minimum passive confidence to treat a dimension as meaningful. */
  readonly minPassiveConfidence: number;
  /** Maximum allowable pairwise delta between independent passive sources before flagging internal conflict. */
  readonly maxPassiveDiscrepancy?: number;
  /** Multiplier (0-1) applied to dampen confidence when internal passive sources contradict. */
  readonly conflictConfidencePenaltyMultiplier?: number;
  readonly policyVersion?: string;
}

export const DEFAULT_CORROBORATION_POLICY: CorroborationPolicy = {
  policyVersion: 'corroboration-policy-v1-practitioner-prior',
  contradictionFloor: {
    BEGINNER: 0.2,
    INTERMEDIATE: 0.25,
    PROFICIENT: 0.275,
    ADVANCED: 0.3,
    PROFESSIONAL: 0.35,
  },
  minPassiveConfidence: 0.15,
  maxPassiveDiscrepancy: 0.4,
  conflictConfidencePenaltyMultiplier: 0.6,
} as const;
