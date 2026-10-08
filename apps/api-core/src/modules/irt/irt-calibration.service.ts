import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IRT_CALIBRATION_MIN_RESPONSES,
  estimateAbility,
  recalibrateLevel,
  type IrtItemParameterRecord,
  type IrtRawResponse,
} from '@hirekiwi/scoring-engine';
import { PrismaService } from '../../platform/prisma/prisma.service.js';

const IRT_MODEL_VERSION = 'irt-2pl-jmle-v1';

/**
 * A response is treated as "correct" for 2PL purposes when it earned (close
 * to) full credit. This is a simplifying assumption for shadow use only —
 * partial-credit item types (SANDBOX, DEFENSE, CAPSTONE) lose information
 * under a binary correct/incorrect collapse. Fine for shadow validation;
 * would need a graded-response IRT model, not 2PL, before this could ever
 * drive anything live for those formats.
 */
const CORRECT_THRESHOLD_RATIO = 0.999;

/**
 * Orchestrates IRT calibration and shadow ability estimation end-to-end for
 * one level: pull real responses, calibrate items (gated on
 * IRT_CALIBRATION_MIN_RESPONSES per item), persist the run and updated item
 * parameters, then produce a shadow theta for every completed attempt.
 *
 * Nothing here is read by v1 scoring (`LevelResult`, `Certificate`,
 * `calculatePersonJobFit`). This is purely additive, shadow infrastructure.
 *
 * Owner: Ramansh.
 */
@Injectable()
export class IrtCalibrationService {
  private readonly logger = new Logger(IrtCalibrationService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Runs (or re-runs) calibration for a level's item pool against every
   * recorded response, persists the run + updated item parameters, then
   * backfills shadow theta estimates for attempts that don't have one yet.
   */
  async runCalibrationForLevel(
    levelId: string,
    triggeredBy: string,
  ): Promise<{ runId: string; itemsCalibrated: number; itemsFrozen: number }> {
    const responses = await this.loadResponsesForLevel(levelId);
    const previousParameters = await this.loadPublishedItemParameters(levelId);

    const report = recalibrateLevel(levelId, responses, previousParameters, {
      minResponsesPerItem: IRT_CALIBRATION_MIN_RESPONSES,
      modelVersion: IRT_MODEL_VERSION,
    });

    const published = report.items.filter((i) => i.published && i.next);
    const frozen = report.items.filter((i) => !i.published);

    const run = await this.prisma.irtCalibrationRun.create({
      data: {
        levelId,
        itemsCalibrated: published.length,
        itemsFrozen: frozen.length,
        totalResponses: report.totalResponses,
        iterations: report.iterations,
        converged: report.converged,
        modelVersion: report.modelVersion,
        checksum: report.checksum,
        triggeredBy,
      },
    });

    for (const outcome of published) {
      // `published` was filtered on `i.published && i.next`, so `next` is non-null here,
      // but that filter doesn't narrow the type — guard explicitly instead of asserting.
      if (!outcome.next) continue;
      const next = outcome.next;
      await this.prisma.item.update({
        where: { id: outcome.itemId },
        data: {
          irtDiscrimination: next.discrimination,
          irtDifficulty: next.difficulty,
          irtCalibrationStatus: 'PROVISIONAL',
          irtSampleSize: next.sampleSize,
          irtCalibratedAt: run.createdAt,
          irtModelVersion: next.modelVersion,
        },
      });
    }

    this.logger.log(
      `IRT calibration run ${run.id} for level ${levelId}: ${published.length} published, ` +
        `${frozen.length} frozen, converged=${report.converged}, iterations=${report.iterations}`,
    );

    await this.backfillShadowEstimates(levelId, run.id);

    return { runId: run.id, itemsCalibrated: published.length, itemsFrozen: frozen.length };
  }

  /** Computes and persists a shadow theta for every completed attempt on this level that lacks one. */
  private async backfillShadowEstimates(levelId: string, calibrationRunId: string): Promise<void> {
    const calibratedItems = await this.prisma.item.findMany({
      where: { levelId, irtCalibrationStatus: { not: 'NOT_CALIBRATED' } },
      select: { id: true, irtDiscrimination: true, irtDifficulty: true },
    });
    const paramsByItemId = new Map(
      calibratedItems
        .filter((i) => i.irtDiscrimination != null && i.irtDifficulty != null)
        .map((i) => [
          i.id,
          {
            itemId: i.id,
            discrimination: Number(i.irtDiscrimination),
            difficulty: Number(i.irtDifficulty),
          },
        ]),
    );
    if (paramsByItemId.size === 0) return;

    const attempts = await this.prisma.attempt.findMany({
      where: {
        levelId,
        completedAt: { not: null },
        irtShadowEstimate: { is: null },
      },
      select: { id: true, responses: { select: { itemId: true, score: true, maxScore: true } } },
    });

    for (const attempt of attempts) {
      const usable = attempt.responses
        .filter((r) => paramsByItemId.has(r.itemId) && r.score != null)
        .flatMap((r) => {
          const item = paramsByItemId.get(r.itemId);
          if (!item) return [];
          return [
            { item, correct: Number(r.score) / Number(r.maxScore) >= CORRECT_THRESHOLD_RATIO },
          ];
        });
      const skipped = attempt.responses.length - usable.length;

      const theta = estimateAbility(usable);

      await this.prisma.irtShadowEstimate.create({
        data: {
          attemptId: attempt.id,
          calibrationRunId,
          theta,
          itemsUsed: usable.length,
          itemsSkippedUncalibrated: skipped,
          inconclusive: theta == null,
          modelVersion: IRT_MODEL_VERSION,
        },
      });
    }
  }

  private async loadResponsesForLevel(levelId: string): Promise<IrtRawResponse[]> {
    const responses = await this.prisma.response.findMany({
      where: { item: { levelId }, score: { not: null } },
      select: { itemId: true, score: true, maxScore: true, attempt: { select: { userId: true } } },
    });

    return responses.map((r) => ({
      examineeId: r.attempt.userId,
      itemId: r.itemId,
      correct: Number(r.score) / Number(r.maxScore) >= CORRECT_THRESHOLD_RATIO,
    }));
  }

  private async loadPublishedItemParameters(
    levelId: string,
  ): Promise<Map<string, IrtItemParameterRecord>> {
    const items = await this.prisma.item.findMany({
      where: { levelId, irtDiscrimination: { not: null }, irtDifficulty: { not: null } },
      select: {
        id: true,
        irtDiscrimination: true,
        irtDifficulty: true,
        irtSampleSize: true,
        irtModelVersion: true,
      },
    });

    return new Map(
      items.map((i) => [
        i.id,
        {
          itemId: i.id,
          discrimination: Number(i.irtDiscrimination),
          difficulty: Number(i.irtDifficulty),
          sampleSize: i.irtSampleSize ?? 0,
          modelVersion: i.irtModelVersion ?? IRT_MODEL_VERSION,
        },
      ]),
    );
  }
}
