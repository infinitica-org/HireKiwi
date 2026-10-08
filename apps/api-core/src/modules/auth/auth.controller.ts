import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  API_PREFIX,
  AcceptInvitationRequestSchema,
  IdentifyRequestSchema,
  PasswordLoginRequestSchema,
  PasswordResetConfirmRequestSchema,
  PasswordResetRequestSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  ResendEmailVerificationRequestSchema,
  SendEmailOtpResponseSchema,
  VerifyEmailOtpRequestSchema,
  VerifyEmailOtpResponseSchema,
} from '@hirekiwi/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../../common/guards/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { env } from '../../platform/config/env.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { AuthService } from './auth.service.js';
import { EmailVerificationService } from './email-verification.service.js';
import { GoogleOauthService } from './google-oauth.service.js';
import { PasswordResetService } from './password-reset.service.js';

@Controller(`${API_PREFIX}/auth`)
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(InvitationsService) private readonly invitations: InvitationsService,
    @Inject(EmailVerificationService) private readonly emailVerification: EmailVerificationService,
    @Inject(PasswordResetService) private readonly passwordReset: PasswordResetService,
    @Inject(GoogleOauthService) private readonly googleOauth: GoogleOauthService,
  ) {}

  @Public()
  @Post('login')
  login(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const parsed = PasswordLoginRequestSchema.parse(body);
    return this.auth.login(parsed.email, parsed.password, reply);
  }

  @Public()
  @Post('identify')
  identify(@Body() body: unknown) {
    const { email } = IdentifyRequestSchema.parse(body);
    return this.auth.identify(email);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.refresh(request, reply);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.logout(request, reply);
  }

  @Public()
  @Get('institutions')
  listSelectableInstitutions() {
    return this.auth.listSelectableInstitutions();
  }

  @Public()
  @Post('register')
  async register(@Body() body: unknown) {
    const parsed = RegisterRequestSchema.parse(body);
    const user = await this.auth.register(parsed);
    await this.emailVerification.sendForUser(user.id, user.email, user.fullName);
    return RegisterResponseSchema.parse({ email: user.email, verificationRequired: true });
  }

  @Public()
  @Post('verify-email/resend')
  @HttpCode(204)
  async resendEmailVerification(@Body() body: unknown) {
    const parsed = ResendEmailVerificationRequestSchema.parse(body);
    await this.emailVerification.resend(parsed.email);
  }

  @Public()
  @Post('verify-email/:token')
  @HttpCode(204)
  async verifyEmail(@Param('token') token: string) {
    await this.emailVerification.confirm(token);
  }

  @Post('email-otp/send')
  async sendEmailOtp(@CurrentUser() user: RequestUser) {
    const result = await this.emailVerification.sendOtpForUser(user.sub);
    return SendEmailOtpResponseSchema.parse(result);
  }

  @Post('email-otp/verify')
  async verifyEmailOtp(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const parsed = VerifyEmailOtpRequestSchema.parse(body);
    const result = await this.emailVerification.verifyOtpForUser(user.sub, parsed.code);
    return VerifyEmailOtpResponseSchema.parse(result);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(204)
  async requestPasswordReset(@Body() body: unknown) {
    const parsed = PasswordResetRequestSchema.parse(body);
    await this.passwordReset.request(parsed.email);
  }

  @Public()
  @Post('password-reset/:token/confirm')
  @HttpCode(204)
  async confirmPasswordReset(@Param('token') token: string, @Body() body: unknown) {
    const parsed = PasswordResetConfirmRequestSchema.parse(body);
    await this.passwordReset.confirm(token, parsed.newPassword);
  }

  @Public()
  @Get('invitations/:token')
  previewInvitation(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  /** Minimal COMPANY-only boundary for portal auth (Phase 6). */
  @Get('company/account')
  @Roles('COMPANY')
  companyAccount(@CurrentUser() user: RequestUser) {
    return this.auth.getCompanyPortalAccount(user.sub);
  }

  /** Kicks off "Sign in with Google" from the student login page. Student-only — company accounts use their verified work-domain email + password. */
  @Public()
  @Get('google')
  async googleAuthorize(
    @Query('returnTo') returnToParam: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const returnTo = parseAbsoluteUrl(returnToParam);
    const url = await this.googleOauth.createAuthorizationUrl(returnTo);
    reply.redirect(url, 302);
  }

  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const loginUrl = `${env.AUTH_APP_URL.replace(/\/$/u, '')}/login`;
    const redirectWithError = (oauthError: string) => {
      reply.redirect(`${loginUrl}?oauthError=${encodeURIComponent(oauthError)}`, 302);
    };

    if (error || !code || !state) {
      redirectWithError(error ?? 'google_cancelled');
      return;
    }

    const parsedState = await this.googleOauth.consumeState(state);
    if (!parsedState) {
      redirectWithError('google_state_expired');
      return;
    }

    try {
      const identity = await this.googleOauth.exchangeCode(code);
      const session = await this.auth.loginOrRegisterWithGoogle(identity, reply);
      const base = env.AUTH_APP_URL.replace(/\/$/u, '');
      const completeUrl = new URL(`${base}/oauth/complete`);
      completeUrl.searchParams.set('accessToken', session.accessToken);
      if (parsedState.returnTo) completeUrl.searchParams.set('returnTo', parsedState.returnTo);
      reply.redirect(completeUrl.toString(), 302);
    } catch (err: unknown) {
      let errorCode = 'google_failed';
      if (err instanceof HttpException) {
        const body = err.getResponse();
        if (typeof body === 'object' && body !== null && 'error' in body) {
          errorCode = String((body as { error?: unknown }).error ?? errorCode);
        }
      }
      redirectWithError(errorCode);
    }
  }

  @Public()
  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const parsed = AcceptInvitationRequestSchema.parse(body);
    const user = await this.invitations.accept(token, parsed.password);
    return this.auth.issueSessionAfterInviteAccept(user, reply);
  }
}

/** Only ever used as a value forwarded back to the frontend's own origin allow-list check. */
function parseAbsoluteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
