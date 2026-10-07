# SMART: Full Implementation Guide

Google Analytics, Sentry, Prometheus, health monitoring, open-source code review and OAuth, designed for **our** codebase and deployment.

|                |                                                                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Audience**   | SMART engineers: backend (api-core), frontend (portals), infra (Compose, Caddy, Grafana), CI                                                                                                                         |
| **Status**     | Proposal. Nothing below is implemented unless a box says "Already built"                                                                                                                                             |
| **Date**       | 2026-10-07                                                                                                                                                                                                           |
| **How to use** | Read section 1 (how our product is configured and deployed), then work through sections 2 to 7 in the suggested order. Each section lists files to change, code, config per environment, tests, rollout and rollback |

---

## Contents

1. [How our product is built and deployed (read first)](#1-how-our-product-is-built-and-deployed-read-first)
2. [Open-source code review and security scanning](#2-open-source-code-review-and-security-scanning)
3. [Sentry](#3-sentry)
4. [OAuth: Google sign-in and other providers](#4-oauth-google-sign-in-and-other-providers)
5. [Google Analytics (GA4)](#5-google-analytics-ga4)
6. [Prometheus](#6-prometheus)
7. [System, database and code health monitoring](#7-system-database-and-code-health-monitoring)
8. [Rollout plan, tickets and open questions](#8-rollout-plan-tickets-and-open-questions)

---

## 1. How our product is built and deployed (read first)

Every item in this guide touches configuration, so these facts decide how each one must be wired.

### 1.1 Applications and ports

| App                                    | Local port | Purpose                                | Reverse-proxy host variable (Caddy) |
| -------------------------------------- | ---------- | -------------------------------------- | ----------------------------------- |
| `api-core`                             | 3000       | NestJS + Fastify API, prefix `/api/v1` | `API_HOST`                          |
| `web-student`                          | 3001       | Student portal                         | `STUDENT_HOST`                      |
| `web-tpo`                              | 3002       | University (TPO) console               | `TPO_HOST`                          |
| `web-admin`                            | 3003       | Super-admin console                    | `ADMIN_HOST`                        |
| `web-verify`                           | 3004       | Public certificate verification        | `VERIFY_HOST`                       |
| `web-auth`                             | 3005       | Login, register, privacy, terms        | `AUTH_HOST`                         |
| `web-company`                          | 3006       | Employer portal                        | `COMPANY_HOST`                      |
| `web-landing`                          | 3007       | Public marketing site                  | `LANDING_HOST`                      |
| `web-docs`                             | 3008       | Documentation site                     | `DOCS_HOST`                         |
| `credential-verifier`, `proctoring-cv` | 3100, 8091 | Backend sidecars (Node, Python)        | internal only                       |

### 1.2 Where configuration lives (this is the most common source of mistakes)

| What                                | Where                                                                                                                                                                                                                        | Consequence                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API environment variables           | Declared and validated in `apps/api-core/src/platform/config/env.ts` (zod). Passed to the container through the `x-app-env` anchor in `infra/docker/docker-compose.yml`                                                      | A new API variable must be added in **both** places, or the container never sees it                                                                       |
| Server secrets per environment      | `.env.dev`, `.env.qa`, `.env.prod` on the VPS, created from `.env.dev.example`, `.env.qa.example`, `.env.prod.example`. The deploy workflows rsync the repo **excluding** `.env*` and then run `scripts/deploy-vps.sh <env>` | Real secrets are never in the repo or in GitHub secrets for the app. New variables must be added to the `.example` files and filled on the server by hand |
| Browser variables (`NEXT_PUBLIC_*`) | **Baked at Docker build time.** `infra/docker/Dockerfile.web` declares `ARG` and `ENV` for each one, and each web service in `docker-compose.yml` passes them under `build.args`                                             | A `NEXT_PUBLIC_` value set only at runtime is **undefined in the browser**. Every new one needs an `ARG`, an `ENV` and a `build.args` entry               |
| Builds                              | The VPS builds images itself, one service at a time (`deploy-vps.sh`)                                                                                                                                                        | Anything needed at build time (source-map upload tokens) must be available on the VPS, not in GitHub Actions                                              |
| Shared Next.js config               | `packages/config-next` (package name `@hirekiwi/next-config`, function `withSmartConfig`)                                                                                                                                    | Cross-portal build behaviour belongs here, not copied into nine `next.config.ts` files                                                                    |
| Reverse proxy                       | `infra/docker/Caddyfile`                                                                                                                                                                                                     | Security headers and any new public host go here                                                                                                          |
| Observability stack                 | Compose profile `obs`: Prometheus, Grafana, Loki, Alloy, Tempo, cAdvisor, node-exporter, Postgres and Redis exporters. Config in `infra/observability/`                                                                      | New scrape jobs, dashboards and alert rules go in this folder                                                                                             |

### 1.3 Existing building blocks we will reuse

| Building block                                | Location                                                                                                      | Reused by                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Central log redaction list `REDACTED_PATHS`   | `packages/observability/src/redaction.ts`                                                                     | Sentry scrubbing, OAuth logging |
| Correlation id (`getContext().correlationId`) | `packages/observability`                                                                                      | Sentry tags, support lookups    |
| Metric registry                               | `packages/observability/src/metrics.ts`                                                                       | Prometheus business metrics     |
| Exception filter                              | `apps/api-core/src/common/filters/api-exception.filter.ts`                                                    | Sentry error capture            |
| Auth session issuing                          | `AuthService.issueSession` in `apps/api-core/src/modules/auth/auth.service.ts`, cookie in `refresh-cookie.ts` | Google sign-in                  |
| Audit publisher                               | `auditPublisher.record(...)`                                                                                  | OAuth sign-in audit trail       |
| Redis state helper pattern                    | `linkedin-oauth.service.ts`                                                                                   | Google OAuth state              |
| Route registry and rate-limit tiers           | `packages/contracts/src/http/routes.ts`, `domain/rate-limits.ts`                                              | New OAuth routes                |
| Grafana alert provisioning                    | `infra/observability/grafana/provisioning/alerting/*.yml`                                                     | New alert rules                 |

### 1.4 Process rules that apply to every ticket

- Branch `type/S<n>-<INIT>-<nn>-slug` from `dev`, PR to `dev`, about 400 changed lines at most. Split work as in section 8.
- Only Vishal V writes Prisma migrations. Any table change is a request to him.
- Every API route needs RBAC and a rate-limit tier in `packages/contracts/src/http/routes.ts`. The route-coverage test fails otherwise. Contracts changes go in their own PR first.
- Never send assessment answers, transcripts, JWTs or emails to any external service.
- Each commit subject needs a valid scope from `commitlint.config.mjs` (for example `api-core`, `ui`, `ci`, `infra`, `deps`, `docs`).

---

## 2. Open-source code review and security scanning

**Do this first.** It is cheap, has no product risk, and protects everything that follows.

### 2.1 Current state

CI (`.github/workflows/ci.yml`) runs: lockfile check, compose config, lint, format, typecheck, unit tests, build. Process is enforced by commitlint, husky, `CODEOWNERS`, `enforce-pr-flow.yml` and `pr-label-check.yml`. **Nothing scans for vulnerable dependencies, leaked secrets, or insecure code patterns.** There is no Dependabot or Renovate configuration.

### 2.2 Tools

| Need                                     | Tool                                            | Why this one                                                        |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| Static security analysis                 | **Semgrep** (open-source rules)                 | Free for private repos, handles TypeScript, Python and Dockerfiles  |
| Secret scanning                          | **gitleaks**                                    | Fast, scans the PR diff and full history                            |
| Dependency and container vulnerabilities | **Trivy**                                       | One tool for the pnpm lockfile, `infra/docker/Dockerfile.*` and IaC |
| Dependency updates                       | **Renovate** (open source) or GitHub Dependabot | Weekly grouped PRs                                                  |
| Inline lint comments                     | **reviewdog**                                   | Posts ESLint findings on the PR                                     |
| AI review (optional)                     | **PR-Agent**, self-hosted                       | Sends diffs to an LLM, so it needs explicit approval                |

GitHub CodeQL is free only for public repositories. For a private repo it needs GitHub Advanced Security, so use Semgrep unless the repo is public.

### 2.3 Steps

**Step 1. Add the security workflow** (`.github/workflows/security.yml`). It is separate from `ci.yml` so scans never slow the main gate:

```yaml
name: Security
on:
  pull_request:
    branches: [dev, qa, main]
  schedule:
    - cron: '0 3 * * 1' # weekly full scan
concurrency:
  group: security-${{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
  pull-requests: write
jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - name: gitleaks (secrets)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: trivy (dependencies, Dockerfiles, IaC)
        uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: '1'
      - name: semgrep (static analysis)
        run: |
          pip install semgrep
          semgrep scan --config p/typescript --config p/nodejs --config p/dockerfile --error --severity ERROR
```

Pin every action to a release tag or commit sha, as the existing workflows do.

**Step 2. Dependency updates.** Create `renovate.json` at the repo root (or `.github/dependabot.yml` if you prefer the GitHub-native tool):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", "group:monorepos", ":semanticCommitTypeAll(chore)"],
  "schedule": ["before 6am on monday"],
  "prConcurrentLimit": 3,
  "packageRules": [
    { "matchUpdateTypes": ["minor", "patch"], "groupName": "weekly minor and patch" },
    {
      "matchPackageNames": ["prisma", "@prisma/client"],
      "groupName": "prisma",
      "reviewers": ["team:backend"]
    }
  ],
  "commitMessageTopic": "{{depName}}",
  "semanticCommitScope": "deps"
}
```

Renovate commits must satisfy commitlint, which is why the scope is `deps`. Prisma updates are grouped and routed to the migration steward.

**Step 3. Pull-request checklist.** Add to `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
### Security checklist

- [ ] New or changed route has RBAC and a rate-limit tier in contracts
- [ ] No secrets, tokens or personal data in code, logs or fixtures
- [ ] User input validated with zod at the boundary
- [ ] New external call has a timeout and a failure path
```

**Step 4. Roll out safely.**

1. Merge with `continue-on-error: true` on each scan step for one week (report only).
2. Triage findings: fix real ones, suppress false positives with a comment and an owner (`.semgrepignore`, `.gitleaksignore`, `.trivyignore`).
3. Remove `continue-on-error` and add **Security / scan** as a required status check on `dev`, `qa` and `main`.

**Step 5. Keep humans in the loop.** `CODEOWNERS` stays the required reviewer. Tools add signal; they do not replace review.

### 2.4 Tests and verification

- Open a throwaway PR containing a fake AWS key. gitleaks must fail it.
- On a throwaway branch, pin a package with a known critical advisory. Trivy must fail it.
- Add an `eval(userInput)` in a scratch file. Semgrep must flag it.

**Rollback:** delete `security.yml` or drop the required check. No runtime impact.

---

## 3. Sentry

### 3.1 Current state and decisions

Sentry is **not** installed. ADR-0010 lists it under "Deferred". `api-core` has an optional OpenTelemetry setup (`apps/api-core/src/tracing.ts`) that is a **no-op unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set**.

Before coding, hold a short decision meeting and record it as a new ADR (Tino and Vishal V):

| Decision         | Options                                                                                 | Recommendation                                                                       |
| ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Hosting          | Sentry SaaS, self-hosted Sentry, or GlitchTip (lighter, open source, Sentry-compatible) | SaaS for speed. Self-host or GlitchTip if candidate-adjacent data must stay in India |
| Scope            | Errors only, or errors plus performance traces                                          | **Errors only** at first. We already have Tempo for traces                           |
| Frontend replay  | On or off                                                                               | **Off.** Assessment and proctoring screens must never be recorded                    |
| Alert recipients | Who is paged for new issues                                                             | One backend and one frontend owner per environment                                   |

### 3.2 Backend: api-core

**Files:** new `apps/api-core/src/instrument.ts`; edit `main.ts`, `common/filters/api-exception.filter.ts`, `platform/config/env.ts`, `app.module.ts`; edit compose `x-app-env`.

1. Install:

```bash
pnpm --filter @hirekiwi/api-core add @sentry/nestjs
```

2. Create `apps/api-core/src/instrument.ts`. Read the validated `env` like `tracing.ts` does (the repo lints against raw `process.env`):

```ts
import { loadDotenv } from './platform/config/load-dotenv.js';
import type { Env } from './platform/config/env.js';

loadDotenv();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { env } = require('./platform/config/env.js') as { env: Env };

if (env.SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nestjs') as typeof import('@sentry/nestjs');
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.APP_VERSION,
    sendDefaultPii: false,
    tracesSampleRate: 0, // errors only; Tempo handles traces
    beforeSend(event) {
      if (event.request) {
        delete event.request.data; // request bodies can hold answers and PII
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
      }
      return event;
    },
  });
}
```

3. In `main.ts`, import it **before** `tracing.js` (Sentry must load before the frameworks it instruments):

```ts
import './instrument.js';
import './tracing.js';
```

With `OTEL_EXPORTER_OTLP_ENDPOINT` unset (the default) there is no second OpenTelemetry SDK, so there is no conflict. If you later set the endpoint in an environment, keep `tracesSampleRate: 0` and follow Sentry's documented "use with existing OpenTelemetry" setup before turning on Sentry tracing.

4. Report server errors from the existing filter. In `api-exception.filter.ts` add the capture in the two places that produce a 5xx: the unhandled branch at the bottom, and the `HttpException` branch when `status >= 500`:

```ts
import * as Sentry from '@sentry/nestjs';

private report(error: unknown, traceId: string, route: string): void {
  Sentry.withScope((scope) => {
    scope.setTag('correlationId', traceId);
    scope.setTag('route', route);
    Sentry.captureException(error);
  });
}
```

Call `this.report(exception, traceId, route)` just before the 500 response is sent, and inside the `HttpException` branch only when `status >= 500`. Do not report 4xx responses: they are expected and would flood the project. `Sentry.captureException` does nothing when Sentry was not initialised, so no extra guard is needed. 5. Register Sentry's Nest integration once in `app.module.ts`: add `SentryModule.forRoot()` to `imports`. Do **not** add Sentry's global exception filter, because our filter already handles every exception and would double-report. 6. Add the variables to `env.ts` as optional strings: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`. Add both to the `x-app-env` anchor:

```yaml
SENTRY_DSN: ${SENTRY_DSN:-}
SENTRY_ENVIRONMENT: ${SENTRY_ENVIRONMENT:-development}
```

### 3.3 Portals: Next.js

**Files:** `packages/config-next/index.ts`, each portal's `next.config.ts`, new `instrumentation-client.ts` and `sentry.server.config.ts` per portal, `Dockerfile.web`, compose build args.

1. Install in each portal that should report (student, tpo, company, admin, auth, landing):

```bash
pnpm --filter @hirekiwi/web-student add @sentry/nextjs
```

2. **Centralise** the Sentry wrapper in `packages/config-next` so nine apps do not drift. Add an optional `withSmartSentry(config)` that calls `withSentryConfig` only when `SENTRY_AUTH_TOKEN` is present at build time. Each portal's `next.config.ts` then wraps once: `export default withSmartSentry(config)`.
3. Per portal, create `instrumentation-client.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend(event) {
    // The auth hand-off puts ?accessToken= in URLs. Never report query strings.
    if (event.request?.url) event.request.url = event.request.url.split('?')[0];
    return event;
  },
});
```

and a matching `sentry.server.config.ts` for server components and route handlers. 4. **Build-time wiring** (this is where our setup differs from a standard Next.js app). The browser DSN is a `NEXT_PUBLIC_` value, so it must be baked in at build:

- In `infra/docker/Dockerfile.web` add `ARG NEXT_PUBLIC_SENTRY_DSN`, `ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT` and the matching `ENV` lines next to the existing `NEXT_PUBLIC_*` ones.
- In `docker-compose.yml`, under each web service's `build.args`, add `NEXT_PUBLIC_SENTRY_DSN: ${SENTRY_DSN_WEB:-}` and `NEXT_PUBLIC_SENTRY_ENVIRONMENT: ${SENTRY_ENVIRONMENT:-development}`.
- **Source maps** are uploaded during `next build`, which runs on the VPS inside Docker. Pass the upload token as a BuildKit secret, never as an `ARG` (build args are stored in image history):

```yaml
# docker-compose.yml, per web service
    build:
      secrets:
        - sentry_auth_token
secrets:
  sentry_auth_token:
    environment: SENTRY_AUTH_TOKEN
```

and in `Dockerfile.web`, mount it only for the build step: `RUN --mount=type=secret,id=sentry_auth_token SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" pnpm --filter ... build`. Add `SENTRY_ORG` and `SENTRY_PROJECT` the same way as plain build args (they are not secret). 5. Add `SENTRY_DSN`, `SENTRY_DSN_WEB`, `SENTRY_ENVIRONMENT` and `SENTRY_AUTH_TOKEN` (empty) to `.env.example`, `.env.dev.example`, `.env.qa.example`, `.env.prod.example`, and fill them on each server.

### 3.4 Python sidecar: proctoring-cv

```bash
pip install sentry-sdk
```

```python
import sentry_sdk
sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), environment=os.getenv("SENTRY_ENVIRONMENT"),
                send_default_pii=False, traces_sample_rate=0.0)
```

Never attach frames, images or transcripts. Pass `SENTRY_DSN` to the `proctoring-cv` service in compose.

### 3.5 Releases

`APP_VERSION` is already read by the API (`env.APP_VERSION`). Set it to the git sha in `deploy-vps.sh`, and use the same value as the Sentry `release`. After each deploy, call `sentry-cli releases deploys` for the environment so regressions point to a release.

### 3.6 Alerts

In Sentry: alert on "new issue" and on "issue regressed" per environment, routed to the backend or frontend channel. Keep the existing Grafana alerts for infrastructure, and Sentry for code errors, so there is no duplicate paging.

### 3.7 Tests and verification

- Unit test: with `SENTRY_DSN` unset, importing `instrument.ts` must not throw and must not call `init`.
- Unit test for the filter: a thrown `Error` produces a 500 response **and** one capture; a 404 produces no capture.
- Dev check: add a temporary route that throws. The Sentry issue must show the `correlationId` tag, no request body, no cookies, and (for web) readable source-mapped frames.
- Search Loki for the same `correlationId` and confirm the log line matches.

**Rollback:** unset `SENTRY_DSN`. Both SDKs disable themselves with no code change.

---

## 4. OAuth: Google sign-in and other providers

### 4.1 Current state

- Email and password login (`POST /auth/login`), refresh, logout, email verification, password reset and invitation acceptance exist.
- `linkedin-oauth.service.ts` implements LinkedIn OIDC for identity verification, with a Redis-backed one-time `state`. It does **not** create sessions.
- **The "Continue with Google" button on the login page (`apps/web-auth/src/app/login/login-form.tsx`) only shows an `alert(...)`.** No backend route exists.
- `GOOGLE_AI_API_KEY` in `env.ts` is for the AI provider and is unrelated.

### 4.2 Design rules (non-negotiable)

1. Use the **OpenID Connect authorization code flow with PKCE**. Never the implicit flow.
2. Google may **sign in** an existing account, or **create a student** account. It must **never create** a TPO, company or admin account. Those are provisioned by invitation, so Google may only **link** to them.
3. Match on a verified email only (`email_verified === true`). Store Google's `sub` on the account, so a later email change cannot hijack it.
4. Reuse the exact session path as password login: the same access token and refresh cookie from `AuthService.issueSession`. Do not create a second session system.
5. Reuse the same gates that `login()` applies: `assertTenantLoginAllowed`, `deactivatedAt`, `assertEmailVerified`, and the audit record `auth.login`. A held institution or deactivated account must be refused exactly as with a password.
6. A user who signs in with Google must still satisfy account lockout and revocation rules (`session-revocation` is already in the codebase).

### 4.3 Data model (request to Vishal V)

One new table. Do not write the migration yourself.

```prisma
model AuthIdentity {
  id        String   @id @default(uuid())
  userId    String
  provider  String   // 'GOOGLE'
  subject   String   // Google "sub" claim
  email     String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, subject])
  @@index([userId])
}
```

### 4.4 Contracts PR (first)

Add a rate-limit tier next to `auth.login` in `packages/contracts/src/domain/rate-limits.ts`, copying its shape (key `auth.oauth`, Redis key `rl:auth:oauth:ip:{id}`, a few requests per minute per IP). Then add the routes to `routes.ts`:

```ts
{
  method: 'GET',
  path: '/auth/google',
  module: 'auth',
  owner: 'Vishal V',
  roles: ['PUBLIC'],
  rateLimit: 'auth.oauth',
  criticality: 'INTERACTIVE',
  execution: 'SYNC',
  slaMs: 150,
  summary: 'Start Google sign-in; redirects to Google with state, nonce and PKCE.',
},
{
  method: 'GET',
  path: '/auth/google/callback',
  module: 'auth',
  owner: 'Vishal V',
  roles: ['PUBLIC'],
  rateLimit: 'auth.oauth',
  criticality: 'INTERACTIVE',
  execution: 'SYNC',
  slaMs: 500,
  summary: 'Google OAuth callback; verifies the ID token and issues the normal session.',
},
```

The callback calls Google, so its `slaMs` must stay within the `INTERACTIVE` budget in `LATENCY_BUDGET_MS` (500 ms) or use a class with a larger budget. The contracts test `keeps every synchronous route inside the budget` enforces this.

Also update the route-coverage snapshot (`apps/api-core/src/modules/rate-limit/__snapshots__/route-coverage.spec.ts.snap`).

### 4.5 Backend: api-core

**Files:** `modules/auth/google-oauth.service.ts` (new), `modules/auth/google-auth.controller.ts` (new, one `@Controller` per file because the route scanner reads one), `auth.service.ts` (small public method), `auth.module.ts`, `platform/config/env.ts`, compose `x-app-env`.

1. Dependencies and env:

```bash
pnpm --filter @hirekiwi/api-core add google-auth-library
```

`env.ts` (all optional, so Google sign-in is simply off when unset):

```ts
GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
```

Add the three to `x-app-env` in compose and to every `.env*.example` file. 2. **Service**, modelled on `LinkedinOauthService` (Redis state with a 10-minute TTL):

```ts
// apps/api-core/src/modules/auth/google-oauth.service.ts
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../platform/config/env.js';
import { RedisService } from '../../platform/redis/redis.service.js';

const STATE_TTL_SECONDS = 10 * 60;
const STATE_KEY = 'auth:google:state:';

export interface GoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

@Injectable()
export class GoogleOauthService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  get configured(): boolean {
    return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);
  }

  private client(): OAuth2Client {
    return new OAuth2Client(
      env.GOOGLE_OAUTH_CLIENT_ID,
      env.GOOGLE_OAUTH_CLIENT_SECRET,
      env.GOOGLE_OAUTH_REDIRECT_URI,
    );
  }

  /** Returns the Google URL plus the state value to bind to this browser (cookie). */
  async createAuthorizationUrl(returnTo: string | null): Promise<{ url: string; state: string }> {
    const client = this.client();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const state = randomUUID();
    const nonce = randomUUID();
    await this.redis.setex(
      `${STATE_KEY}${state}`,
      STATE_TTL_SECONDS,
      JSON.stringify({ codeVerifier, nonce, returnTo }),
    );
    const url = client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256' as never,
      prompt: 'select_account',
    });
    return { url, state };
  }

  /** One-time: the state is deleted as soon as it is read. */
  async completeAuthorization(
    code: string,
    state: string,
  ): Promise<{ identity: GoogleIdentity; returnTo: string | null }> {
    const raw = await this.redis.get(`${STATE_KEY}${state}`);
    await this.redis.del(`${STATE_KEY}${state}`);
    if (!raw) throw new Error('invalid_state');
    const { codeVerifier, nonce, returnTo } = JSON.parse(raw) as {
      codeVerifier: string;
      nonce: string;
      returnTo: string | null;
    };

    const client = this.client();
    const { tokens } = await client.getToken({ code, codeVerifier });
    if (!tokens.id_token) throw new Error('missing_id_token');
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.nonce !== nonce) {
      throw new Error('invalid_token');
    }
    return {
      identity: {
        subject: payload.sub,
        email: payload.email.toLowerCase(),
        emailVerified: payload.email_verified === true,
        name: payload.name,
      },
      returnTo,
    };
  }
}
```

3. **Session issuing.** `AuthService` already exposes `issueSession(user, reply)` and wrappers such as `issueSessionAfterInviteAccept`. Add one more wrapper that applies the same gates as `login()`:

```ts
// auth.service.ts
async loginWithGoogle(identity: GoogleIdentity, reply: FastifyReply): Promise<AuthTokenResponse> {
  if (!identity.emailVerified) throw unauthorized('Google email is not verified.');

  // 1. Known Google identity -> its user. 2. Existing user by email -> link. 3. New student, if allowed.
  const user = await this.resolveUserForGoogle(identity);

  assertTenantLoginAllowed(user);
  if (user.deactivatedAt) throw unauthorized('This account has been deactivated.');
  assertEmailVerified(user);

  await this.auditPublisher.record({
    actorId: user.id,
    action: 'auth.login',
    resourceType: 'user',
    resourceId: user.id,
    reasonCode: 'google',
  });
  return this.issueSession(user, reply);
}
```

`resolveUserForGoogle` rules: (a) look up `AuthIdentity` by `provider='GOOGLE'` and `subject`; (b) otherwise look up a user by email. If found, create the `AuthIdentity` link **only if** that user's email is already verified (otherwise an attacker could pre-register someone's email and wait); (c) otherwise create a student only if self-registration is allowed for that email (`registration` rules already used by `POST /auth/register`). TPO, company and admin users are never created here. 4. **Controller:**

```ts
// google-auth.controller.ts
@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    @Inject(GoogleOauthService) private readonly google: GoogleOauthService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  @Public()
  @Get()
  async start(@Query('returnTo') returnTo: string | undefined, @Res() reply: FastifyReply) {
    if (!this.google.configured)
      return reply.redirect(`${env.AUTH_APP_URL}/login?error=google_not_configured`);
    const { url, state } = await this.google.createAuthorizationUrl(returnTo ?? null);
    // Bind the state to THIS browser so a forged callback is rejected (login CSRF).
    void (reply as CookieReply).setCookie('smart_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      maxAge: 600,
    });
    return reply.redirect(url);
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const bound = req.cookies?.['smart_oauth_state'];
    if (!code || !state || bound !== state) {
      return reply.redirect(`${env.AUTH_APP_URL}/login?error=oauth_failed`);
    }
    try {
      const { identity, returnTo } = await this.google.completeAuthorization(code, state);
      await this.auth.loginWithGoogle(identity, reply); // sets the refresh cookie
      const target = new URL(`${env.AUTH_APP_URL}/login/callback`);
      if (returnTo) target.searchParams.set('returnTo', returnTo);
      return reply.redirect(target.toString());
    } catch (error) {
      return reply.redirect(`${env.AUTH_APP_URL}/login?error=${mapOauthError(error)}`);
    }
  }
}
```

`mapOauthError` maps known exceptions to the codes the login form already understands (`account_held`, `institution_held`, `institution_deactivated`) and everything else to `oauth_failed`. Register the service and controller in `auth.module.ts`. Clear the `smart_oauth_state` cookie in the callback.

**Cookie caveat to test early:** the refresh cookie is `SameSite=Strict`. The callback response is a top-level navigation, which browsers allow to set it, and `web-auth` then calls `POST /auth/refresh` with `credentials: 'include'` from a same-site origin (`localhost` ports in dev, subdomains of one registrable domain in production). Verify this in a real browser in both dev and the QA domain before building more on it. 5. **Token hand-off.** The callback must not put an access token in a URL. Instead it redirects to a new `web-auth` page, `/login/callback`, which calls the existing refresh endpoint (the pattern `reconcileAccessTokenFromCookie` already uses), stores the session, and calls `redirectForRole` with the `returnTo` value.

### 4.6 Frontend: web-auth

1. Replace the `alert(...)` handler in `login-form.tsx`:

```tsx
onClick={() => {
  const returnTo = searchParams.get('returnTo');
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  window.location.href = url.toString();
}}
```

2. Add `apps/web-auth/src/app/login/callback/page.tsx`: on mount call `api.auth.refresh()`, then `storeSession(result.accessToken)` and `redirectForRole(result.user.role, result.accessToken, returnTo)`. On failure, go to `/login?error=oauth_failed`.
3. In `login-form.tsx`, read `?error=` and show the existing styled error message. Map `oauth_failed`, `google_not_configured`, `account_held`, `institution_held`.
4. Hide the Google button when the API reports Google is not configured (a small `GET /auth/providers` response, or a `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED` build flag passed through `Dockerfile.web` like any `NEXT_PUBLIC_` value).

### 4.7 Google Cloud setup

1. Google Cloud Console, create or choose a project, then **APIs and services, OAuth consent screen** (External, testing mode until launch).
2. **Credentials, Create OAuth client ID, Web application.**
3. Authorised redirect URIs, one per environment, **exactly** equal to `GOOGLE_OAUTH_REDIRECT_URI`:
   - local: `http://localhost:3000/api/v1/auth/google/callback`
   - dev, QA, prod: `https://<API_HOST>/api/v1/auth/google/callback`
4. Put the client id and secret in `.env.<env>` on each server.

### 4.8 Other providers, in order

| Provider                                    | Purpose                                                                | Plan                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| LinkedIn                                    | Verify identity and work history                                       | Already built as `LinkedinOauthService`. Wire it into the student onboarding UI end to end                                             |
| GitHub                                      | Prove coding work, import repositories                                 | A client exists. Confirm whether it is token-based; if so add an OAuth app with the same state/PKCE pattern, store the token encrypted |
| Microsoft Entra ID or institution OIDC/SAML | University single sign-on for TPOs (the login stub text promises this) | Needs a per-institution design. Same `AuthIdentity` table, provider `MICROSOFT` or `INSTITUTION:<id>`                                  |
| Google Calendar                             | Placement calendar sync                                                | Later, separate scopes and consent                                                                                                     |

After Google works, extract a small provider interface so each additional provider is configuration plus a mapper, not a new flow.

### 4.9 Security checklist for every OAuth flow

- `state`, `nonce` and PKCE are mandatory. Reject any mismatch.
- The state is bound to the browser with an HttpOnly cookie and is single-use.
- Redirect URIs are exact-match allow-listed. Validate `returnTo` against the portal allow-list (`returnToForRole` in `@hirekiwi/api-client`) so it cannot be an open redirect.
- No access tokens in URLs in production. The `?accessToken=` hand-off between ports is a development convenience only.
- Third-party tokens (LinkedIn, GitHub) are encrypted at rest and never logged. Add the field names to `REDACTED_PATHS`.
- Rate-limit both routes. Audit every success, link and refusal.

### 4.10 Tests and verification

Unit tests with a mocked Google client: success; wrong or reused `state`; missing cookie; expired or wrong-audience token; `email_verified` false; account held; deactivated; linking an existing verified user; refusing to link an unverified user; refusing to create a TPO, company or admin. Add the route-coverage and contracts tests. Manual: new Gmail creates a student; second sign-in reuses the identity; an invited TPO email links and does not create.

**Rollback:** unset the three variables. The button hides and the routes redirect with `google_not_configured`. The `AuthIdentity` table can stay.

---

## 5. Google Analytics (GA4)

### 5.1 Current state and decisions

No analytics exists. Decide first:

| Question     | Recommendation                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which apps   | `web-landing` always. `web-auth` and `web-student` only after consent. **Never** `web-admin`, `web-verify`, `web-tpo` or `web-company` (candidate and employer data) |
| Consent      | The student portal has a DPDP policy page, so analytics cookies need a consent banner. Until one exists, ship GA on the landing page only                            |
| Environments | A GA4 property per environment, or no id in dev and QA. Do not mix test traffic into production data                                                                 |

### 5.2 Steps

1. In Google Analytics, create a GA4 property and a web data stream per production domain. Copy the measurement id (`G-XXXXXXXXXX`).
2. **Build-time wiring** (required by our Docker setup, see section 1.2). In `infra/docker/Dockerfile.web` add `ARG NEXT_PUBLIC_GA_MEASUREMENT_ID` and `ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID`. In `docker-compose.yml`, under the **landing, auth and student** services' `build.args` only:

```yaml
NEXT_PUBLIC_GA_MEASUREMENT_ID: ${GA_ID_LANDING:-}
```

(use `GA_ID_AUTH` and `GA_ID_STUDENT` for the others if they have separate streams). Add the variables to the `.env*.example` files; leave them empty in dev and QA. 3. Install the official helper in those three apps:

```bash
pnpm --filter @hirekiwi/web-landing --filter @hirekiwi/web-auth --filter @hirekiwi/web-student add @next/third-parties
```

4. Add one shared component in `packages/ui` (for example `packages/ui/src/analytics/analytics.tsx`) so every portal behaves the same, and export it from the package index:

```tsx
'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'smart.analytics.consent';

export function Analytics({
  gaId,
  requireConsent = true,
}: {
  gaId?: string;
  requireConsent?: boolean;
}) {
  const [allowed, setAllowed] = useState(!requireConsent);

  useEffect(() => {
    if (!requireConsent) return;
    const read = () => {
      try {
        setAllowed(window.localStorage.getItem(CONSENT_KEY) === 'granted');
      } catch {
        setAllowed(false);
      }
    };
    read();
    window.addEventListener('smart:analytics-consent', read);
    return () => window.removeEventListener('smart:analytics-consent', read);
  }, [requireConsent]);

  if (!gaId || !allowed) return null;
  return <GoogleAnalytics gaId={gaId} />;
}

export function setAnalyticsConsent(granted: boolean): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    /* storage blocked: stay denied */
  }
  window.dispatchEvent(new Event('smart:analytics-consent'));
}
```

5. Mount it in each root layout:

```tsx
// apps/web-landing/src/app/layout.tsx  (public marketing site: no banner required to measure basic traffic)
<Analytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} requireConsent={false} />

// apps/web-student/src/app/layout.tsx and apps/web-auth/src/app/layout.tsx
<Analytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
<ConsentBanner />   // calls setAnalyticsConsent(true | false)
```

Confirm with legal whether the landing page also needs a banner under DPDP before launch; if yes, set `requireConsent` there too. 6. Build the `ConsentBanner` in `packages/ui`: two buttons (Accept, Decline), a link to `/dpdp-policy`, shown until the choice is stored, with a way to change the choice from the footer. 7. Track funnel events with `sendGAEvent` from `@next/third-parties/google`. Suggested names: `signup_started`, `signup_completed`, `skill_assessment_started`, `skill_assessment_completed`, `job_applied`. **Never** put emails, names, user ids or free text in event parameters. 8. Update the privacy policy page (`apps/web-auth/src/app/privacy`) to state that Google Analytics is used, what is collected, and how to opt out. 9. If a Content-Security-Policy is added to the web apps later, allow `www.googletagmanager.com` and `www.google-analytics.com`. None exists today (the API disables helmet's CSP, and the web apps send none).

### 5.3 Tests and verification

- Unit tests: `Analytics` renders nothing with no id; renders nothing when consent is `denied` or unset; renders after `setAnalyticsConsent(true)`.
- Manual: with consent denied, the browser network tab shows no request to `googletagmanager.com`. After accepting, GA Realtime shows the visit and the event.

**Rollback:** empty the GA variables and rebuild; the component then renders nothing.

---

## 6. Prometheus

> **Already built.** `packages/observability/src/metrics.ts` defines the `prom-client` registry (default metrics prefixed `smart_`). The API serves them at `/api/v1/admin/metrics`, protected by the `x-metrics-token` header (`METRICS_SCRAPE_TOKEN` is required in production). `infra/observability/prometheus.yml` scrapes: `smart-api`, `cadvisor`, `node`, `postgres`, `redis`, `redpanda`, `minio`. Dashboards: API metrics, API logs, Postgres, host and containers, MinIO, platform overview, k6. Prometheus runs in the Compose `obs` profile.

So the work is extending it.

### 6.1 Business and domain metrics

Declare metrics **only** in `packages/observability/src/metrics.ts` (never inside a request handler, because Prometheus rejects a re-registered name). Follow the existing style:

```ts
export const assessmentAttemptsTotal = new Counter({
  name: 'smart_assessment_attempts_total',
  help: 'Skill assessment attempts by outcome.',
  labelNames: ['outcome'] as const, // started | completed | abandoned | flagged
  registers: [registry],
});

export const authLoginsTotal = new Counter({
  name: 'smart_auth_logins_total',
  help: 'Sign-ins by method and result.',
  labelNames: ['method', 'result'] as const, // password|google  x  success|failure
  registers: [registry],
});

export const signalIngestionTotal = new Counter({
  name: 'smart_signal_ingestion_total',
  help: 'External signal fetches by source and result.',
  labelNames: ['source', 'result'] as const, // leetcode|hackerrank|github x ok|error
  registers: [registry],
});
```

Increment them from the services (assessment, auth, signal-ingestion) and add a Grafana panel in the same PR, as the file header requires. Keep label values bounded: use enums and route templates, never user ids or raw paths.

### 6.2 SLO rules from our latency budgets

`LATENCY_BUDGET_MS` in contracts defines the budgets (candidate-critical 200 ms, interactive 500 ms, reporting 1000 ms). Add `infra/observability/slo.rules.yml` and reference it from `prometheus.yml`:

```yaml
# prometheus.yml
rule_files:
  - /etc/prometheus/slo.rules.yml
```

```yaml
# infra/observability/slo.rules.yml
groups:
  - name: smart-slo
    interval: 30s
    rules:
      - record: smart:http_requests_under_200ms:ratio_rate5m
        expr: |
          sum(rate(smart_http_request_duration_seconds_bucket{le="0.2"}[5m]))
          / sum(rate(smart_http_request_duration_seconds_count[5m]))
      - record: smart:http_requests_under_500ms:ratio_rate5m
        expr: |
          sum(rate(smart_http_request_duration_seconds_bucket{le="0.5"}[5m]))
          / sum(rate(smart_http_request_duration_seconds_count[5m]))
      - record: smart:http_5xx:ratio_rate5m
        expr: |
          sum(rate(smart_http_requests_total{status_code=~"5.."}[5m]))
          / sum(rate(smart_http_requests_total[5m]))
```

Mount the file into the `prometheus` service in compose. Then add Grafana alert rules that fire when the 5-minute ratio stays below target (see 7.4). Today's alert is only a flat "p95 above 1.5 s".

### 6.3 Portals and other targets

The portals expose only `/health`. Container metrics from cAdvisor are enough to start. Add a per-app `prom-client` endpoint only if you need server-render timings. For `credential-verifier`, add a `/metrics` route and a scrape job. If production moves to Kubernetes (`infra/helm`, `infra/k8s`), use a `ServiceMonitor` instead of the static config.

### 6.4 Tests and verification

- Open the Prometheus targets page and confirm every job is `UP`.
- Query each new metric after exercising the feature.
- Add a test beside the existing registry tests that asserts each new metric name is registered once.
- Check cardinality: `count({__name__=~"smart_.*"})` should stay stable under load.

**Rollback:** remove the `rule_files` entry; metrics are additive.

---

## 7. System, database and code health monitoring

> **Already built.**
>
> - **System:** `GET /health` (liveness) and `GET /ready` (Postgres and Redis, with latency) in `apps/api-core/src/platform/health/health.controller.ts`; an `app/health` route in each portal; an integration-health controller for external providers.
> - **Alerts:** 22 Grafana alert rules in `infra/observability/grafana/provisioning/alerting/`.
>   - Platform (13): scrape down, 5xx ratio above 2%, Postgres down, Redis down, no backup in 26 hours, p95 latency above 1.5 s, disk above 85%, Kafka lag, scoring paused, AI queue stalled, dead-letter growth and others.
>   - Integrations (1): third-party integration down.
>   - Security (8): refresh-token reuse, burst of failed logins, several accounts locked out, infected upload, upload scanner failing, spike in refused requests, support access granted, staff role changed.
>   - Contact points: email and a webhook.
> - **Database:** `postgres-exporter` scraped, dashboard exists; backup and restore in `infra/backup`.

### 7.1 System health gaps

1. **Widen `/ready`.** It checks only Postgres and Redis. Add Redpanda, object storage (MinIO or R2) and the BullMQ queue connection in `health.controller.ts`. Use the injected service for each (for example the storage service's existing lightweight head-bucket call, and the Kafka admin client's connect). Mark non-critical dependencies as `degraded` instead of `error`, so a storage blip does not remove the API from the load balancer:

```ts
// in readiness(): critical = postgres, redis. Non-critical = redpanda, storage, queue.
const critical = ['postgres', 'redis'];
const down = Object.entries(checks).filter(([, c]) => c.status === 'down');
const criticalDown = down.some(([name]) => critical.includes(name));
const status = criticalDown ? 'error' : down.length > 0 ? 'degraded' : 'ok';
if (criticalDown) throw new ServiceUnavailableException(body);
```

2. **External uptime checks.** Probes inside the Docker network cannot see DNS, TLS or edge failures. Run **Uptime Kuma** (open source) in the `obs` profile and put it behind a new Caddy host. Note that host port 3001 is the student portal, so map Uptime Kuma to another port:

```yaml
uptime-kuma:
  image: louislam/uptime-kuma:1
  restart: unless-stopped
  volumes:
    - uptime_kuma_data:/app/data
  ports:
    - '127.0.0.1:${UPTIME_PORT:-3090}:3001'
  profiles: ['obs']
```

```caddyfile
{$STATUS_HOST} {
	basic_auth {
		{$DB_BASIC_AUTH_USER} {$DB_BASIC_AUTH_HASH}
	}
	reverse_proxy uptime-kuma:3001
}
```

Add monitors for each public host (API `/ready`, all portals' `/health`) and TLS certificate expiry (alert at 14 days). Send notifications to the same channel as the Grafana webhook. 3. **Notification route.** Confirm the Grafana webhook contact point (`smart-team-webhook`) goes to a monitored channel (for example Slack) and name an on-call owner in the runbook.

### 7.2 Database health gaps

Add Grafana alert rules on `postgres-exporter` metrics (copy an existing rule in `hirekiwi-alerts.yml`, then change `uid`, `title`, the query and the threshold):

| Alert                 | Query idea                                                    |
| --------------------- | ------------------------------------------------------------- |
| Connections above 80% | `pg_stat_activity_count` over `pg_settings_max_connections`   |
| Long transactions     | maximum of `pg_stat_activity_max_tx_duration` above 5 minutes |
| Deadlocks             | `rate(pg_stat_database_deadlocks[5m])` above 0                |
| Cache hit ratio       | `pg_stat_database_blks_hit` over hit plus read, below 0.95    |
| Replication lag       | only if a replica exists                                      |
| Disk growth           | extend the existing disk alert to the Postgres volume         |

Also enable the `pg_stat_statements` extension (a migration request for Vishal V) and chart the slowest queries. The "no backup in 26 hours" alert already exists. Add a **monthly restore drill**: run `infra/backup/restore.sh` into a scratch database, run a row-count check, and record the date and result in the runbook, so the recovery numbers are tested.

### 7.3 Code health

Today only lint, typecheck and tests measure code health.

1. **Coverage with a floor.** Add `@vitest/coverage-v8` per package, run `vitest run --coverage` in CI, and set a per-package threshold equal to the current value, so it can only rise. Start with `api-core`, `contracts`, `scoring-engine`.
2. **Dead code and unused dependencies:** `knip`. A starter `knip.json` at the root with one workspace entry per app and package. Run it in CI as a non-blocking report first.
3. **Boundaries:** `dependency-cruiser` to enforce the rules in `ARCHITECTURE.md`. Example rule: only `ai-gateway` may import an LLM SDK; web apps may not import from `apps/api-core`; `contracts` may not import from apps.
4. **Dependency freshness:** Renovate (section 2).
5. **Quality dashboard (optional):** SonarQube Community Edition, self-hosted, results decorated on PRs. Keep `TECH_DEBT.mdx` as the human-curated list and link findings from it.
6. **Flaky and slow tests:** record per-test duration in CI and list the slowest 20 weekly. The 20,000-student readiness test already failed once on a loaded runner and was changed to best-of-three. Quarantine flaky tests visibly instead of re-running silently.

### 7.4 Alert ownership

Keep a single table in the runbook: alert name, severity, who is paged, first action. Sentry owns code errors, Grafana owns infrastructure and security events, Uptime Kuma owns "is it reachable". Do not let two tools page for the same event.

### 7.5 Tests and verification

- Stop Redis in dev: `/ready` returns 503 while `/health` stays 200. Stop MinIO: `/ready` returns `degraded` with 200.
- Fail an Uptime Kuma monitor on purpose and confirm the notification arrives.
- Fire each new alert rule once in a test environment (lower the threshold temporarily).
- Run the restore drill and record the result.

**Rollback:** each item is independent; revert the single change.

---

## 8. Rollout plan, tickets and open questions

### 8.1 Suggested order

| Phase | Items                                                 | Why                                |
| ----- | ----------------------------------------------------- | ---------------------------------- |
| 1     | Security workflow and Renovate (section 2)            | Cheap, no product risk             |
| 2     | Sentry ADR, then api-core, then portals (section 3)   | Needed before more features go out |
| 3     | Google sign-in (section 4)                            | Highest user value                 |
| 4     | Health gaps and Prometheus extensions (sections 6, 7) | Small tickets, run alongside       |
| 5     | Google Analytics with consent (section 5)             | Needs a legal decision first       |

### 8.2 Ticket breakdown

| #   | Ticket                                                                            | Area            | Size |
| --- | --------------------------------------------------------------------------------- | --------------- | ---- |
| 1   | Security workflow: gitleaks, Trivy, Semgrep; Renovate config; PR checklist        | CI              | S    |
| 2   | ADR: Sentry adoption and data handling                                            | Architecture    | S    |
| 3   | Sentry in api-core (instrument, filter, env, compose)                             | Backend         | M    |
| 4   | Sentry in portals via `@hirekiwi/next-config`, Dockerfile args, source-map secret | Frontend, infra | M    |
| 5   | Sentry in proctoring-cv                                                           | Backend         | S    |
| 6   | Contracts: Google OAuth routes and `auth.oauth` tier                              | Contracts       | S    |
| 7   | Prisma: `AuthIdentity` table                                                      | Vishal V        | S    |
| 8   | api-core: Google OAuth service, controller, `loginWithGoogle`, audit              | Backend         | L    |
| 9   | web-auth: Google button, `/login/callback` page, error states                     | Frontend        | S    |
| 10  | GA4 shared component, landing page first                                          | Frontend        | S    |
| 11  | Consent banner, GA in student and auth portals, privacy page update               | Frontend        | M    |
| 12  | `/ready` widening and degraded state                                              | Backend         | M    |
| 13  | Uptime Kuma, Caddy host, TLS expiry monitors                                      | Infra           | M    |
| 14  | Postgres alert rules and monthly restore drill                                    | Infra           | M    |
| 15  | Business metrics and SLO recording rules                                          | Backend         | M    |
| 16  | Coverage floor, knip, dependency-cruiser in CI                                    | CI              | M    |

### 8.3 Definition of done for each ticket

- Code and tests merged to `dev`, CI green.
- New environment variables added to `env.ts` (if API), `x-app-env` or `build.args`, and all four `.env*.example` files.
- Server `.env.<env>` updated on dev, QA and prod before the deploy that needs it.
- A one-paragraph runbook note: how to turn it off, who owns it.

### 8.4 Open questions for the team

1. Sentry SaaS or self-hosted, and where must error data be stored?
2. Is a consent banner acceptable in the student portal, and who writes the DPDP wording?
3. Do TPOs sign in through Google, or through their university's own provider?
4. Is the repository public or private? This decides CodeQL versus Semgrep.
5. Is an LLM-based PR reviewer allowed to see source code?
6. Who is the named on-call owner for Grafana, Sentry and Uptime Kuma alerts?

### 8.5 Known risks

| Risk                                        | Mitigation                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_` value missing in the browser | It must be an `ARG` and `ENV` in `Dockerfile.web` and a `build.args` entry. Check the built bundle |
| Refresh cookie is `SameSite=Strict`         | Test the Google callback in a real browser on the QA domain before merging                         |
| Source-map upload token leaking             | Use a BuildKit secret, never an `ARG`                                                              |
| Sentry and OpenTelemetry conflict           | Errors only; leave `OTEL_EXPORTER_OTLP_ENDPOINT` unset until reviewed                              |
| Alert fatigue                               | One tool owns each class of alert; report-only period before required checks                       |
| Scanners block unrelated PRs                | One-week report-only phase, then fix or suppress with an owner                                     |
