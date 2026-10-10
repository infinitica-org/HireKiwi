/**
 * Calls the REAL production fusion code path (same functions evidence-skill-inference.service.ts
 * uses) directly against the live DB, to show the computed CompetencyFusionResult without going
 * through the HTTP layer's response-schema validation (which has a live bug: it requires
 * evidenceValidationMetrics[].evidenceId to be a UUID, but the scoring-engine itself emits the
 * literal strings "assessment"/"project" there — see proficiency-fusion-integration.spec.ts).
 */
import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { Effect } from 'effect';
import {
  getSkillBlueprint,
  AssessmentResultSchema,
  ProjectVerificationReportDtoSchema,
} from '@hirekiwi/contracts';
import {
  assessmentToObservationBundle,
  projectBundleFromQlixEvidence,
  runSkillEvidenceFusion,
} from '@hirekiwi/scoring-engine';
import { QlixHireKiwiAssessmentSchema } from '../src/modules/evaluation/qlix-client.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://hirekiwi:hirekiwi@127.0.0.1:5433/hirekiwi?schema=public';

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
  const skillCode = 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT';
  const blueprint = getSkillBlueprint(skillCode);
  if (!blueprint) throw new Error('no blueprint');

  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) throw new Error('no student');

  // ASSESSMENT bundle — same query as loadAssessmentBundle()
  const attempt = await prisma.skillVerificationAttempt.findFirst({
    where: { passed: true, claim: { studentId: student.id, skill: { code: skillCode } } },
    orderBy: { createdAt: 'desc' },
    select: { assessmentResultJson: true },
  });
  const parsedAssessment = AssessmentResultSchema.parse(attempt?.assessmentResultJson);
  const assessmentBundle = assessmentToObservationBundle({
    competencyResults: parsedAssessment.competencyResults,
    testedItemCount: parsedAssessment.competencyResults.filter((r) => r.status !== 'NOT_TESTED')
      .length,
    proctoringRiskHigh: false,
    competencyModel: blueprint.competencyModel,
  });

  // PROJECT bundle(s) — same query as loadProjectBundles()
  const evidenceRecords = await prisma.evidenceRecord.findMany({
    where: {
      studentId: student.id,
      evidenceType: 'PROJECT',
      relatedSkillCodes: { has: skillCode },
      verificationStatus: 'VERIFIED',
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  const projectBundles = [];
  for (const record of evidenceRecords) {
    const projectId = record.sourceEntityId;
    if (!projectId) continue;
    const project = await prisma.project.findFirst({
      where: { id: projectId, studentId: student.id },
      include: { qlixCheckResult: true },
    });
    if (!project?.qlixCheckResult) continue;
    const report = ProjectVerificationReportDtoSchema.parse(record.sourcePayload);
    const hirekiwi = QlixHireKiwiAssessmentSchema.parse(
      project.qlixCheckResult.hirekiwiAssessmentJson,
    );
    projectBundles.push(
      projectBundleFromQlixEvidence(
        {
          report,
          competencyObservations: hirekiwi.competencyObservations ?? [],
          appliedProficiencyCeiling: hirekiwi.appliedProficiencyCeiling ?? null,
          evidenceRecordId: record.id,
          projectId: project.id,
        },
        { competencyModel: blueprint.competencyModel },
      ),
    );
  }

  const inference = await runSkillEvidenceFusion({
    skillCode,
    competencyModel: blueprint.competencyModel,
    proficiencyRequirements: blueprint.proficiencyRequirements ?? [],
    targetProficiency: 'PROFESSIONAL',
    assessmentBundle,
    projectBundles,
    provenance: {
      ruleSetVersion: 'v1',
      taxonomyVersion: 'v1',
      rubricVersion: 'fusion-rubric@1',
      capabilityModelVersion: 'capability-inference-v1',
      promptRefs: [],
      evidenceRecordIds: evidenceRecords.map((r) => r.id),
    },
  }).pipe(Effect.runPromise);

  console.log('\n=== LIVE fuseDomainCapability result (real DB data, real production code) ===\n');
  console.log('inferredProficiency:', inference.inferredProficiency);
  console.log('confidence:', inference.confidence, '-', inference.confidenceReason);
  console.log('outcome:', inference.outcome);
  console.log('proficiencyInferenceReason:', inference.proficiencyInferenceReason);
  console.log('evidenceCount:', inference.evidenceCount);
  console.log('activeSources:', inference.fusion.activeSources);
  console.log('capabilityGaps:', inference.fusion.capabilityGaps);
  console.log('recommendedNextStep:', inference.fusion.recommendedNextStep);
  console.log('\ncapabilityProfile:');
  for (const row of inference.fusion.capabilityProfile) {
    console.log(
      `  ${row.competencyId.slice(0, 8)}... ${row.capability}: ${row.inferredStatus} (via ${row.primaryEvidenceSource})`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
