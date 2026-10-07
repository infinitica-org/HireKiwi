# Product — HireKiwi Intelligent Talent Discovery Platform

**HireKiwi** transforms fragmented claims about candidates into **evidence-backed capability profiles** and matches them to roles with defensible, explainable precision.

Operates under **AI-DLC (AI-Driven Software Delivery Lifecycle)**: _"The hardest part of AI coding was never generation — it was delivery."_

> "What evidence exists that demonstrates what this person can do?" — and shows its work.

## Core Architectural Blueprint (9 Modules)

Per `HireKiwi_RnD_Workstream_Blueprint.md` and the architecture MindMap:

1. **Data Sources (Active + Passive):**
   - _Active:_ 5-tier assessments (L1 MCQ, L2 Code/SQL Sandbox, L3 Spoken BARS, L4 AI Defense, L5 Capstones), AI interviews, simulations.
   - _Passive:_ Work experience, projects, verified degrees/certifications, GitHub/GitLab commits, LeetCode/HackerRank metrics, LinkedIn history, Kaggle, portfolios.
2. **Data Ingestion & Processing:**
   - NLP/OCR document extraction, entity recognition (skills, tools, tasks, roles, context), normalization, deduplication, trust score & recency assignment.
3. **Universal Capability Ontology:**
   - Hybrid relational catalog + knowledge graph: Domain → Competency → Skill → Tool/Tech → Knowledge → Task → Role.
   - Relationships (`requires`, `related-to`, `demonstrated-by`) and external taxonomies (ESCO, O*NET).
4. **Assessment & Verification Engine:**
   - Adaptive skill assessments, technical/non-technical simulations, certification authority verification, manager endorsement validation with tamper detection.
5. **Evidence Fusion & Inference Engine:**
   - Evidence Graph linking evidence to capabilities with provenance and attribution.
   - Fusion models estimating 1–5 proficiency levels with calibrated confidence intervals.
   - Identifies evidence gaps and recommends targeted next assessments.
6. **Role Understanding & Requirement Mapping:**
   - Parses job descriptions, extracts required vs. preferred skills/tools/tasks, establishes proficiency thresholds, and maps to canonical ontology entities.
7. **Matching & Ranking Engine:**
   - **Algorithmic first:** Hard eligibility constraints + weighted requirement scoring + `pgvector` HNSW cosine similarity.
   - No open-ended LLM hallucination or arbitrary ranking.
   - Batch-normalized scoring across assessment cohorts; event-driven re-indexing upon profile/proficiency upgrades.
8. **Outputs & Applications:**
   - _For Employers:_ Instant candidate search, explainable match reasons, proficiency breakdowns, verified source evidence, shortlist exports.
   - _For Candidates:_ Verified capability profile, evidence trail, personalized learning recommendations, skill gap discovery, progress tracking.
9. **Continuous Learning & Improvement:**
   - Feedback loops from hiring outcomes (shortlisted, interviewed, offered), ontology expansion, and model evaluation.

## Human Review Accountability Model (October 2026 Decision)

- **Partnered Institutions:** Academic integrity / assessment flags are routed to the **College / Placement Admin Queue**.
- **Independent Students:** Directly routed to the **HireKiwi Platform Trust & Safety Queue**.

## Database & Security Mandates

- **Skill Inventory:** Canonical catalog in PostgreSQL with alias resolution and ESCO/O*NET crosswalks.
- **Incremental Job IDs:** Migrating from legacy 32-bit format to incremental, structured IDs.
- **Verification ID:** Standardized cryptographic hash and verification URL (`hirekiwi.online/verify/{id}`).
- **Security:** 1 Mobile Number = 1 Account; rate-limiting on student auth endpoints; resilient HttpOnly token refresh.
