/**
 * Seeds a second student (fair-match-student@smart.local) with VERIFIED skill claims that
 * meet or exceed the requirements on the JobOpening created by seed-company-job-match-demo.ts
 * (Python >= INTERMEDIATE, SQL >= BEGINNER, API Design >= BEGINNER), so a match run against
 * that job should produce a strong-fit result — a positive control against the earlier
 * near-zero result for student@smart.local (whose SQL/API Design claims are unverified).
 *
 * Usage: npx tsx prisma/seed-fair-match-student.ts
 */
import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { hashPassword } from '../src/modules/auth/password-hash.util.js';
import { resolveSeedPassword } from '../src/platform/prisma/seed-accounts.js';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

const STUDENT_EMAIL = 'fairmatch-student@smart.local';

const REQUIRED_SKILLS: Array<{
  code: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'PROFICIENT' | 'ADVANCED' | 'PROFESSIONAL';
}> = [
  { code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT', proficiency: 'PROFICIENT' },
  { code: 'SQL_QUERY_OPTIMIZATION', proficiency: 'INTERMEDIATE' },
  { code: 'RESTFUL_GRAPHQL_API_DESIGN', proficiency: 'INTERMEDIATE' },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

  const institution = await prisma.institution.findFirst({
    where: { name: 'SMART Pilot Institute' },
  });
  if (!institution) throw new Error('SMART Pilot Institute not found — run seed.ts first');

  const track = await prisma.track.findUnique({ where: { code: 'TECH_FULLSTACK' } });
  if (!track) throw new Error('TECH_FULLSTACK track not found');

  const batch = await prisma.batch.findFirst({
    where: { institutionId: institution.id, name: 'Pilot Batch 2026' },
  });
  if (!batch) throw new Error('Pilot Batch 2026 not found — run seed.ts first');

  const password = resolveSeedPassword();
  const passwordHash = await hashPassword(password);

  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      passwordHash,
      role: 'STUDENT',
      institutionId: institution.id,
      primaryTrackId: track.id,
      batchId: batch.id,
      emailVerified: true,
      discoverableToEmployers: true,
      deactivatedAt: null,
      heldAt: null,
    },
    create: {
      email: STUDENT_EMAIL,
      fullName: 'Fair Match Student',
      passwordHash,
      role: 'STUDENT',
      institutionId: institution.id,
      primaryTrackId: track.id,
      batchId: batch.id,
      groupLabel: 'Section A',
      emailVerified: true,
      discoverableToEmployers: true,
    },
  });
  console.log(`Upserted student ${student.email} (${student.id})`);

  const skills = await prisma.skill.findMany({
    where: { code: { in: REQUIRED_SKILLS.map((s) => s.code) } },
  });
  if (skills.length !== REQUIRED_SKILLS.length) {
    const found = new Set(skills.map((s) => s.code));
    const missing = REQUIRED_SKILLS.filter((s) => !found.has(s.code));
    throw new Error(`Missing Skill rows: ${missing.map((s) => s.code).join(', ')}`);
  }

  const verifiedUntil = new Date();
  verifiedUntil.setFullYear(verifiedUntil.getFullYear() + 1);

  for (const skill of skills) {
    const wanted = REQUIRED_SKILLS.find((s) => s.code === skill.code)!;
    const claim = await prisma.skillClaim.upsert({
      where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
      update: {
        proficiency: wanted.proficiency,
        finalProficiency: wanted.proficiency,
        status: 'VERIFIED',
        verifiedUntil,
        claimConfidence: 0.92,
      },
      create: {
        studentId: student.id,
        skillId: skill.id,
        proficiency: wanted.proficiency,
        finalProficiency: wanted.proficiency,
        status: 'VERIFIED',
        source: 'MANUAL',
        verifiedUntil,
        claimConfidence: 0.92,
      },
    });
    console.log(`  - ${skill.code}: VERIFIED @ ${wanted.proficiency} (claim ${claim.id})`);
  }

  console.log(`\nFair-match student ready: ${student.email} / "${password}"`);
  console.log(`studentId: ${student.id}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
