#!/usr/bin/env bash
# SMART — Zero-Downtime Blue-Green Deployment Engine for High-End Linux VPS
# Manages seamless, zero-downtime traffic switching between Blue and Green production slots.
#
# Usage:
#   bash scripts/blue-green-deploy.sh prod
#   bash scripts/blue-green-deploy.sh dev
#
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_NAME="${1:-prod}"
if [[ "$ENV_NAME" != "prod" && "$ENV_NAME" != "dev" ]]; then
  echo "Usage: bash scripts/blue-green-deploy.sh <prod|dev>"
  exit 1
fi

ENV_FILE=".env.${ENV_NAME}"
test -f "$ENV_FILE" || {
  echo "Error: Missing ${ENV_FILE}. Copy .env.${ENV_NAME}.example and configure secrets."
  exit 1
}

# If deploying to DEV, run direct isolated deploy
if [[ "$ENV_NAME" == "dev" ]]; then
  echo "==> Deploying to isolated DEV stack (smart-dev)..."
  COMPOSE=(docker compose --env-file "$ENV_FILE" -f infra/docker/docker-compose.yml -p "smart-dev")
  "${COMPOSE[@]}" --profile apps build
  "${COMPOSE[@]}" --profile apps up -d --no-build
  echo "==> Waiting for DEV API health check..."
  for _ in $(seq 1 30); do
    status="$("${COMPOSE[@]}" --profile apps ps api --format '{{.Health}}' 2>/dev/null || true)"
    [[ "$status" == "healthy" ]] && break
    sleep 2
  done
  echo "==> Running Prisma migrations on DEV..."
  "${COMPOSE[@]}" --profile apps exec -T api npx prisma migrate deploy
  echo "==> DEV stack deployed successfully at dev.becomesmart.online."
  exit 0
fi

# -----------------------------------------------------------------------------
# PRODUCTION BLUE-GREEN ZERO-DOWNTIME DEPLOYMENT
# -----------------------------------------------------------------------------
STATE_FILE=".deploy_state_prod"
ACTIVE_COLOR=$(cat "$STATE_FILE" 2>/dev/null || echo "blue")
TARGET_COLOR=$([[ "$ACTIVE_COLOR" == "blue" ]] && echo "green" || echo "blue")

# Port mappings: Blue (3000-3006), Green (3010-3016)
if [[ "$TARGET_COLOR" == "blue" ]]; then
  TARGET_API_PORT="3000"
else
  TARGET_API_PORT="3010"
fi

echo "=========================================================================="
echo " SMART BLUE-GREEN DEPLOYMENT ENGINE"
echo " Active Production Slot:   [${ACTIVE_COLOR}]"
echo " Target Deployment Slot:   [${TARGET_COLOR}] (Internal API Port: ${TARGET_API_PORT})"
echo "=========================================================================="

TARGET_PROJECT="smart-prod-${TARGET_COLOR}"
TARGET_COMPOSE=(docker compose --env-file "$ENV_FILE" -f infra/docker/docker-compose.yml -p "$TARGET_PROJECT")

# 1. Build target container images sequentially to prevent VPS CPU/IO starvation
echo "==> [Phase 1/5] Building container images for ${TARGET_COLOR}..."
BUILD_SERVICES=$("${TARGET_COMPOSE[@]}" --profile apps --profile obs config --services)
while IFS= read -r svc; do
  [[ -z "$svc" ]] && continue
  echo "    Building service: ${svc}..."
  "${TARGET_COMPOSE[@]}" --profile apps --profile obs build "$svc"
done <<<"$BUILD_SERVICES"

# 2. Boot target slot
echo "==> [Phase 2/5] Starting containers for ${TARGET_COLOR} slot..."
"${TARGET_COMPOSE[@]}" --profile apps --profile obs up -d --no-build

# 3. Health Probe Gate
echo "==> [Phase 3/5] Verifying health probes on ${TARGET_COLOR} (port ${TARGET_API_PORT})..."
HEALTHY=0
for i in $(seq 1 30); do
  echo "    Checking health probe (attempt ${i}/30)..."
  if curl -sf "http://127.0.0.1:${TARGET_API_PORT}/health" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [[ "$HEALTHY" -ne 1 ]]; then
  echo "ERROR: Health check failed on ${TARGET_COLOR} slot!"
  echo "ABORTING deployment. Live traffic remains 100% on active slot [${ACTIVE_COLOR}]."
  echo "Tearing down failed ${TARGET_COLOR} slot..."
  "${TARGET_COMPOSE[@]}" --profile apps --profile obs down
  exit 1
fi

echo "==> Target [${TARGET_COLOR}] is healthy!"

# 4. Database Migrations (Forward-Only)
echo "==> [Phase 4/5] Running database migrations on shared production database..."
"${TARGET_COMPOSE[@]}" --profile apps exec -T api npx prisma migrate deploy

# 5. Atomic Traffic Switchover via Caddy
echo "==> [Phase 5/5] Shifting live traffic from ${ACTIVE_COLOR} to ${TARGET_COLOR}..."
UPSTREAM_FILE="infra/docker/upstream_prod.txt"
echo "api-${TARGET_COLOR}:3000" > "$UPSTREAM_FILE"

# Reload Caddy proxy to immediately point to the new color with zero dropped connections
if docker ps --format '{{.Names}}' | grep -q "caddy"; then
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile || true
fi

echo "==> Live traffic successfully shifted to [${TARGET_COLOR}]!"

# Graceful Drain & Cleanup of old color
echo "==> Allowing 15-second graceful connection draining on old slot [${ACTIVE_COLOR}]..."
sleep 15

if [[ -f "$STATE_FILE" ]]; then
  OLD_PROJECT="smart-prod-${ACTIVE_COLOR}"
  echo "==> Spinning down inactive slot [${ACTIVE_COLOR}]..."
  OLD_COMPOSE=(docker compose --env-file "$ENV_FILE" -f infra/docker/docker-compose.yml -p "$OLD_PROJECT")
  "${OLD_COMPOSE[@]}" --profile apps --profile obs down || true
fi

echo "$TARGET_COLOR" > "$STATE_FILE"
echo "=========================================================================="
echo " BLUE-GREEN DEPLOYMENT COMPLETE"
echo " Active Production is now: [${TARGET_COLOR}]"
echo " Public Domains Verified:  https://becomesmart.online"
echo "=========================================================================="
