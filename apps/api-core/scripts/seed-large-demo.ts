import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { SKILL_DEFINITIONS, TRACK_DEFINITIONS } from '@smart/contracts';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';

/**
 * Large, realistic local-dev demo dataset: 10 institutions, 500 students (50/institution),
 * one TPO per institution, 10 companies per institution with 10 job openings each (varying
 * skill/experience requirements), so batch-scoped matching has something meaningful to chew on.
 *
 * Logins (password for every account: ChangeMe!Dev):
 *   tpo1@smart.local     .. tpo10@smart.local      (one per institution)
 *   student1@smart.local .. student500@smart.local (50 per institution, sequential)
 *
 * Idempotent-ish: re-running adds more students/jobs on top rather than erroring, but skips
 * institutions/companies/TPOs that already exist by name/email.
 */

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://smart:smart@127.0.0.1:5432/smart?schema=public';
const SEED_PASSWORD = 'ChangeMe!Dev';

const INSTITUTION_COUNT = 10;
const STUDENTS_PER_INSTITUTION = 50;
const COMPANIES_PER_INSTITUTION = 10;
const JOBS_PER_COMPANY = 10;

const FIRST_NAMES = [
  'Aarav',
  'Vihaan',
  'Advik',
  'Diya',
  'Ananya',
  'Ishaan',
  'Kavya',
  'Rohan',
  'Sneha',
  'Arjun',
  'Priya',
  'Karthik',
  'Meera',
  'Sai',
  'Divya',
  'Rahul',
  'Pooja',
  'Vikram',
  'Nisha',
  'Aditya',
  'Shreya',
  'Manoj',
  'Lakshmi',
  'Suresh',
  'Anjali',
  'Kiran',
  'Deepika',
  'Naveen',
  'Swathi',
  'Ravi',
];
const LAST_NAMES = [
  'Sharma',
  'Iyer',
  'Reddy',
  'Nair',
  'Gupta',
  'Rao',
  'Patel',
  'Kumar',
  'Menon',
  'Pillai',
  'Verma',
  'Krishnan',
  'Joshi',
  'Bose',
  'Chatterjee',
  'Desai',
  'Mehta',
  'Shetty',
  'Singh',
  'Das',
];
const BATCH_LABELS = ['CSE', 'ECE', 'ISE'];
const CITIES = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Mumbai',
  'Delhi NCR',
  'Kolkata',
  'Coimbatore',
];
const ROLE_TITLES = [
  'Backend Engineer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'QA Engineer',
  'Cloud Engineer',
  'Security Engineer',
  'Mobile App Developer',
];
const COMPANY_PREFIXES = [
  'Infinitica',
  'Northwind',
  'Aegis',
  'Vertex',
  'Quantum',
  'Nimbus',
  'Lumen',
  'Catalyst',
  'Orbit',
  'Redshift',
  'Ironclad',
  'Zenith',
  'Meridian',
  'Pinnacle',
  'Sterling',
  'Cobalt',
  'Beacon',
  'Apex',
  'Ridgeline',
  'Sundial',
];
const COMPANY_SUFFIXES = ['Labs', 'Systems', 'Technologies', 'Solutions', 'Networks', 'Softworks'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'FULL_TIME', 'FULL_TIME', 'INTERNSHIP'] as const;
const PROFICIENCIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]!);
  }
  return out;
}
function gaussian(mean: number, stdDev: number, min: number, max: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.min(max, Math.max(min, mean + z * stdDev));
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

  const plan = await prisma.subscriptionPlan.findFirstOrThrow({ where: { code: 'PRO' } });
  const techTracks = TRACK_DEFINITIONS.filter((t) => t.code.startsWith('TECH_'));
  const tracks = await prisma.track.findMany({
    where: { code: { in: techTracks.map((t) => t.code) } },
  });
  const skills = await prisma.skill.findMany({
    where: { code: { in: SKILL_DEFINITIONS.map((s) => s.code) } },
  });
  if (skills.length === 0 || tracks.length === 0) {
    throw new Error(
      'Run the base seed (pnpm --filter @smart/api-core db:seed) first — skills/tracks are missing.',
    );
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);

  let studentCounter = 1;
  let companyCounter = 0;
  let jobCounter = 0;

  for (let instIndex = 1; instIndex <= INSTITUTION_COUNT; instIndex++) {
    const domain = `institution${instIndex}.smart.local`;
    const institution = await prisma.institution.upsert({
      where: { domain },
      update: {},
      create: { name: `Demo Institute ${instIndex}`, domain, planId: plan.id },
    });

    const tpoEmail = `tpo${instIndex}@smart.local`;
    const tpo = await prisma.user.upsert({
      where: { email: tpoEmail },
      update: { passwordHash, institutionId: institution.id },
      create: {
        email: tpoEmail,
        fullName: `TPO Admin ${instIndex}`,
        passwordHash,
        role: 'INSTITUTION_ADMIN',
        emailVerified: true,
        institutionId: institution.id,
      },
    });

    // 3 batches per institution (e.g. CSE-2026, ECE-2026, ISE-2026).
    const batches = [];
    for (const label of BATCH_LABELS) {
      const name = `${label}-2026`;
      const batch = await prisma.batch.upsert({
        where: { institutionId_name: { institutionId: institution.id, name } },
        update: {},
        create: { institutionId: institution.id, name, code: name, createdById: tpo.id },
      });
      batches.push(batch);
    }

    // Students for this institution.
    const studentsToCreate = [];
    for (let i = 0; i < STUDENTS_PER_INSTITUTION; i++) {
      const track = pick(tracks);
      const cgpaKnown = Math.random() > 0.08;
      studentsToCreate.push({
        id: randomUUID(),
        email: `student${studentCounter}@smart.local`,
        fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        passwordHash,
        role: 'STUDENT' as const,
        emailVerified: true,
        institutionId: institution.id,
        batchId: pick(batches).id,
        primaryTrackId: track.id,
        onboardingCompleted: true,
        cgpa: cgpaKnown ? Number(gaussian(7.4, 1.1, 4.5, 9.9).toFixed(2)) : null,
        sscPercentage: cgpaKnown ? Number(gaussian(83, 8, 55, 99).toFixed(2)) : null,
        hscPercentage: cgpaKnown ? Number(gaussian(80, 9, 50, 99).toFixed(2)) : null,
      });
      studentCounter++;
    }
    await prisma.user.createMany({ data: studentsToCreate, skipDuplicates: true });

    const skillClaims: {
      studentId: string;
      skillId: string;
      proficiency: (typeof PROFICIENCIES)[number];
      status: 'VERIFIED' | 'DECLARED';
    }[] = [];
    for (const student of studentsToCreate) {
      const chosen = pickN(skills, 3 + Math.floor(Math.random() * 8));
      for (const skill of chosen) {
        skillClaims.push({
          studentId: student.id,
          skillId: skill.id,
          proficiency: pick(PROFICIENCIES),
          status: Math.random() < 0.65 ? 'VERIFIED' : 'DECLARED',
        });
      }
    }
    if (skillClaims.length > 0) {
      await prisma.skillClaim.createMany({ data: skillClaims, skipDuplicates: true });
    }

    const certificates = [];
    for (const student of studentsToCreate) {
      if (Math.random() > 0.7) continue;
      const r = Math.random();
      certificates.push({
        userId: student.id,
        trackId: student.primaryTrackId,
        highestLevelCleared: 1 + Math.floor(Math.random() * 5),
        headlineTier: (r < 0.15 ? 'GOLD' : r < 0.5 ? 'SILVER' : 'BRONZE') as
          'GOLD' | 'SILVER' | 'BRONZE',
        tierTrail: {},
        status: 'ISSUED' as const,
        verificationSlug: `seed-${student.id}`,
        issuedAt: new Date(),
      });
    }
    if (certificates.length > 0) {
      await prisma.certificate.createMany({ data: certificates, skipDuplicates: true });
    }

    // Companies + jobs for this institution.
    for (let c = 0; c < COMPANIES_PER_INSTITUTION; c++) {
      companyCounter++;
      const companyName = `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)} ${companyCounter}`;

      for (let j = 0; j < JOBS_PER_COMPANY; j++) {
        const existing = await prisma.jobOpening.findFirst({
          where: { institutionId: institution.id, companyName, roleTitle: pick(ROLE_TITLES) },
        });
        if (existing) continue; // best-effort idempotency; skip exact dupes on re-run

        const minExp = pick([0, 0, 1, 2, 3]);
        const requiredSkillCount = 1 + Math.floor(Math.random() * 4);
        const requiredSkills = pickN(skills, requiredSkillCount);

        const opening = await prisma.jobOpening.create({
          data: {
            institutionId: institution.id,
            companyName,
            roleTitle: pick(ROLE_TITLES),
            domainCode: 'SOFTWARE_IT',
            minYearsExperience: minExp,
            maxYearsExperience: minExp + 1 + Math.floor(Math.random() * 3),
            location: pick(CITIES),
            employmentType: pick(EMPLOYMENT_TYPES),
            headcount: 1 + Math.floor(Math.random() * 10),
            status: Math.random() < 0.85 ? 'OPEN' : Math.random() < 0.5 ? 'DRAFT' : 'CLOSED',
            createdById: tpo.id,
          },
        });
        await prisma.jobOpeningSkill.createMany({
          data: requiredSkills.map((skill) => ({
            openingId: opening.id,
            skillId: skill.id,
            minProficiency: pick(PROFICIENCIES),
          })),
          skipDuplicates: true,
        });
        jobCounter++;
      }
    }

    console.log(`Institution ${instIndex}/${INSTITUTION_COUNT} (${institution.name}) done.`);
  }

  console.log(
    `\nSeed complete: ${INSTITUTION_COUNT} institutions, ${studentCounter - 1} students, ` +
      `${companyCounter} companies, ${jobCounter} job openings.\n` +
      `Login as tpo1..tpo${INSTITUTION_COUNT}@smart.local or student1..student${studentCounter - 1}@smart.local, password: ${SEED_PASSWORD}`,
  );
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
