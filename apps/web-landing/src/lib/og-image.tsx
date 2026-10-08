import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND_INK, BRAND_LIME, OG_IMAGE_SIZE, PAGES, siteUrl, type PageKey } from '@/lib/seo';

/**
 * Renders the 1200×630 share card for a landing route. Used by every
 * `opengraph-image.tsx` / `twitter-image.tsx`; statically generated at build.
 * TODO(Th6-598): swap for final OG artwork from design once available.
 */
export async function renderOgImage(key: PageKey): Promise<ImageResponse> {
  const page = PAGES[key];
  const logo = await readFile(join(process.cwd(), 'public/icons/icon-512.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;
  const host = siteUrl().host;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 80px',
        backgroundColor: '#ffffff',
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(225,255,160,0.85) 0%, rgba(180,248,220,0.5) 45%, rgba(255,255,255,0) 80%)',
        color: BRAND_INK,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <img src={logoSrc} width={88} height={88} alt="" style={{ borderRadius: 22 }} />
        <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em' }}>hirekiwi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            width: 160,
            height: 14,
            borderRadius: 7,
            backgroundColor: BRAND_LIME,
            marginBottom: 28,
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: page.ogHeadline.length > 24 ? 76 : 104,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            maxWidth: 1040,
          }}
        >
          {page.ogHeadline}
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: '#3f3f46', maxWidth: 960 }}>
          {page.ogTagline}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 28, color: '#52525b' }}>{host}</div>
    </div>,
    OG_IMAGE_SIZE,
  );
}
