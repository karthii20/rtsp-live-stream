# syntax=docker/dockerfile:1

# --- deps ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- build ---
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gateway is co-located in the same container; bake the rewrite target.
ENV HEVC_GATEWAY_URL=http://127.0.0.1:3002
ENV HEVC_GATEWAY_PORT=3002
RUN pnpm run build && pnpm prune --prod

# --- runtime ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV HEVC_GATEWAY_PORT=3002
ENV HEVC_GATEWAY_URL=http://127.0.0.1:3002
ENV GATEWAY_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
ENV ALLOW_LOOPBACK_ORIGINS=true

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/next.config.ts ./

EXPOSE 3000

CMD ["node", "./scripts/dev.mjs", "start"]
