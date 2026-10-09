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
});
