import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PROJECT_VERIFY_README_MAX_CHARS, REDIS_TTL_SECONDS } from '@hirekiwi/contracts';
import { env } from '../../../platform/config/env.js';
import { RedisService } from '../../../platform/redis/redis.service.js';

/**
 * Thin GitHub REST v3 client. Mirrors the fetch+timeout+zod pattern already
 * used in `evaluation/project-verify.web-similarity.ts` for the same API.
 *
 * Two auth modes:
 *  - App-level (`fetchProfile`, `listRepos`, `getReadme`, `repoLanguages`):
 *    unauthenticated-equivalent public data, cached in Redis, using the
 *    shared GITHUB_API_TOKEN PAT (raises the unauthenticated-per-IP rate
 *    limit of 60/hr to 5,000/hr; no scopes needed, public data only).
 *  - Per-student OAuth (`*Authenticated` methods): the student's own `repo`-
 *    scope access token from GithubOauthService, for reading their private
 *    repos. Never cached — caching one student's private repo content under
 *    a global key would leak it to any other code path that reuses that key.
 */

const GITHUB_API = 'https://api.github.com';
const FETCH_MS = 4_000;

export class GithubNotFoundError extends Error {
  constructor(login: string) {
    super(`GitHub user not found: ${login}`);
    this.name = 'GithubNotFoundError';
  }
}

const GithubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable().default(null),
  avatar_url: z.string(),
  bio: z.string().nullable().default(null),
  public_repos: z.number().int().nonnegative(),
});

const GithubRepoSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  description: z.string().nullable().default(null),
  html_url: z.string(),
  stargazers_count: z.number().int().nonnegative().default(0),
  language: z.string().nullable().default(null),
  updated_at: z.string(),
  fork: z.boolean().optional(),
  private: z.boolean().optional(),
});

const GithubLanguagesSchema = z.record(z.string(), z.number().int().nonnegative());

export interface GithubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepoCount: number;
}

export interface GithubRepo {
  id: number;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  primaryLanguage: string | null;
  updatedAt: string;
}

/** Extracts the username from a GitHub profile URL. Returns null if not a github.com URL. */
export function extractGithubLogin(githubUrl: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(githubUrl) ? githubUrl : `https://${githubUrl}`;
    const url = new URL(withScheme);
    if (!/(^|\.)github\.com$/i.test(url.hostname)) return null;
    const [login] = url.pathname.split('/').filter(Boolean);
    return login && /^[\w-]{1,100}$/.test(login) ? login : null;
  } catch {
    return null;
  }
}

