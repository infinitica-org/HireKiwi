# Sprint 6 — Delivery Manifest

> **Sprint window:** 22 Sep – 29 Sep 2026
> **Status:** ✅ Merged to `dev`
> **Release manager:** Tino (@brittytino)

---

## Merged PRs

| PR | Title | Engineer | Labels | Merged |
|----|-------|----------|--------|--------|
| #380 | `feat(assessment): server-authoritative attempt timer & cryptographic certificates (S6-VB-04)` | @vishalbharath | P1-high · area:backend · area:frontend · sprint-6 | 2026-09-29 |
| #379 | `feat(matching): jd fallback extraction and semantic candidate matcher (S6-RM-24)` | @Ram9012 | P1 · area:ai · area:backend · sprint-5 | 2026-09-29 |
| #378 | `[Peer Audit] Vishal Bharath's Modules by Vedika: Certificate Tampering & Edge Invalidation` | @11vedikaa | sprint-6 (peer audit) | 2026-09-29 |
| #377 | `feat(api-core): TPO partnership onboarding + bulk whitelist uploader (S6-VG-605)` | @11vedikaa | P1 · area:backend · area:contracts · area:frontend · sprint-6 | 2026-09-29 |

Merge order: #380 → #379 → #378 (conflict-resolved) → #377 (conflict-resolved)

Merge conflicts resolved by architect:
- `apps/web-verify/src/app/cert/[id]/page.tsx` — #378 vs #380 (kept full credential view + added tamper detection from peer audit)
- `apps/api-core/src/modules/institutions/institutions.module.ts` — #377 vs dev (kept `IdempotencyService` + added `BulkWhitelistImportProcessor`)
- `apps/api-core/src/modules/institutions/institutions.service.ts` — #377 vs dev (kept `sanitizeSpreadsheetCellText` from #380 + added `DbUserRole` type from #377)

---

## Feature Surface

### 1. Server-Authoritative Assessment Timer (S6-VB-04)

- `AssessmentForceSubmitProcessor` — BullMQ delayed-job fires at attempt deadline server-side
- Duplicate force-submit protection via attempt-state guard before DB write
- `apps/api-core/src/modules/assessment/assessment-force-submit.processor.ts`
- Queue: `bull:queue:assessment_force_submit`

### 2. Cryptographic Certificate Issuance (S6-VB-04)

- `certificate-crypto.util.ts` — HMAC-SHA256 canonical payload construction
- `certificate-qr.util.ts` — QR code encoding of the public verification URL
- `certificate-pdf.generator.ts` — Async PDF generation via BullMQ
- Prisma migration: `20260929120000_certificate_cryptographic_fields` — adds `signatureHash`, `canonicalPayload`, `qrUrl` to `Certificate` model
- Required env var: `CERTIFICATE_HMAC_SECRET` (see `.env.example`)

### 3. Public Credential Verification View (S6-VB-04)

- `apps/web-verify/src/app/cert/[id]/page.tsx` — Full credential view with Tier Trail, Level Stepper, calibration employer panel, Confidence Note
- `apps/web-verify/src/app/cert/[id]/print-button.tsx` — Client-side print trigger
- `apps/web-verify/src/app/globals.css` — `@media print` single-page constraint
- Revocation, supersession, and tamper warning alert states rendered correctly

### 4. Certificate Tamper Detection & Security Hardening (Peer Audit, S6-VG)

- `apps/web-verify/src/lib/cert-signature.ts` — UUID validation + HMAC hash verification
- `[SECURITY_EVENT]` console.error log on tamper detection
- 404 wall on non-existent or malformed UUIDs (no stack trace leakage)
- Defect documentation: `docs/delivery/issues/S6-VB-certificate-verification-flaws.md`
- AI gateway defect log: `docs/delivery/issues/S6-RM-ai-gateway-defects.md`

### 5. 14-Day Manager Endorsement Token (S6-VB-04)

