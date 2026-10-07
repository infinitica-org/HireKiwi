import { randomUUID } from 'node:crypto';
import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../../platform/config/env.js';
import { RedisService } from '../../platform/redis/redis.service.js';

/**
 * "Sign in with Google" (OIDC) for the student login page. Company accounts
 * always use their verified work-domain email + password — Google sign-in
 * is student-only.
 *
 * Unlike LinkedinOauthService (which verifies an *already signed-in* user's
 * profile for evidence purposes), this flow is unauthenticated — it is how a
 * session gets created in the first place. The `state` therefore carries no
 * userId, only where to send the browser back to (`returnTo`), so the
 * callback can route correctly without trusting anything the client passes
 * back directly.
 */

const STATE_TTL_SECONDS = 10 * 60;
const FETCH_MS = 4_000;
const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const STATE_KEY_PREFIX = 'auth:google:state:';

export interface GoogleOauthState {
  returnTo: string | null;
}

const TokenResponseSchema = z.object({ access_token: z.string() });

const UserinfoSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  email_verified: z.boolean().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
});

export interface GoogleIdentity {
  providerSub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  pictureUrl?: string;
}

@Injectable()
export class GoogleOauthService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  get configured(): boolean {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  async createAuthorizationUrl(returnTo: string | null): Promise<string> {
    if (!this.configured) {
      throw new BadRequestException({
        error: 'google_not_configured',
        message: 'Google sign-in is not configured on this environment.',
        statusCode: 400,
      });
    }
    const state = randomUUID();
    const payload: GoogleOauthState = { returnTo };
    await this.redis.setex(
      `${STATE_KEY_PREFIX}${state}`,
      STATE_TTL_SECONDS,
      JSON.stringify(payload),
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /** One-time lookup: resolves `state` back to the returnTo that started the flow. */
  async consumeState(state: string): Promise<GoogleOauthState | null> {
    const key = `${STATE_KEY_PREFIX}${state}`;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    await this.redis.del(key);
    try {
      return JSON.parse(raw) as GoogleOauthState;
    } catch {
      return null;
    }
  }

  async exchangeCode(code: string): Promise<GoogleIdentity> {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
        client_id: env.GOOGLE_CLIENT_ID ?? '',
        client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      }),
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!tokenResponse.ok) {
      throw new BadGatewayException({
        error: 'google_token_exchange_failed',
        message: 'Google did not accept the authorization code.',
        statusCode: 502,
      });
    }
    const token = TokenResponseSchema.parse(await tokenResponse.json());

    const userinfoResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!userinfoResponse.ok) {
      throw new BadGatewayException({
        error: 'google_userinfo_failed',
        message: 'Could not read the Google profile after sign-in.',
        statusCode: 502,
      });
    }
    const info = UserinfoSchema.parse(await userinfoResponse.json());
    return {
      providerSub: info.sub,
      email: info.email,
      emailVerified: info.email_verified ?? false,
      name: info.name,
      pictureUrl: info.picture,
    };
  }
}
