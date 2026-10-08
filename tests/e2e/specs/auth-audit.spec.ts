/// <reference lib="dom" />
import { randomInt } from 'node:crypto';
import { expect, test, type BrowserContext, type Page, type Response } from '@playwright/test';
import {
  HireKiwiApiClient,
  HireKiwiApiError,
  describeApiError,
} from '../../../packages/api-client/dist/index.js';
import { apiV1, e2eEnv } from '../helpers/env.js';
import { uniqueSuffix } from '../helpers/flows.js';

/**
 * Th6-614 peer audit - TEST ONLY. These specs observe the auth stack as it is today and are
 * written to FAIL when it misbehaves; they never touch auth/backend code.
 *
 * Needs the full local stack (see tests/e2e/README.md): API :3000, web-auth :3005,
 * web-student :3001, Postgres/Redis/Mailpit, and the seeded student account.
 */

const ACCESS_TOKEN_KEY = 'hirekiwi.accessToken';
const TABS = 5;

function fakeIp(): string {
  return `10.${randomInt(1, 250)}.${randomInt(1, 250)}.${randomInt(1, 250)}`;
}

/** Keeps a real token's header + payload but moves `exp` into the past (signature no longer valid). */
function expireToken(token: string): string {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) throw new Error('Not a JWT');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    exp?: number;
    iat?: number;
  };
  claims.exp = Math.floor(Date.now() / 1000) - 3600;
  claims.iat = claims.exp - 900;
  return `${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${signature}`;
}

/** Signs in through the API with the context's own request client, so the HttpOnly cookie lands in the browser context. */
async function signInContext(
  context: BrowserContext,
  email: string,
  password: string,
): Promise<{ accessToken: string }> {
  const response = await context.request.post(`${apiV1}/auth/login`, {
    data: { email, password },
    headers: { 'x-forwarded-for': fakeIp() },
  });
  expect([200, 201], await response.text()).toContain(response.status());
  const body = (await response.json()) as { accessToken: string };
  return { accessToken: body.accessToken };
}

/** Seeds the student origin's storage with a token before any app code runs. */
async function seedToken(context: BrowserContext, token: string): Promise<void> {
  await context.addInitScript(
    ({ key, value, origin }) => {
      if (window.location.origin !== origin) return;
      window.sessionStorage.setItem(key, value);
      window.localStorage.setItem(key, value);
    },
    { key: ACCESS_TOKEN_KEY, value: token, origin: new URL(e2eEnv.studentAppUrl).origin },
  );
}

