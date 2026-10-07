# Credential Verification Platform (`credential-verifier`)

Standalone, adapter-based engine that verifies external professional/educational credentials (Credly, Open Badges, W3C Verifiable Credentials, issuer public-lookup pages, etc.). Built as its own microservice rather than as a module inside `api-core` — see the "Existing Code Findings" tab of the [research doc](https://claude.ai/code/artifact/fd08b42f-97b5-4591-9064-8303d3fdcf38) for why.

## Status: Stage 4 (core engine)

What's implemented:

- Canonical types (`src/verification/types.ts`) — provider-independent `Credential`/`Verification`/`CredentialVerifier` model.
- Input resolver, issuer detector, adapter registry (`src/verification/*.service.ts`) — the pipeline the architecture proposal describes, with a safe `UnverifiableFallbackAdapter` so the pipeline runs end-to-end before any real adapter lands.
- Async orchestration: `POST /api/v1/verifications` enqueues a BullMQ job and returns immediately; `GET /api/v1/verifications/:id` reads the persisted result. A worker process (`src/worker.ts`) runs the actual adapter pipeline.
- Postgres persistence (Prisma) matching the Stage 3 schema: `Credential`, `Verification`, `VerificationCheck`, `VerificationEvidence`, `VerificationAttempt`, `IssuerAdapter`, `TrustRegistryEntry`.
- Redis result caching, keyed by source identifier, TTL varies by verification level (cryptographic proofs cache longest; platform/issuer-checked credentials cache shortest, since they're revocable).

What's NOT yet implemented (Stage 5):

- Real adapters. The registry has zero real adapters registered — every request currently resolves to `UnverifiableFallbackAdapter`, which is an honest `UNVERIFIABLE` result, not a fake pass. Stage 5 adds Credly, Open Badges, W3C VC, and a GenericIssuerVerifier config for Cisco/Linux Foundation.
- Document/QR pipeline (OCR, SSRF-safe URL resolution).
- Migration of `api-core`'s `candidate-certificates` and `evidence/ProfessionalCredential` call sites onto this service (deferred per user decision 2026-10-06).

## Local dev

```bash
cp .env.example .env
pnpm --filter @hirekiwi/credential-verifier db:migrate
pnpm --filter @hirekiwi/credential-verifier dev      # HTTP API
pnpm --filter @hirekiwi/credential-verifier worker   # BullMQ worker, separate process
```
