# AGENTS.md — HireKiwi (repository-wide)

This file governs agent behavior across the **HireKiwi** monorepo. Shared context applies team-wide; personal preferences live in the excluded `.cursor/local/` directory.

## Context load order

1. `.cursor/local/IDENTITY.md` — the operator being assisted (System Architect: `@brittytino`)
2. `.cursor/local/preferences.md` — durable personal preferences, applied across agent sessions
3. `.cursor/local/working-memory.md` — active tickets and current focus
4. `.cursor/kb/INDEX.md` — shared reference material (`ownership.md`, rate limits, integration seams, and related notes)
5. Role depth: `TEAM.md` together with the relevant section of `apps/web-docs/content/docs/delivery/ENGINEER_GUIDES.mdx`
6. As required: `ARCHITECTURE.md`, `packages/contracts`, `apps/web-docs/content/docs/*`

Project rules under `.cursor/rules/*.mdc` apply at all times. `02-dev-workflow.mdc` is mandatory.

## Non-negotiable agent behavior

| Rule                    | Requirement                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branching               | Never commit directly to `main`, `qa`, or `dev`. All changes enter `dev` via a feature/bugfix branch PR. Direct pushes to `dev` are mechanically blocked. See `apps/web-docs/content/docs/delivery/BRANCHING.mdx`.                                                                                                                                                               |
| Quality                 | `pnpm lint`, `typecheck`, `test`, and `format:check` pass before a pull request is opened.                                                                                                                                                                                                                                                                                       |
| Hooks                   | Git hooks are never bypassed (`--no-verify` is not used).                                                                                                                                                                                                                                                                                                                        |
| Delivery                | Shippable work concludes as a pull request into `dev`, carrying the required labels (promotion follows `dev` → `qa` → `main`).                                                                                                                                                                                                                                                   |
| Commits                 | `<type>(<scope>): <summary> (<TICKET>)` — see `.cursor/rules/09-commits-and-prs.mdc`.                                                                                                                                                                                                                                                                                            |
| Size                    | No more than 400 hand-written lines of code per pull request; one ticket per pull request. Large diffs are rejected immediately.                                                                                                                                                                                                                                                 |
| Contracts               | Changes to `@hirekiwi/contracts` are made first and reviewed by the system architect before dependent work proceeds. No parallel DTOs.                                                                                                                                                                                                                                           |
| Ownership               | Only owned paths are edited directly; otherwise a pull request is opened for owner review per `TEAM.md` and `.github/CODEOWNERS`.                                                                                                                                                                                                                                                |
| Secrets                 | Environment files and credentials are never committed.                                                                                                                                                                                                                                                                                                                           |
| Merging                 | Feature PRs into `dev` require passing CI + approval from the designated Module Code Owner. Cross-cutting paths (`@hirekiwi/contracts`, CI, build graph) require System Architect (`@brittytino`) approval. Release promotions (`dev → qa → main`) are gated and executed by Tino only.                                                                                          |
| Preferences             | `.cursor/local/preferences.md` is honored when present.                                                                                                                                                                                                                                                                                                                          |
| Backlog                 | `tools/zoho-sprint*/backlog.mjs` is the edited source; synchronization to GitHub Issues runs via `tools/backlog/sync-github.mjs` only. The external sprint-tracking system is not updated unless explicitly requested.                                                                                                                                                           |
| Infrastructure          | Single High-End Linux VPS hosting both Dev (`dev.hirekiwi.online`) and Prod (`hirekiwi.online`) in isolated Docker Compose projects with automated Blue-Green zero-downtime switching, Caddy TLS reverse proxy, and PgBouncer. Built cloud-ready for scheduled AWS migration. Internal ports (5432, 6379, 19092) are strictly bound to `127.0.0.1` and accessed via SSH tunnels. |
| Compliance & Privacy    | No Aadhaar or PAN is collected or stored in the application database. Biometric and proctoring telemetry adheres strictly to the Indian DPDP Act 2023 (explicit consent, data minimization via downsampled snapshots, and automated 30-day purge).                                                                                                                               |
| Documentation           | Authoritative Single Source of Truth (SSOT) is maintained exclusively via `@hirekiwi/web-docs` (Fumadocs portal on port 3008). All living PRDs, user journeys, architecture specs, ADRs, blueprints, and delivery runbooks live in `apps/web-docs/content/docs/`. Duplicate, unmaintained drafts outside `apps/web-docs` are deleted.                                            |
| Deployment verification | A deployment is not considered successful on the basis of a green CI run alone. The triggered deployment workflow, and the resulting live environment, are confirmed independently.                                                                                                                                                                                              |

