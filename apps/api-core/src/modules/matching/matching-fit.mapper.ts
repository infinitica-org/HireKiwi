import {
  CandidateMatchDtoSchema,
  MatchFitDtoSchema,
  SKILL_DEFINITIONS,
  type CandidateMatchDto,
  type EvidenceQualityMetrics,
  type MatchFitDto,
  type MatchMethod,
  type SkillRequirement,
  type PublicCompetencyEvidenceSummary,
  type VerifiedSkillSummary,
} from '@hirekiwi/contracts';
import { computeCompositeValidityScore } from '@hirekiwi/scoring-engine';
import type { SkillCapabilityScore } from './skill-capability-ranker.js';

const skillNameByCode = new Map(SKILL_DEFINITIONS.map((skill) => [skill.code, skill.name]));

/** Human-readable label for a skill code, falling back to the code itself if unknown. */
export function skillNameForCode(code: string): string {
  return skillNameByCode.get(code) ?? code;
}

/**
 * Declared policy weights per evidence source type (authority, not a measured reliability
 * coefficient). Unknown source types fall back to the INFERRED weight.
 */
const INFERRED_AUTHORITY_WEIGHT = 0.7;
const SOURCE_AUTHORITY_WEIGHTS: Record<string, number> = {
  ASSESSMENT: 0.95,
  PROJECT: 0.85,
  INFERRED: INFERRED_AUTHORITY_WEIGHT,
};

/**
 * Summarises the evidence behind a candidate's capability fit using only what the match
 * pipeline actually knows. Rater agreement, recency and decay are not available here, so they
 * are reported as null (not measured) rather than synthesised; the composite is renormalised
 * over the known components via the scoring-engine's single definition.
 */
export function aggregateEvidenceMetrics(
  capabilityFit: readonly unknown[],
): EvidenceQualityMetrics[] {
  if (!capabilityFit || capabilityFit.length === 0) {
    return [];
  }

  const evidenceSources = capabilityFit
    .map((row) => (row as Record<string, unknown>).evidenceSource)
    .filter((source): source is string => typeof source === 'string' && source !== 'NONE');

  if (evidenceSources.length === 0) {
    return [];
  }

  // Share of the candidate's capability-fit rows that are backed by any evidence at all.
  const constructCoverage = evidenceSources.length / capabilityFit.length;
  const sourceAuthorityWeight =
    evidenceSources.reduce(
      (sum, source) => sum + (SOURCE_AUTHORITY_WEIGHTS[source] ?? INFERRED_AUTHORITY_WEIGHT),
      0,
    ) / evidenceSources.length;

  const compositeValidityScore = computeCompositeValidityScore({
    constructCoverage,
    interRaterReliability: null,
    sourceAuthorityWeight,
    decayFactor: null,
  }) as number;

  return [
    {
      constructCoverage: Math.round(constructCoverage * 100) / 100,
      interRaterReliability: null,
      sourceAuthorityWeight: Math.round(sourceAuthorityWeight * 100) / 100,
      recencyDays: null,
      decayFactor: null,
      compositeValidityScore: Math.round(compositeValidityScore * 100) / 100,
    },
  ];
}

export function mapVerifiedSkillsSummary(
  skills: readonly { code: string; proficiency: string }[],
): VerifiedSkillSummary[] {
  return skills.map((skill) => ({
    skillCode: skill.code as VerifiedSkillSummary['skillCode'],
    skillName: skillNameByCode.get(skill.code) ?? skill.code,
    proficiency: skill.proficiency as VerifiedSkillSummary['proficiency'],
  }));
}

