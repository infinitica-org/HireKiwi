# SMART Platform — Production Release Notes

**Release:** v2.1.0-prod  
**Build Target:** `dev` → `qa` → `main` (Promotion Cycle)  
**Release Lead / Architect:** Tino (`@brittytino`)  
**Deployment Date:** 29 September 2026  
**Target Milestone:** Sprint 6 GA Readiness & Placement Season Onboarding

---

## 1. Executive Summary

Release v2.1.0 represents the convergence of our Sprint 6 delivery cycle. Over the past four sprints, our modular monolith backend (`apps/api-core`) and candidate/employer presentation layers have transitioned from prototype assessment scripts into a resilient, tamper-evident talent verification network.

This release delivers three foundational architectural requirements for our institutional campus rollout:

1. **Server-Authoritative Anti-Cheating Timer:** Replaced client-driven countdown clocks with a BullMQ delayed-job force-submit processor that terminates and evaluates attempts at the server deadline, regardless of candidate network state.
2. **Cryptographic Certificate Trust Chain:** Added HMAC-SHA256 signature hashes to all issued candidate certificates, validated on our public verification portal (`verify.smart.com`) with automated tamper alerts and QR routing.
3. **Deterministic Placement Matching Engine:** Deployed PostgreSQL `pgvector` cosine similarity matching between candidate competency vectors and incoming Job Descriptions, backed by a deterministic keyword fallback parser to guarantee zero match downtime.

All 17 Architecture Decision Records (ADRs 0001–0017) are fully honored. Zero direct dependencies on Orion APIs remain; the platform operates self-sufficiently with dual Claude-to-Gemini AI failover.

---

## 2. Key Features & Architectural Enhancements

### 2.1 Server-Authoritative Assessment Timer & State Enforcement (ADR-0016)

- **Problem Solved:** Previously, assessment submission depended on the browser's JavaScript event loop. A candidate could disable network requests, alter the local system clock, or leave the browser tab suspended to gain unlimited time.
- **Architectural Implementation:**
  - Implemented `AssessmentForceSubmitProcessor` backed by BullMQ queue `bull:queue:assessment_force_submit`.
  - When an attempt starts (`POST /api/v1/assessment/start`), a delayed job is scheduled with an exact epoch millisecond deadline: `started_at + duration_minutes + grace_period_ms`.
  - At deadline arrival, the BullMQ worker retrieves the attempt from Redis (`session:assessment:{id}`), transitions the DB state from `IN_PROGRESS` to `SUBMITTED`, writes `Attempt.forceSubmittedAt`, and triggers the asynchronous evaluation pipeline.
  - Implemented duplicate-submission guards using Redis atomic locks (`SET NX EX`) to prevent race conditions if the candidate clicks "Submit" at the exact millisecond the delayed job fires.

### 2.2 HMAC-SHA256 Cryptographic Verification & Public Verify App (ADR-0016)

- **Problem Solved:** Legacy PDF certificates can easily be edited using desktop tools to alter candidate names, skill tracks, or tier badges (e.g., editing Bronze to Gold).
- **Architectural Implementation:**
  - Standardized a canonical JSON payload containing `certificate_id`, `candidate_id`, `track_id`, `tier`, `issued_at`, and `evaluator_version`.
  - Signed using `crypto.createHmac('sha256', process.env.CERTIFICATE_HMAC_SECRET)`.
  - The signature hash is persisted in the PostgreSQL `certificates` table under `signature_hash`.
  - The public verification service (`apps/web-verify`) executes an in-memory recalculation against the stored record and compares it to the incoming request. If the computed hash deviates from `signature_hash`, the UI flags a `[SECURITY_EVENT]` warning alert and logs the IP address to Redis for rate-limiting review.
  - Dynamic QR codes generated on certificates embed deep links directly to `https://verify.smart.com/verify/{certificate_id}?hash={short_hash}`.

### 2.3 Semantic Vector Placement Matching & Fallback Pipeline (ADR-0017)

- **Problem Solved:** Job description (JD) matching previously relied on rigid string tokenization that missed candidates with equivalent semantic skills (e.g., "PostgreSQL optimization" vs. "relational database performance tuning").
- **Architectural Implementation:**
  - Enabled the `pgvector` extension in PostgreSQL 16.
  - Seeded 1536-dimensional embedding vectors for all 10 domain competency blueprints (5 IT tracks, 5 MBA tracks).
  - Implemented `PlacementMatchingService` in `apps/api-core/src/modules/placement`:
    - Generates embeddings for parsed JDs via `ai-gateway`.
    - Executes vector cosine distance queries: `ORDER BY embedding <=> query_embedding LIMIT 50`.
    - If the embedding service experiences a 429 rate limit or network timeout, the pipeline triggers an automatic fallback to the deterministic regex keyword matcher (`deterministic-fallback-extractor.ts`), ensuring 100% operational availability during campus placement drives.

### 2.4 Proctoring Snapshot Sidecar & DPDP Statutory Consent (ADR-0014)

- **Problem Solved:** Running continuous video streaming for thousands of concurrent candidates is cost-prohibitive and violates India's DPDP Act data minimization requirements.
- **Architectural Implementation:**
  - Deployed `apps/proctoring-cv` as an isolated Python HTTP microservice running OpenCV and MediaPipe.
  - Candidate client captures randomized snapshots (1 frame every 30–60 seconds) rather than raw continuous video.
  - Snapshots are uploaded to Cloudflare R2 / MinIO via signed upload URLs, and an asynchronous event `smart.proctoring.snapshot.ready` is published to Redpanda (Kafka).
  - The Python sidecar validates single-face presence, gaze orientation, and liveness.
  - Statutory compliance: Implemented the DPDP Section 6 explicit consent gate prior to webcam hardware initialization. All captured telemetry frames are flagged with an automated 30-day lifecycle purge rule.