## Product summary

**HireKiwi Intelligent Talent Discovery Platform** (formerly known under working prototypes as HireKiwi) is an **evidence-backed talent discovery and readiness platform**.

Candidates build **evidence-backed capability profiles** combining **active evidence** (criterion-referenced assessments, AI project defense, coding sandboxes, spoken BARS simulations) and **passive evidence** (work experience, projects, verified credentials, GitHub, LeetCode, LinkedIn, endorsements).

Capabilities are structured via a **Universal Capability Ontology** (Domains, Competencies, Skills, Tools, Knowledge, Tasks, Roles) and verified through cryptographic signatures (HMAC-SHA256) and tamper-evident verification trails.

## The AI-DLC Delivery Doctrine: "The Hardest Part Was Never Generation — It Was Delivery"

This repository operates under **AI-DLC (AI-Driven Software Delivery Lifecycle)**. Modern LLMs (Claude, Gemini) generate code instantly ("vibe coding"), but unmanaged generation creates knowledge gaps, silent regressions, and integration debt. AI-DLC enforces closed-loop delivery governance:

1. **Machine-Executable Ticket Units:** Every ticket pulled via Zoho Sprints MCP contains explicit bounded contexts, schemas, input/output assertions, and verification commands.
2. **Contract-First Architectural Gating:** No feature code is written without prior merged types in `@hirekiwi/contracts`. Parallel DTOs are prohibited.
3. **Deterministic Mechanical Verification:** Before opening a PR, agents must execute and verify:
   - `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm format:check`
4. **Bounded Diffs (<400 LOC):** Exactly one ticket per PR; max 400 hand-written lines.
5. **Living Documentation SSOT & Mandatory Agent Updates:** Authoritative documentation resides in `@hirekiwi/web-docs` (port 3006/3026). Whenever an agent or engineer works on a ticket, their agent MUST update the relevant `@hirekiwi/web-docs` documentation as part of the ticket PR, ensuring zero documentation drift. Before opening a PR, verify `pnpm --filter @hirekiwi/web-docs build` compiles cleanly with zero errors.

### Core Architectural Principles & October Mandates (Anti-Hallucination Guardrails)

1. **Algorithmic Matching First (No LLM Guesswork in Ranking):**
   Candidate-to-role matching must NOT rely on open-ended LLM prompting or generative ranking. Matching must be **computationally efficient, deterministic, and inspectable** using:
   - Hard eligibility filters (SQL).
   - Weighted requirement scoring against validated proficiency thresholds (1–5 scale).
   - `pgvector` HNSW cosine similarity for semantic candidate-to-role requirement embeddings.
   - Transparent, evidence-grounded match explanations.
2. **Deep Learning Pipeline & 4D Telemetry Validation:**
   Multidimensional behavioral and assessment telemetry (e.g. 4D proctoring and attempt data) must pass rigorous validation mechanisms and confidence calibration before entering the Evidence Fusion & Inference Engine.
3. **Batch Normalization & Dynamic Profile Re-indexing:**
   - Candidate scores must be normalized across assessment and matching batches to prevent drift.
   - When a student registers newly, advances proficiency, or completes gap assessments, the platform triggers an **event-driven delta re-indexing pipeline** (`hirekiwi.user.updated` / `hirekiwi.eval.completed`) rather than expensive full-cohort recomputations.
4. **Dual Human Review Accountability Model:**
   - **Partnered Institution Students:** Flagged assessment integrity or verification disputes are routed to the **College / TPO Review Queue**.
   - **Independent Candidates:** Flagged disputes are routed to the **HireKiwi Platform Trust & Safety Review Queue**.
5. **Database & Identifier Standards:**
   - Canonical **Skill Inventory** maintained centrally in PostgreSQL (with ESCO / O*NET crosswalks).
   - Standardized cryptographic **Verification ID structure** (`VK-YYYYMMDD-UUID8`) across all credentials.
   - Migration from legacy 32-bit Job IDs to an **incremental, structured Job ID format** (`JOB-YYYY-NNNNNN`).
