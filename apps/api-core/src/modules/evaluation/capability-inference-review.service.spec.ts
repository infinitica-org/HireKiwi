import { describe, expect, it, vi } from 'vitest';
import { CapabilityInferenceReviewService } from './capability-inference-review.service.js';

const CAP_ID = 'aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee';

describe('CapabilityInferenceReviewService', () => {
  it('lists low-confidence capabilities for admin review', async () => {
    const inferredAt = new Date('2026-03-01T12:00:00.000Z');
    const findMany = vi.fn().mockResolvedValue([
      {
        id: CAP_ID,
        studentId: '11111111-1111-4111-8111-111111111111',
        skillCode: 'SQL_QUERY_OPTIMIZATION',
        capabilityLabel: 'Query tuning',
        proficiency: 'BEGINNER',
        confidenceScore: 0.42,
        modelVersion: 'fusion:v1|skill@1|capability-inference-v1',
        inferredAt,
      },
    ]);
    const service = new CapabilityInferenceReviewService(
      { studentCapability: { findMany } } as never,
      { recomputeForSkill: vi.fn() } as never,
    );

    const result = await service.listReviewQueue(10);

    expect(findMany).toHaveBeenCalledWith({
      where: { confidenceScore: { lt: 0.55 } },
      orderBy: { inferredAt: 'desc' },
      take: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.capabilityId).toBe(CAP_ID);
    expect(result.items[0]?.inferredAt).toBe(inferredAt.toISOString());
  });

  it("shows an institution admin only its own students' capabilities (S6-VV-153)", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const findFirst = vi.fn().mockResolvedValue(null);
    const update = vi.fn();
    const service = new CapabilityInferenceReviewService(
      { studentCapability: { findMany, findFirst, update } } as never,
      { recomputeForSkill: vi.fn() } as never,
    );

    await service.listReviewQueue(10, 'inst-a');
    expect(findMany.mock.calls[0]?.[0].where).toEqual({
      confidenceScore: { lt: 0.55 },
      student: { institutionId: 'inst-a' },
    });

    await expect(
      service.correctCapability(
        CAP_ID,
        { proficiency: 'INTERMEDIATE', reviewerNote: 'Checked the transcript.' },
        'tpo-a',
        'inst-a',
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(findFirst.mock.calls[0]?.[0].where).toEqual({
      id: CAP_ID,
      student: { institutionId: 'inst-a' },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('updates low-confidence capability and recomputes skill inference', async () => {
    const update = vi.fn().mockResolvedValue({
      id: CAP_ID,
      studentId: '11111111-1111-4111-8111-111111111111',
      skillCode: 'SQL_QUERY_OPTIMIZATION',
      proficiency: 'INTERMEDIATE',
      confidenceScore: 0.75,
      capabilityLabel: 'Query tuning',
    });
    const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-1' });
    const skillInference = { recomputeForSkill: vi.fn().mockResolvedValue({}) };
    const service = new CapabilityInferenceReviewService(
      {
        studentCapability: {
          findFirst: vi.fn().mockResolvedValue({
            id: CAP_ID,
            studentId: '11111111-1111-4111-8111-111111111111',
            skillCode: 'SQL_QUERY_OPTIMIZATION',
            proficiency: 'BEGINNER',
            confidenceScore: 0.4,
            capabilityLabel: 'Query tuning',
          }),
          update,
        },
        auditLog: {
          create: auditCreate,
        },
      } as never,
      skillInference as never,
    );

    const result = await service.correctCapability(
      CAP_ID,
      { proficiency: 'INTERMEDIATE', reviewerNote: 'Reviewer validated transcript evidence.' },
      '22222222-2222-4222-8222-222222222222',
    );

    expect(result.proficiency).toBe('INTERMEDIATE');
    expect(skillInference.recomputeForSkill).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'SQL_QUERY_OPTIMIZATION',
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: '22222222-2222-4222-8222-222222222222',
        action: 'capability_inference.corrected',
        resourceType: 'student_capability',
        resourceId: CAP_ID,
        metadata: expect.objectContaining({
          prior: { proficiency: 'BEGINNER', confidenceScore: 0.4 },
          updated: { proficiency: 'INTERMEDIATE', confidenceScore: 0.75 },
          reviewerNote: 'Reviewer validated transcript evidence.',
        }),
      }),
    });
  });
});
