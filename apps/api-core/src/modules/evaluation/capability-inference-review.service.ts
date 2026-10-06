import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CorrectStudentCapabilityRequestSchema,
  CorrectStudentCapabilityResponseSchema,
  ListCapabilityInferenceReviewQueueResponseSchema,
  UuidSchema,
} from '@hirekiwi/contracts';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { EvidenceSkillInferenceService } from '../evidence/evidence-skill-inference.service.js';

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

@Injectable()
export class CapabilityInferenceReviewService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EvidenceSkillInferenceService)
    private readonly skillInference: EvidenceSkillInferenceService,
  ) {}

  /** `institutionId` null = platform-wide (SUPER_ADMIN); otherwise that institution's students only. */
  async listReviewQueue(limit = 50, institutionId: string | null = null) {
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.studentCapability.findMany({
      where: {
        confidenceScore: { lt: LOW_CONFIDENCE_THRESHOLD },
        ...(institutionId ? { student: { institutionId } } : {}),
      },
      orderBy: { inferredAt: 'desc' },
      take,
    });

    return ListCapabilityInferenceReviewQueueResponseSchema.parse({
      items: rows.map((row) => ({
        capabilityId: row.id,
        studentId: row.studentId,
        skillCode: row.skillCode,
        capabilityLabel: row.capabilityLabel,
        proficiency: row.proficiency,
        confidenceScore: row.confidenceScore,
        modelVersion: row.modelVersion,
        inferredAt: row.inferredAt.toISOString(),
      })),
    });
  }

  async correctCapability(
    capabilityId: string,
    body: unknown,
    reviewerId: string,
    institutionId: string | null = null,
  ) {
    const id = UuidSchema.parse(capabilityId);
    const request = CorrectStudentCapabilityRequestSchema.parse(body);
    if (request.proficiency === undefined && request.confidenceScore === undefined) {
      throw new BadRequestException({
        error: 'no_corrections',
        message: 'Provide proficiency or confidenceScore to correct.',
        statusCode: 400,
      });
    }

    // Another institution's student's row is indistinguishable from a missing one (S6-VV-153).
    const row = await this.prisma.studentCapability.findFirst({
      where: { id, ...(institutionId ? { student: { institutionId } } : {}) },
    });
    if (!row) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Capability inference row not found.',
        statusCode: 404,
      });
    }

    if (row.confidenceScore >= LOW_CONFIDENCE_THRESHOLD && !request.proficiency) {
      throw new BadRequestException({
        error: 'confidence_not_low',
        message: 'Only low-confidence capabilities can be approved without a proficiency change.',
        statusCode: 400,
      });
    }

    const updated = await this.prisma.studentCapability.update({
      where: { id },
      data: {
        proficiency: request.proficiency ?? row.proficiency,
        confidenceScore: request.confidenceScore ?? Math.max(row.confidenceScore, 0.7),
        capabilityLabel: row.capabilityLabel.includes('[reviewer]')
          ? row.capabilityLabel
          : `${row.capabilityLabel} [reviewer: ${request.reviewerNote.slice(0, 120)}]`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'capability_inference.corrected',
        resourceType: 'student_capability',
        resourceId: id,
        reasonCode: request.reviewerNote.slice(0, 120),
        metadata: {
          studentId: row.studentId,
          skillCode: row.skillCode,
          prior: {
            proficiency: row.proficiency,
            confidenceScore: row.confidenceScore,
          },
          updated: {
            proficiency: updated.proficiency,
            confidenceScore: updated.confidenceScore,
          },
          reviewerNote: request.reviewerNote,
        },
      },
    });

    if (row.skillCode) {
      await this.skillInference.recomputeForSkill(row.studentId, row.skillCode);
    }

    return CorrectStudentCapabilityResponseSchema.parse({
      capabilityId: updated.id,
      proficiency: updated.proficiency,
      confidenceScore: updated.confidenceScore,
      reviewerId,
      correctedAt: new Date().toISOString(),
    });
  }
}
