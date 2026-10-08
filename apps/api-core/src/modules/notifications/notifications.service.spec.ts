import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  it('creates in-app notification and enqueues email', async () => {
    const userId = randomUUID();
    const createdAt = new Date('2026-09-02T10:00:00.000Z');
    const prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: randomUUID(),
          kind: 'OPPORTUNITY',
          title: 'Shortlisted for Backend Engineer',
          body: 'You have been shortlisted.',
          linkUrl: 'http://localhost:3001/applications',
          readAt: null,
          createdAt,
        }),
      },
    };
    const emailQueue = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    const service = new NotificationsService(prisma as never, emailQueue as never);
    const dto = await service.notifyOpportunityShortlisted({
      userId,
      email: 'student@hirekiwi.local',
      fullName: 'Alex Student',
      companyName: 'Infinitica Labs',
      roleTitle: 'Backend Engineer',
      applicationId: randomUUID(),
      openingId: randomUUID(),
    });

    expect(prisma.notification.create).toHaveBeenCalledOnce();
    expect(emailQueue.add).toHaveBeenCalledOnce();
    expect(dto.kind).toBe('OPPORTUNITY');
    expect(dto.title).toContain('Backend Engineer');
  });

  it('CO-T05: sends distinct title/body copy per target stage, not one generic message', async () => {
    const stages = ['AI_VERIFIED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'] as const;
    const seen: { stage: string; title: string; body: string }[] = [];

    for (const toStage of stages) {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn(({ data }: { data: { title: string; body: string; kind: string } }) =>
            Promise.resolve({
              id: randomUUID(),
              kind: data.kind,
              title: data.title,
              body: data.body,
              linkUrl: null,
              readAt: null,
              createdAt: new Date('2026-09-05T00:00:00.000Z'),
            }),
          ),
        },
      };
      const emailQueue = { add: vi.fn().mockResolvedValue(undefined) };
      const service = new NotificationsService(prisma as never, emailQueue as never);

      const dto = await service.notifyStageChange({
        userId: randomUUID(),
        email: 'student@hirekiwi.local',
        fullName: 'Alex Student',
        companyName: 'Infinitica Labs',
        roleTitle: 'Backend Engineer',
        fromStage: 'SHORTLISTED',
        toStage,
        applicationId: randomUUID(),
      });

      expect(dto.kind).toBe('STAGE_CHANGE');
      expect(dto.title).toContain('Backend Engineer');
      seen.push({ stage: toStage, title: dto.title, body: dto.body });
    }

    const titles = new Set(seen.map((row) => row.title));
    const bodies = new Set(seen.map((row) => row.body));
    expect(titles.size).toBe(stages.length);
    expect(bodies.size).toBe(stages.length);
  });

  it('SKL-02 I312: notifies student when evidence-fused skill level changes', async () => {
    const userId = randomUUID();
    const prisma = {
      notification: {
        create: vi.fn(({ data }: { data: { title: string; body: string; kind: string } }) =>
          Promise.resolve({
            id: randomUUID(),
            kind: data.kind,
            title: data.title,
            body: data.body,
            linkUrl: 'http://localhost:3001/assessments/skills',
            readAt: null,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
          }),
        ),
      },
    };
    const emailQueue = { add: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationsService(prisma as never, emailQueue as never);

    const dto = await service.notifySkillInferenceLevelChange({
      userId,
      email: 'student@hirekiwi.local',
      fullName: 'Alex Student',
      skillCode: 'SQL_QUERY_OPTIMIZATION',
      previousLevel: 'BEGINNER',
      newLevel: 'INTERMEDIATE',
      confidence: 'MEDIUM',
      outcome: 'INFERRED',
    });

    expect(dto.title).toContain('SQL_QUERY_OPTIMIZATION');
    expect(dto.body).toContain('separate from your verified claim');
    expect(emailQueue.add).toHaveBeenCalledOnce();
  });
  describe('APP-01 dedupe (Th6-389/395)', () => {
    const row = (over: Record<string, unknown> = {}) => ({
      id: randomUUID(),
      kind: 'APPLICATION',
      title: 't',
      body: 'b',
      linkUrl: null,
      readAt: null,
      createdAt: new Date('2026-09-25T00:00:00.000Z'),
      ...over,
    });
    const params = () => ({
      userId: randomUUID(),
      email: 'student@hirekiwi.local',
      fullName: 'Alex Student',
      companyName: 'Acme',
      roleTitle: 'Engineer',
      applicationId: 'app-1',
      referenceNumber: 'APP-1234ABCD',
    });

    it('sends the submitted confirmation once and stores its dedupe key', async () => {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(row()),
        },
      };
      const emailQueue = { add: vi.fn().mockResolvedValue(undefined) };
      const service = new NotificationsService(prisma as never, emailQueue as never);
      await service.notifyApplicationSubmitted(params());
      expect(prisma.notification.create.mock.calls[0]?.[0].data.dedupeKey).toBe(
        'application:app-1:submitted',
      );
      expect(emailQueue.add.mock.calls[0]?.[1].template).toBe('application-submitted');
    });

    it('a retry with the same key sends no second notification or email', async () => {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(row()),
          create: vi.fn(),
        },
      };
      const emailQueue = { add: vi.fn() };
      const service = new NotificationsService(prisma as never, emailQueue as never);
      await service.notifyApplicationSubmitted(params());
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('returns the winner and sends nothing when a concurrent call takes the key first', async () => {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(row()),
          create: vi.fn().mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' })),
        },
      };
      const emailQueue = { add: vi.fn() };
      const service = new NotificationsService(prisma as never, emailQueue as never);
      await expect(service.notifyApplicationSubmitted(params())).resolves.toBeDefined();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('keys status-change notifications per application and target status', async () => {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(row({ kind: 'STAGE_CHANGE' })),
        },
      };
      const service = new NotificationsService(prisma as never, { add: vi.fn() } as never);
      await service.notifyStageChange({
        ...params(),
        fromStage: 'APPLIED',
        toStage: 'INTERVIEW',
      });
      expect(prisma.notification.create.mock.calls[0]?.[0].data.dedupeKey).toBe(
        'application:app-1:status:INTERVIEW',
      );
    });

    it('notifies each company member once per event', async () => {
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(row()),
        },
      };
      const service = new NotificationsService(prisma as never, { add: vi.fn() } as never);
      await service.notifyEmployerApplicant({
        kind: 'withdrawn',
        userId: 'member-1',
        email: 'hr@acme.test',
        recipientName: 'Hana',
        candidateName: 'Alex',
        roleTitle: 'Engineer',
        applicationId: 'app-1',
        openingId: 'job-1',
      });
      expect(prisma.notification.create.mock.calls[0]?.[0].data.dedupeKey).toBe(
        'application:app-1:employer:withdrawn:member-1',
      );
    });
  });

  describe('older call sites get dedupe keys too (S6-VV-122, #435)', () => {
    function harness() {
      const created = {
        id: 'n-1',
        kind: 'VERIFICATION_RESULT',
        title: 't',
        body: 'b',
        linkUrl: null,
        readAt: null,
        createdAt: new Date('2026-09-28T00:00:00.000Z'),
      };
      const prisma = {
        notification: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(created),
        },
      };
      const emailQueue = { add: vi.fn().mockResolvedValue(undefined) };
      const service = new NotificationsService(prisma as never, emailQueue as never);
      const keyOf = () => prisma.notification.create.mock.calls[0]?.[0].data.dedupeKey;
      return { prisma, emailQueue, service, keyOf };
    }
    const student = { userId: 'u-1', email: 'student@hirekiwi.local', fullName: 'Alex Student' };

    it('keys a verification result on its Kafka event id', async () => {
      const { service, keyOf } = harness();
      await service.notifyVerificationResult({
        ...student,
        skillName: 'SQL',
        status: 'VERIFIED',
        detail: 'Passed.',
        claimId: 'claim-1',
        eventId: 'evt-1',
      });
      expect(keyOf()).toBe('skill-verification:evt-1');
    });

    it('keys an evidence-fusion level change on its Kafka event id', async () => {
      const { service, keyOf } = harness();
      await service.notifySkillInferenceLevelChange({
        ...student,
        skillCode: 'SQL',
        previousLevel: null,
        newLevel: 'INTERMEDIATE',
        confidence: 'HIGH',
        outcome: 'INFERRED',
        eventId: 'evt-2',
      });
      expect(keyOf()).toBe('skill-inference:evt-2');
    });

    it('shares the stage-change key for a shortlist, so one transition notifies once', async () => {
      const { service, keyOf } = harness();
      await service.notifyOpportunityShortlisted({
        ...student,
        companyName: 'Acme',
        roleTitle: 'Engineer',
        applicationId: 'app-1',
        openingId: 'job-1',
      });
      expect(keyOf()).toBe('application:app-1:status:SHORTLISTED');
    });

    it('uses the notification id as the email job id, so a retried enqueue sends once', async () => {
      const { service, emailQueue } = harness();
      await service.notifyVerificationResult({
        ...student,
        skillName: 'SQL',
        status: 'LOCKED',
        detail: 'Cooldown.',
        claimId: 'claim-1',
      });
      expect(emailQueue.add.mock.calls[0]?.[2]).toEqual({ jobId: 'notification-n-1' });
    });
  });
});
