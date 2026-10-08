import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_LOCK_NAME,
  createRefreshAccessToken,
  refreshAcrossTabs,
} from './session.js';

/** Th6-614 - five tabs must share ONE refresh. */

function jwt(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `eyJhbGciOiJub25lIn0.${body}.sig`;
}

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

/** First-in-first-out mutex standing in for navigator.locks. */
function fakeLocks() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    names: [] as string[],
    request(name: string, _options: unknown, callback: () => Promise<unknown>) {
      this.names.push(name);
      const result = tail.then(callback);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}

const NOW_S = Math.floor(Date.now() / 1_000);
const STALE = jwt({ sub: 'u1', role: 'STUDENT', iat: NOW_S - 3_600, exp: NOW_S - 2_700 });
const FRESH = jwt({ sub: 'u1', role: 'STUDENT', iat: NOW_S, exp: NOW_S + 900 });

let local: ReturnType<typeof memoryStorage>;
let session: ReturnType<typeof memoryStorage>;

function installBrowser(locks: unknown) {
  local = memoryStorage({ [ACCESS_TOKEN_KEY]: STALE });
  session = memoryStorage({ [ACCESS_TOKEN_KEY]: STALE });
  vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
  vi.stubGlobal('navigator', { locks });
}

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());

describe('refreshAcrossTabs', () => {
  it('lets five tabs holding the same stale token trigger exactly one refresh', async () => {
    const locks = fakeLocks();
    installBrowser(locks);
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      local.setItem(ACCESS_TOKEN_KEY, FRESH);
      return FRESH;
    });

    const results = await Promise.all(Array.from({ length: 5 }, () => refreshAcrossTabs(refresh)));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill(FRESH));
    expect(locks.names.every((name) => name === REFRESH_LOCK_NAME)).toBe(true);
    // Waiting tabs adopt the new token in their own per-tab storage too.
    expect(session.getItem(ACCESS_TOKEN_KEY)).toBe(FRESH);
  });

  it('refreshes when no other tab has rotated the token', async () => {
    installBrowser(fakeLocks());
    const refresh = vi.fn(async () => FRESH);
    expect(await refreshAcrossTabs(refresh)).toBe(FRESH);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reuses a token another tab minted seconds ago only when asked to', async () => {
    installBrowser(fakeLocks());
    local.setItem(ACCESS_TOKEN_KEY, FRESH);
    const refresh = vi.fn(async () => 'brand-new');

    // Boot-time check: a token minted moments ago is good enough.
    expect(await refreshAcrossTabs(refresh, { reuseRecent: true })).toBe(FRESH);
    expect(refresh).not.toHaveBeenCalled();

    // A refresh after a 401 must never hand back the token that just failed.
    expect(await refreshAcrossTabs(refresh)).toBe('brand-new');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('falls back to a plain refresh without the Web Locks API', async () => {
    installBrowser(undefined);
    const refresh = vi.fn(async () => FRESH);
    expect(await refreshAcrossTabs(refresh)).toBe(FRESH);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes on its own when waiting for another tab times out', async () => {
    installBrowser({
      request: vi.fn(async () => {
        throw new DOMException('timed out', 'AbortError');
      }),
    });
    const refresh = vi.fn(async () => FRESH);
    expect(await refreshAcrossTabs(refresh)).toBe(FRESH);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not touch browser storage on the server', async () => {
    vi.unstubAllGlobals();
    const refresh = vi.fn(async () => FRESH);
    expect(await refreshAcrossTabs(refresh)).toBe(FRESH);
  });
});

describe('createRefreshAccessToken', () => {
  it('stores the rotated token and shares one refresh between tabs', async () => {
    installBrowser(fakeLocks());
    const api = vi.fn(async () => ({ accessToken: FRESH }));
    const refreshToken = createRefreshAccessToken(api);

    const results = await Promise.all([refreshToken(), refreshToken(), refreshToken()]);

    expect(api).toHaveBeenCalledTimes(1);
    expect(results).toEqual([FRESH, FRESH, FRESH]);
    expect(local.getItem(ACCESS_TOKEN_KEY)).toBe(FRESH);
  });

  it('returns null when the refresh is refused', async () => {
    installBrowser(fakeLocks());
    const refreshToken = createRefreshAccessToken(async () => {
      throw new Error('401');
    });
    expect(await refreshToken()).toBeNull();
  });
});
