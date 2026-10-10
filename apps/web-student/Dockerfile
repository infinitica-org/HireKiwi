# syntax=docker/dockerfile:1

# Build from the monorepo root:
#   docker build -f apps/web-student/Dockerfile -t hirekiwi-web-student .

FROM node:22.20.0-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------
# Dependencies
# ---------------------------------------------------------
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------
# Build
# ---------------------------------------------------------
FROM deps AS build

COPY scripts ./scripts
COPY packages ./packages
COPY apps ./apps

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:3005
ARG NEXT_PUBLIC_STUDENT_URL=http://localhost:3001
ARG NEXT_PUBLIC_TPO_URL=http://localhost:3002
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3003
ARG NEXT_PUBLIC_COMPANY_URL=http://localhost:3006

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_STUDENT_URL=$NEXT_PUBLIC_STUDENT_URL
ENV NEXT_PUBLIC_TPO_URL=$NEXT_PUBLIC_TPO_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_COMPANY_URL=$NEXT_PUBLIC_COMPANY_URL

RUN pnpm --filter @hirekiwi/web-student... build
RUN mkdir -p apps/web-student/public

# ---------------------------------------------------------
# Runtime
# ---------------------------------------------------------
FROM node:22.20.0-bookworm-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN useradd --system --uid 10001 hirekiwi

COPY --from=build --chown=hirekiwi:hirekiwi \
    /app/apps/web-student/.next/standalone ./

COPY --from=build --chown=hirekiwi:hirekiwi \
    /app/apps/web-student/.next/static \
    ./apps/web-student/.next/static

COPY --from=build --chown=hirekiwi:hirekiwi \
    /app/apps/web-student/public \
    ./apps/web-student/public

USER hirekiwi

EXPOSE 3000

CMD ["node", "apps/web-student/server.js"]
