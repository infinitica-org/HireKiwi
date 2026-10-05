import 'dotenv/config';
import { SKILL_DEFINITIONS } from '@smart/contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://smart:smart@127.0.0.1:5432/smart?schema=public';
const TARGET_PER_COMPANY = 10;

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

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
  const skills = await prisma.skill.findMany({
    where: { code: { in: SKILL_DEFINITIONS.map((s) => s.code) } },
  });

  const groups = await prisma.jobOpening.groupBy({
    by: ['institutionId', 'companyName', 'createdById'],
    _count: { _all: true },
  });

  let created = 0;
  for (const group of groups) {
    const deficit = TARGET_PER_COMPANY - group._count._all;
    if (deficit <= 0) continue;
    for (let i = 0; i < deficit; i++) {
      const minExp = pick([0, 0, 1, 2, 3]);
      const requiredSkills = pickN(skills, 1 + Math.floor(Math.random() * 4));
      const opening = await prisma.jobOpening.create({
        data: {
          institutionId: group.institutionId,
          companyName: group.companyName,
          roleTitle: pick(ROLE_TITLES),
          domainCode: 'SOFTWARE_IT',
          minYearsExperience: minExp,
          maxYearsExperience: minExp + 1 + Math.floor(Math.random() * 3),
          location: pick(CITIES),
          employmentType: pick(EMPLOYMENT_TYPES),
          headcount: 1 + Math.floor(Math.random() * 10),
          status: Math.random() < 0.85 ? 'OPEN' : Math.random() < 0.5 ? 'DRAFT' : 'CLOSED',
          createdById: group.createdById,
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
      created++;
    }
  }

  const total = await prisma.jobOpening.count();
  console.log(`Topped up ${created} job openings. Total job_openings now: ${total}.`);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
