#!/bin/sh
set -eu

fail() {
  printf '%s\n' 'seoul-fit-frontend: invalid observability identity; server was not started' >&2
  exit 1
}

require_identity() {
  value=$1
  test -n "${value}" || fail
  test "${#value}" -le 128 || fail
  printf '%s\n' "${value}" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._:-]*$' || fail
  normalized=$(printf '%s' "${value}" | tr '[:upper:]' '[:lower:]')
  case "${normalized}" in
    development|local|none|null|placeholder|test|unknown|unset|unknown_service:*) fail ;;
  esac
}

test "${OTEL_SERVICE_NAME:-}" = seoul-fit-frontend || fail
test "${OTEL_SERVICE_NAMESPACE:-}" = seoul-fit || fail
test "${K8S_WORKLOAD_NAME:-}" = seoul-fit-fe || fail
case "${DEPLOYMENT_ENVIRONMENT_NAME:-}" in
  dev|prod) ;;
  *) fail ;;
esac
require_identity "${OTEL_SERVICE_VERSION:-}"
require_identity "${OTEL_SERVICE_INSTANCE_ID:-}"

printf '%s\n' 'homelab-runtime-start-v1'
exec node /usr/local/bin/seoul-fit-observability-launcher.mjs "$@"
