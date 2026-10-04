# SmartKiwi (SMART) Intelligent Talent Discovery Platform

**SmartKiwi (SMART)** is an **evidence-backed talent discovery and readiness platform**. Candidates build capability profiles backed by verified active and passive evidence (projects, repositories, work vouchers, spoken BARS simulations, and proctored tasks), assessed against a criterion-referenced multi-tier (Gold / Silver / Bronze) competency grid mapped to real industry job tracks. Certified candidates receive student-controlled, cryptographically signed (HMAC-SHA256), publicly verifiable credentials, and are matched semantically to high-fit employer opportunities via vector intelligence (`pgvector`). SmartKiwi operates across two unified deployment models: embedded in academia as verified placement infrastructure, and embedded in enterprises for internal mobility and workforce readiness.

**Vivi** is the unified AI agent persona, proctoring supervisor, and candidate copilot across the SmartKiwi platform.

Governing references: team charter and ownership — [`TEAM.md`](./TEAM.md); delivery methodology — [`apps/web-docs/content/docs/delivery/AI_DLC_FRAMEWORK.mdx`](./apps/web-docs/content/docs/delivery/AI_DLC_FRAMEWORK.mdx); architecture documentation SSOT — `@smart/web-docs` on port `3008` / `3028`; branching policy — [`apps/web-docs/content/docs/delivery/BRANCHING.mdx`](./apps/web-docs/content/docs/delivery/BRANCHING.mdx).

