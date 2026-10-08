import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import QRCode from 'qrcode';
import type { MfaSetupResponse } from '@hirekiwi/contracts';
import { decryptSecret, encryptSecret } from '../../../platform/crypto/secret-cipher.util.js';
import { env } from '../../../platform/config/env.js';
import { PrismaService } from '../../../platform/prisma/prisma.service.js';
import { hashPassword, verifyPassword } from '../auth.service.js';
import { generateRecoveryCodes, normalizeRecoveryCode } from './recovery-codes.util.js';
import { buildTotpUri, generateTotpSecret, verifyTotp } from './totp.util.js';

/** `purpose` claim distinguishing an MFA challenge token from a real access token. */
const MFA_CHALLENGE_PURPOSE = 'mfa_challenge';
const MFA_CHALLENGE_TTL_SECONDS = 300;
const RECOVERY_CODE_PATTERN = /^[A-Z2-9]{5}-[A-Z2-9]{5}$/;
const TOTP_ISSUER = 'HireKiwi';

interface MfaChallengeClaims {
  sub: string;
  purpose: typeof MFA_CHALLENGE_PURPOSE;
}

@Injectable()
export class MfaService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async status(userId: string): Promise<{ enabled: boolean; enabledAt: Date | null }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaEnabled: true, mfaEnabledAt: true },
    });
    return { enabled: user.mfaEnabled, enabledAt: user.mfaEnabledAt };
  }

  /**
   * Generates and stores a new secret (encrypted) but does not enable MFA yet —
   * `confirmEnable` must prove the app was actually set up before it takes effect.
   * Re-running this (e.g. the user abandoned enrollment) just replaces the pending secret.
   */
  async startEnrollment(userId: string): Promise<MfaSetupResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaEnabled: true, email: true },
    });
    if (user.mfaEnabled) {
      throw new ConflictException({
        error: 'mfa_already_enabled',
        message: 'MFA is already enabled. Disable it before setting it up again.',
        statusCode: 409,
      });
    }

    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecretEncrypted: encryptSecret(secret, env.MFA_SECRET_ENCRYPTION_KEY),
      },
    });

    const otpauthUri = buildTotpUri(secret, user.email, TOTP_ISSUER);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
    return { secret, otpauthUri, qrCodeDataUrl };
  }

  /** Confirms the pending secret with a real code, then turns MFA on and mints recovery codes. */
  async confirmEnable(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaEnabled: true, mfaSecretEncrypted: true },
    });
    if (user.mfaEnabled || !user.mfaSecretEncrypted) {
      throw new ConflictException({
        error: 'mfa_not_pending',
        message: 'Start MFA enrollment before confirming a code.',
        statusCode: 409,
      });
    }
    const secret = decryptSecret(user.mfaSecretEncrypted, env.MFA_SECRET_ENCRYPTION_KEY);
    if (!verifyTotp(secret, code)) {
      throw new UnauthorizedException({
        error: 'invalid_mfa_code',
        message: 'That code is incorrect or has expired. Check your authenticator app and retry.',
        statusCode: 401,
      });
    }

    const recoveryCodes = generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true, mfaEnabledAt: new Date() },
      }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.prisma.mfaRecoveryCode.createMany({
        data: await Promise.all(
          recoveryCodes.map(async (plain) => ({
            userId,
            codeHash: await hashPassword(plain),
          })),
        ),
      }),
    ]);

    return { recoveryCodes };
  }

  /** Disabling requires one more valid factor, so a stolen session alone can't turn MFA off. */
  async disable(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaEnabled: true, mfaSecretEncrypted: true },
    });
    if (!user.mfaEnabled) return;
    const verified = await this.verifyFactorAndConsume(userId, code, user.mfaSecretEncrypted);
    if (!verified) {
      throw new UnauthorizedException({
        error: 'invalid_mfa_code',
        message: 'That code is incorrect. MFA was not disabled.',
        statusCode: 401,
      });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false, mfaSecretEncrypted: null, mfaEnabledAt: null },
      }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /** Short-lived, single-purpose token: proves "password already checked out", nothing more. */
  async createChallenge(
    userId: string,
  ): Promise<{ mfaRequired: true; mfaToken: string; expiresInSeconds: number }> {
    const mfaToken = await this.jwt.signAsync(
      { sub: userId, purpose: MFA_CHALLENGE_PURPOSE } satisfies MfaChallengeClaims,
      { expiresIn: MFA_CHALLENGE_TTL_SECONDS },
    );
    return { mfaRequired: true, mfaToken, expiresInSeconds: MFA_CHALLENGE_TTL_SECONDS };
  }

  /** Resolves a challenge token to the userId it was issued for, or throws. */
  async resolveChallenge(mfaToken: string): Promise<string> {
    try {
      const claims = await this.jwt.verifyAsync<MfaChallengeClaims>(mfaToken);
      if (claims.purpose !== MFA_CHALLENGE_PURPOSE || !claims.sub) {
        throw new Error('not an mfa challenge token');
      }
      return claims.sub;
    } catch {
      throw new UnauthorizedException({
        error: 'invalid_mfa_challenge',
        message: 'This MFA challenge has expired. Sign in again.',
        statusCode: 401,
      });
    }
  }

  /** Verifies a TOTP code or an unused recovery code (and consumes the recovery code on success). */
  async verifyFactorAndConsume(
    userId: string,
    code: string,
    mfaSecretEncrypted: string | null,
  ): Promise<boolean> {
    const normalized = normalizeRecoveryCode(code);
    if (RECOVERY_CODE_PATTERN.test(normalized)) {
      return this.consumeRecoveryCode(userId, normalized);
    }
    if (!mfaSecretEncrypted) return false;
    const secret = decryptSecret(mfaSecretEncrypted, env.MFA_SECRET_ENCRYPTION_KEY);
    return verifyTotp(secret, normalized);
  }

  private async consumeRecoveryCode(userId: string, normalizedCode: string): Promise<boolean> {
    const candidates = await this.prisma.mfaRecoveryCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });
    for (const candidate of candidates) {
      if (await verifyPassword(normalizedCode, candidate.codeHash)) {
        await this.prisma.mfaRecoveryCode.update({
          where: { id: candidate.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }
}
