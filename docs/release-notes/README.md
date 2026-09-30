# SMART Platform — Release Engineering & Version History

This directory contains the formal production release records, changelogs, and operational runbooks for the SMART platform.

## Release Governance & Promotion Model

SMART follows a strict three-tier deployment and release gate governed by the System Architect ([`TEAM.md`](file:///d:/Work's/Infinitica/smart/TEAM.md) §2.1):

```
[ Feature PR ] ──▶ dev (Modular Monolith CI & Unit Tests)
                     │
                     ▼ (Weekly Staging Soak & k6 Stress Test)
                   qa (Pre-Production Acceptance & Partner Verification)
                     │
                     ▼ (Architect Approval & Promotion Sign-off)
                   main (Production Deployment to AWS ECS & Edge CDN)
```

Direct pushes to `dev`, `qa`, and `main` are mechanically blocked. All releases are tagged using semantic versioning (`vMAJOR.MINOR.PATCH`).

## Release Index

| Version    | Release Date | Key Milestones                                                                                                              | Release Notes                             |
| :--------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| **v2.1.0** | 2026-09-29   | BullMQ server-authoritative timer, HMAC-SHA256 certificates, `pgvector` placement matching, DPDP consent proctoring sidecar | [Release Notes v2.1.0](./RELEASE_v2.1.md) |
| **v2.0.0** | 2026-09-15   | Monolith consolidation (`api-core`), Redis sliding-window rate limiting, Decoupled Claude 5 Sonnet AI gateway               | Archived in Sprint 5 Manifest             |
| **v1.0.0** | 2026-08-30   | Initial foundation release, Next.js student & TPO portals, L1/L2 test delivery engine                                       | Archived in Sprint 3 Manifest             |

## Deployment Runbooks

For disaster recovery, database failovers, and backup restore procedures, refer to:

- [Database Recovery & Backup Runbook](../delivery/BACKUP_RESTORE.md)
- [Zero-Downtime Deployment Checklist](../delivery/S6-RM-21-production-checklist.md)
- [Performance Testing & Observability Specifications](../adr/0015-perf-testing-observability.md)