6. **Platform Security & Authentication:**
   - Strict rate limiting on student login and signup endpoints.
   - Resilient, stable HttpOnly JWT token refresh mechanism.
   - **1 Mobile Number = 1 Account** verification guard with friendly duplicate-number handling.
7. **Vivi is the Intelligent Agent Persona:**
   **Vivi** is the unified AI agent persona, proctoring supervisor, and candidate copilot across the HireKiwi platform (do NOT rename Vivi to HireKiwi; HireKiwi is the product platform name, Vivi is the intelligent agent). Vivi conducts project defense interviews, guides students through skill gap assessments, and provides contextual feedback. Implementation-wise, Vivi's capabilities are backed by clean, modular services within `apps/api-core` and shared packages (`@hirekiwi/contracts`, `packages/scoring-engine`, `packages/prompts`), orchestrated via BullMQ and Kafka. No phantom autonomous agent frameworks.

### Environment & Port Allocations (Single Linux VPS)

All environments run on a single Linux VPS managed via isolated Docker Compose projects with Caddy TLS reverse proxy and automated Blue-Green zero-downtime switching:

| Service / Application | Production Blue   | Production Green  | Dev (`dev.hirekiwi.online`) | Local Host              | Description                                          |
| :-------------------- | :---------------- | :---------------- | :-------------------------- | :---------------------- | :--------------------------------------------------- |
| `apps/api-core`       | `:3000`           | `:3010`           | `:3020`                     | `http://localhost:3000` | Fastify + NestJS Backend API Core                    |
| `apps/web-student`    | `:3001`           | `:3011`           | `:3021`                     | `http://localhost:3001` | Next.js 16 Student Assessment & Profile Portal       |
| `apps/web-tpo`        | `:3002`           | `:3012`           | `:3022`                     | `http://localhost:3002` | Next.js 16 University / TPO Cohort Portal            |
| `apps/web-admin`      | `:3003`           | `:3013`           | `:3023`                     | `http://localhost:3003` | Next.js 16 Super Admin & Review Console              |
| `apps/web-verify`     | `:3004`           | `:3014`           | `:3024`                     | `http://localhost:3004` | Next.js 16 Public Verification & Credential Portal   |
| `apps/web-auth`       | `:3005`           | `:3015`           | `:3025`                     | `http://localhost:3005` | Next.js 16 Unified Auth & Invitation Portal          |
| `apps/web-company`    | `:3006`           | `:3016`           | `:3026`                     | `http://localhost:3006` | Next.js 16 Employer / Recruiter Company Portal       |
| `apps/web-landing`    | `:3007`           | `:3017`           | `:3027`                     | `http://localhost:3007` | Next.js 16 Public Marketing Landing Site             |
| `apps/web-docs`       | `:3008`           | `:3018`           | `:3028`                     | `http://localhost:3008` | Next.js 16 Fumadocs Documentation SSOT               |
| `apps/proctoring-cv`  | `:8091`           | `:8092`           | `:8093`                     | `http://localhost:8091` | Python CV Proctoring Sidecar (YuNet/YOLO)            |
| PostgreSQL            | `127.0.0.1:5432`  | `127.0.0.1:5432`  | `127.0.0.1:5432`            | `127.0.0.1:5432`        | Relational Store with `pgvector` HNSW                |
| PgBouncer             | `127.0.0.1:6432`  | `127.0.0.1:6432`  | `127.0.0.1:6432`            | `127.0.0.1:6432`        | Transaction Pooling Gateway                          |
| Redis                 | `127.0.0.1:6379`  | `127.0.0.1:6379`  | `127.0.0.1:6379`            | `127.0.0.1:6380`        | Token bucket, sliding-window rate limit, cache       |
| Kafka / Redpanda      | `127.0.0.1:19092` | `127.0.0.1:19092` | `127.0.0.1:19092`           | `127.0.0.1:19092`       | Event bus for asynchronous telemetry & delta updates |
| MinIO S3              | `127.0.0.1:9000`  | `127.0.0.1:9000`  | `127.0.0.1:9000`            | `127.0.0.1:9000`        | S3 Object Storage API (Console: `:9001`)             |