/** GET /users/me that waits out a 429 (honouring Retry-After) so rate limiting can't mask the result. */
async function getMe(context: BrowserContext, token: string) {
  let response = await context.request.get(`${apiV1}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  for (let attempt = 0; attempt < 3 && response.status() === 429; attempt += 1) {
    const wait = Math.min(Number(response.headers()['retry-after']) || 5, 70);
    await new Promise((resolve) => setTimeout(resolve, wait * 1_000));
    response = await context.request.get(`${apiV1}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return response;
}

function isRefresh(response: Response): boolean {
  return response.url().includes('/api/v1/auth/refresh') && response.request().method() === 'POST';
}

test.describe('auth audit (Th6-614)', () => {
  test('1. five tabs with an expired access token refresh exactly once and stay signed in', async ({
    browser,
  }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext();
    try {
      const { accessToken } = await signInContext(context, e2eEnv.studentEmail, e2eEnv.password);
      await seedToken(context, expireToken(accessToken));

      const pages: Page[] = await Promise.all(
        Array.from({ length: TABS }, () => context.newPage()),
      );
      const refreshStatuses: number[] = [];
      const unauthorized: string[] = [];
      for (const page of pages) {
        page.on('response', (response) => {
          if (isRefresh(response)) refreshStatuses.push(response.status());
          else if (response.status() === 401 && response.url().startsWith(e2eEnv.apiUrl)) {
            unauthorized.push(response.url());
          }
        });
      }

      // All five tabs boot at the same moment, each holding the same stale token.
      await Promise.all(pages.map((page) => page.goto(`${e2eEnv.studentAppUrl}/dashboard`)));
      await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));

      const successful = refreshStatuses.filter((status) => status >= 200 && status < 300).length;
      test.info().annotations.push({
        type: 'evidence',
        description: `refresh responses: [${refreshStatuses.join(', ')}]; API 401s: ${unauthorized.length}`,
      });
      expect.soft(successful, `refresh statuses: ${refreshStatuses.join(',')}`).toBe(1);

      // Every tab is still on the student app (not bounced to login) and holds a working token.
      for (const [index, page] of pages.entries()) {
        expect.soft(page.url(), `tab ${index + 1}`).not.toContain('/login');
        const stored = await page.evaluate(
          (key) => window.localStorage.getItem(key),
          ACCESS_TOKEN_KEY,
        );
        expect.soft(stored, `tab ${index + 1} token`).toBeTruthy();
        const me = await getMe(context, stored ?? '');
        expect.soft(me.status(), `tab ${index + 1} /users/me`).toBe(200);
      }

      // No 401 loop: each tab may see its own first 401, but not repeated ones.
      expect.soft(unauthorized.length, unauthorized.join('\n')).toBeLessThanOrEqual(TABS * 4);
    } finally {
      await context.close();
    }
  });

  test('2. spamming an endpoint reaches 429 with valid rate-limit headers that api-client understands', async () => {
    const ip = fakeIp();
    const seen: Array<{ status: number; headers: Record<string, string> }> = [];
    const recordingFetch: typeof fetch = async (input, init) => {
      const response = await fetch(input, {
        ...init,
        headers: { ...(init?.headers as Record<string, string>), 'x-forwarded-for': ip },
      });
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      seen.push({ status: response.status, headers });
      return response;
    };
    const client = new HireKiwiApiClient({ baseUrl: e2eEnv.apiUrl, fetchImpl: recordingFetch });

    let caught: unknown;
    for (let attempt = 0; attempt < 40 && !caught; attempt += 1) {
      try {
        await client.post(
          `/api/v1/auth/login`,
          { email: `nobody-${uniqueSuffix()}@example.com`, password: 'irrelevant' },
          { anonymous: true },
        );
      } catch (error) {
        if (error instanceof HireKiwiApiError && error.statusCode === 429) caught = error;
      }
    }
    expect(
      caught,
      `never throttled; statuses: ${seen.map((s) => s.status).join(',')}`,
    ).toBeTruthy();

    const throttled = [...seen].reverse().find((entry) => entry.status === 429);
    if (!throttled) throw new Error('no 429 recorded');
    const header = (name: string) => throttled.headers[name];
    const asNumber = (name: string) => Number(header(name));
    test.info().annotations.push({
      type: 'evidence',
      description: `429 headers: ${JSON.stringify({
        limit: header('x-ratelimit-limit'),
        remaining: header('x-ratelimit-remaining'),
        reset: header('x-ratelimit-reset'),
        retryAfter: header('retry-after'),
      })}`,
    });

    expect(header('x-ratelimit-limit'), 'X-RateLimit-Limit').toBeDefined();
    expect(
      Number.isFinite(asNumber('x-ratelimit-limit')) && asNumber('x-ratelimit-limit') > 0,
    ).toBe(true);
    expect(header('x-ratelimit-remaining'), 'X-RateLimit-Remaining').toBeDefined();
    expect(asNumber('x-ratelimit-remaining')).toBe(0);
    expect(header('x-ratelimit-reset'), 'X-RateLimit-Reset').toBeDefined();
    expect(
      Number.isFinite(asNumber('x-ratelimit-reset')) && asNumber('x-ratelimit-reset') > 0,
    ).toBe(true);
    expect(header('retry-after'), 'Retry-After').toBeDefined();
    expect(Number.isInteger(asNumber('retry-after')) && asNumber('retry-after') > 0).toBe(true);

    // The remaining count should fall as the limit is approached.
    const remaining = seen
      .filter((entry) => entry.headers['x-ratelimit-remaining'] !== undefined)
      .map((entry) => Number(entry.headers['x-ratelimit-remaining']));
    expect(remaining.length).toBeGreaterThan(1);
    expect(remaining[0]).toBeGreaterThan(remaining[remaining.length - 1] ?? 0);

    // api-client turns the 429 into an error a user can act on.
    const error = caught as HireKiwiApiError;
    expect(error.statusCode).toBe(429);
    expect(error.retryAfterSeconds, 'retryAfterSeconds on the parsed error').toBeGreaterThan(0);
    expect(Math.abs((error.retryAfterSeconds ?? 0) - asNumber('retry-after'))).toBeLessThanOrEqual(
      2,
    );
    expect(describeApiError(error)).toMatch(/try again|retry|wait|too many/i);
  });

  test('3. after logout in tab 1, tab 2 is rejected at once and sent to login; the old token is dead', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    try {
      const { accessToken } = await signInContext(context, e2eEnv.studentEmail, e2eEnv.password);
      await seedToken(context, accessToken);

      const tab1 = await context.newPage();
      const tab2 = await context.newPage();
      await Promise.all([
        tab1.goto(`${e2eEnv.studentAppUrl}/dashboard`),
        tab2.goto(`${e2eEnv.studentAppUrl}/dashboard`),
      ]);
      await Promise.all([
        tab1.waitForLoadState('networkidle'),
        tab2.waitForLoadState('networkidle'),
      ]);
      expect(tab2.url()).not.toContain('/login');

      // Tab 1: sign out through the real menu.
      await tab1.getByRole('button', { name: /User menu for/i }).click();
      await tab1.getByRole('menuitem', { name: /Log Out/i }).click();
      await tab1.waitForURL(/\/login/, { timeout: 30_000 });

      // Tab 2: do something that needs the API, recording what the server says.
      const apiStatuses: number[] = [];
      tab2.on('response', (response) => {
        if (response.url().startsWith(e2eEnv.apiUrl)) apiStatuses.push(response.status());
      });
      const started = Date.now();
      await tab2.goto(`${e2eEnv.studentAppUrl}/profile`);
      await tab2.waitForURL(/\/login/, { timeout: 15_000 }).catch(() => undefined);
      const redirectedMs = Date.now() - started;

      // The old access token no longer works on the API.
      const oldToken = await context.request.get(`${apiV1}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // And the refresh cookie was revoked with the session.
      const refresh = await context.request.post(`${apiV1}/auth/refresh`);

      test.info().annotations.push({
        type: 'evidence',
        description: `tab2 API statuses: [${apiStatuses.join(', ')}]; tab2 url: ${tab2.url()} (${redirectedMs} ms); old token /users/me: ${oldToken.status()}; refresh after logout: ${refresh.status()}`,
      });

      expect.soft(apiStatuses, 'tab 2 saw a 401 from the API').toContain(401);
      expect.soft(tab2.url(), 'tab 2 ends on the login page').toMatch(/\/login/);
      expect.soft(oldToken.status(), 'old access token is rejected').toBe(401);
      expect.soft(refresh.status(), 'refresh cookie is revoked').toBe(401);
    } finally {
      await context.close();
    }
  });
});
