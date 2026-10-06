import type { NextConfig } from 'next';
import { withSmartConfig } from '@hirekiwi/next-config';

const config: NextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', 'localhost:3007', '127.0.0.1:3007'],
  // withSmartConfig defaults to 'standalone' for the Docker/VPS deployment (started with
  // `node server.js`, not `next start`). 'standalone' is incompatible with `next start` and
  // breaks static chunk serving (seen as 500s and bogus console errors) — exactly the command
  // the landing-lighthouse CI job and Vercel builds use. Same pattern as web-docs (S8-ARCH-03).
  ...((process.env.VERCEL === '1' || process.env.CI === 'true') && { output: undefined }),
  transpilePackages: [
    '@hirekiwi/ui',
    '@hirekiwi/api-client',
    '@hirekiwi/contracts',
    'motion',
    '@mediapipe/tasks-vision',
    'motion',
    'gsap',
    'lenis',
    'ogl',
  ],
  experimental: {
    // Landing CSS is small (~13 KB); inlining it removes the only render-blocking request.
    inlineCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // /_next/static and statically imported images are already served immutable by
  // Next. Public files keep stable (unhashed) names, so cache them for a day and
  // revalidate in the background rather than marking them immutable.
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default withSmartConfig(config);
