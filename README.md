# SMART

SMART is an **Intellectual Talent Network** and role-specific readiness verification platform. Candidates build verified talent profiles backed by unfakeable evidence (projects, repositories, work vouchers, and proctored tasks), assessed against a criterion-referenced multi-tier (Gold / Silver / Bronze) competency grid mapped to real industry job tracks. Certified candidates receive student-controlled, cryptographically signed (HMAC-SHA256), publicly verifiable credentials, and are matched semantically to high-fit employer opportunities via vector intelligence (`pgvector`). SMART operates across two unified deployment models: embedded in academia as verified placement infrastructure, and embedded in enterprises for internal mobility and workforce readiness.

Governing references: team charter and ownership — [`TEAM.md`](./TEAM.md); delivery methodology — [`docs/delivery/AGILE_PLAN.md`](./docs/delivery/AGILE_PLAN.md); architecture decision records — [`docs/adr/`](./docs/adr/); branching policy — [`docs/delivery/BRANCHING.md`](./docs/delivery/BRANCHING.md).

**New to the codebase:** begin with [`docs/delivery/ENGINEER_START_CHECKLIST.md`](./docs/delivery/ENGINEER_START_CHECKLIST.md), then [`CONTRIBUTING.md`](./CONTRIBUTING.md). Product specification: [`docs/product/prd-v1/`](./docs/product/prd-v1/README.md).

## What was shipped in Sprint 6

The following capabilities were merged into `dev` as part of Sprint 6 and represent the current live feature surface:

| Feature                                                                                                                                               | PR   | Module            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------- |
| **Server-authoritative assessment timer** — BullMQ delayed-job force-submits on expiry regardless of client connectivity                              | #380 | `assessment`      |
| **Cryptographic certificate issuance** — HMAC-SHA256 canonical payload, QR code, async PDF generation                                                 | #380 | `certificate`     |
| **Public credential verification view** — tier trail, confidence note, calibration employer panel, revocation/supersession states                     | #380 | `web-verify`      |
| **14-day manager endorsement token** — extended from 7 days; reminder + expiry scheduled via BullMQ                                                   | #380 | `work-experience` |
| **Spreadsheet formula injection protection** — CWE-1236 neutralization for student whitelist imports                                                  | #380 | `institutions`    |
| **JD offline fallback extractor** — heuristic skill extraction + 10-track threshold vector when AI gateway times out                                  | #379 | `matching`        |
| **Semantic vector candidate matcher** — cosine similarity with privacy opt-out triple-gate and 5-domain radar chart                                   | #379 | `matching`        |
| **TPO partnership onboarding** — partnership request lifecycle (create → review → provision), 7-day activation token, university account provisioning | #377 | `institutions`    |
| **Bulk whitelist importer** — 10 000-row CSV/XLSX async import via BullMQ, email/dept/year validation, error quarantine, pre-signed error report      | #377 | `institutions`    |
| **Peer audit: certificate tamper detection** — UUID validation, client-side HMAC hash check, `[SECURITY_EVENT]` logging, 404 stack-trace protection   | #378 | `web-verify`      |
| **Print alignment CSS** — `@media print` single-page constraint for certificate print view                                                            | #378 | `web-verify`      |

## Ownership model

Module and path ownership is authoritative in [`TEAM.md`](./TEAM.md) and enforced by [`.github/CODEOWNERS`](./.github/CODEOWNERS). At a system level, ownership is organized as:

| Domain                  | Scope                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| Architecture & Review   | System architecture, `@smart/contracts`, quality gates. No feature code.        |
| Platform / Backend Core | Authentication, Prisma, Redis, Kafka, rate limiting, sandboxing, infrastructure |
| Frontend & Full-Stack   | `@smart/ui`, `@smart/api-client`, student and TPO applications                  |
| Full-Stack & Backend    | Assessment lifecycle, certificates, verification and admin applications         |
| AI Engineering          | AI gateway, evaluation, matching, `@smart/prompts`, `@smart/scoring-engine`     |
| Data & AI/Backend       | Catalog, calibration, item banks, placement records, analytics                  |

