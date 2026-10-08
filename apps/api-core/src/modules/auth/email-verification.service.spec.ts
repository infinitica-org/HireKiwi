import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { EmailVerificationService } from './email-verification.service.js';
import { hashEmailVerificationToken } from './email-verification-token.util.js';
import { env } from '../../platform/config/env.js';

describe('EmailVerificationService.sendForUser', () => {
  it('persists a hashed token and enqueues the verification email', async () => {
    const audit = { record: vi.fn() };
    const userId = randomUUID();
    const created: unknown[] = [];
    const prisma = {
      emailVerificationToken: {
        create: vi.fn(async ({ data }: { data: unknown }) => {
          created.push(data);
          return data;
        }),
      },
    };
    const emailQueue = { add: vi.fn() };
    const service = new EmailVerificationService(
      prisma as never,
      emailQueue as never,
      audit as never,
    );

    await service.sendForUser(userId, 'student@example.com', 'Test Student');

    expect(created).toHaveLength(1);
    const row = created[0] as { userId: string; tokenHash: string; expiresAt: Date };
    expect(row.userId).toBe(userId);
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        to: 'student@example.com',
        template: 'email-verification',
        data: expect.objectContaining({ fullName: 'Test Student' }),
      }),
    );
  });
});

describe('EmailVerificationService.confirm', () => {
  it('marks the user verified and consumes the token', async () => {
    const audit = { record: vi.fn() };
    const raw = 'raw-token';
    const tokenId = randomUUID();
    const userId = randomUUID();
    const prisma = {
      emailVerificationToken: {
        findUnique: vi.fn(async () => ({
          id: tokenId,
          userId,
          tokenHash: hashEmailVerificationToken(raw),
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: null,
        })),
        update: vi.fn(),
      },
      user: { update: vi.fn() },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const service = new EmailVerificationService(
      prisma as never,
      { add: vi.fn() } as never,
      audit as never,
    );

    await service.confirm(raw);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: userId,
        action: 'auth.email_verified',
        resourceId: userId,
      }),
    );
  });

  it('rejects an unknown token with 404', async () => {
    const audit = { record: vi.fn() };
    const prisma = { emailVerificationToken: { findUnique: vi.fn(async () => null) } };
    const service = new EmailVerificationService(
      prisma as never,
      { add: vi.fn() } as never,
      audit as never,
    );

    await expect(service.confirm('bogus')).rejects.toMatchObject({
      response: { statusCode: 404 },
    });
  });

  it('rejects an already-consumed token with 410', async () => {
    const audit = { record: vi.fn() };
    const prisma = {
      emailVerificationToken: {
        findUnique: vi.fn(async () => ({
          id: randomUUID(),
          userId: randomUUID(),
          tokenHash: 'x',
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: new Date(),
        })),
      },
    };
    const service = new EmailVerificationService(
      prisma as never,
      { add: vi.fn() } as never,
      audit as never,
    );

    await expect(service.confirm('used')).rejects.toMatchObject({
      response: { statusCode: 410 },
    });
  });

  it('rejects an expired token with 410', async () => {
    const audit = { record: vi.fn() };
    const prisma = {
      emailVerificationToken: {
        findUnique: vi.fn(async () => ({
          id: randomUUID(),
          userId: randomUUID(),
          tokenHash: 'x',
          expiresAt: new Date(Date.now() - 60_000),
          consumedAt: null,
        })),
      },
    };
    const service = new EmailVerificationService(
      prisma as never,
      { add: vi.fn() } as never,
      audit as never,
    );

    await expect(service.confirm('expired')).rejects.toMatchObject({
      response: { statusCode: 410 },
    });
  });
});

