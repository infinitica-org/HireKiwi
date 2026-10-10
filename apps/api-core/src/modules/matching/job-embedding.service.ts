import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service.js';

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generates and persists a Stage 1 job-opening embedding, mirroring CandidateEmbeddingService —
 * same dimensions, same AI Gateway call, same raw-SQL write (JobOpening.embedding is an
 * `Unsupported("vector(1536)")` column, same as CandidateEvidenceProfile.embedding). Lets
 * matching's Stage 1 pre-filter do real pgvector cosine similarity job-side too, instead of
 * falling back to the in-memory 6-dim domain heuristic for every search.
 */
@Injectable()
export class JobEmbeddingService {
  private readonly logger = new Logger(JobEmbeddingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiGatewayService) private readonly aiGateway: AiGatewayService,
  ) {}

  /** A short, stable text summary of a job's requirements. Null when there's nothing meaningful
   * to embed yet (no role title). */
  async buildJobText(openingId: string): Promise<string | null> {
    const job = await this.prisma.jobOpening.findUnique({
      where: { id: openingId },
      select: {
        roleTitle: true,
        domainCode: true,
        roleDetails: true,
        requiredSkills: {
          select: {
            minProficiency: true,
            skill: { select: { name: true } },
          },
        },
      },
    });
    if (!job || !job.roleTitle) return null;

    const skillLines = job.requiredSkills
      .map((s) => `${s.skill.name} (min ${s.minProficiency})`)
      .join(', ');

    return [
      `Role: ${job.roleTitle}`,
      job.domainCode ? `Domain: ${job.domainCode}` : null,
      skillLines ? `Required skills: ${skillLines}` : null,
      job.roleDetails ? `Role details: ${job.roleDetails}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n');
  }

  /**
   * Generates and upserts a job opening's Stage 1 embedding. Returns false (no-op) when the job
   * doesn't yet have enough data to embed meaningfully — callers should treat that as "try again
   * later", not an error.
   */
  async generateAndStoreEmbedding(openingId: string): Promise<boolean> {
    const text = await this.buildJobText(openingId);
    if (!text) return false;

    const embedding = await this.aiGateway.embedText(text);
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected a ${EMBEDDING_DIMENSIONS}-dim embedding for job opening ${openingId}, got ${embedding.length}.`,
      );
    }
    const vectorLiteral = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      UPDATE job_openings
      SET embedding = ${vectorLiteral}::vector, embedding_updated_at = now()
      WHERE id = ${openingId}::uuid
    `;
    this.logger.log(`Generated Stage 1 embedding for job opening ${openingId}.`);
    return true;
  }
}
