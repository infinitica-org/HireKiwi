#!/usr/bin/env bash
# Same quality gates as .github/workflows/ci.yml — use when hosted Actions
# are blocked (billing) or you want to burn zero GitHub minutes.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> lockfile"
node scripts/check-lockfile.mjs

echo "==> compose config (dev & prod)"
docker compose -f infra/docker/docker-compose.dev.yml config >/dev/null
docker compose -f infra/docker/docker-compose.prod.yml --profile apps --env-file .env.example config >/dev/null
docker compose -f infra/docker/docker-compose.yml --profile apps --env-file .env.example config >/dev/null

echo "==> lint"
pnpm lint

echo "==> format"
pnpm format:check

echo "==> typecheck"
pnpm typecheck

echo "==> unit tests"
pnpm test:unit

echo "==> build"
pnpm build

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'postgres'; then
  echo "==> db migrations & drift check"
  node scripts/verify-db-migrations.mjs
fi

echo "Local CI gates passed."
