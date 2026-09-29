import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvalCompletedEvent } from '@smart/contracts';
import { SMART_TOPICS } from '@smart/contracts';
import { CertificateService } from './certificate.service.js';
import type { PrismaService } from '../../platform/prisma/prisma.service.js';
import type { KafkaOutboxService } from '../../platform/kafka/kafka-outbox.service.js';
import type { StorageService } from '../../platform/storage/storage.service.js';
import type { Queue } from 'bullmq';

describe('CertificateService', () => {
  let service: CertificateService;
  let mockPrisma: any;
  let mockOutbox: Partial<KafkaOutboxService>;
  let mockStorage: Partial<StorageService>;
  let mockPdfQueue: Partial<Queue>;

  const studentId = '22222222-2222-4222-8222-222222222222';
  const attemptId = '33333333-3333-4333-8333-333333333333';
  const trackId = '44444444-4444-4444-8444-444444444444';

  const sampleTrack = {
    id: trackId,
    code: 'TECH_FULLSTACK',
    name: 'Fullstack Engineering',
    levels: [
      { levelNumber: 1, name: 'Foundational Knowledge' },
      { levelNumber: 2, name: 'System Implementation' },
      { levelNumber: 3, name: 'Architecture & Scale' },
    ],
  };

  beforeEach(() => {
    mockPrisma = {
      attempt: {
        findUnique: vi.fn(),
      },
      track: {
        findFirst: vi.fn().mockResolvedValue(sampleTrack),
      },
      certificate: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    mockOutbox = {
      enqueueEnvelope: vi.fn().mockResolvedValue(undefined),
    };

    mockStorage = {
      putObjectBuffer: vi.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: vi.fn().mockResolvedValue('https://storage.smart.local/signed-url'),
    };

    mockPdfQueue = {
      add: vi.fn().mockResolvedValue({} as any),
    };

    service = new CertificateService(
      mockPrisma as PrismaService,
      mockOutbox as KafkaOutboxService,
      mockStorage as StorageService,
      mockPdfQueue as Queue,
    );
  });

  const baseEvent = (overrides: Partial<EvalCompletedEvent['data']> = {}): EvalCompletedEvent => ({
    id: '11111111-1111-4111-8111-111111111111',
    topic: SMART_TOPICS.evalCompleted,
    partitionKey: attemptId,
    source: 'evaluation',
    timestamp: '2026-09-29T12:00:00Z',
    data: {
      attemptId,
      studentId,
      trackCode: 'TECH_FULLSTACK',
      levelNumber: 1,
      rawScore: 88,
      tierAwarded: 'GOLD',
      confidenceBand: '75-95',
      borderline: false,
      cutScoreSetId: '55555555-5555-4555-8555-555555555555',
      cohensKappa: 0.9,
      humanReviewed: false,
      provider: 'ANTHROPIC',
      usedFallback: false,
      competencyScores: [],
      evaluatedAt: '2026-09-29T12:00:00Z',
      ...overrides,
    },
  });

  it('1. BELOW_BRONZE does not produce or upgrade a certificate', async () => {
    const event = baseEvent({ tierAwarded: 'BELOW_BRONZE' });

    await service.issueFromEvalCompleted(event);

    expect(mockPrisma.certificate.create).not.toHaveBeenCalled();
    expect(mockPrisma.certificate.update).not.toHaveBeenCalled();
    expect(mockOutbox.enqueueEnvelope).not.toHaveBeenCalled();
  });

  it('2. Invalid integrity blocks issuance and leaves certificate uncreated', async () => {
    mockPrisma.attempt.findUnique.mockResolvedValue({
      integrityFlag: 'FLAGGED',
    });

    const event = baseEvent({ attemptId, tierAwarded: 'GOLD' });

    await service.issueFromEvalCompleted(event);

    expect(mockPrisma.certificate.create).not.toHaveBeenCalled();
    expect(mockPrisma.certificate.update).not.toHaveBeenCalled();
    expect(mockOutbox.enqueueEnvelope).not.toHaveBeenCalled();
  });

  it('3. Tier Trail merges L1 -> L2 -> L3 correctly and preserves existing tiers', async () => {
    const existingCertId = '66666666-6666-4666-8666-666666666666';
    mockPrisma.attempt.findUnique.mockResolvedValue({ integrityFlag: 'CLEAN' });
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: existingCertId,
      userId: studentId,
      trackId: sampleTrack.id,
      highestLevelCleared: 1,
      headlineTier: 'SILVER',
      tierTrail: { L1: 'SILVER' },
      verificationSlug: 'slug123',
    });

    mockPrisma.certificate.update.mockResolvedValue({
      id: existingCertId,
      highestLevelCleared: 2,
      headlineTier: 'GOLD',
      tierTrail: { L1: 'SILVER', L2: 'GOLD' },
      verificationSlug: 'slug123',
    });

    const event = baseEvent({ levelNumber: 2, tierAwarded: 'GOLD' });

    await service.issueFromEvalCompleted(event);

    expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existingCertId },
        data: expect.objectContaining({
          highestLevelCleared: 2,
          headlineTier: 'GOLD',
          tierTrail: { L1: 'SILVER', L2: 'GOLD' },
          status: 'ISSUED',
        }),
      }),
    );
  });

  it('4. Highest cleared level is correct when level is cleared', async () => {
    mockPrisma.attempt.findUnique.mockResolvedValue({ integrityFlag: 'CLEAN' });
    mockPrisma.certificate.findFirst.mockResolvedValue(null);

    mockPrisma.certificate.create.mockImplementation((args: any) => ({
      ...args.data,
      id: args.data.id || '77777777-7777-4777-8777-777777777777',
    }));

    const event = baseEvent({ levelNumber: 1, tierAwarded: 'BRONZE' });
    await service.issueFromEvalCompleted(event);

    expect(mockPrisma.certificate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          highestLevelCleared: 1,
          headlineTier: 'BRONZE',
        }),
      }),
    );
  });

  it('5. Headline tier matches the tier at the highest cleared level', async () => {
    const existingCertId = '88888888-8888-4888-8888-888888888888';
    mockPrisma.attempt.findUnique.mockResolvedValue({ integrityFlag: 'CLEAN' });
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: existingCertId,
      userId: studentId,
      trackId: sampleTrack.id,
      highestLevelCleared: 1,
      headlineTier: 'GOLD',
      tierTrail: { L1: 'GOLD' },
    });

    mockPrisma.certificate.update.mockImplementation((args: any) => ({
      ...args.data,
      id: existingCertId,
    }));

    const event = baseEvent({ levelNumber: 2, tierAwarded: 'SILVER' });
    await service.issueFromEvalCompleted(event);

    expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          highestLevelCleared: 2,
          headlineTier: 'SILVER',
        }),
      }),
    );
  });

  it('12. QR is generated and uploaded through StorageService during issuance', async () => {
    mockPrisma.attempt.findUnique.mockResolvedValue({ integrityFlag: 'CLEAN' });
    mockPrisma.certificate.findFirst.mockResolvedValue(null);
    mockPrisma.certificate.create.mockImplementation((args: any) => ({
      ...args.data,
    }));

    const event = baseEvent({ levelNumber: 1, tierAwarded: 'GOLD' });
    await service.issueFromEvalCompleted(event);

    expect(mockStorage.putObjectBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        objectKey: expect.stringMatching(/^certificates\/qr\/.+\.svg$/),
        contentType: 'image/svg+xml',
      }),
    );
  });

  it('15. smart.certificate.issued is emitted exactly once for successful issuance', async () => {
    mockPrisma.attempt.findUnique.mockResolvedValue({ integrityFlag: 'CLEAN' });
    mockPrisma.certificate.findFirst.mockResolvedValue(null);
    mockPrisma.certificate.create.mockImplementation((args: any) => ({
      ...args.data,
    }));

    const event = baseEvent({ levelNumber: 1, tierAwarded: 'GOLD' });
    await service.issueFromEvalCompleted(event);

    expect(mockOutbox.enqueueEnvelope).toHaveBeenCalledTimes(1);
    expect(mockOutbox.enqueueEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: SMART_TOPICS.certificateIssued,
        eventType: SMART_TOPICS.certificateIssued,
        data: expect.objectContaining({
          headlineTier: 'GOLD',
          highestLevelCleared: 1,
          verificationUrl: expect.stringMatching(/\/cert\/[0-9a-f-]+[?]sig=/),
        }),
      }),
    );
  });

  it('Public verification verifies cryptographic signature correctly and rejects invalid status', async () => {
    const certId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const issuedAt = new Date('2026-09-29T12:00:00Z');

    const { signCertificatePayload } = await import('./certificate-crypto.util.js');
    const { env } = await import('../../platform/config/env.js');
    const validSignature = signCertificatePayload(
      {
        certificateId: certId,
        studentId,
        trackId: sampleTrack.id,
        highestLevelCleared: 2,
        headlineTier: 'GOLD',
        issuedAt: issuedAt.toISOString(),
      },
      env.CERTIFICATE_MASTER_SECRET,
    );

    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: certId,
      userId: studentId,
      trackId: sampleTrack.id,
      highestLevelCleared: 2,
      headlineTier: 'GOLD',
      tierTrail: { L1: 'GOLD', L2: 'GOLD' },
      signature: validSignature,
      status: 'ISSUED',
      issuedAt,
      user: { fullName: 'Priya Patel' },
      track: sampleTrack,
    });

    const result = await service.getPublicVerification(certId, validSignature);

    expect(result.signatureValid).toBe(true);
    expect(result.candidateName).toBe('Priya Patel');
    expect(result.headlineTier).toBe('GOLD');
    expect(result.tierTrail).toHaveLength(2);
  });

  it('Public verification returns signatureValid=false if status is REVOKED', async () => {
    const certId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: certId,
      userId: studentId,
      trackId: sampleTrack.id,
      highestLevelCleared: 1,
      headlineTier: 'BRONZE',
      tierTrail: { L1: 'BRONZE' },
      signature: 'some-sig',
      status: 'REVOKED',
      issuedAt: new Date(),
      user: { fullName: 'Priya' },
      track: sampleTrack,
    });

    const result = await service.getPublicVerification(certId);
    expect(result.signatureValid).toBe(false);
    expect(result.status).toBe('REVOKED');
  });
});
