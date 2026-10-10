import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service.js';

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generates and persists the real Stage 1 candidate embedding (S8-RM-XX) that
 * docs/proposal-xgboost-reranker.md describes — distinct from the in-memory 6-dim domain
 * heuristic in vector-candidate-matcher.ts, which stays as the explainable radar-chart layer.
 *
 * Writes go through raw SQL because `CandidateEvidenceProfile.embedding` is an
 * `Unsupported("vector(1536)")` column — Prisma's query engine can't read or write it via the
 * normal client API.
 *
 * Owner: Ramansh.
 */
@Injectable()
export class CandidateEmbeddingService {
  private readonly logger = new Logger(CandidateEmbeddingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiGatewayService) private readonly aiGateway: AiGatewayService,
  ) {}

  /** A short, stable text summary of a candidate's verified profile. Null when there's nothing
   * meaningful to embed yet (no track, no verified skills). */
  async buildProfileText(studentId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        primaryTrack: { select: { code: true, name: true } },
      },
    });
    if (!user) return null;

    const verifiedSkills = await this.prisma.skillClaim.findMany({
      where: {
        studentId,
        status: 'VERIFIED',
        OR: [{ verifiedUntil: null }, { verifiedUntil: { gt: new Date() } }],
      },
      select: {
        proficiency: true,
        finalProficiency: true,
        skill: { select: { name: true } },
      },
    });

    const skillLines = verifiedSkills
      .map((s) => `${s.skill.name} (${s.finalProficiency ?? s.proficiency})`)
      .join(', ');

    if (!user.primaryTrack && !skillLines) return null;

    return [
      user.primaryTrack ? `Track: ${user.primaryTrack.name} (${user.primaryTrack.code})` : null,
      skillLines ? `Verified skills: ${skillLines}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n');
  }

  /**
   * Generates and upserts a candidate's Stage 1 embedding. Returns false (no-op) when the
   * candidate doesn't yet have enough verified profile data to embed meaningfully — callers
   * should treat that as "try again later", not an error.
   */
  async generateAndStoreEmbedding(studentId: string): Promise<boolean> {
    const text = await this.buildProfileText(studentId);
    if (!text) return false;

    const embedding = await this.aiGateway.embedText(text);
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected a ${EMBEDDING_DIMENSIONS}-dim embedding for candidate ${studentId}, got ${embedding.length}.`,
      );
    }
    const vectorLiteral = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO candidate_evidence_profiles (id, student_id, embedding, embedding_updated_at, updated_at)
      VALUES (gen_random_uuid(), ${studentId}::uuid, ${vectorLiteral}::vector, now(), now())
      ON CONFLICT (student_id) DO UPDATE
      SET embedding = ${vectorLiteral}::vector, embedding_updated_at = now(), updated_at = now()
    `;
    this.logger.log(`Generated Stage 1 embedding for candidate ${studentId}.`);
    return true;
  }
}
