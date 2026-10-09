/**
 * One-off / periodic backfill (S8-RM-XX): generates Stage 1 embeddings for candidates who don't
 * have one yet, or whose embedding predates their latest verified skill. Requires
 * GOOGLE_AI_API_KEY to be configured — see AiGatewayService.embedText / CandidateEmbeddingService.
 *
 * Run with: pnpm --filter @hirekiwi/api-core exec tsx src/platform/prisma/backfill-candidate-embeddings.ts
 */
import 'reflect-metadata';
import '../config/load-dotenv.bootstrap.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { CandidateEmbeddingService } from '../../modules/matching/candidate-embedding.service.js';
import { PrismaService } from './prisma.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    const embeddingService = app.get(CandidateEmbeddingService);

    const candidates = await prisma.user.findMany({
      where: {
        discoverableToEmployers: true,
        deactivatedAt: null,
        OR: [{ evidenceProfile: null }, { evidenceProfile: { embeddingUpdatedAt: null } }],
      },
      select: { id: true },
    });

    let generated = 0;
    let skipped = 0;
    for (const candidate of candidates) {
      const wrote = await embeddingService.generateAndStoreEmbedding(candidate.id);
      if (wrote) generated++;
      else skipped++;
    }

    console.log(
      `Candidate embedding backfill: generated ${generated}, skipped ${skipped} (no verified profile data yet) of ${candidates.length} candidates considered.`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Candidate embedding backfill failed:', error);
  process.exitCode = 1;
});
