import { loadDotenv } from '../src/platform/config/load-dotenv.js';
loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { JdThresholdVectorSchema, SKILL_CODE_SET } from '@hirekiwi/contracts';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const jd = await prisma.jobDescription.findUnique({
    where: { id: '486bb2bd-ad20-44ea-9e18-8f3b7dc30b93' },
  });
  console.log('jd:', JSON.stringify(jd, null, 2));
  const parsed = JdThresholdVectorSchema.safeParse(jd?.thresholds);
  console.log('parse success:', parsed.success);
  if (!parsed.success) console.log(JSON.stringify(parsed.error.issues, null, 2));
  console.log('has skill code:', SKILL_CODE_SET.has('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'));
  await prisma.$disconnect();
}
main();
