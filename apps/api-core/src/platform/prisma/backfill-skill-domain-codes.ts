/**
 * One-off backfill (S8-RM-XX): assigns a literal A-E `domainCode` to every `Skill` row that
 * doesn't have one yet, using `classifySkillDomainCode`. Safe to re-run — only touches rows
 * where `domainCode IS NULL`.
 *
 * Run with: pnpm --filter @hirekiwi/api-core exec tsx src/platform/prisma/backfill-skill-domain-codes.ts
 */
import { loadDotenv } from '../config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/index.js';
import { classifySkillDomainCode } from './skill-domain-classifier.js';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
  try {
    const skills = await prisma.skill.findMany({
      where: { domainCode: null },
      select: { id: true, name: true },
    });

    let updated = 0;
    for (const skill of skills) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: { domainCode: classifySkillDomainCode(skill.name) },
      });
      updated++;
    }

    console.log(`Backfilled domainCode on ${updated} of ${skills.length} skills.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Skill domainCode backfill failed:', error);
  process.exitCode = 1;
});
