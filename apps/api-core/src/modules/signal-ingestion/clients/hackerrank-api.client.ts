import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  REDIS_TTL_SECONDS,
  type HackerrankBadge,
  type HackerrankContestRating,
  type HackerrankSolvedByTag,
} from '@hirekiwi/contracts';
import { z } from 'zod';
import { RedisService } from '../../../platform/redis/redis.service.js';
import { SignalCircuitBreaker } from '../signal-circuit-breaker.js';

const FETCH_MS = 4_000;
const HR_HOST = 'www.hackerrank.com';

const HackerrankProfileResponseSchema = z.object({
  model: z
    .object({
      badges: z
        .array(
          z.object({
            badge_name: z.string(),
            level: z.string().optional(),
          }),
        )
        .optional()
        .default([]),
      contest_ratings: z
        .array(
          z.object({
            track: z.string(),
            rating: z.number(),
            rank: z.number().optional(),
          }),
        )
        .optional(),
      skills: z
        .array(
          z.object({
            name: z.string(),
            total_challenges: z.number().optional(),
            total_solved: z.number().optional(),
          }),
        )
        .optional()
        .default([]),
    })
    .optional(),
});

const HackerrankLookupResponseSchema = z.object({
  model: z
    .object({
      username: z.string().optional(),
      name: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      level: z.number().nullable().optional(),
    })
    .passthrough()
    .optional(),
});

export interface HackerrankLookupData {
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly country: string | null;
  readonly level: number | null;
}

export interface HackerrankProfileData {
  readonly badges: readonly HackerrankBadge[];
  readonly contestRatings: readonly HackerrankContestRating[];
  readonly solvedByTag: readonly HackerrankSolvedByTag[];
}

/**
 * Thin HackerRank public profile client (S6-VB-01).
 *
 * Owner: Vishal Bharath R.
 */
@Injectable()
export class HackerrankApiClient {
  private readonly logger = new Logger(HackerrankApiClient.name);

  constructor(
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(SignalCircuitBreaker) private readonly breaker: SignalCircuitBreaker,
  ) {}

  /** Public name and photo for one username; null when there is no such profile. */
  async lookupProfile(username: string): Promise<HackerrankLookupData | null> {
    // `/rest/hackers/<name>/profile` answers 404 even for real users; this is the address that
    // serves a public profile (and a real 404 for a name that does not exist).
    const url = `https://${HR_HOST}/rest/contests/master/hackers/${encodeURIComponent(username)}/profile`;
    const result = await this.breaker.execute('HACKERRANK', async (signal) => {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'smart-signal-ingestion' },
        signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_MS)]),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HackerRank lookup failed: HTTP ${response.status}`);
      return HackerrankLookupResponseSchema.safeParse(await response.json().catch(() => ({})));
    });
    if (!result || !result.success || !result.data.model?.username) return null;
    const model = result.data.model;
    const avatar = model.avatar ?? null;
    return {
      username: model.username ?? username,
      displayName: model.name?.trim() || null,
      avatarUrl: avatar && avatar.startsWith('https://') ? avatar : null,
      country: model.country?.trim() || null,
      level: typeof model.level === 'number' && model.level > 0 ? model.level : null,
    };
  }

  async fetchProfile(username: string): Promise<HackerrankProfileData> {
    const cacheKey = `hackerrank:profile:${username.toLowerCase()}`;
    try {
      const hit = await this.redis.get(cacheKey);
      if (hit) return JSON.parse(hit) as HackerrankProfileData;
    } catch {
      /* cache miss */
    }

    const url = `https://${HR_HOST}/rest/hackers/${encodeURIComponent(username)}/profile`;
    const raw = await this.breaker.execute('HACKERRANK', async (signal) => {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'smart-signal-ingestion' },
        signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_MS)]),
      });
      if (!response.ok) {
        throw new Error(`HackerRank profile fetch failed: HTTP ${response.status}`);
      }
      return HackerrankProfileResponseSchema.parse(await response.json());
    });

    const model = raw.model;
    const badges: HackerrankBadge[] = (model?.badges ?? []).map((badge) => ({
      name: badge.badge_name,
      level: badge.level ?? 'unknown',
    }));
    const contestRatings: HackerrankContestRating[] = (model?.contest_ratings ?? []).map((row) => ({
      track: row.track,
      rating: row.rating,
      rank: row.rank,
    }));
    const solvedByTag: HackerrankSolvedByTag[] = (model?.skills ?? [])
      .filter((skill) => (skill.total_solved ?? 0) > 0)
      .map((skill) => ({
        tag: skill.name,
        count: skill.total_solved ?? 0,
        difficulty: 'UNKNOWN' as const,
      }));

    const result: HackerrankProfileData = { badges, contestRatings, solvedByTag };
    try {
      await this.redis.setex(cacheKey, REDIS_TTL_SECONDS.hackerrankProfile, JSON.stringify(result));
    } catch {
      this.logger.debug('HackerRank profile cache write skipped');
    }
    return result;
  }

  async probeProfileExists(username: string): Promise<boolean> {
    const url = `https://${HR_HOST}/${encodeURIComponent(username)}`;
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_MS),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
