import { z } from 'zod';

/**
 * Validated process environment. Every other module reads `env`, never
 * `process.env` directly.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3100),
  APP_NAME: z.string().default('credential-verifier'),
  APP_VERSION: z.string().default('0.1.0'),

  // Same shared Postgres instance as api-core (infra/docker/docker-compose.yml, host
  // port 5432, user smart/smart) — own database (credential_verifier) on that instance.
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://smart:smart@127.0.0.1:5432/credential_verifier?schema=public'),

  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6380'),

  CORS_ORIGINS: z.string().default('http://localhost:3004,http://localhost'),

  /** Per-domain default cache TTL for a verification result, seconds. Adapters may override. */
  VERIFICATION_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 6),

  /** Max outbound verification attempts per credential per hour, enforced via Redis token bucket. */
  VERIFICATION_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
