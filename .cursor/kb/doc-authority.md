# Document Authority

When sources disagree, use this order:

1. **`.github/CODEOWNERS`** + **`TEAM.md`** — who owns what (mechanical + human).
2. **`packages/contracts/**`** — API/event/rate-limit shapes actually enforced in code.
3. **`apps/web-docs/content/docs/delivery/AI_DLC_FRAMEWORK.mdx`** — AI-DLC delivery doctrine ("The Hardest Part of AI Coding Was Never Generation — It Was Delivery").
4. **`apps/web-docs/content/docs/blueprints/smartkiwi-rnd-blueprint.mdx`** — R&D objectives, architecture decisions, and readiness criteria.
5. **Minutes of Meeting (MoM 03/10/2026)** / **`apps/web-docs/content/docs/delivery/MOM_2026_10_03_TECHNICAL_REVIEW.mdx`** — latest technical and product decisions.
6. **`apps/web-docs/content/docs/delivery/OCTOBER_2026_SPRINT_PLAN.mdx`** — active October 2026 sprint plan and weekly deliverables.
7. **`ARCHITECTURE.md`** — system design, SLAs, schema narrative, rate-limit rationale.
8. **`apps/web-docs/content/docs/*`** — Single Source of Truth (Fumadocs portal on :3006).
9. **`tools/zoho-sprint*/backlog.mjs`** — sprint ticket AC/DoD/subtasks (synced to GitHub Issues).
10. **`README.md`** — local ports and bootstrap.
11. Older narrative docs with legacy working titles ("SmartZen", "Vivi", "HireKiwi") — **superseded/historical**; do not hallucinate autonomous agents or use deprecated names.

## Known Architecture Truths (October 2026)

| Topic                     | Deprecated / Hallucinated        | Authoritative Truth                                                                                                        |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Product Name**          | "SmartZen" / "HireKiwi"          | **SmartKiwi (SMART) Intelligent Talent Discovery Platform**                                                                |
| **Delivery Framework**    | OpenSpec (static markdown)       | **AI-DLC (AI-Driven Software Delivery Lifecycle)** with machine-actionable MCP tickets                                     |
| **Verification Agent**    | "Vivi Autonomous Agent"          | Modular Ingestion & Verification Engine (`apps/api-core`, BullMQ workers, cryptographic HMAC-SHA256, human verifier queue) |
| **Matching Engine**       | Generative LLM scoring / ranking | **Algorithmic hybrid matcher** (hard SQL filters + weighted requirement scoring + `pgvector` HNSW cosine similarity)       |
| **Review Accountability** | Ambiguous review queue           | **Partnered students:** College review queue; **Independent students:** Platform review queue                              |
| **Job ID Format**         | 32-bit integer                   | **Incremental structured Job ID format** (`JOB-YYYY-NNNNNN`)                                                               |
| **Mobile Number**         | Multiple accounts per mobile     | **1 Mobile Number = 1 Account** strictly enforced                                                                          |
| **Telemetry Validation**  | Raw model ingestion              | **4D telemetry validation & deep learning pipeline checks**                                                                |
| **Matching Recompute**    | Full-cohort re-run               | **Event-driven delta re-indexing** upon student registration or proficiency upgrade                                        |
