import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignalProfilePreviewSchema } from '@hirekiwi/contracts';
import { HackerrankSignalAdapter } from './adapters/hackerrank-signal.adapter.js';
import { LeetcodeSignalAdapter } from './adapters/leetcode-signal.adapter.js';
import { HackerrankApiClient } from './clients/hackerrank-api.client.js';
import { LeetcodeStatsClient } from './clients/leetcode-stats.client.js';

/** Checking a username before connecting: exists? whose is it? */

const breaker = {
  execute: async (_id: string, fn: (signal: AbortSignal) => Promise<unknown>) =>
    fn(new AbortController().signal),
};

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function leetcodeAdapter(setResults: (string | null)[] = ['OK']) {
  const queue = [...setResults];
  const redis = {
    get: vi.fn(async () => null),
    setex: vi.fn(async () => 'OK'),
    set: vi.fn(async () => (queue.length > 1 ? queue.shift() : (queue[0] ?? 'OK'))),
  };
  const client = new LeetcodeStatsClient(redis as never, breaker as never);
  return { adapter: new LeetcodeSignalAdapter(client), redis };
}

// The shape LeetCode really returns for a public profile (checked for `vishalbharath`).
const LEETCODE_PROFILE = {
  data: {
    matchedUser: {
      username: 'vishalbharath',
      profile: {
        realName: 'VISHAL BHARATH',
        userAvatar: 'https://assets.leetcode.com/users/default_avatar.jpg',
      },
      submitStats: {
        acSubmissionNum: [
          { difficulty: 'All', count: 42 },
          { difficulty: 'Easy', count: 30 },
        ],
      },
    },
  },
};

describe('LeetCode username lookup', () => {
  it('returns the name, photo and solved count for a real public profile', async () => {
    stubFetch(LEETCODE_PROFILE);
    const preview = await leetcodeAdapter().adapter.lookupProfile('vishalbharath');

    expect(preview).toEqual({
      sourceId: 'LEETCODE',
      username: 'vishalbharath',
      displayName: 'VISHAL BHARATH',
      avatarUrl: 'https://assets.leetcode.com/users/default_avatar.jpg',
      profileUrl: 'https://leetcode.com/u/vishalbharath/',
      summary: '42 problems solved',
    });
    // It is exactly what the API promises to send to the browser.
    expect(SignalProfilePreviewSchema.safeParse(preview).success).toBe(true);
  });

  it('says "not found" for a username that has no public profile', async () => {
    stubFetch({ data: { matchedUser: null } });
    await expect(leetcodeAdapter().adapter.lookupProfile('vishalbhart')).rejects.toMatchObject({
      response: { error: 'leetcode_user_not_found' },
    });
    stubFetch({ errors: [{ message: 'User not found' }] });
    await expect(leetcodeAdapter().adapter.lookupProfile('nobody')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('never hands the browser a non-https photo', async () => {
    stubFetch({
      data: {
        matchedUser: {
          ...LEETCODE_PROFILE.data.matchedUser,
          profile: { realName: 'Ada', userAvatar: 'http://insecure.example/a.png' },
        },
      },
    });
    const preview = await leetcodeAdapter().adapter.lookupProfile('ada');
    expect(preview.avatarUrl).toBeNull();
  });

  it('falls back to no name when the profile has none', async () => {
    stubFetch({
      data: {
        matchedUser: { username: 'ada', profile: { realName: '  ', userAvatar: null } },
      },
    });
    const preview = await leetcodeAdapter().adapter.lookupProfile('ada');
    expect(preview.displayName).toBeNull();
    expect(preview.summary).toBeNull();
  });

  it('reports a clear "cannot reach LeetCode" (not "not found") when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(leetcodeAdapter().adapter.lookupProfile('ada')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('refuses a URL or unsafe text instead of calling out to it', async () => {
    const fetchMock = stubFetch(LEETCODE_PROFILE);
    await expect(
      leetcodeAdapter().adapter.lookupProfile('https://evil.example'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('waits out the one-request-per-second limit instead of failing', async () => {
    vi.useFakeTimers();
    stubFetch(LEETCODE_PROFILE);
    // First attempt is throttled (SET NX returns null), the next one is allowed.
    const { adapter } = leetcodeAdapter([null, 'OK']);
    const pending = adapter.lookupProfile('vishalbharath');
    await vi.advanceTimersByTimeAsync(1_200);
    await expect(pending).resolves.toMatchObject({ username: 'vishalbharath' });
  });
});

function hackerrankAdapter() {
  const redis = { get: vi.fn(async () => null), setex: vi.fn(async () => 'OK') };
  const client = new HackerrankApiClient(redis as never, breaker as never);
  return new HackerrankSignalAdapter(client);
}

describe('HackerRank username lookup', () => {
  it('returns the name, photo and a short summary', async () => {
    stubFetch({
      model: {
        username: 'ada_hr',
        name: 'Ada Lovelace',
        avatar: 'https://hrcdn.com/avatars/ada.png',
        country: 'India',
        level: 5,
      },
    });
    const preview = await hackerrankAdapter().lookupProfile('ada_hr');
    expect(preview).toEqual({
      sourceId: 'HACKERRANK',
      username: 'ada_hr',
      displayName: 'Ada Lovelace',
      avatarUrl: 'https://hrcdn.com/avatars/ada.png',
      profileUrl: 'https://www.hackerrank.com/profile/ada_hr',
      summary: 'Level 5 · India',
    });
    expect(SignalProfilePreviewSchema.safeParse(preview).success).toBe(true);
  });

  it('says "not found" for an unknown username (HTTP 404 or an empty model)', async () => {
    stubFetch({}, 404);
    await expect(hackerrankAdapter().lookupProfile('nobody')).rejects.toMatchObject({
      response: { error: 'hackerrank_user_not_found' },
    });
    stubFetch({ model: {} });
    await expect(hackerrankAdapter().lookupProfile('nobody')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reports a clear error when HackerRank cannot be reached', async () => {
    stubFetch({}, 503);
    await expect(hackerrankAdapter().lookupProfile('ada_hr')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
