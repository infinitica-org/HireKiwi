import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../platform/config/env.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { AdminSessionsController } from './admin-sessions.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { EmailVerificationService } from './email-verification.service.js';
import { GithubOauthService } from './github-oauth.service.js';
import { GoogleOauthService } from './google-oauth.service.js';
import { LinkedinOauthService } from './linkedin-oauth.service.js';
import { MfaController } from './mfa/mfa.controller.js';
import { MfaService } from './mfa/mfa.service.js';
import { PasswordResetService } from './password-reset.service.js';

@Module({
  imports: [
    InvitationsModule,
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_TTL_SECONDS },
    }),
  ],
  controllers: [AuthController, AdminSessionsController, MfaController],
  providers: [
    AuthService,
    LinkedinOauthService,
    GoogleOauthService,
    GithubOauthService,
    EmailVerificationService,
    PasswordResetService,
    MfaService,
  ],
  exports: [AuthService, LinkedinOauthService, GoogleOauthService, GithubOauthService],
})
export class AuthModule {}
