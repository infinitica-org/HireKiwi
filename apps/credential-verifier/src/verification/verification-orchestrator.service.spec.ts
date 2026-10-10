import { describe, expect, it, vi } from 'vitest';
import { VerificationOrchestratorService } from './verification-orchestrator.service.js';

/**
 * Regression coverage for two bugs found during a live concurrency test:
 *
 * 1. Two concurrent submit() calls for the same credential both passed the
 *    findUnique-no-row check before either inserted (TOCTOU), so the
 *    loser's credential.create() threw a real Postgres unique constraint
 *    violation (P2002) that went uncaught — a 500 for what is, from the
 *    caller's perspective, a perfectly normal duplicate submission.
 * 2. Even once (1) was fixed so every concurrent caller gets the same
 *    verificationId back, the controller still enqueued one BullMQ job per
 *    caller. run() used createMany for checks/evidence with no cleanup
 *    first, so N concurrent (or retried) runs of the same verification
 *    appended N copies of every check/evidence row instead of one.
 */
describe('VerificationOrchestratorService — concurrency', () => {
  function makePrismaStub(overrides: Record<string, unknown> = {}) {
    return {
      verification: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
      credential: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      issuer: { upsert: vi.fn() },
      subject: { create: vi.fn() },
      achievement: { create: vi.fn() },
      verificationCheck: { createMany: vi.fn(), deleteMany: vi.fn() },
      verificationEvidence: { createMany: vi.fn(), deleteMany: vi.fn() },
      verificationAttempt: { create: vi.fn().mockResolvedValue({ id: 'attempt-1' }) },
      $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
      ...overrides,
    };
  }

  function makeRedisStub() {
    return { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue('OK') };
  }

  it('submit() recovers from a P2002 unique-constraint race instead of throwing', async () => {
    const sourceIdentifier = 'PASTED_TEXT:race-value';
    const winnerCredential = { id: 'cred-winner', sourceIdentifier };
    const winnerVerification = { id: 'ver-winner', credentialId: 'cred-winner' };

    const prisma = makePrismaStub();
    // First findUnique (pre-insert check): no row yet -- both "requests" race past this.
    prisma.credential.findUnique.mockResolvedValueOnce(null);
    prisma.issuer.upsert.mockResolvedValue({ id: 'issuer-1' });
    prisma.subject.create.mockResolvedValue({ id: 'subject-1' });
    prisma.achievement.create.mockResolvedValue({ id: 'achievement-1' });
    // This caller loses the race: Postgres rejects the insert.
    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prisma.credential.create.mockRejectedValueOnce(p2002);
    // Recovery path re-looks-up the row the winner already inserted.
    prisma.credential.findUnique.mockResolvedValueOnce(winnerCredential);
    prisma.verification.findFirst.mockResolvedValueOnce(winnerVerification);

    const orchestrator = new VerificationOrchestratorService(
      prisma as any,
      makeRedisStub() as any,
      { resolve: (r: any) => r, sourceIdentifier: () => sourceIdentifier } as any,
      { detect: () => ({ candidateIssuer: null, candidateDomain: null, signals: [] }) } as any,
      {} as any,
    );

    const result = await orchestrator.submit({ inputType: 'PASTED_TEXT', value: 'race-value' });

    expect(result.verificationId).toBe('ver-winner');
    expect(result.credentialId).toBe('cred-winner');
    expect(result.status).toBe('VERIFICATION_PENDING');
  });

  it('run() clears prior checks/evidence before re-inserting, so a second run never duplicates rows', async () => {
    const prisma = makePrismaStub();
    const credential = {
      id: 'cred-1',
      source: 'PASTED_TEXT',
      sourceIdentifier: 'PASTED_TEXT:value',
      rawMetadata: {},
    };
    prisma.verification.findUnique.mockResolvedValue({
      id: 'ver-1',
      credentialId: 'cred-1',
      credential,
      checks: [],
      evidence: [],
    });

    const fallbackAdapter = {
      normalize: vi.fn().mockResolvedValue({}),
      verify: vi.fn().mockResolvedValue({
        status: 'UNVERIFIABLE',
        verificationLevel: 'UNVERIFIED',
        method: 'DOCUMENT_PARSE',
        provider: null,
        verifiedAt: null,
        checks: [
          { checkName: 'issuer', result: 'UNKNOWN', detail: 'No adapter recognized this input.' },
        ],
        evidence: [],
        evidenceUrl: null,
        rawResponse: null,
      }),
    };

    const orchestrator = new VerificationOrchestratorService(
      prisma as any,
      makeRedisStub() as any,
      {} as any,
      {} as any,
      { resolve: () => fallbackAdapter } as any,
    );

    await orchestrator.run('ver-1');

    const transactionOps = prisma.$transaction.mock.calls[0][0] as unknown[];
    // deleteMany calls must run (and therefore appear in the transaction array)
    // before the createMany calls that follow them.
    expect(prisma.verificationCheck.deleteMany).toHaveBeenCalledWith({
      where: { verificationId: 'ver-1' },
    });
    expect(prisma.verificationEvidence.deleteMany).toHaveBeenCalledWith({
      where: { verificationId: 'ver-1' },
    });
    expect(transactionOps.length).toBeGreaterThanOrEqual(6);
  });

  describe('submit() for a credential seen before', () => {
    const sourceIdentifier = 'URL:https://www.credly.com/badges/x';
    function orchestratorWith(prisma: ReturnType<typeof makePrismaStub>, redis = makeRedisStub()) {
      return new VerificationOrchestratorService(
        prisma as any,
        redis as any,
        { resolve: (r: any) => r, sourceIdentifier: () => sourceIdentifier } as any,
        {} as any,
        {} as any,
      );
    }

    it('starts a fresh run once the cached result has expired, instead of returning the stale one', async () => {
      const prisma = makePrismaStub();
      prisma.credential.findUnique.mockResolvedValue({ id: 'cred-1', status: 'UNVERIFIABLE' });
      prisma.verification.findFirst.mockResolvedValue({ id: 'ver-old', credentialId: 'cred-1' });
      prisma.verification.create.mockResolvedValue({ id: 'ver-new' });

      const result = await orchestratorWith(prisma).submit({ inputType: 'URL', value: 'x' });

      expect(result).toEqual({
        verificationId: 'ver-new',
        credentialId: 'cred-1',
        status: 'VERIFICATION_PENDING',
      });
      expect(prisma.credential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: { status: 'VERIFICATION_PENDING' },
      });
    });

    it('reuses a run that is still in flight', async () => {
      const prisma = makePrismaStub();
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        status: 'VERIFICATION_PENDING',
      });
      prisma.verification.findFirst.mockResolvedValue({
        id: 'ver-running',
        credentialId: 'cred-1',
      });

      const result = await orchestratorWith(prisma).submit({ inputType: 'URL', value: 'x' });

      expect(result.verificationId).toBe('ver-running');
      expect(prisma.verification.create).not.toHaveBeenCalled();
    });

    it('refresh skips a cached result and drops it', async () => {
      const prisma = makePrismaStub();
      prisma.credential.findUnique.mockResolvedValue({ id: 'cred-1', status: 'VERIFIED' });
      prisma.verification.findFirst.mockResolvedValue({ id: 'ver-old', credentialId: 'cred-1' });
      prisma.verification.create.mockResolvedValue({ id: 'ver-new' });
      const redis = {
        ...makeRedisStub(),
        get: vi.fn().mockResolvedValue(JSON.stringify({ verificationId: 'ver-old' })),
        del: vi.fn().mockResolvedValue(1),
      };

      const result = await orchestratorWith(prisma, redis).submit(
        { inputType: 'URL', value: 'x' },
        { refresh: true },
      );

      expect(result.verificationId).toBe('ver-new');
      expect(redis.del).toHaveBeenCalledWith(`verification:result:${sourceIdentifier}`);
      expect(redis.get).not.toHaveBeenCalled();
    });
  });
});
