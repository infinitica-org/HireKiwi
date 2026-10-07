#!/usr/bin/env node
/**
 * verify-db-migrations.mjs
 *
 * Verifies that:
 *  1. All Prisma migrations deploy sequentially from scratch with ZERO SQL errors.
 *  2. No schema drift exists between applied migrations and schema.prisma (e.g. catches
 *     arbitrary column renames, unmigrated fields, or missing migration files).
 *  3. Seed scripts run cleanly against the migrated database schema.
 *
 * Checks both @hirekiwi/api-core and @hirekiwi/credential-verifier.
 *
 * Usage:
 *   node scripts/verify-db-migrations.mjs              # Full check (migrate + diff + seed)
 *   node scripts/verify-db-migrations.mjs --skip-seed   # Skip seed execution
 *   node scripts/verify-db-migrations.mjs --core-only   # Check api-core only
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(join(root, 'apps', 'api-core', 'package.json'));
const pg = req('pg');
const { Client } = pg;

const args = process.argv.slice(2);
const skipSeed = args.includes('--skip-seed');
const coreOnly = args.includes('--core-only');

const baseDatabaseUrl =
  process.env['DATABASE_URL'] || 'postgresql://smart:smart@127.0.0.1:5432/smart?schema=public';

function runEnsurePnpm(cmdArgs, envOverrides = {}) {
  const ensureScript = join(root, 'scripts', 'ensure-pnpm.mjs');
  const result = spawnSync(process.execPath, [ensureScript, 'pnpm', ...cmdArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
  return result.status ?? 1;
}

function runPrismaDiff(filter, schemaPath, dbUrl) {
  const ensureScript = join(root, 'scripts', 'ensure-pnpm.mjs');
  const result = spawnSync(
    process.execPath,
    [
      ensureScript,
      'pnpm',
      '--filter',
      filter,
      'prisma',
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      schemaPath,
      '--exit-code',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
    },
  );

  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function probeDatabase(url) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 AS ok');
    await client.end();
    return res.rows[0]?.ok === 1;
  } catch (_err) {
    try {
      await client.end();
    } catch {
      // ignore client end failure
    }
    return false;
  }
}

async function ensureCredentialVerifierDb(baseTargetUrl) {
  const urlObj = new URL(baseTargetUrl);
  const targetUser = urlObj.username || 'smart';
  urlObj.pathname = '/smart';
  const client = new Client({ connectionString: urlObj.toString() });

  try {
    await client.connect();
    const check = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'credential_verifier'",
    );
    if (check.rowCount === 0) {
      console.log('==> Creating credential_verifier database for verification...');
      await client.query(`CREATE DATABASE credential_verifier OWNER "${targetUser}"`);
    }
    await client.end();
  } catch (_err) {
    try {
      await client.end();
    } catch {
      // ignore client end failure
    }
    // If database already exists or creation failed gracefully
  }
}

async function main() {
  console.log('==================================================================');
  console.log('🚀 HireKiwi CI/Local Database Migration & Drift Verification Gate');
  console.log('==================================================================');
  console.log(`Target database URL: ${baseDatabaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  // 1. Connectivity check
  console.log('\n[1/4] Checking PostgreSQL connectivity...');
  const isConnected = await probeDatabase(baseDatabaseUrl);
  if (!isConnected) {
    console.error(
      `\n❌ ERROR: Cannot connect to PostgreSQL at ${baseDatabaseUrl.replace(/:[^:@]+@/, ':****@')}`,
    );
    console.error('Make sure PostgreSQL is running:');
    console.error('  Local dev: run `pnpm infra:up` or `docker compose up -d postgres`');
    console.error('  CI: ensure the postgres service container is healthy\n');
    process.exit(1);
  }
  console.log('✅ PostgreSQL connection verified.');

  // 2. Test @hirekiwi/api-core
  console.log('\n[2/4] Testing @hirekiwi/api-core migrations and schema sync...');
  console.log('  -> Executing prisma migrate deploy...');
  const apiMigrateStatus = runEnsurePnpm(['--filter', '@hirekiwi/api-core', 'db:deploy'], {
    DATABASE_URL: baseDatabaseUrl,
  });

  if (apiMigrateStatus !== 0) {
    console.error(
      '\n❌ FAIL: @hirekiwi/api-core migrations failed during `prisma migrate deploy`!',
    );
    console.error(
      'Check migration SQL files for syntax errors, broken column types, or constraint clashes.\n',
    );
    process.exit(1);
  }
  console.log('  ✅ Migrations applied successfully.');

  console.log('  -> Checking for schema drift (migrations vs schema.prisma)...');
  const apiDiff = runPrismaDiff('@hirekiwi/api-core', 'prisma/schema.prisma', baseDatabaseUrl);

  if (apiDiff.status !== 0) {
    console.error(
      '\n================================================================================',
    );
    console.error('❌ FAIL: Schema drift detected in @hirekiwi/api-core!');
    console.error('The Prisma schema (schema.prisma) does NOT match the committed migrations.');
    console.error(
      'Someone modified column names, tables, or relations without generating a migration.',
    );
    console.error(
      '================================================================================',
    );
    if (apiDiff.stdout) console.error(apiDiff.stdout);
    if (apiDiff.stderr) console.error(apiDiff.stderr);
    console.error('\nHow to fix:');
    console.error('  1. Run `pnpm db:migrate` locally to generate the missing migration.');
    console.error('  2. If renaming a column, edit the migration SQL to use:');
    console.error('       ALTER TABLE "<table>" RENAME COLUMN "<old>" TO "<new>";');
    console.error('     (Do NOT let Prisma drop and re-add the column).');
    console.error('  3. Commit the migration folder alongside schema.prisma.\n');
    process.exit(1);
  }
  console.log('  ✅ Zero schema drift detected in @hirekiwi/api-core.');

  if (!skipSeed) {
    console.log('  -> Testing db:seed...');
    const apiSeedStatus = runEnsurePnpm(['--filter', '@hirekiwi/api-core', 'db:seed'], {
      DATABASE_URL: baseDatabaseUrl,
    });
    if (apiSeedStatus !== 0) {
      console.error('\n❌ FAIL: @hirekiwi/api-core `db:seed` failed on the migrated schema!\n');
      process.exit(1);
    }
    console.log('  ✅ Seed completed cleanly.');
  }

  // 3. Test @hirekiwi/credential-verifier (if applicable)
  if (!coreOnly) {
    console.log('\n[3/4] Testing @hirekiwi/credential-verifier migrations and schema sync...');
    const credUrlObj = new URL(baseDatabaseUrl);
    credUrlObj.pathname = '/credential_verifier';
    const credDbUrl = credUrlObj.toString();

    await ensureCredentialVerifierDb(baseDatabaseUrl);

    console.log('  -> Executing credential-verifier prisma migrate deploy...');
    const credMigrateStatus = runEnsurePnpm(
      ['--filter', '@hirekiwi/credential-verifier', 'db:deploy'],
      { DATABASE_URL: credDbUrl },
    );

    if (credMigrateStatus !== 0) {
      console.error(
        '\n❌ FAIL: @hirekiwi/credential-verifier migrations failed during `prisma migrate deploy`!\n',
      );
      process.exit(1);
    }
    console.log('  ✅ Migrations applied successfully.');

    console.log('  -> Checking for schema drift in credential-verifier...');
    const credDiff = runPrismaDiff(
      '@hirekiwi/credential-verifier',
      'prisma/schema.prisma',
      credDbUrl,
    );

    if (credDiff.status !== 0) {
      console.error(
        '\n================================================================================',
      );
      console.error('❌ FAIL: Schema drift detected in @hirekiwi/credential-verifier!');
      console.error('The Prisma schema does NOT match the committed migrations.');
      console.error(
        '================================================================================',
      );
      if (credDiff.stdout) console.error(credDiff.stdout);
      if (credDiff.stderr) console.error(credDiff.stderr);
      process.exit(1);
    }
    console.log('  ✅ Zero schema drift detected in @hirekiwi/credential-verifier.');

    if (!skipSeed) {
      console.log('  -> Testing credential-verifier db:seed...');
      const credSeedStatus = runEnsurePnpm(
        ['--filter', '@hirekiwi/credential-verifier', 'db:seed'],
        { DATABASE_URL: credDbUrl },
      );
      if (credSeedStatus !== 0) {
        console.error('\n❌ FAIL: @hirekiwi/credential-verifier `db:seed` failed!\n');
        process.exit(1);
      }
      console.log('  ✅ Seed completed cleanly.');
    }
  }

  console.log('\n[4/4] Finalizing verification...');
  console.log('==================================================================');
  console.log('🎉 SUCCESS: All database migrations verified! Zero drift detected.');
  console.log('==================================================================\n');
}

main().catch((err) => {
  console.error('Unexpected error during migration verification:', err);
  process.exit(1);
});
