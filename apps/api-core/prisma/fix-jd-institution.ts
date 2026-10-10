import { loadDotenv } from '../src/platform/config/load-dotenv.js';
loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const correctInstId = '05fddadd-fc02-4c30-a536-ad9249760ca3';
  const track = await prisma.track.findFirst({ where: { code: 'TECH_FULLSTACK' } });

  await prisma.jobDescription.update({
    where: { id: '486bb2bd-ad20-44ea-9e18-8f3b7dc30b93' },
    data: { institutionId: correctInstId, trackId: track!.id },
  });
  console.log('Moved JD to correct institution', correctInstId);

  const flag = await prisma.featureFlag.findUnique({ where: { key: 'matching.use_pjf_scoring' } });
  await prisma.featureFlagOverride.deleteMany({
    where: { featureFlagId: flag!.id, institutionId: correctInstId },
  });
  await prisma.featureFlagOverride.create({
    data: { featureFlagId: flag!.id, institutionId: correctInstId, enabled: true },
  });
  console.log('Enabled matching.use_pjf_scoring for', correctInstId);

  await prisma.$disconnect();
}
main();