New engineers: [`ENGINEER_START_CHECKLIST.md`](./docs/delivery/ENGINEER_START_CHECKLIST.md) · Day-to-day guidance: [`ENGINEER_GUIDES.md`](./docs/delivery/ENGINEER_GUIDES.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Stack

Turborepo + pnpm workspaces. Next.js 16 (four portals) · NestJS 11 / Fastify · PostgreSQL 16 with **pgvector** · Redis 7 · Redpanda (Kafka) · MinIO (S3) · Mailpit (development SMTP) · Caddy.

Shared packages: `@smart/contracts` (frozen API surface), `@smart/scoring-engine`, `@smart/prompts`, `@smart/observability`, `@smart/api-client`, `@smart/ui`.

## Local development

Exact step-by-step commands (Windows and Unix): [`docs/delivery/LOCAL_DEV.md`](./docs/delivery/LOCAL_DEV.md).

Requires Node **22.20** (see `.nvmrc`) and pnpm **11.22** (pinned in `packageManager`). Docker Desktop is recommended for the data plane.

```bash
pnpm bootstrap          # install, start data plane, Prisma generate/migrate, seed
pnpm doctor             # toolchain check (scripts/doctor.sh — requires bash)
pnpm infra:up           # data plane only (see ports below)
pnpm dev:api            # http://localhost:3000 — /health, /ready, /api/docs
pnpm dev                # API + all web apps
pnpm dev:web            # student / TPO / admin / verify / auth (`@smart/web-*`)
```

### Data plane (`pnpm infra:up`)

| Service       | Host URL / port                          | Notes                                                           |
| ------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Postgres      | `localhost:5432`                         | `pgvector/pgvector:pg16`                                        |
| Redis         | `localhost:6380` → container `6379`      | Windows commonly binds host `6379` already                      |
| Redpanda      | `localhost:19092`                        | Kafka-compatible                                                |
| MinIO         | `localhost:9000` / console `:9001`       | S3-compatible; stores certificate PDFs and import error reports |
| Mailpit       | UI `http://localhost:8025`, SMTP `:1025` | Captures outbound mail                                          |
| Prisma Studio | `http://localhost:5555`                  | Browse and edit rows against the same database as the API       |

Optional Compose profiles:

- `pnpm infra:obs` — Prometheus, Grafana, Loki
- `pnpm infra:apps` — containerized API and four web applications (VPS/integration style; no Next.js HMR)

> **Windows / pnpm 9:** if `PATH` still surfaces a standalone pnpm 9, wrapped scripts (`infra:*`, `db:*`, `bootstrap`) print a notice and continue, or re-exec via `npx pnpm@11.22.0`. `pnpm install` remains strict — place `%APPDATA%\npm` before `%LOCALAPPDATA%\pnpm`, or use Corepack. Details: [`LOCAL_DEV.md` §0](./docs/delivery/LOCAL_DEV.md).

### API probes (after `pnpm dev:api`)

| Path        | Purpose                                  |
| ----------- | ---------------------------------------- |
| `/health`   | Liveness                                 |
| `/ready`    | Readiness (Postgres and Redis reachable) |
| `/api/docs` | Swagger UI                               |

Seeded accounts exist for local and non-production environments only; credentials are environment-specific and are not documented here. See [`docs/delivery/DATABASE.md`](./docs/delivery/DATABASE.md) for the seeding mechanism.

Sign in at **http://localhost:3005/login** — the session redirects to the portal appropriate to the authenticated role.

| App     | Port | Notes                                                     |
| ------- | ---- | --------------------------------------------------------- |
| API     | 3000 | `/health`, `/ready`, `/api/docs`                          |
| Student | 3001 | Candidate portal                                          |
| TPO     | 3002 | Batch management, student invitations, bulk import wizard |
| Admin   | 3003 | Institution and platform operations                       |
| Verify  | 3004 | Public certificate lookup (no authentication)             |
| Auth    | 3005 | Login, invitation acceptance, password setup              |

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
