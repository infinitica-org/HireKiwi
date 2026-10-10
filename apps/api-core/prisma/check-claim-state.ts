import { loadDotenv } from '../src/platform/config/load-dotenv.js';
loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const claim = await prisma.skillClaim.findFirst({
    where: { skill: { code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT' } },
  });
  console.log(claim);
  await prisma.$disconnect();
}
main();
