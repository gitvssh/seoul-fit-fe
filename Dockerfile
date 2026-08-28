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
RUN --mount=type=secret,id=next_public_app_url,required=true \
    --mount=type=secret,id=next_public_backend_url,required=true \
    --mount=type=secret,id=next_public_kakao_client_id,required=true \
    --mount=type=secret,id=next_public_kakao_map_api_key,required=true \
    --mount=type=secret,id=next_public_kakao_redirect_uri,required=true \
    --mount=type=secret,id=next_public_ga_measurement_id,required=true \
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
COPY --chown=root:root docker-entrypoint.sh /usr/local/bin/seoul-fit-entrypoint
COPY --chown=root:root infra/runtime/observability-launcher.mjs /usr/local/bin/seoul-fit-observability-launcher.mjs
RUN chmod 0555 /usr/local/bin/seoul-fit-entrypoint \
    /usr/local/bin/seoul-fit-observability-launcher.mjs

USER nextjs
EXPOSE 3000

# Supply BACKEND_INTERNAL_URL and SEOUL_API_KEY when starting the container.
ENTRYPOINT ["/usr/local/bin/seoul-fit-entrypoint"]
CMD ["node", "server.js"]


# Execute the exact published entrypoint and Next standalone server. Both
# streams share one descriptor so framework stderr can never precede the
# platform's first-record receipt unnoticed.
FROM runner AS runtime-contract

RUN set -eu; \
    contract_log=/tmp/seoul-fit-runtime-contract.log; \
    runtime_pid=; \
    export KUBERNETES_SERVICE_HOST=10.43.0.1; \
    export OTEL_SERVICE_NAME=seoul-fit-frontend; \
    export OTEL_SERVICE_NAMESPACE=seoul-fit; \
    export OTEL_SERVICE_VERSION=sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef; \
    export OTEL_SERVICE_INSTANCE_ID=00000000-0000-0000-0000-000000000001; \
    export DEPLOYMENT_ENVIRONMENT_NAME=dev; \
    export K8S_WORKLOAD_NAME=seoul-fit-fe; \
    export SEOUL_API_KEY=runtime-contract-not-a-secret; \
    /usr/local/bin/seoul-fit-entrypoint node server.js >"${contract_log}" 2>&1 & \
    runtime_pid=$!; \
    cleanup() { \
      if [ -n "${runtime_pid:-}" ]; then \
        kill "${runtime_pid}" 2>/dev/null || true; \
        wait "${runtime_pid}" 2>/dev/null || true; \
      fi; \
      rm -f "${contract_log}"; \
    }; \
    trap cleanup EXIT; \
    attempt=0; \
    until wget -q -O /dev/null http://127.0.0.1:3000/; do \
      kill -0 "${runtime_pid}" 2>/dev/null \
        || { echo 'seoul-fit runtime contract exited before server startup' >&2; exit 1; }; \
      attempt=$((attempt + 1)); \
      test "${attempt}" -lt 100 \
        || { echo 'seoul-fit runtime contract did not become ready' >&2; exit 1; }; \
      sleep 0.1; \
    done; \
    attempt=0; \
    until grep -q '"event_name":"http.server.request"' "${contract_log}"; do \
      kill -0 "${runtime_pid}" 2>/dev/null \
        || { echo 'seoul-fit runtime contract exited before access logging' >&2; exit 1; }; \
      attempt=$((attempt + 1)); \
      test "${attempt}" -lt 100 \
        || { echo 'seoul-fit runtime contract did not emit an access record' >&2; exit 1; }; \
      sleep 0.1; \
    done; \
    kill "${runtime_pid}"; \
    set +e; \
    wait "${runtime_pid}"; \
    runtime_status=$?; \
    set -e; \
    runtime_pid=; \
    test "${runtime_status}" -eq 143 \
      || { echo "seoul-fit runtime contract did not forward SIGTERM: ${runtime_status}" >&2; exit 1; }; \
    node --input-type=module -e 'import fs from "node:fs"; import { isSafeNormalizedOutputLine } from "file:///usr/local/bin/seoul-fit-observability-launcher.mjs"; const lines=fs.readFileSync(process.argv[1],"utf8").split(/\r?\n/).filter(Boolean); const marker="homelab-runtime-start-v1"; if(lines[0]!==marker||lines.filter(line=>line===marker).length!==1)process.exit(1); const identity={deployment_environment_name:process.env.DEPLOYMENT_ENVIRONMENT_NAME,service_instance_id:process.env.OTEL_SERVICE_INSTANCE_ID,service_name:process.env.OTEL_SERVICE_NAME,service_namespace:process.env.OTEL_SERVICE_NAMESPACE,service_version:process.env.OTEL_SERVICE_VERSION,workload_name:process.env.K8S_WORKLOAD_NAME}; const normalized=lines.slice(1); if(!normalized.length||!normalized.every(line=>isSafeNormalizedOutputLine(line,identity)))process.exit(1); const documents=normalized.map(JSON.parse); if(!documents.some(document=>document.event_name==="http.server.request")||!documents.some(document=>document.event_name==="runtime.unstructured.output"))process.exit(1)' "${contract_log}"; \
    rm -f "${contract_log}"; \
    trap - EXIT


FROM runtime-contract AS release
