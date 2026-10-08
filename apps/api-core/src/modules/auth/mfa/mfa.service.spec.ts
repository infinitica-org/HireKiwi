import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encryptSecret } from '../../../platform/crypto/secret-cipher.util.js';
import { env } from '../../../platform/config/env.js';
import { hashPassword } from '../password-hash.util.js';
import { generateTotp, generateTotpSecret } from './totp.util.js';
import { MfaService } from './mfa.service.js';

function buildPrisma() {
  const recoveryCodeRows: Array<{
    id: string;
    userId: string;
    codeHash: string;
    usedAt: Date | null;
  }> = [];
  const userStore = new Map<
    string,
    { mfaEnabled: boolean; mfaSecretEncrypted: string | null; email: string }
  >();

  return {
    userStore,
    recoveryCodeRows,
    user: {
      findUniqueOrThrow: vi.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = userStore.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      update: vi.fn(async ({ where: { id }, data }: { where: { id: string }; data: object }) => {
        const row = userStore.get(id);
        if (!row) throw new Error('not found');
        Object.assign(row, data);
        return row;
      }),
    },
    mfaRecoveryCode: {
      deleteMany: vi.fn(async ({ where: { userId } }: { where: { userId: string } }) => {
        for (let i = recoveryCodeRows.length - 1; i >= 0; i--) {
          if (recoveryCodeRows[i]?.userId === userId) recoveryCodeRows.splice(i, 1);
        }
        return { count: 0 };
      }),
      createMany: vi.fn(async ({ data }: { data: Array<{ userId: string; codeHash: string }> }) => {
        for (const row of data) {
          recoveryCodeRows.push({ id: randomUUID(), usedAt: null, ...row });
        }
        return { count: data.length };
      }),
      findMany: vi.fn(async ({ where: { userId } }: { where: { userId: string } }) =>
        recoveryCodeRows.filter((row) => row.userId === userId && row.usedAt === null),
      ),
      update: vi.fn(async ({ where: { id }, data }: { where: { id: string }; data: object }) => {
        const row = recoveryCodeRows.find((r) => r.id === id);
        if (row) Object.assign(row, data);
        return row;
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

function buildService() {
  const prisma = buildPrisma();
  const jwt = {
    signAsync: vi.fn(async (payload: object) => JSON.stringify(payload)),
    verifyAsync: vi.fn(async (token: string) => JSON.parse(token)),
  };
  const mfa = new MfaService(prisma as never, jwt as never);
  return { mfa, prisma, jwt };
}

describe('MfaService', () => {
  const userId = randomUUID();

  beforeEach(() => {
    // Nothing shared between tests — each test builds its own prisma stub.
  });

  describe('enrollment', () => {
    it('startEnrollment stores an encrypted pending secret and returns a QR URI', async () => {
      const { mfa, prisma } = buildService();
      prisma.userStore.set(userId, {
        mfaEnabled: false,
        mfaSecretEncrypted: null,
        email: 'student@example.com',
      });

      const result = await mfa.startEnrollment(userId);

      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
      expect(result.otpauthUri).toContain('student%40example.com');
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(false);
      expect(prisma.userStore.get(userId)?.mfaSecretEncrypted).not.toBeNull();
    });

    it('refuses to start enrollment when MFA is already enabled', async () => {
      const { mfa, prisma } = buildService();
      prisma.userStore.set(userId, {
        mfaEnabled: true,
        mfaSecretEncrypted: 'whatever',
        email: 'student@example.com',
      });

      await expect(mfa.startEnrollment(userId)).rejects.toMatchObject({ status: 409 });
    });

    it('confirmEnable turns MFA on and issues recovery codes given a correct code', async () => {
      const { mfa, prisma } = buildService();
      const secret = generateTotpSecret();
      prisma.userStore.set(userId, {
        mfaEnabled: false,
        mfaSecretEncrypted: encryptSecret(secret, env.MFA_SECRET_ENCRYPTION_KEY),
        email: 'student@example.com',
      });

      const result = await mfa.confirmEnable(userId, generateTotp(secret));

      expect(result.recoveryCodes).toHaveLength(10);
      expect(new Set(result.recoveryCodes).size).toBe(10); // no duplicates
      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(true);
      expect(prisma.recoveryCodeRows).toHaveLength(10);
    });

    it('confirmEnable rejects a wrong code and leaves MFA off', async () => {
      const { mfa, prisma } = buildService();
      const secret = generateTotpSecret();
      prisma.userStore.set(userId, {
        mfaEnabled: false,
        mfaSecretEncrypted: encryptSecret(secret, env.MFA_SECRET_ENCRYPTION_KEY),
        email: 'student@example.com',
      });

      await expect(mfa.confirmEnable(userId, '000000')).rejects.toMatchObject({ status: 401 });
      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(false);
    });

    it('confirmEnable refuses when no enrollment was started', async () => {
      const { mfa, prisma } = buildService();
      prisma.userStore.set(userId, {
        mfaEnabled: false,
        mfaSecretEncrypted: null,
        email: 'student@example.com',
      });

      await expect(mfa.confirmEnable(userId, '123456')).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('disable', () => {
    it('disables MFA given a correct TOTP code and wipes recovery codes', async () => {
      const { mfa, prisma } = buildService();
      const secret = generateTotpSecret();
      prisma.userStore.set(userId, {
        mfaEnabled: true,
        mfaSecretEncrypted: encryptSecret(secret, env.MFA_SECRET_ENCRYPTION_KEY),
        email: 'student@example.com',
      });
      prisma.recoveryCodeRows.push({
        id: randomUUID(),
        userId,
        codeHash: await hashPassword('AAAAA-BBBBB'),
        usedAt: null,
      });

      await mfa.disable(userId, generateTotp(secret));

      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(false);
      expect(prisma.userStore.get(userId)?.mfaSecretEncrypted).toBeNull();
      expect(prisma.recoveryCodeRows).toHaveLength(0);
    });

    it('rejects disabling with a wrong code', async () => {
      const { mfa, prisma } = buildService();
      const secret = generateTotpSecret();
      prisma.userStore.set(userId, {
        mfaEnabled: true,
        mfaSecretEncrypted: encryptSecret(secret, env.MFA_SECRET_ENCRYPTION_KEY),
        email: 'student@example.com',
      });

      await expect(mfa.disable(userId, '000000')).rejects.toMatchObject({ status: 401 });
      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(true);
    });

    it('is a no-op when MFA is already off', async () => {
      const { mfa, prisma } = buildService();
      prisma.userStore.set(userId, {
        mfaEnabled: false,
        mfaSecretEncrypted: null,
        email: 'student@example.com',
      });

      await expect(mfa.disable(userId, '000000')).resolves.toBeUndefined();
    });

    it('accepts an unused recovery code and consumes it, disabling MFA', async () => {
      const { mfa, prisma } = buildService();
      prisma.userStore.set(userId, {
        mfaEnabled: true,
        mfaSecretEncrypted: encryptSecret(generateTotpSecret(), env.MFA_SECRET_ENCRYPTION_KEY),
        email: 'student@example.com',
      });
      const recoveryId = randomUUID();
      prisma.recoveryCodeRows.push({
        id: recoveryId,
        userId,
        codeHash: await hashPassword('AAAAA-BBBBB'),
        usedAt: null,
      });

      await mfa.disable(userId, 'aaaaa-bbbbb'); // lowercase on purpose: normalized before matching

      expect(prisma.userStore.get(userId)?.mfaEnabled).toBe(false);
    });
  });

  describe('verifyFactorAndConsume', () => {
    it('does not let the same recovery code be used twice', async () => {
      const { mfa, prisma } = buildService();
      prisma.recoveryCodeRows.push({
        id: randomUUID(),
        userId,
        codeHash: await hashPassword('CCCCC-DDDDD'),
        usedAt: null,
      });

      const first = await mfa.verifyFactorAndConsume(userId, 'CCCCC-DDDDD', null);
      const second = await mfa.verifyFactorAndConsume(userId, 'CCCCC-DDDDD', null);

      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it('rejects a TOTP-shaped code when no secret is on file', async () => {
      const { mfa } = buildService();
      expect(await mfa.verifyFactorAndConsume(userId, '123456', null)).toBe(false);
    });
  });

  describe('challenge tokens', () => {
    it('round-trips a challenge token back to the same userId', async () => {
      const { mfa } = buildService();
      const challenge = await mfa.createChallenge(userId);
      expect(challenge.mfaRequired).toBe(true);
      expect(challenge.expiresInSeconds).toBe(300);

      const resolved = await mfa.resolveChallenge(challenge.mfaToken);
      expect(resolved).toBe(userId);
    });

    it('rejects a token without the mfa_challenge purpose claim', async () => {
      const { mfa, jwt } = buildService();
      vi.mocked(jwt.verifyAsync).mockResolvedValueOnce({ sub: userId, purpose: 'access' } as never);

      await expect(mfa.resolveChallenge('whatever')).rejects.toMatchObject({ status: 401 });
    });

    it('rejects an expired or malformed token', async () => {
      const { mfa, jwt } = buildService();
      vi.mocked(jwt.verifyAsync).mockRejectedValueOnce(new Error('jwt expired'));

      await expect(mfa.resolveChallenge('whatever')).rejects.toMatchObject({ status: 401 });
    });
  });
});