describe('EmailVerificationService.resend', () => {
  function serviceFor(
    user: {
      id: string;
      email: string;
      fullName: string;
      emailVerified: boolean;
      passwordHash: string | null;
    } | null,
    latest: { createdAt: Date } | null = null,
  ) {
    const prisma = {
      user: { findUnique: vi.fn(async () => user) },
      emailVerificationToken: {
        findFirst: vi.fn(async () => latest),
        deleteMany: vi.fn(async () => ({ count: 1 })),
        create: vi.fn(async ({ data }: { data: unknown }) => data),
      },
    };
    const emailQueue = { add: vi.fn() };
    return {
      prisma,
      emailQueue,
      service: new EmailVerificationService(prisma as never, emailQueue as never),
    };
  }

  const student = {
    id: randomUUID(),
    email: 'student@example.com',
    fullName: 'Test Student',
    emailVerified: false,
    passwordHash: 'salt:hash',
  };

  it('retires unused links and emails a new one to an unverified account', async () => {
    const { prisma, emailQueue, service } = serviceFor(student, {
      createdAt: new Date(Date.now() - 5 * 60_000),
    });

    await service.resend('Student@Example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'student@example.com' },
    });
    expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: student.id, consumedAt: null },
    });
    expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({ to: 'student@example.com', template: 'email-verification' }),
    );
  });

  it.each([
    ['an unknown address', null],
    ['an already-verified account', { ...student, emailVerified: true }],
    ['an invited account that has no password yet', { ...student, passwordHash: null }],
  ])('sends nothing for %s', async (_label, user) => {
    const { prisma, emailQueue, service } = serviceFor(user);

    await service.resend('student@example.com');

    expect(prisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('sends nothing when a link went out less than a minute ago', async () => {
    const { emailQueue, service } = serviceFor(student, {
      createdAt: new Date(Date.now() - 10_000),
    });

    await service.resend('student@example.com');

    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});

describe('EmailVerificationService.sendOtpForUser', () => {
  it('generates 6-digit code, saves token hash, and queues email', async () => {
    const audit = { record: vi.fn() };
    const userId = randomUUID();
    const created: unknown[] = [];
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          email: 'student@example.com',
          fullName: 'Test Student',
          emailVerified: false,
        })),
      },
      emailVerificationToken: {
        findFirst: vi.fn(async () => null),
        deleteMany: vi.fn(async () => ({ count: 0 })),
        create: vi.fn(async ({ data }: { data: unknown }) => {
          created.push(data);
          return data;
        }),
      },
    };
    const emailQueue = { add: vi.fn() };
    const service = new EmailVerificationService(
      prisma as never,
      emailQueue as never,
      audit as never,
    );

    const result = await service.sendOtpForUser(userId);

    expect(result.expiresAt).toBeDefined();
    expect(result.resendAvailableAt).toBeDefined();
    expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId, consumedAt: null },
    });
    expect(created).toHaveLength(1);
    const tokenRow = created[0] as { userId: string; tokenHash: string; expiresAt: Date };
    expect(tokenRow.userId).toBe(userId);
    expect(tokenRow.tokenHash).toHaveLength(64); // SHA-256 hex string
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        to: 'student@example.com',
        template: 'student-email-otp',
        data: expect.objectContaining({
          fullName: 'Test Student',
          verificationCode: expect.stringMatching(/^\d{6}$/),
        }),
      }),
    );
  });

  it('rejects if user is already verified', async () => {
    const userId = randomUUID();
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          email: 'student@example.com',
          fullName: 'Test Student',
          emailVerified: true,
        })),
      },
    };
    const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

    await expect(service.sendOtpForUser(userId)).rejects.toMatchObject({
      response: { statusCode: 400 },
    });
  });

  it('enforces 60-second resend cooldown', async () => {
    const userId = randomUUID();
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          email: 'student@example.com',
          fullName: 'Test Student',
          emailVerified: false,
        })),
      },
      emailVerificationToken: {
        findFirst: vi.fn(async () => ({
          createdAt: new Date(Date.now() - 15_000), // 15 seconds ago
        })),
      },
    };
    const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

    await expect(service.sendOtpForUser(userId)).rejects.toMatchObject({
      response: { statusCode: 409 },
    });
  });
});

describe('EmailVerificationService.verifyOtpForUser', () => {
  it('marks user verified and records audit log for valid OTP', async () => {
    const audit = { record: vi.fn() };
    const userId = randomUUID();
    const tokenId = randomUUID();
    const code = '654321';
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          email: 'student@example.com',
          emailVerified: false,
        })),
        update: vi.fn(),
      },
      emailVerificationToken: {
        findFirst: vi.fn(async () => ({
          id: tokenId,
          userId,
          tokenHash: hashEmailVerificationToken(code),
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: null,
        })),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const service = new EmailVerificationService(
      prisma as never,
      { add: vi.fn() } as never,
      audit as never,
    );

    const result = await service.verifyOtpForUser(userId, code);

    expect(result).toEqual({ verified: true });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: userId,
        action: 'auth.email_verified',
        resourceId: userId,
        reasonCode: 'otp_verified',
      }),
    );
  });

  it('returns verified: true immediately if user is already verified', async () => {
    const userId = randomUUID();
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          emailVerified: true,
        })),
      },
    };
    const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

    const result = await service.verifyOtpForUser(userId, '123456');
    expect(result).toEqual({ verified: true });
  });

  it('rejects invalid format code', async () => {
    const userId = randomUUID();
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          emailVerified: false,
        })),
      },
    };
    const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

    await expect(service.verifyOtpForUser(userId, 'abc')).rejects.toMatchObject({
      response: { statusCode: 400 },
    });
  });

  it('rejects expired OTP with 410', async () => {
    const userId = randomUUID();
    const code = '654321';
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: userId,
          emailVerified: false,
        })),
      },
      emailVerificationToken: {
        findFirst: vi.fn(async () => ({
          id: randomUUID(),
          userId,
          tokenHash: hashEmailVerificationToken(code),
          expiresAt: new Date(Date.now() - 60_000), // Expired
          consumedAt: null,
        })),
      },
    };
    const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

    await expect(service.verifyOtpForUser(userId, code)).rejects.toMatchObject({
      response: { statusCode: 410 },
    });
  });

  it('strictly rejects fallback 123456 in production environment when hash does not match', async () => {
    const originalEnv = env.NODE_ENV;
    (env as { NODE_ENV: string }).NODE_ENV = 'production';
    try {
      const userId = randomUUID();
      const prisma = {
        user: {
          findUnique: vi.fn(async () => ({
            id: userId,
            emailVerified: false,
          })),
        },
        emailVerificationToken: {
          findFirst: vi.fn(async ({ where }: { where: { tokenHash?: string } }) => {
            // In production, findFirst is called with tokenHash.
            // 123456 hash will not match the genuine 999999 token.
            if (where.tokenHash === hashEmailVerificationToken('999999')) {
              return {
                id: randomUUID(),
                userId,
                tokenHash: hashEmailVerificationToken('999999'),
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: null,
              };
            }
            return null;
          }),
        },
      };
      const service = new EmailVerificationService(prisma as never, { add: vi.fn() } as never);

      await expect(service.verifyOtpForUser(userId, '123456')).rejects.toMatchObject({
        response: { statusCode: 400, error: 'invalid_code' },
      });
    } finally {
      (env as { NODE_ENV: string }).NODE_ENV = originalEnv;
    }
  });
});
