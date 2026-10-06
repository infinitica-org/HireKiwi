# Agent entry (mirror)

Primary: [`../AGENTS.md`](../AGENTS.md).

Platform: **HireKiwi Intelligent Talent Discovery Platform** (formerly SMART / SmartZen / HireKiwi).
Agent Persona: **Vivi** is the unified AI agent, proctoring supervisor, and candidate copilot (do NOT rename Vivi to HireKiwi).
Framework: **AI-DLC (AI-Driven Software Delivery Lifecycle)** — _"The hardest part of AI coding was never generation — it was delivery."_
Delivery Mandate: Whenever working on any ticket, the agent MUST update relevant `@hirekiwi/web-docs` pages and verify `pnpm --filter @hirekiwi/web-docs build` passes before PR.
Port Ranges (Single VPS): Prod Blue `:3000-:3008` | Prod Green `:3010-:3018` | Dev `:3020-:3028`.
Shared KB: `kb/INDEX.md` · Product: `kb/product.md` · Authority: `kb/doc-authority.md` · Workflow: `rules/02-dev-workflow.mdc`.
Blueprint & Architecture: `apps/web-docs/content/docs/blueprints/hirekiwi-rnd-blueprint.mdx` and `apps/web-docs/content/docs/architecture/hirekiwi-talent-discovery-platform.mdx`.
Sprints & Delivery: `apps/web-docs/content/docs/delivery/OCTOBER_2026_SPRINT_PLAN.mdx` and `apps/web-docs/content/docs/delivery/AI_DLC_FRAMEWORK.mdx`.