export function toCandidateMatchDto(input: {
  score: SkillCapabilityScore;
  studentName: string;
  trackCode: CandidateMatchDto['trackCode'];
  certificateId: string | null;
  highestLevelCleared: CandidateMatchDto['highestLevelCleared'];
  headlineTier: CandidateMatchDto['headlineTier'];
  verifiedSkills: readonly { code: string; proficiency: string }[];
  method: MatchMethod;
  matchStrategy?: 'EXPLOITATION' | 'EXPLORATION';
  explorationRationale?: string;
  recruiterSummary?: string;
  studentSummary?: string;
  competencyEvidenceSummaries?: PublicCompetencyEvidenceSummary[];
}): CandidateMatchDto {
  return CandidateMatchDtoSchema.parse({
    studentId: input.score.studentId,
    studentName: input.studentName,
    trackCode: input.trackCode,
    certificateId: input.certificateId,
    highestLevelCleared: input.highestLevelCleared,
    headlineTier: input.headlineTier,
    similarityScore: 0,
    matchScore: input.score.matchScore,
    method: input.method,
    matchStrategy: input.matchStrategy ?? 'EXPLOITATION',
    explorationRationale: input.explorationRationale,
    explanation: {
      thresholdsMet: [],
      thresholdsMissed: [],
      strongCompetencies: [...input.score.strongCompetencies],
      gapCompetencies: [...input.score.gapCompetencies],
      why: input.score.why,
      skillCoveragePct: input.score.skillCoveragePct,
      capabilityCoveragePct: input.score.capabilityCoveragePct,
      potentialFit: input.score.potentialFit,
      skillFit: [...input.score.skillFit],
      capabilityFit: [...input.score.capabilityFit],
      recruiterSummary: input.recruiterSummary,
      studentSummary: input.studentSummary,
      skillCapability: {
        skill: input.score.skillScore,
        proficiency: input.score.skillScore,
        capability: input.score.capabilityScore,
      },
      verifiedSkills: mapVerifiedSkillsSummary(input.verifiedSkills),
      requiredSkillsHeld: input.score.requiredSkillsHeld,
      requiredSkillsMissing: input.score.requiredSkillsMissing,
      transferSkills: input.score.transferSkills.map((row) => ({
        skillCode: row.skillCode as VerifiedSkillSummary['skillCode'],
        skillName: row.skillName,
        reason: row.reason,
        rank: row.rank,
        transferExplanation: row.transferExplanation,
      })),
      competencyEvidenceSummaries: input.competencyEvidenceSummaries,
      evidenceQualityMetrics: aggregateEvidenceMetrics(input.score.capabilityFit),
    },
  });
}

export function toMatchFitDto(input: {
  score: SkillCapabilityScore;
  roleTitle: string;
  companyName: string;
  method: MatchMethod;
  openingId?: string;
  applicationId?: string;
  runId?: string;
  recruiterSummary?: string;
  studentSummary?: string;
}): MatchFitDto {
  return MatchFitDtoSchema.parse({
    studentId: input.score.studentId,
    openingId: input.openingId,
    applicationId: input.applicationId,
    runId: input.runId,
    roleTitle: input.roleTitle,
    companyName: input.companyName,
    matchScore: input.score.matchScore,
    method: input.method,
    skillCoveragePct: input.score.skillCoveragePct,
    capabilityCoveragePct: input.score.capabilityCoveragePct,
    potentialFit: input.score.potentialFit,
    skillFit: [...input.score.skillFit],
    capabilityFit: [...input.score.capabilityFit],
    skillGaps: input.score.skillFit.filter((row) => row.status !== 'MET'),
    competencyGaps: input.score.capabilityFit.filter((row) => row.hitScore < 0.5),
    strongCompetencies: [...input.score.strongCompetencies],
    gapCompetencies: [...input.score.gapCompetencies],
    why: input.score.why,
    recruiterSummary: input.recruiterSummary,
    studentSummary: input.studentSummary,
  });
}

export function jobRequirementsFromProfile(job: {
  requiredSkills: readonly { code: string; minProficiency: string }[];
  requiredCapabilities: readonly {
    competencyId: string;
    capability: string;
    skillCode: string;
    role: 'critical' | 'core' | 'supporting';
  }[];
}): {
  skills: SkillRequirement[];
  capabilities: {
    competencyId: string;
    capability: string;
    skillCode: SkillRequirement['skillCode'];
    role: 'critical' | 'core' | 'supporting';
  }[];
} {
  return {
    skills: job.requiredSkills.map((skill) => ({
      skillCode: skill.code as SkillRequirement['skillCode'],
      minProficiency: skill.minProficiency as SkillRequirement['minProficiency'],
    })),
    capabilities: job.requiredCapabilities.map((cap) => ({
      competencyId: cap.competencyId,
      capability: cap.capability,
      skillCode: cap.skillCode as SkillRequirement['skillCode'],
      role: cap.role,
    })),
  };
}
