import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // 'standalone' is required for our Docker/VPS deployment via docker-compose.
  // Vercel manages its own output format and is incompatible with standalone mode
  // (it causes a missing next-server.js.nft.json error in onBuildComplete).
  ...(process.env.VERCEL !== '1' && { output: 'standalone' }),
};

export default withMDX(config);