### 2.5 Institutional TPO Bulk Whitelist Importer

- **Problem Solved:** University placement officers (TPOs) struggle with onboarding batches of 3,000–10,000 students via manual web forms.
- **Architectural Implementation:**
  - Built an asynchronous Excel/CSV ingestion pipeline using `exceljs` and BullMQ.
  - Validates college email domains, pre-assigned degree tracks, and roll numbers in chunks of 500 rows.
  - Generates single-use cryptographic invitation tokens with 72-hour expiration, notifying candidates via SES/Nodemailer.

---

## 3. Database Schema Changes & Migrations

All migrations were authored and stewarded by Vishal V (`@vis465`) in compliance with ADR-0007.

| Migration File                                | Affected Table                              | Description                                                                                                                  |
| :-------------------------------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `20260925120000_add_certificate_hmac`         | `certificates`                              | Added `signature_hash VARCHAR(64) NOT NULL`, `revocation_status VARCHAR(32) DEFAULT 'ACTIVE'`, `qr_payload TEXT`.            |
| `20260927091500_add_force_submit_to_attempts` | `attempts`                                  | Added `force_submitted_at TIMESTAMPTZ`, `server_deadline TIMESTAMPTZ NOT NULL`, `timer_status VARCHAR(24) DEFAULT 'NORMAL'`. |
| `20260928143000_enable_pgvector_competencies` | `competency_blueprints`, `job_descriptions` | Enabled `CREATE EXTENSION IF NOT EXISTS vector;`, added `embedding vector(1536)`.                                            |
| `20260929110000_proctoring_session_schema`    | `proctoring_sessions`, `integrity_events`   | Created session table tracking `consent_at`, `warning_count`, `integrity_score`, and foreign key to `attempts`.              |

---

## 4. Environment Variables & Secret Configuration

The following environment variables must be populated in the production vault prior to container deployment:

```bash
# Security & Cryptographic Trust Chain (ADR-0016)
CERTIFICATE_HMAC_SECRET="<64-character-hex-secret-from-kms>"
CERTIFICATE_PUBLIC_VERIFY_URL="https://verify.smart.com"

# AI Gateway & Fallback Configuration (ADR-0005)
AI_PRIMARY_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-prod-..."
AI_FALLBACK_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_BILLING_HARD_CAP_USD="500.00"

# Proctoring Sidecar (ADR-0014)
PROCTORING_CV_INTERNAL_URL="http://proctoring-cv.internal:8000"
PROCTORING_MAX_WARNINGS=15

# Observability & Tracing (ADR-0015)
OTEL_EXPORTER_OTLP_ENDPOINT="http://tempo.internal:4318"
PROMETHEUS_METRICS_ENABLED=true
```

---

## 5. Deployment & Runbook Instructions

### Pre-Deployment Verification

1. Verify database replica lag on RDS PostgreSQL: `SELECT pg_last_wal_replay_lsn();`
2. Verify Redis cluster memory fragmentation ratio: `INFO memory` (must be < 1.4).
3. Ensure Redpanda broker connectivity on port 19092.

### Zero-Downtime Deployment Sequence

1. **Database Migration:**
   ```bash
   pnpm --filter @smart/api-core prisma migrate deploy
   ```
2. **Sidecar Deployment:**
   Deploy `apps/proctoring-cv` container to AWS ECS. Verify health endpoint returns HTTP 200:
   ```bash
   curl -f http://proctoring-cv.internal:8000/health
   ```
3. **Core API Rolling Update:**
   Deploy updated `apps/api-core` container images across the ECS task definition. Traffic shift occurs 25% every 2 minutes via AWS Application Load Balancer.
4. **BullMQ Processor Verification:**
   Verify worker registrations in BullMQ dashboard. Confirm `assessment_force_submit` queue is actively consuming.
5. **Frontend Deployments:**
   Deploy Next.js applications (`web-student`, `web-tpo`, `web-admin`, `web-verify`, `web-docs`) to edge CDN nodes.

### Rollback Procedure

If p95 latency exceeds 250ms or BullMQ job failure rate exceeds 0.5% during the first 30 minutes:

1. Immediately revert ECS task definition to image tag `v2.0.4-prod`.
2. Do not rollback database migrations unless instructed by Vishal V (`signature_hash` and `server_deadline` columns are nullable or contain safe defaults, preserving backward compatibility).
3. Notify the incident commander via PagerDuty.

---

## 6. Known Limitations & Sprint 7 Roadmap

1. **Active Directory / SAML 2.0 Institutional SSO:** University SSO is currently operating on Google OAuth and GitHub OAuth; native Azure AD / Entra ID SAML connector is scheduled for completion in Sprint 7 (Ticket S7-VV-01).
2. **Audio Defense Analysis in Proctoring:** Spoken responses in L3 currently run asynchronous Whisper transcription on CPU; GPU acceleration is scheduled for Phase 2 scaling.
3. **Item Bank Dynamic Parameterization:** Math/numeric items currently draw from a seeded bank of 400 questions; full procedural parameter mutation lands in Sprint 7.

---

_Sign-off Authority:_  
**Tino**  
System Architect & Engineering Reviewer  
Infinitica Engineering Team
