import { Body, Controller, Delete, Get, HttpCode, Inject, Post } from '@nestjs/common';
import {
  API_PREFIX,
  MfaDisableRequestSchema,
  MfaEnableRequestSchema,
  type MfaEnableResponse,
  type MfaSetupResponse,
  type MfaStatusResponse,
} from '@hirekiwi/contracts';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../../common/guards/jwt-auth.guard.js';
import { MfaService } from './mfa.service.js';

/**
 * S8-VV-P0 — TOTP multi-factor authentication. Every route here is
 * authenticated (a signed-in session, same as any other `/auth` route past
 * login) and acts only on the caller's own account; the challenge-time
 * verification used *during* login lives on AuthController/AuthService
 * instead, since it runs before a session exists.
 */
@Controller(`${API_PREFIX}/auth/mfa`)
export class MfaController {
  constructor(@Inject(MfaService) private readonly mfa: MfaService) {}

  @Get('status')
  async status(@CurrentUser() user: RequestUser): Promise<MfaStatusResponse> {
    const result = await this.mfa.status(user.sub);
    return { enabled: result.enabled, enabledAt: result.enabledAt?.toISOString() ?? null };
  }

  @Post('setup')
  async setup(@CurrentUser() user: RequestUser): Promise<MfaSetupResponse> {
    return this.mfa.startEnrollment(user.sub);
  }

  @Post('enable')
  async enable(
    @CurrentUser() user: RequestUser,
    @Body() body: unknown,
  ): Promise<MfaEnableResponse> {
    const parsed = MfaEnableRequestSchema.parse(body);
    return this.mfa.confirmEnable(user.sub, parsed.code);
  }

  @Delete()
  @HttpCode(204)
  async disable(@CurrentUser() user: RequestUser, @Body() body: unknown): Promise<void> {
    const parsed = MfaDisableRequestSchema.parse(body);
    await this.mfa.disable(user.sub, parsed.code);
  }
}
