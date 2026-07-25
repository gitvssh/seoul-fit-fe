# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public browser configuration is embedded by Next.js at build time. BuildKit
# secrets keep its source values out of shell arguments and image layers; the
# resulting public values remain available only where the browser requires them.
RUN --mount=type=secret,id=next_public_app_url,required=false \
    --mount=type=secret,id=next_public_backend_url,required=false \
    --mount=type=secret,id=next_public_kakao_client_id,required=false \
    --mount=type=secret,id=next_public_kakao_map_api_key,required=false \
    --mount=type=secret,id=next_public_kakao_redirect_uri,required=false \
    --mount=type=secret,id=next_public_ga_measurement_id,required=false \
    set -eu; \
    read_secret() { if [ -f "$1" ]; then tr -d '\\r\\n' < "$1"; fi; }; \
    export NEXT_PUBLIC_APP_URL="$(read_secret /run/secrets/next_public_app_url)"; \
    export NEXT_PUBLIC_BACKEND_URL="$(read_secret /run/secrets/next_public_backend_url)"; \
    export NEXT_PUBLIC_KAKAO_CLIENT_ID="$(read_secret /run/secrets/next_public_kakao_client_id)"; \
    export NEXT_PUBLIC_KAKAO_MAP_API_KEY="$(read_secret /run/secrets/next_public_kakao_map_api_key)"; \
    export NEXT_PUBLIC_KAKAO_REDIRECT_URI="$(read_secret /run/secrets/next_public_kakao_redirect_uri)"; \
    export NEXT_PUBLIC_GA_MEASUREMENT_ID="$(read_secret /run/secrets/next_public_ga_measurement_id)"; \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Supply BACKEND_INTERNAL_URL and SEOUL_API_KEY when starting the container.
CMD ["node", "server.js"]
