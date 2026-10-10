/**
 * Sets up a live matching demo: enables the matching.use_pjf_scoring flag for the pilot
 * institution (so createMatchRun actually exercises calculatePersonJobFit, not the legacy
 * ranker), and creates a parsed JobDescription requiring the Python skill our seeded student
 * already has evidence for.
 * Usage: npx tsx prisma/seed-matching-demo.ts
 */
import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://hirekiwi:hirekiwi@127.0.0.1:5433/hirekiwi?schema=public';

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

  const institution = await prisma.institution.findFirst();
  if (!institution) throw new Error('No institution found — run seed.ts first');

  const track = await prisma.track.findFirst({ where: { code: 'TECH_FULLSTACK' } });
  if (!track) throw new Error('No TECH_FULLSTACK track found');

  // 1) Enable matching.use_pjf_scoring for this institution, so createMatchRun uses
  //    calculatePersonJobFit (not the legacy skill-capability-ranker path).
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

  // 2) Create a parsed JobDescription requiring PYTHON_APPLICATION_BACKEND_DEVELOPMENT.
  const jd = await prisma.jobDescription.create({
    data: {
      institutionId: institution.id,
      trackId: track.id,
      companyName: 'Live Demo Co',
      roleTitle: 'Python Backend Engineer',
      rawText: 'We are hiring a Python backend engineer with FastAPI and REST API experience.',
      status: 'PARSED',
      parseConfidence: 0.95,
      parsedAt: new Date(),
      thresholds: {
        requiredTrack: 'TECH_FULLSTACK',
        minThresholds: { PYTHON_APPLICATION_BACKEND_DEVELOPMENT: 'SILVER' },
        emphasisedCompetencies: ['PYTHON_APPLICATION_BACKEND_DEVELOPMENT'],
        parseConfidence: 0.95,
      },
    },
  });
  console.log(`Created JobDescription ${jd.id} ("${jd.roleTitle}" @ ${jd.companyName})`);
  console.log(`\njdId for the match-run request: ${jd.id}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
