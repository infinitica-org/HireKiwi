/**
 * Seeds a JobOpening the way the company portal (apps/web-company, /jobs) actually creates
 * one — via the JobOpening + JobOpeningSkill models, not the legacy JobDescription table —
 * requiring skills that student@smart.local already has matching/near-matching skill claims
 * for, so the pair should be a fair-to-strong fit. Then enables PJF scoring and prints the
 * jdId to drive a POST /placement/match-runs request against.
 *
 * Usage: npx tsx prisma/seed-company-job-match-demo.ts
 */
import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

  const institution = await prisma.institution.findFirst({
    where: { name: 'SMART Pilot Institute' },
  });
  if (!institution) throw new Error('SMART Pilot Institute not found — run seed.ts first');

  const companyUser = await prisma.user.findUnique({ where: { email: 'company@smart.local' } });
  if (!companyUser) throw new Error('company@smart.local not found — run seed.ts first');

  const studentUser = await prisma.user.findUnique({ where: { email: 'student@smart.local' } });
  if (!studentUser) throw new Error('student@smart.local not found — run seed.ts first');

  const company = await prisma.company.findFirst({ where: { name: 'SMART Pilot Employer' } });

  // Skills the student already holds claims for (from skill_claims), used as JobOpening
  // requirements at or below the student's current proficiency — a "fair fit" job.
  const wantedSkillCodes = [
    { code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT', minProficiency: 'INTERMEDIATE' as const },
    { code: 'SQL_QUERY_OPTIMIZATION', minProficiency: 'BEGINNER' as const },
    { code: 'RESTFUL_GRAPHQL_API_DESIGN', minProficiency: 'BEGINNER' as const },
  ];

  const skills = await prisma.skill.findMany({
    where: { code: { in: wantedSkillCodes.map((s) => s.code) } },
  });
  if (skills.length !== wantedSkillCodes.length) {
    const found = new Set(skills.map((s) => s.code));
    const missing = wantedSkillCodes.filter((s) => !found.has(s.code));
    throw new Error(`Missing Skill rows: ${missing.map((s) => s.code).join(', ')}`);
  }

  // 1) Enable matching.use_pjf_scoring for this institution so createMatchRun exercises
  //    calculatePersonJobFit (the live scoring path), not the legacy ranker.
  const flag = await prisma.featureFlag.upsert({
    where: { key: 'matching.use_pjf_scoring' },
    create: { key: 'matching.use_pjf_scoring', name: 'Person-Job-Fit scoring' },
    update: {},
  });
  await prisma.featureFlagOverride.deleteMany({
    where: { featureFlagId: flag.id, institutionId: institution.id },
  });
  await prisma.featureFlagOverride.create({
    data: { featureFlagId: flag.id, institutionId: institution.id, enabled: true },
  });
  console.log(`Enabled matching.use_pjf_scoring for institution ${institution.id}`);

  // 2) Create the JobOpening the way employer-jobs.service.ts / the /jobs company-portal
  //    form would (CreateEmployerJobRequestSchema shape), published (status OPEN).
  const opening = await prisma.jobOpening.create({
    data: {
      institutionId: institution.id,
      companyId: company?.id,
      companyName: 'SMART Pilot Employer',
      roleTitle: 'Python Backend Engineer',
      domainCode: 'SOFTWARE_IT',
      minYearsExperience: 0,
      maxYearsExperience: 2,
      location: 'Remote',
      employmentType: 'FULL_TIME',
      workMode: 'REMOTE',
      headcount: 1,
      aboutCompany: 'SMART Pilot Employer is a demo company for local matching verification.',
      roleDetails:
        'Build and maintain REST/GraphQL APIs in Python, write optimized SQL, and ship backend services.',
      salaryDetails: '6-9 LPA, fixed',
      status: 'OPEN',
      jdParseStatus: 'PARSED',
      rawText:
        'Looking for a Python backend engineer with REST/GraphQL API design experience and solid SQL skills.',
      backlogsAllowed: true,
      createdById: companyUser.id,
      requiredSkills: {
        create: skills.map((skill) => {
          const wanted = wantedSkillCodes.find((w) => w.code === skill.code)!;
          return { skillId: skill.id, minProficiency: wanted.minProficiency };
        }),
      },
    },
    include: { requiredSkills: { include: { skill: true } } },
  });

  console.log(
    `\nCreated JobOpening ${opening.id} ("${opening.roleTitle}" @ ${opening.companyName})`,
  );
  console.log('Required skills:');
  for (const rs of opening.requiredSkills) {
    console.log(`  - ${rs.skill.code}: min ${rs.minProficiency}`);
  }
  console.log(`\nMatching candidate: ${studentUser.email} (${studentUser.id})`);
  console.log(`\njdId for the match-run request: ${opening.id}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
