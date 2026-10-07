import type { NextConfig } from 'next';

/**
 * Creates a shared Next.js configuration for HireKiwi portals.
 * Applies standard transpilePackages, standalone output, and merges custom config.
 */
export function withHireKiwiConfig(config: NextConfig = {}): NextConfig {
  const baseConfig: NextConfig = {
    allowedDevOrigins: ['localhost', '127.0.0.1', 'localhost:3001', '127.0.0.1:3001'],
    output: 'standalone',
    transpilePackages: [
      '@hirekiwi/ui',
      '@hirekiwi/api-client',
      '@hirekiwi/contracts',
      'motion',
      '@mediapipe/tasks-vision',
    ],
    ...config,
  };

  return baseConfig;
}
