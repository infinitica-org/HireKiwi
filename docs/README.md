# SMART Engineering & Product Documentation Index

> **Single Source of Truth (SSOT) Notice:**  
> The authoritative, interactive, and searchable documentation portal for the SMART platform is hosted via the `@smart/web-docs` application (Fumadocs on port `3006`).  
> Live URL: `https://becomesmart.online/docs` (or `http://localhost:3006/docs` in local development).  
> Authenticated Access Key: Configured via `DOCS_PASSWORD` (default: `smartzen2026`).

---

## 1. Documentation Architecture & Folder Structure

In enterprise monorepo engineering, documentation is structured across two complementary layers:

```
smart/
├── apps/
│   └── web-docs/               # ◄── SINGLE SOURCE OF TRUTH (SSOT) PORTAL
│       ├── app/                # Next.js 16 Web Application (Port 3006)
│       │   ├── docs/           # Dynamic MDX Documentation Viewer
│       │   ├── login/          # Password Protection Session Gate
│       │   └── api/search/     # Full-Text Search Engine
│       └── content/docs/       # Canonical MDX Documentation Library (31 Parts)
│           ├── 00-start-here.mdx
│           ├── 01-product-strategy.mdx
│           ├── 02-product-architecture.mdx
│           ├── 03-user-journeys.mdx
│           ├── 18-technical-architecture.mdx
│           ├── 19-api-integrations.mdx
│           ├── 25-product-requirements.mdx
│           ├── 26-qa-testing.mdx
│           └── 27-releases-roadmap.mdx
│
└── docs/                       # ◄── REPOSITORY RUNBOOKS & ARCHITECTURAL RECORDS
    ├── README.md               # This Master Documentation Index
    ├── adr/                    # Immutable Architectural Decision Records (0001 - 0017)
    └── delivery/               # Low-Level Git Delivery Runbooks & Engineering Workflows
        ├── BRANCHING.md        # Monorepo Branching Rules (dev -> qa -> main)
        ├── DEFINITION_OF_DONE.md # Quality Gates & Acceptance Criteria
        └── ENGINEER_GUIDES.md  # Module Ownership & Development Guides
```

### Why Both Folders Exist & How They Are Unified:

1. **`apps/web-docs/` (The Product & Architecture Portal):**
   - Acts as the **living, interactive documentation portal** accessible to technical recruiters, academic partners, executives, and developers.
   - Compiles MDX with full-text search, live syntax highlighting, OpenGraph preview generation, and cryptographic verification demos.
   - Contains the complete 31-part product autonomy, system PRDs, API schemas, and roadmap specifications.
2. **`docs/` (Low-Level Engineering Protocols):**
   - Reserved strictly for **developer environment execution runbooks** (`docs/delivery/`) and **immutable decision records** (`docs/adr/`) tied directly to git hooks and developer onboarding.
   - To prevent "split-brain" documentation drift, **all product requirements, technical blueprints, and release roadmaps live exclusively inside `@smart/web-docs/content/docs/`**.

---

## 2. Topic Map to Authoritative Portal Content

| Documentation Topic                      | Authoritative Portal Path          | Local MDX Source File                                                                                                                                       |
| :--------------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Overview & Mission**           | `/docs/00-start-here`              | [`apps/web-docs/content/docs/00-start-here.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/00-start-here.mdx)                           |
| **Product Strategy & Moat**              | `/docs/01-product-strategy`        | [`apps/web-docs/content/docs/01-product-strategy.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/01-product-strategy.mdx)               |
| **Product Architecture & Multi-Tenancy** | `/docs/02-product-architecture`    | [`apps/web-docs/content/docs/02-product-architecture.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/02-product-architecture.mdx)       |
| **End-to-End User Journeys**             | `/docs/03-user-journeys`           | [`apps/web-docs/content/docs/03-user-journeys.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/03-user-journeys.mdx)                     |
| **Talent Evidence & GitHub AST**         | `/docs/04-talent-evidence`         | [`apps/web-docs/content/docs/04-talent-evidence.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/04-talent-evidence.mdx)                 |
| **Work Experience Voucher Engine**       | `/docs/05-verification`            | [`apps/web-docs/content/docs/05-verification.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/05-verification.mdx)                       |
| **Capability Intelligence & BARS**       | `/docs/06-capability-intelligence` | [`apps/web-docs/content/docs/06-capability-intelligence.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/06-capability-intelligence.mdx) |
| **Technical Architecture & VPS Sizing**  | `/docs/18-technical-architecture`  | [`apps/web-docs/content/docs/18-technical-architecture.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/18-technical-architecture.mdx)   |
| **API Endpoints & ATS Webhooks**         | `/docs/19-api-integrations`        | [`apps/web-docs/content/docs/19-api-integrations.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/19-api-integrations.mdx)               |
| **DPDP Act 2023 Security & Privacy**     | `/docs/20-security-privacy`        | [`apps/web-docs/content/docs/20-security-privacy.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/20-security-privacy.mdx)               |
| **PRD (Functional & Non-Functional)**    | `/docs/25-product-requirements`    | [`apps/web-docs/content/docs/25-product-requirements.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/25-product-requirements.mdx)       |
| **QA Pyramid & k6 Load Profiles**        | `/docs/26-qa-testing`              | [`apps/web-docs/content/docs/26-qa-testing.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/26-qa-testing.mdx)                           |
| **Releases & Roadmap (v1.0 - v1.3)**     | `/docs/27-releases-roadmap`        | [`apps/web-docs/content/docs/27-releases-roadmap.mdx`](file:///d:/Work's/Infinitica/smart/apps/web-docs/content/docs/27-releases-roadmap.mdx)               |

---

## 3. Running Documentation Locally

To start the documentation portal in development mode:

```bash
# Launch documentation portal on port 3006
pnpm --filter @smart/web-docs dev

# Validate documentation build and TypeScript types
pnpm --filter @smart/web-docs build
```

Navigate to `http://localhost:3006/login` and enter the access key (`smartzen2026`).