@Injectable()
export class GithubApiClient {
  private readonly logger = new Logger(GithubApiClient.name);

  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'hirekiwi-onboarding',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (env.GITHUB_API_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_API_TOKEN}`;
    return headers;
  }

  /** Per-student token headers — never falls back to the shared app token. */
  private authedHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'hirekiwi-onboarding',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private async cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.redis.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      /* cache unavailable — fall through to a live call */
    }
    const value = await load();
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      this.logger.debug('GitHub response cache write skipped (Redis unavailable)');
    }
    return value;
  }

  async fetchProfile(login: string): Promise<GithubProfile> {
    return this.cached(
      `onboarding:github:profile:${login.toLowerCase()}`,
      REDIS_TTL_SECONDS.githubProfile,
      async () => {
        const response = await fetch(`${GITHUB_API}/users/${encodeURIComponent(login)}`, {
          headers: this.headers(),
          signal: AbortSignal.timeout(FETCH_MS),
        });
        if (response.status === 404) throw new GithubNotFoundError(login);
        if (!response.ok) throw new Error(`github_user_${String(response.status)}`);
        const body = GithubUserSchema.parse(await response.json());
        return {
          login: body.login,
          name: body.name,
          avatarUrl: body.avatar_url,
          bio: body.bio,
          publicRepoCount: body.public_repos,
        };
      },
    );
  }

  async listRepos(login: string): Promise<GithubRepo[]> {
    return this.cached(
      `onboarding:github:repos:${login.toLowerCase()}`,
      REDIS_TTL_SECONDS.githubRepoList,
      async () => {
        const response = await fetch(
          `${GITHUB_API}/users/${encodeURIComponent(login)}/repos?type=owner&sort=updated&per_page=100`,
          { headers: this.headers(), signal: AbortSignal.timeout(FETCH_MS) },
        );
        if (response.status === 404) throw new GithubNotFoundError(login);
        if (!response.ok) throw new Error(`github_repos_${String(response.status)}`);
        const body = z.array(GithubRepoSchema).parse(await response.json());
        return body
          .filter((repo) => !repo.fork && !repo.private)
          .map((repo) => ({
            id: repo.id,
            fullName: repo.full_name,
            description: repo.description,
            htmlUrl: repo.html_url,
            stars: repo.stargazers_count,
            primaryLanguage: repo.language,
            updatedAt: repo.updated_at,
          }));
      },
    );
  }

  /** Raw README markdown for one repo. Returns null on any failure (no README, private, rate-limited) — never throws. */
  async getReadme(fullName: string): Promise<string | null> {
    return this.cached(
      `onboarding:github:readme:${fullName.toLowerCase()}`,
      REDIS_TTL_SECONDS.githubReadme,
      async () => {
        try {
          const response = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
            headers: { ...this.headers(), Accept: 'application/vnd.github.raw' },
            signal: AbortSignal.timeout(FETCH_MS),
          });
          if (!response.ok) return null;
          const text = await response.text();
          return text.slice(0, PROJECT_VERIFY_README_MAX_CHARS);
        } catch (error) {
          this.logger.warn(
            `getReadme(${fullName}) failed: ${error instanceof Error ? error.message : 'unknown'}`,
          );
          return null;
        }
      },
    );
  }

  /** Bytes of code per language for one repo. Returns {} on any failure — never throws. */
  async repoLanguages(fullName: string): Promise<Record<string, number>> {
    return this.cached(
      `onboarding:github:langs:${fullName.toLowerCase()}`,
      REDIS_TTL_SECONDS.githubRepoLanguages,
      async () => {
        try {
          const response = await fetch(`${GITHUB_API}/repos/${fullName}/languages`, {
            headers: this.headers(),
            signal: AbortSignal.timeout(FETCH_MS),
          });
          if (!response.ok) return {};
          return GithubLanguagesSchema.parse(await response.json());
        } catch (error) {
          this.logger.warn(
            `repoLanguages(${fullName}) failed: ${error instanceof Error ? error.message : 'unknown'}`,
          );
          return {};
        }
      },
    );
  }

  /**
   * Every repo the OAuth-connected student can access — `/user/repos` (not
   * `/users/:login/repos`), so private repos are included when the token
   * carries `repo` scope. Not cached; see the class doc comment for why.
   */
  async listReposForAuthenticatedUser(accessToken: string): Promise<GithubRepo[]> {
    const response = await fetch(
      `${GITHUB_API}/user/repos?affiliation=owner&sort=updated&per_page=100`,
      { headers: this.authedHeaders(accessToken), signal: AbortSignal.timeout(FETCH_MS) },
    );
    if (!response.ok) throw new Error(`github_user_repos_${String(response.status)}`);
    const body = z.array(GithubRepoSchema).parse(await response.json());
    return body
      .filter((repo) => !repo.fork)
      .map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        stars: repo.stargazers_count,
        primaryLanguage: repo.language,
        updatedAt: repo.updated_at,
      }));
  }

  /** Authenticated equivalent of {@link getReadme}, for a repo that may be private. */
  async getReadmeAuthenticated(fullName: string, accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
        headers: { ...this.authedHeaders(accessToken), Accept: 'application/vnd.github.raw' },
        signal: AbortSignal.timeout(FETCH_MS),
      });
      if (!response.ok) return null;
      const text = await response.text();
      return text.slice(0, PROJECT_VERIFY_README_MAX_CHARS);
    } catch (error) {
      this.logger.warn(
        `getReadmeAuthenticated(${fullName}) failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }

  /** Authenticated equivalent of {@link repoLanguages}, for a repo that may be private. */
  async repoLanguagesAuthenticated(
    fullName: string,
    accessToken: string,
  ): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${GITHUB_API}/repos/${fullName}/languages`, {
        headers: this.authedHeaders(accessToken),
        signal: AbortSignal.timeout(FETCH_MS),
      });
      if (!response.ok) return {};
      return GithubLanguagesSchema.parse(await response.json());
    } catch (error) {
      this.logger.warn(
        `repoLanguagesAuthenticated(${fullName}) failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return {};
    }
  }
}
