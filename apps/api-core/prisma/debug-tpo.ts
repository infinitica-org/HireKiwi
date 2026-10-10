import { loadDotenv } from '../src/platform/config/load-dotenv.js';
loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const tpo = await prisma.user.findFirst({ where: { email: 'tpo@hirekiwi.local' } });
  console.log('tpo institutionId:', tpo?.institutionId);
  const insts = await prisma.institution.findMany({ select: { id: true, name: true } });
  console.log('all institutions:', insts);
  await prisma.$disconnect();
}
main();
