import { afterEach, describe, expect, it, vi } from 'vitest';
import { CredlyAdapter, parseBadgePage } from './credly.adapter.js';
import { safeFetch } from '../safe-fetch.util.js';

vi.mock('../safe-fetch.util.js', () => ({
  safeFetch: vi.fn(),
  UnsafeUrlError: class UnsafeUrlError extends Error {},
}));

const BADGE_ID = 'f7ae4be9-fd65-454d-874e-c6e2c3237d41';
const BADGE_URL = `https://www.credly.com/badges/${BADGE_ID}/public_url`;

/** Trimmed from a live public badge page (2026-10-10): no JSON-LD, no visible text, only Open Graph meta. */
function badgePage(ogTitle: string | null): string {
  const og = ogTitle === null ? '' : `<meta property="og:title" content="${ogTitle}">`;
  return `<!DOCTYPE html><html><head><title>Python Essentials 2 - Credly</title>${og}
<meta property="og:image:alt" content="Python Essentials 2 issued by Cisco"></head>
<body><noscript>We've detected that your browser has JavaScript disabled.</noscript></body></html>`;
}

function assertion(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    '@context': 'https://w3id.org/openbadges/v2',
    id: `https://api.credly.com/api/v1/obi/v2/badge_assertions/${BADGE_ID}`,
    issuedOn: '2024-05-01T19:11:02.000Z',
    recipient: { type: 'email', identity: 'sha256$abc', hashed: true },
    type: 'Assertion',
    verification: { type: 'hosted' },
    ...extra,
  });
}

function respond(status: number, text: string) {
  return { status, ok: status >= 200 && status < 300, text, finalUrl: BADGE_URL };
}

async function verify() {
  const adapter = new CredlyAdapter();
  const input = { type: 'URL' as const, value: BADGE_URL };
  return adapter.verify(await adapter.normalize(input));
}

describe('parseBadgePage', () => {
  it.each([
    [
      'CCNA: Switching, Routing, and Wireless Essentials was issued by Cisco to VISHAL V.',
      ['CCNA: Switching, Routing, and Wireless Essentials', 'Cisco', 'VISHAL V'],
    ],
    [
      'Endpoint Security was issued by Cisco to Vishal V.',
      ['Endpoint Security', 'Cisco', 'Vishal V'],
    ],
    [
      'Introduction to Cybersecurity was issued by Cisco to Ann O&#39;Neil.',
      ['Introduction to Cybersecurity', 'Cisco', "Ann O'Neil"],
    ],
  ])(
    'reads badge, issuer and earner from %s',
    (ogTitle, [badgeName, issuerName, recipientName]) => {
      expect(parseBadgePage(badgePage(ogTitle))).toEqual({ badgeName, issuerName, recipientName });
    },
  );

  it('returns null when og:title is missing or not in the issued-to shape', () => {
    expect(parseBadgePage(badgePage(null))).toBeNull();
    expect(parseBadgePage(badgePage('Credly'))).toBeNull();
  });
});

describe('CredlyAdapter.verify', () => {
  afterEach(() => vi.mocked(safeFetch).mockReset());

  it('verifies from og:title + an active assertion and reports the earner name', async () => {
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(
        respond(200, badgePage('Python Essentials 2 was issued by Cisco to VISHAL V.')),
      )
      .mockResolvedValueOnce(respond(200, assertion()));

    const result = await verify();

    expect(result.status).toBe('VERIFIED');
    expect(result.verificationLevel).toBe('CREDENTIAL_PLATFORM_VERIFIED');
    expect(result.subjectName).toBe('VISHAL V');
    expect(vi.mocked(safeFetch).mock.calls[1]?.[0]).toBe(
      `https://api.credly.com/v1/obi/v2/badge_assertions/${BADGE_ID}`,
    );
  });

  it('reports REVOKED from a revoked assertion (200 + revoked:true, or 410)', async () => {
    const page = badgePage('Python Essentials 2 was issued by Cisco to Vishal V.');
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(respond(200, page))
      .mockResolvedValueOnce(respond(200, assertion({ revoked: true, revocationReason: 'Fraud' })));
    expect((await verify()).status).toBe('REVOKED');

    vi.mocked(safeFetch)
      .mockResolvedValueOnce(respond(200, page))
      .mockResolvedValueOnce(respond(410, ''));
    expect((await verify()).status).toBe('REVOKED');
  });

  it('reports EXPIRED when the assertion expiry has passed', async () => {
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(
        respond(200, badgePage('Python Essentials 2 was issued by Cisco to Vishal V.')),
      )
      .mockResolvedValueOnce(respond(200, assertion({ expires: '2020-01-01T00:00:00.000Z' })));
    expect((await verify()).status).toBe('EXPIRED');
  });

  it('verifies with warnings when the assertion lookup fails', async () => {
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(
        respond(200, badgePage('Python Essentials 2 was issued by Cisco to Vishal V.')),
      )
      .mockResolvedValueOnce(respond(503, ''));
    const result = await verify();
    expect(result.status).toBe('VERIFIED_WITH_WARNINGS');
    expect(result.subjectName).toBe('Vishal V');
  });

  it('is UNVERIFIABLE (no earner name) when the page has no usable og:title', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(200, badgePage(null)));
    const result = await verify();
    expect(result.status).toBe('UNVERIFIABLE');
    expect(result.subjectName).toBeNull();
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });

  it('is NOT_FOUND when the badge page 404s', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(respond(404, ''));
    expect((await verify()).status).toBe('NOT_FOUND');
  });
});
