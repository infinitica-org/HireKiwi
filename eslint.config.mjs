import { base } from '@hirekiwi/eslint-config/base';

/**
 * Root ESLint config — lints repo-level files only. Each workspace ships its
 * own `eslint.config.mjs` extending @hirekiwi/eslint-config.
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/generated/**',
      'apps/**',
      'packages/**',
      'tools/**',
      'tests/**',
    ],
  },
  ...base,
];
