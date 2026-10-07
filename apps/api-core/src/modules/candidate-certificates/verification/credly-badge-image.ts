const CREDLY_HOSTS = new Set(['credly.com', 'www.credly.com']);
const FETCH_TIMEOUT_MS = 3_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const MAX_HTML_BYTES = 600_000;

const cache = new Map<string, { image: string | null; expiresAt: number }>();

/** True only for an https link on credly.com, so nothing else can be fetched on a student's behalf. */
export function isCredlyBadgeUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' && CREDLY_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Reads the `og:image` address out of a page, in either attribute order. */
export function extractOgImage(html: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    if (!/property=["']og:image["']/iu.test(tag)) continue;
    const content = /content=["']([^"']+)["']/iu.exec(tag)?.[1];
    if (!content) continue;
    try {
      const image = new URL(content);
      // Only a Credly-hosted https picture is passed on to the browser.
      if (image.protocol === 'https:' && image.hostname.toLowerCase().endsWith('credly.com')) {
        return image.toString();
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * The badge picture for a Credly verification link, or null when the link is not Credly's, the
 * page has no picture, or Credly cannot be reached. Never throws; results are cached for a day.
 */
export async function credlyBadgeImage(
  verificationUrl: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (!isCredlyBadgeUrl(verificationUrl)) return null;
  const key = new URL((verificationUrl as string).trim()).toString();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.image;

  let image: string | null = null;
  try {
    const response = await fetchImpl(key, {
      method: 'GET',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SMART-Certificate-Preview/1.0)' },
      redirect: 'follow',
    });
    if (response.ok && isCredlyBadgeUrl(response.url || key)) {
      image = extractOgImage((await response.text()).slice(0, MAX_HTML_BYTES));
    }
  } catch {
    image = null;
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  // A failed look-up is remembered only briefly so a short Credly outage is retried soon.
  cache.set(key, { image, expiresAt: Date.now() + (image ? CACHE_TTL_MS : 60_000) });
  return image;
}
