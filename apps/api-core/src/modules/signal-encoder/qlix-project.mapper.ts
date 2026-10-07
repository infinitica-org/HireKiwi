import { QlixHireKiwiAssessmentSchema } from '../evaluation/qlix-client.js';
import type { QlixProjectFusionInput } from '@hirekiwi/scoring-engine';

type QlixCheckResultRow = {
  appliedProficiencyCeiling: string | null;
  qualityScore: number | null;
  authenticityScore: number | null;
  relevanceScore: number | null;
  similarityIndex: number | null;
  aiLikelihood: number | null;
  confidence: string | null;
  hirekiwiAssessmentJson: unknown;
};

type VerifiedProjectRow = {
  id: string;
  skillMappings: readonly { skillCode: string }[];
  qlixCheckResult: QlixCheckResultRow | null;
};

export function mapVerifiedProjectToQlixFusionInput(
  project: VerifiedProjectRow,
  options?: { defenseScore?: number | null; ownershipConcern?: boolean },
): QlixProjectFusionInput | null {
  const qlix = project.qlixCheckResult;
  if (!qlix) return null;

  const skillCodes = [...new Set(project.skillMappings.map((row) => row.skillCode))];
  if (skillCodes.length === 0) return null;

  const hirekiwiAssessment = qlix.hirekiwiAssessmentJson
    ? QlixHireKiwiAssessmentSchema.safeParse(qlix.hirekiwiAssessmentJson).data
    : null;

  return {
    projectId: project.id,
    skillCodes,
    appliedProficiencyCeiling:
      qlix.appliedProficiencyCeiling ?? hirekiwiAssessment?.appliedProficiencyCeiling ?? null,
    qualityScore: qlix.qualityScore ?? hirekiwiAssessment?.qualityScore ?? null,
    authenticityScore: qlix.authenticityScore ?? hirekiwiAssessment?.authenticityScore ?? null,
    relevanceScore: qlix.relevanceScore ?? hirekiwiAssessment?.relevanceScore ?? null,
    similarityIndex: qlix.similarityIndex,
    aiLikelihood: qlix.aiLikelihood,
    qlixConfidence: qlix.confidence,
    competencyObservations: hirekiwiAssessment?.competencyObservations ?? [],
    defenseScore: options?.defenseScore ?? null,
    ownershipConcern: options?.ownershipConcern ?? false,
  };
}
