'use client';

import Script from 'next/script';
import { isIndexable } from '@/lib/seo';

/**
 * The CookieYes CDN script validates its registered domain at runtime and fails on any host
 * other than the real production domain — and Next.js's script loader logs that failure to
 * the console itself (`.catch(e => console.error(e))` in its own runtime), regardless of
 * whether an `onError` handler is attached. That fails Lighthouse's errors-in-console audit
 * on every non-production host, including CI (confirmed failing the same way on PRs that
 * don't touch this file at all — lighthouserc.json even blocks the CDN URL on purpose).
 *
 * The only fix that actually avoids the console.error is to never attempt the load at all
 * anywhere but production. `isIndexable()` (shared with the robots/sitemap "production only"
 * rule in lib/seo.ts) reads NEXT_PUBLIC_ENV, inlined at build time, so this works in the
 * client bundle too.
 */
export default function CookieYesScript() {
  if (!isIndexable()) return null;

  return (
    <Script
      id="cookieyes"
      src="https://cdn-cookieyes.com/client_data/be2546efcbf450059885daed3260170c/script.js"
      strategy="afterInteractive"
    />
  );
}
