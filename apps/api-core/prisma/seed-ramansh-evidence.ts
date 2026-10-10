/**
 * Layers real EvidenceRecord + QlixCheckResult rows on top of seed-ramansh-data.ts so the live
 * fusion pipeline (runSkillEvidenceFusion -> fuseDomainCapability) has admissible ASSESSMENT +
 * PROJECT evidence to fuse, instead of returning basis:"NONE". Mirrors the G2-Rohan case from
 * the pilot rerun: strong assessment (C1-C4 DEMONSTRATED, C5-C6 PARTIAL) + a TRUSTED project
 * claiming DEMONSTRATED on 5 of 6 competencies, which should land ADVANCED via R-PROJUPGRADE-04.
 * Usage: npx tsx prisma/seed-ramansh-evidence.ts
 */

import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://hirekiwi:hirekiwi@127.0.0.1:5433/hirekiwi?schema=public';

// Competency ids for PYTHON_APPLICATION_BACKEND_DEVELOPMENT, in C1..C6 order
// (packages/contracts/src/generated/skill-competency-index.ts)
const C = [
  '828ed14b-2aca-408b-adc1-78e24f22b09d', // C1 Python syntax, idioms & standard library
  'e74fb14e-7e33-41fd-a709-4c23f24656be', // C2 OOP, typing & backend framework basics
  '296c4b35-7619-482c-aa9c-5d9b980598d3', // C3 REST APIs, data validation & persistence
  'a12803b7-ad4b-48a4-a042-5a948daaf7ef', // C4 Async I/O, concurrency & service integration
  '445faf5d-334e-473a-adda-495be6fb6350', // C5 Testing, profiling & production debugging
  'ce43fb80-9697-44ea-af6a-bbdc7f60c0e4', // C6 Backend architecture, packaging & deployment
];

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) throw new Error('No student found — run seed-ramansh-data.ts first');

  const project = await prisma.project.findFirst({ where: { studentId: student.id } });
  if (!project) throw new Error('No project found — run seed-ramansh-data.ts first');

  const verificationAttempt = await prisma.skillVerificationAttempt.findFirst({
    where: {
      claim: { studentId: student.id, skill: { code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!verificationAttempt) throw new Error('No verification attempt found');

  // 1) Bump the skill claim's target to PROFESSIONAL so fusion targets the top of the ladder,
  //    same target used in the pilot rerun report.
  await prisma.skillClaim.update({
    where: { id: verificationAttempt.claimId },
    data: { proficiency: 'PROFESSIONAL' },
  });
  console.log('Set skill claim target proficiency -> PROFESSIONAL');

  // 2) Populate assessmentResultJson on the verification attempt — this is what
  //    loadAssessmentBundle() reads. Marks mirror G2-Rohan: C1-C4 DEMONSTRATED, C5-C6 PARTIAL.
  const assessmentStatuses = [
    'DEMONSTRATED',
    'DEMONSTRATED',
    'DEMONSTRATED',
    'DEMONSTRATED',
    'PARTIALLY_DEMONSTRATED',
    'PARTIALLY_DEMONSTRATED',
  ] as const;

  const assessmentResultJson = {
    skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
    assessmentVersion: 'v1',
    attemptId: verificationAttempt.assessmentAttemptId,
    competencyResults: C.map((competencyId, i) => ({
      competencyId,
      status: assessmentStatuses[i],
      confidence: 'HIGH',
      evidence: [`live demo: competency ${i + 1} assessment item`],
    })),
    highestAssessmentSupportedProficiency: 'PROFICIENT',
    targetProficiency: 'PROFESSIONAL',
    assessmentComplete: true,
    assessmentPassed: true,
    uncertainties: [],
    recommendedNextStep: 'REMEDIATION',
    requiresInterview: false,
    requiresEvidenceVerification: false,
    requiresAdditionalAssessment: false,
    confidence: 'HIGH',
    scorePercent: 85,
    evaluatedAt: new Date().toISOString(),
  };

  await prisma.skillVerificationAttempt.update({
    where: { id: verificationAttempt.id },
    data: { assessmentResultJson },
  });
  console.log('Populated assessmentResultJson on verification attempt (ASSESSMENT bundle source)');

  // 3) Create a QlixCheckResult for the project carrying a strong, TRUSTED-tier assessment:
  //    DEMONSTRATED on 5/6 competencies, PARTIAL on C6 — same shape as G2-Rohan's project.
  const projectClaims = [
    'DEMONSTRATED',
    'DEMONSTRATED',
    'DEMONSTRATED',
    'DEMONSTRATED',
    'DEMONSTRATED',
    'PARTIALLY_DEMONSTRATED',
  ] as const;

  const hirekiwiAssessmentJson = {
    schemaVersion: 'v1',
    relevanceScore: 92,
    qualityScore: 88,
    authenticityScore: 95,
    appliedProficiencyCeiling: null,
    competencyObservations: C.map((competencyId, i) => ({
      competencyId,
      status: projectClaims[i],
      confidence: 'high',
      evidenceSnippets: [`FastAPI backend evidence for competency ${i + 1}`],
      authenticityWeight: 0.9,
    })),
    gaps: [],
  };

  await prisma.qlixCheckResult.upsert({
    where: { projectId: project.id },
    create: {
      projectId: project.id,
      checkId: `demo-check-${randomUUID()}`,
      status: 'completed',
      similarityIndex: 0.04,
      similarityExcludingCited: 0.02,
      confidence: 'high',
      aiLikelihood: 0.1,
      hirekiwiAssessmentJson,
      appliedProficiencyCeiling: null,
      qualityScore: 88,
      authenticityScore: 95,
      relevanceScore: 92,
      gaps: [],
    },
    update: { hirekiwiAssessmentJson },
  });
  console.log('Created/updated QlixCheckResult for project (PROJECT competency observations)');

  // 4) Create the EvidenceRecord that evidence-skill-inference.service.ts actually queries:
  //    evidenceType PROJECT, verificationStatus VERIFIED, relatedSkillCodes containing the skill,
  //    sourceEntityId -> project.id, sourcePayload matching ProjectVerificationReportDtoSchema.
  const reportId = randomUUID();
  const sourcePayload = {
    reportId,
    projectId: project.id,
    score: 90,
    relevanceScore: 92,
    qualityScore: 88,
    duplicateScore: 4,
    confidence: 0.93, // >=0.5 and routedToReview:false -> TRUSTED trust tier
    plagiarismFlag: false,
    techAgeFlag: false,
    flags: [],
    explanation:
      'Live demo: E-Commerce API Backend project shows strong, independent evidence of Python backend competencies.',
    routedToReview: false,
    promptRef: 'project-verify-demo@1',
    auditId: null,
    createdAt: new Date().toISOString(),
  };

  const existingEvidence = await prisma.evidenceRecord.findFirst({
    where: { studentId: student.id, evidenceType: 'PROJECT', sourceEntityId: project.id },
  });

  if (existingEvidence) {
    await prisma.evidenceRecord.update({
      where: { id: existingEvidence.id },
      data: {
        verificationStatus: 'VERIFIED',
        relatedSkillCodes: { set: ['PYTHON_APPLICATION_BACKEND_DEVELOPMENT'] },
        sourcePayload,
      },
    });
    console.log(`Updated existing EvidenceRecord ${existingEvidence.id} -> VERIFIED`);
  } else {
    const record = await prisma.evidenceRecord.create({
      data: {
        studentId: student.id,
        evidenceType: 'PROJECT',
        source: 'CANDIDATE',
        sourceEntityId: project.id,
        relatedSkillCodes: ['PYTHON_APPLICATION_BACKEND_DEVELOPMENT'],
        verificationStatus: 'VERIFIED',
        claim: 'E-Commerce API Backend demonstrates Python backend development competencies',
        sourcePayload,
      },
    });
    console.log(`Created EvidenceRecord ${record.id} -> VERIFIED`);
  }

  console.log('\nDone. The fusion pipeline now has admissible ASSESSMENT + PROJECT evidence.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
