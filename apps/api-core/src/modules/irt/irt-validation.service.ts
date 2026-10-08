import { Inject, Injectable } from '@nestjs/common';
import { validateIrtAgainstV1, type IrtValidationReport } from '@hirekiwi/scoring-engine';
import { PrismaService } from '../../platform/prisma/prisma.service.js';

/**
 * Compares shadow IRT theta estimates against the live v1 weighted score for
 * the same attempts and reports whether the calibration is even a candidate
 * for promotion out of shadow mode. This never writes anything and never
 * flips anything live — it's read-only, same as
 * `validateIrtAgainstV1` itself. A human reads this report and decides.
 *
 * Owner: Ramansh.
 */
@Injectable()
export class IrtValidationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async validateLevel(levelId: string): Promise<IrtValidationReport> {
    const rows = await this.prisma.irtShadowEstimate.findMany({
      where: { theta: { not: null }, attempt: { levelId } },
      select: {
        attemptId: true,
        theta: true,
        attempt: { select: { result: { select: { rawScore: true } } } },
      },
    });

    const pairs = rows.flatMap((r) => {
      if (!r.attempt.result) return [];
      return [
        {
          attemptId: r.attemptId,
          theta: Number(r.theta),
          v1Score: Number(r.attempt.result.rawScore),
        },
      ];
    });

    return validateIrtAgainstV1(pairs);
  }
}
