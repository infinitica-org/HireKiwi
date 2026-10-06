import { defineConfig, devices } from '@playwright/test';

// Landing SEO + accessibility checks against the production build. Build first with
// NEXT_PUBLIC_ENV=production so robots/meta are the indexable variant.
const baseURL = process.env.LANDING_URL ?? 'http://localhost:3007';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHROME_CHANNEL ?? 'chrome',
      },
    },
  ],
  webServer: process.env.LANDING_URL
    ? undefined
    : {
        command: 'next start --port 3007',
        url: `${baseURL}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
