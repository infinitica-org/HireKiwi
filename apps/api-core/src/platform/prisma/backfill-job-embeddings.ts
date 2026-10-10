/**
 * One-off / periodic backfill (S8-RM-XX): generates Stage 1 embeddings for job openings that
 * don't have one yet. Requires GOOGLE_AI_API_KEY to be configured — see
 * AiGatewayService.embedText / JobEmbeddingService.
 *
 * Run with: pnpm --filter @hirekiwi/api-core exec tsx src/platform/prisma/backfill-job-embeddings.ts
 */
import 'reflect-metadata';
import '../config/load-dotenv.bootstrap.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { JobEmbeddingService } from '../../modules/matching/job-embedding.service.js';
import { PrismaService } from './prisma.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    const embeddingService = app.get(JobEmbeddingService);

    const jobs = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM job_openings WHERE embedding_updated_at IS NULL
    `;

    let generated = 0;
    let skipped = 0;
    for (const job of jobs) {
      const wrote = await embeddingService.generateAndStoreEmbedding(job.id);
      if (wrote) generated++;
      else skipped++;
    }

    console.log(
      `Job embedding backfill: generated ${generated}, skipped ${skipped} (no role title yet) of ${jobs.length} jobs considered.`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Job embedding backfill failed:', error);
  process.exitCode = 1;
});
