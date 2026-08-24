# syntax=docker/dockerfile:1

# ---------------------------------------------------------
# Base stage: Official lightweight Bun runtime (Debian slim)
# ---------------------------------------------------------
FROM oven/bun:1.4-slim AS base
WORKDIR /app

# ---------------------------------------------------------
# Stage 1: Prune monorepo strictly for server & dependencies
# ---------------------------------------------------------
FROM base AS pruner
RUN bun add --global turbo@^2
COPY . .
RUN turbo prune server --docker

# ---------------------------------------------------------
# Stage 2: Install dependencies (leveraging BuildKit cache)
# ---------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ---------------------------------------------------------
# Stage 3: Build application bundle
# ---------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN cd apps/server && bun run build

# ---------------------------------------------------------
# Stage 4: Install strictly production dependencies
# ---------------------------------------------------------
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install --production --frozen-lockfile

# ---------------------------------------------------------
# Stage 5: Production runner (minimal footprint & non-root)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules and built dist
COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/apps/server/dist ./apps/server/dist
COPY --from=pruner --chown=bun:bun /app/out/json/apps/server/package.json ./apps/server/package.json

# Security: run as non-root user
USER bun
EXPOSE 3000

WORKDIR /app/apps/server

# Native Bun healthcheck (respects dynamic Railway $PORT)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "dist/index.mjs"]
