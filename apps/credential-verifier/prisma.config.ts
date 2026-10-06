import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config();

/** Prisma 7 CLI config. The database URL lives here, not in schema.prisma. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://credverify:credverify@127.0.0.1:5433/credential_verifier?schema=public',
  },
});