- Extended from 7 to 14 days
- BullMQ reminder and expiry scheduling integrated
- `apps/api-core/src/modules/work-experience/work-experience.service.ts`

### 6. JD Offline Fallback Extractor (S6-RM-24)

- `apps/api-core/src/modules/matching/jd-fallback-extractor.ts`
  - `extractSkillsOfflineFallback()` — heuristic skill extraction
  - `extract10TrackThresholdVector()` — deterministic 10-track threshold vector
- Integrated into `opening-jd-parse.service.ts` as safe failover on AI gateway timeout
- Implements ADR-0005 (ai-failover)

### 7. Semantic Vector Candidate Matcher (S6-RM-24)

- `apps/api-core/src/modules/matching/vector-candidate-matcher.ts`
  - `matchCandidatesWithVectorSimilarity()` — cosine similarity over `pgvector`
  - Privacy opt-out triple-gate: `discoverableToEmployers`, `isDeactivated`, `isHeld` filtered **before** scoring
  - `RadarCompetencyAxis` 5-domain breakdown for employer visualization
- Integrated into `MatchingService.searchStudents()`

### 8. TPO Partnership Onboarding (S6-VG-605)

- Partnership request lifecycle: create → review → provision
- 7-day activation token generation
- University account provisioning with primary + regional campuses
- Institution admin credential setup
- Audit logging for all provisioning actions
- New contracts: `packages/contracts/src/dto/partnership.dto.ts`

### 9. Bulk Whitelist Importer (S6-VG-605)

- `apps/api-core/src/modules/institutions/bulk-whitelist-import.processor.ts`
  - BullMQ worker with DLQ fallback after 5 retries
  - Validates: email format, graduation year, department code, duplicate detection
  - Atomic batch: valid rows → whitelist; invalid rows → quarantine error log
- `POST /tpo/batches/:batchId/members/import-async` — multipart streaming upload
- `GET /tpo/batches/:batchId/members/import-status/:jobId` — Redis progress polling
- `GET /tpo/batches/:batchId/members/import-errors/:jobId` — pre-signed error report URL
- `apps/web-tpo/src/components/batch-import-wizard.tsx` — progress bar + error report download
- Queue: `bull:queue:bulk_whitelist_import`

### 10. Spreadsheet Formula Injection Protection (S6-VB-04)

- `sanitizeSpreadsheetCellText()` in `institutions.service.ts`
- Neutralizes CWE-1236: prepends `'` to cells starting with `=`, `+`, `-`, `@`

---

## Contracts Updated

| File | Change |
|------|--------|
| `packages/contracts/src/dto/assessment.dto.ts` | Added `AssessmentForceSubmitJobData` |
| `packages/contracts/src/dto/partnership.dto.ts` | New file — `CreatePartnershipRequest`, `ReviewPartnershipRequest`, `PartnershipDecisionResponse` |
| `packages/contracts/src/dto/onboarding.dto.ts` | Added `BulkImportJobPayload`, `BulkImportProgressDto`, `BulkImportErrorReportDto` |
| `packages/contracts/src/http/routes.ts` | Added TPO partnership routes and bulk import endpoints |
| `packages/contracts/src/domain/rate-limits.ts` | Rate limits declared for all new TPO/partnership endpoints |
| `packages/api-client/src/resources.ts` | Added `certificates.verify()` resource |

---

## Queue Names Added

| Queue | Purpose | Module |
|-------|---------|--------|
| `bull:queue:assessment_force_submit` | Server-authoritative timer force-submit | assessment |
| `bull:queue:certificate_pdf_generation` | Async PDF artifact generation | certificate |
| `bull:queue:bulk_whitelist_import` | 10k-row CSV/XLSX async import | institutions |

---

## Known CI Notes at Time of Merge

- `pnpm test:unit` for `@smart/ui` and `@smart/web-tpo` contains pre-existing failures unrelated to these PRs.
- `pnpm format:check` discrepancies exist in unrelated areas.
- All new test suites in the merged PRs pass independently.
- Typecheck and lint pass for all changed files.
