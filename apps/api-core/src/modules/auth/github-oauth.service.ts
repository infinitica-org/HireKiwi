import { randomUUID } from 'node:crypto';
import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../../platform/config/env.js';
import { RedisService } from '../../platform/redis/redis.service.js';

/**
 * "Sign in with GitHub" (classic OAuth, `repo` scope) — grants read access to
 * a student's private repos, not just the public ones the unauthenticated
 * GithubApiClient can already see. Mirrors LinkedinOauthService's shape: the
 * student must already be signed in, so `state` carries no identity of its
 * own, only a Redis-backed mapping back to the userId who started the flow.
 *
 * This never writes to GitHub — `repo` is the narrowest classic scope that
 * includes private repos, and GitHub has no "private repos, read-only" scope.
 */

const STATE_TTL_SECONDS = 10 * 60;
const FETCH_MS = 4_000;
const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';
const STATE_KEY_PREFIX = 'onboarding:github-oauth:state:';
const SCOPE = 'repo read:user';

const TokenResponseSchema = z.object({
  access_token: z.string(),
  scope: z.string().optional().default(''),
  token_type: z.string().optional(),
});

const GithubUserSchema = z.object({
  id: z.number().int(),
  login: z.string(),
  name: z.string().nullable().default(null),
  avatar_url: z.string(),
});

export interface GithubOauthIdentity {
  login: string;
  name: string | null;
  avatarUrl: string;
  accessToken: string;
  scopes: string[];
}

@Injectable()
export class GithubOauthService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  get configured(): boolean {
    return Boolean(
      env.GITHUB_OAUTH_CLIENT_ID &&
      env.GITHUB_OAUTH_CLIENT_SECRET &&
      env.GITHUB_TOKEN_ENCRYPTION_KEY,
    );
  }

  async createAuthorizationUrl(userId: string): Promise<string> {
    if (!this.configured) {
      throw new BadRequestException({
        error: 'github_oauth_not_configured',
        message: 'GitHub private-repo access is not configured on this environment.',
        statusCode: 400,
      });
    }
    const state = randomUUID();
    await this.redis.setex(`${STATE_KEY_PREFIX}${state}`, STATE_TTL_SECONDS, userId);

    const params = new URLSearchParams({
      client_id: env.GITHUB_OAUTH_CLIENT_ID ?? '',
      redirect_uri: env.GITHUB_OAUTH_REDIRECT_URI,
      scope: SCOPE,
      state,
      allow_signup: 'false',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /** One-time lookup: resolves `state` back to the userId that started the flow. */
  async consumeState(state: string): Promise<string | null> {
    const key = `${STATE_KEY_PREFIX}${state}`;
    const userId = await this.redis.get(key);
    if (userId) await this.redis.del(key);
    return userId;
  }

  async exchangeCode(code: string): Promise<GithubOauthIdentity> {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: env.GITHUB_OAUTH_CLIENT_ID ?? '',
        client_secret: env.GITHUB_OAUTH_CLIENT_SECRET ?? '',
        code,
        redirect_uri: env.GITHUB_OAUTH_REDIRECT_URI,
      }),
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!tokenResponse.ok) {
      throw new BadGatewayException({
        error: 'github_oauth_token_exchange_failed',
        message: 'GitHub did not accept the authorization code.',
        statusCode: 502,
      });
    }
    const token = TokenResponseSchema.parse(await tokenResponse.json());
    if (
      !token.scope
        .split(',')
        .map((s) => s.trim())
        .includes('repo')
    ) {
      throw new BadRequestException({
        error: 'github_oauth_repo_scope_denied',
        message: 'Private-repo access was not granted — the "repo" scope is required.',
        statusCode: 400,
      });
    }

    const userResponse = await fetch(USER_URL, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'smart-onboarding',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!userResponse.ok) {
      throw new BadGatewayException({
        error: 'github_oauth_userinfo_failed',
        message: 'Could not read the GitHub profile after sign-in.',
        statusCode: 502,
      });
    }
    const user = GithubUserSchema.parse(await userResponse.json());

    return {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      accessToken: token.access_token,
      scopes: token.scope
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }
}