**New to the codebase:** begin with [`apps/web-docs/content/docs/delivery/ENGINEER_START_CHECKLIST.mdx`](./apps/web-docs/content/docs/delivery/ENGINEER_START_CHECKLIST.mdx), then [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Ecosystem Applications & Architecture

SmartKiwi is composed of **10 applications** running within a Turborepo monorepo:

| #   | Application Name     | Port | Description                                                  |
| --- | -------------------- | :--: | ------------------------------------------------------------ |
| 1   | `@smart/api-core`    | 3000 | Fastify + NestJS Core API (`/health`, `/ready`, `/api/docs`) |
| 2   | `@smart/web-student` | 3001 | Candidate portal & AI project defense                        |
| 3   | `@smart/web-tpo`     | 3002 | University / TPO placement cohort & analytics console        |
| 4   | `@smart/web-admin`   | 3003 | Super admin console & integrity dispute review queue         |
| 5   | `@smart/web-verify`  | 3004 | Public cryptographic credential verification portal          |
| 6   | `@smart/web-auth`    | 3005 | Unified authentication, SSO, and invitation flow             |
| 7   | `@smart/web-company` | 3006 | Employer & recruiter talent search and job management        |
| 8   | `@smart/web-landing` | 3007 | Public marketing landing & conversion website                |
| 9   | `@smart/web-docs`    | 3008 | Fumadocs Architecture & Engineering Documentation SSOT       |
| 10  | `proctoring-cv`      | 8091 | Python CV proctoring sidecar (YuNet / YOLO / head pose)      |

## Stack

Turborepo + pnpm workspaces. 8 Next.js 16 portals · NestJS 11 / Fastify core · Python CV sidecar · PostgreSQL 16 with **pgvector** · Redis 7 · Redpanda (Kafka) · MinIO (S3) · Mailpit (development SMTP) · Caddy TLS reverse proxy.

Shared packages: `@smart/contracts` (frozen API surface), `@smart/scoring-engine`, `@smart/prompts`, `@smart/observability`, `@smart/api-client`, `@smart/ui`.

## Local development

Exact step-by-step commands (Windows and Unix): [`apps/web-docs/content/docs/delivery/LOCAL_DEV.mdx`](./apps/web-docs/content/docs/delivery/LOCAL_DEV.mdx).

Requires Node **22.20** (see `.nvmrc`) and pnpm **11.22** (pinned in `packageManager`). Docker Desktop is recommended for the data plane.

```bash
pnpm bootstrap          # install, start data plane, Prisma generate/migrate, seed
pnpm doctor             # toolchain check (scripts/doctor.sh — requires bash)
pnpm infra:up           # data plane only (see ports below)
pnpm ports              # display active port matrix across local/blue/green/dev
pnpm dev                # API + all web apps
pnpm dev:api            # http://localhost:3000 — /health, /ready, /api/docs
pnpm dev:student        # http://localhost:3001 — student portal
pnpm dev:tpo            # http://localhost:3002 — TPO portal
pnpm dev:admin          # http://localhost:3003 — admin console
pnpm dev:verify         # http://localhost:3004 — public verification
pnpm dev:auth           # http://localhost:3005 — unified authentication
pnpm dev:company        # http://localhost:3006 — employer portal
pnpm dev:landing        # http://localhost:3007 — marketing landing
pnpm dev:docs           # http://localhost:3008 — documentation portal
pnpm dev:cv             # http://localhost:8091 — python CV sidecar
```

### Data plane (`pnpm infra:up`)

| Service       | Host URL / port                          | Notes                                                           |
| ------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Postgres      | `localhost:5432`                         | `pgvector/pgvector:pg16` (PgBouncer: `localhost:6432`)          |
| Redis         | `localhost:6380` → container `6379`      | Windows commonly binds host `6379` already                      |
| Redpanda      | `localhost:19092`                        | Kafka-compatible event bus                                      |
| MinIO         | `localhost:9000` / console `:9001`       | S3-compatible; stores certificate PDFs and import error reports |
| Mailpit       | UI `http://localhost:8025`, SMTP `:1025` | Captures outbound mail                                          |
| Prisma Studio | `http://localhost:5555`                  | Browse and edit rows against the same database as the API       |

Optional Compose profiles:

- `pnpm infra:obs` — Prometheus (9090), Grafana (3100), Loki (3101), Tempo (3103)
- `pnpm infra:apps` — containerized API and web applications under Docker Compose

### API probes (after `pnpm dev:api`)

| Path        | Purpose                                  |
| ----------- | ---------------------------------------- |
| `/health`   | Liveness                                 |
| `/ready`    | Readiness (Postgres and Redis reachable) |
| `/api/docs` | Swagger UI                               |

Seeded accounts exist for local and non-production environments only; credentials are environment-specific and are not documented here.

Sign in at **http://localhost:3005/login** — the session redirects to the portal appropriate to the authenticated role.

Invitation emails are captured by Mailpit (`http://localhost:8025`) in local development. Invitation links resolve on the auth application (`/invite/:token`).

Invitation emails are captured by Mailpit (`http://localhost:8025`) in local development. Invitation links resolve on the auth application (`/invite/:token`).

## Infrastructure

Two environments are maintained outside local development: a staging/pre-production environment tracking the `dev` branch, and a production environment tracking the `main` branch. Full provisioning and deployment procedure: [`infra/vps/README.md`](./infra/vps/README.md). Database policy: [`docs/delivery/DATABASE.md`](./docs/delivery/DATABASE.md).

Deployment is automated: a merge to `dev` or `main` runs continuous integration, and a successful run triggers the corresponding deployment workflow. Manual invocation of `scripts/deploy-vps.sh` remains supported for break-glass operation and first-time environment setup.

```bash
# staging
cp .env.dev.example .env.dev && bash scripts/deploy-vps.sh dev

# production (restricted to the designated release owner)
cp .env.prod.example .env.prod && bash scripts/deploy-vps.sh prod
```

## Quality

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:handover   # optional live data-plane smoke test (bash + Docker)
```

Continuous integration runs lint, typecheck, unit tests, build, and Compose configuration validation on every pull request. Merge criteria: [`docs/delivery/DEFINITION_OF_DONE.md`](./docs/delivery/DEFINITION_OF_DONE.md).

## Architecture documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, scoring methodology, rate limiting
- [`SERVICES_VIEW.md`](./SERVICES_VIEW.md) — module and service boundaries
- [`REPOSITORY_STRUCTURE.md`](./REPOSITORY_STRUCTURE.md) — repository layout rationale
- [`docs/delivery/issues/`](./docs/delivery/issues/) — known defects and peer audit findings
- Role-specific blueprints: [`docs/`](./docs/)
