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
} from '@smart/contracts';
import type { SkillCapabilityScore } from './skill-capability-ranker.js';

const skillNameByCode = new Map(SKILL_DEFINITIONS.map((skill) => [skill.code, skill.name]));

/**
 * Aggregates evidence quality metrics from capability fit rows.
 * Computes psychometric validity across all evidence sources in a candidate's match.
 */
function aggregateEvidenceMetrics(capabilityFit: readonly unknown[]): EvidenceQualityMetrics[] {
  // If no capability fit data with evidence, return empty
  if (!capabilityFit || capabilityFit.length === 0) {
    return [];
  }

  // Extract evidence from capability fit rows
  // Each row has hitScore (0-1) which reflects confidence in evidence
  const evidenceSources = capabilityFit
    .filter((row: unknown): row is { evidenceSource: string; hitScore?: number } => {
      const r = row as Record<string, unknown>;
      return typeof r.evidenceSource === 'string' && r.evidenceSource !== 'NONE';
    })
    .map((row) => ({
      hitScore: row.hitScore ?? 0.5,
      source: row.evidenceSource,
    }));

  if (evidenceSources.length === 0) {
    return [];
  }

  // Aggregate metrics across all evidence sources
  // constructCoverage: Portion of required competencies covered by evidence
  const constructCoverage = Math.min(
    1,
    (capabilityFit.filter((row: unknown): row is { hitScore?: number } => {
      const r = row as Record<string, unknown>;
      return typeof r.hitScore === 'number' && r.hitScore >= 0.5;
    }).length || 1) / capabilityFit.length,
  );

  // interRaterReliability: Consistency of evidence assessment (simulated from hit scores)
  const scores = capabilityFit.map((row: unknown): number => {
    const r = row as Record<string, unknown>;
    return typeof r.hitScore === 'number' ? r.hitScore : 0.5;
  });
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const interRaterReliability = Math.max(0, 1 - stdDev / 2); // Higher consistency = higher reliability

  // sourceReliability: Based on evidence type (ASSESSMENT=0.95, INFERRED=0.70, PROJECT=0.85)
  const sourceWeights: Record<string, number> = {
    ASSESSMENT: 0.95,
    PROJECT: 0.85,
    INFERRED: 0.7,
    NONE: 0,
  };
  const sourceReliability =
    evidenceSources.reduce((sum, e) => sum + (sourceWeights[e.source] ?? 0.7), 0) /
    evidenceSources.length;

  // recencyDays: Assume assessment/project evidence is recent (0-30 days)
  const recencyDays = 15; // Default recent evidence

  // decayFactor: Quality retention over time (1.0 = no decay for recent evidence)
  const decayFactor = Math.max(0.5, 1.0 - recencyDays / 365);

  // compositeValidityScore: Weighted combination of all factors
  const compositeValidityScore =
    constructCoverage * 0.25 +
    interRaterReliability * 0.25 +
    sourceReliability * 0.35 +
    decayFactor * 0.15;

  return [
    {
      constructCoverage: Math.round(constructCoverage * 100) / 100,
      interRaterReliability: Math.round(interRaterReliability * 100) / 100,
      sourceReliability: Math.round(sourceReliability * 100) / 100,
      recencyDays,
      decayFactor: Math.round(decayFactor * 100) / 100,
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
