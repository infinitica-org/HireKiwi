import { describe, expect, it, vi } from 'vitest';

import { credlyBadgeImage, extractOgImage, isCredlyBadgeUrl } from './credly-badge-image.js';

const IMAGE = 'https://images.credly.com/images/abc/image.png';

function page(html: string, url = 'https://www.credly.com/badges/one') {
  return vi.fn().mockResolvedValue({ ok: true, url, text: async () => html });
}

describe('Credly badge picture', () => {
  it('accepts only https credly.com links', () => {
    expect(isCredlyBadgeUrl('https://www.credly.com/badges/x')).toBe(true);
    expect(isCredlyBadgeUrl('http://www.credly.com/badges/x')).toBe(false);
    expect(isCredlyBadgeUrl('https://credly.com.evil.example/badges/x')).toBe(false);
    expect(isCredlyBadgeUrl('https://evil.example/credly.com')).toBe(false);
    expect(isCredlyBadgeUrl(null)).toBe(false);
  });

  it('reads og:image in either attribute order and ignores foreign hosts', () => {
    expect(extractOgImage(`<meta property="og:image" content="${IMAGE}">`)).toBe(IMAGE);
    expect(extractOgImage(`<meta content="${IMAGE}" property="og:image" />`)).toBe(IMAGE);
    expect(extractOgImage('<meta property="og:image" content="https://evil.example/a.png">')).toBe(
      null,
    );
    expect(extractOgImage('<html></html>')).toBe(null);
  });

  it('returns the badge picture for a Credly link', async () => {
    const fetchMock = page(`<meta property="og:image" content="${IMAGE}">`);
    expect(await credlyBadgeImage('https://www.credly.com/badges/one', fetchMock)).toBe(IMAGE);
  });

  it('does not fetch anything for a non-Credly link', async () => {
    const fetchMock = page('');
    expect(await credlyBadgeImage('https://example.com/cert', fetchMock)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null instead of throwing when Credly cannot be reached or redirects away', async () => {
    const down = vi.fn().mockRejectedValue(new Error('network'));
    expect(await credlyBadgeImage('https://www.credly.com/badges/down', down)).toBeNull();
    const away = page(`<meta property="og:image" content="${IMAGE}">`, 'https://evil.example/x');
    expect(await credlyBadgeImage('https://www.credly.com/badges/away', away)).toBeNull();
  });

  it('remembers a result so the page is fetched once', async () => {
    const fetchMock = page(`<meta property="og:image" content="${IMAGE}">`);
    await credlyBadgeImage('https://www.credly.com/badges/cached', fetchMock);
    await credlyBadgeImage('https://www.credly.com/badges/cached', fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
