import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

/**
 * Re-syncs the education degree / specialization catalog from prisma/data/*.json.
 * Idempotent (upsert by id) and never deletes rows, so it is safe against any environment.
 * The same rows are also inserted by the 20261009000000_education_catalog migration.
 */

interface DegreeRow {
  id: string;
  name: string;
  fullName: string;
  level: string;
}

interface SpecializationRow {
  id: string;
  name: string;
  category: string;
}

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

async function readJson<T>(file: string): Promise<T[]> {
  return JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf8')) as T[];
}

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  const degrees = await readJson<DegreeRow>('degrees.json');
  const specializations = await readJson<SpecializationRow>('specializations.json');

  await prisma.$transaction([
    ...degrees.map((row, sortOrder) =>
      prisma.educationDegree.upsert({
        where: { id: row.id },
        update: { name: row.name, fullName: row.fullName, level: row.level, sortOrder },
        create: { id: row.id, name: row.name, fullName: row.fullName, level: row.level, sortOrder },
      }),
    ),
    ...specializations.map((row, sortOrder) =>
      prisma.educationSpecialization.upsert({
        where: { id: row.id },
        update: { name: row.name, category: row.category, sortOrder },
        create: { id: row.id, name: row.name, category: row.category, sortOrder },
      }),
    ),
  ]);

  console.log(
    `Education catalog synced — ${String(degrees.length)} degrees, ${String(specializations.length)} specializations.`,
  );
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
