#!/usr/bin/env python3
"""Validate frontend access-log and deployment identity without YAML dependencies."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ACCESS_LOG_SOURCE = REPO_ROOT / "src/shared/lib/observability/http-access-log.ts"
INSTRUMENTATION_SOURCE = REPO_ROOT / "instrumentation.ts"
RUNTIME_ENTRYPOINT = REPO_ROOT / "docker-entrypoint.sh"
RUNTIME_LAUNCHER = REPO_ROOT / "infra/runtime/observability-launcher.mjs"
RUNTIME_LAUNCHER_TEST = REPO_ROOT / "infra/runtime/observability-launcher.node-test.mjs"
DOCKERFILE = REPO_ROOT / "Dockerfile"
BASE_DEPLOYMENT = REPO_ROOT / "infra/k8s/seoul-fit-fe/base/deployment.yaml"
OVERLAY_ROOT = REPO_ROOT / "infra/k8s/seoul-fit-fe/overlays"
LOG_SCHEMA = "http_access_json_v1"
SERVICE_NAME = "seoul-fit-frontend"
SERVICE_NAMESPACE = "seoul-fit"
INVALID_IDENTITY = {
    "",
    "development",
    "local",
    "none",
    "null",
    "placeholder",
    "test",
    "unknown",
    "unset",
}


class ContractError(RuntimeError):
    """Raised when desired state could publish ambiguous telemetry."""


def require(pattern: str, text: str, description: str) -> str:
    match = re.search(pattern, text, flags=re.MULTILINE)
    if not match:
        raise ContractError(f"missing {description}")
    return match.group(1)


def validate_access_log_source() -> None:
    source = ACCESS_LOG_SOURCE.read_text(encoding="utf-8")
    required_fragments = (
        f"const LOG_SCHEMA = '{LOG_SCHEMA}'",
        "log_schema: LOG_SCHEMA",
        "log_category: 'access'",
        "event_name: 'http.server.request'",
        "event_action: 'serve'",
        "event_outcome:",
        "http_method:",
        "http_route:",
        "http_status_code:",
        "duration_ms:",
    )
    missing = [fragment for fragment in required_fragments if fragment not in source]
    if missing:
        raise ContractError(f"access logger is missing contract fields: {', '.join(missing)}")


def validate_runtime_start_source() -> None:
    instrumentation = INSTRUMENTATION_SOURCE.read_text(encoding="utf-8")
    entrypoint = RUNTIME_ENTRYPOINT.read_text(encoding="utf-8")
    launcher = RUNTIME_LAUNCHER.read_text(encoding="utf-8")
    launcher_test = RUNTIME_LAUNCHER_TEST.read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    required_entrypoint = (
        "test \"${OTEL_SERVICE_NAME:-}\" = seoul-fit-frontend",
        "test \"${OTEL_SERVICE_NAMESPACE:-}\" = seoul-fit",
        "test \"${K8S_WORKLOAD_NAME:-}\" = seoul-fit-fe",
        "printf '%s\\n' 'homelab-runtime-start-v1'",
        "exec node /usr/local/bin/seoul-fit-observability-launcher.mjs",
    )
    missing = [fragment for fragment in required_entrypoint if fragment not in entrypoint]
    if missing:
        raise ContractError(f"runtime entrypoint contract is missing: {', '.join(missing)}")
    if entrypoint.count("homelab-runtime-start-v1") != 1:
        raise ContractError("runtime entrypoint must emit exactly one startup marker")
    if "service.runtime.start" in instrumentation:
        raise ContractError("late instrumentation cannot claim the first-record startup anchor")
    if "console.log" in instrumentation or "console.error" in instrumentation:
        raise ContractError("instrumentation must not bypass the structured lifecycle logger")
    required_launcher = (
        "Unstructured runtime output suppressed",
        "isSafeStructuredLine",
        "isSafeNormalizedOutputLine",
        "normalizeStructuredLine",
        "isRfc3339Timestamp",
        "ACCESS_KEYS",
        "APPLICATION_REQUIRED_KEYS",
        "MAX_SUPPRESSED_LINES_PER_WINDOW",
        "SUPPRESSION_WINDOW_MS",
        "stdio: ['inherit', 'pipe', 'pipe']",
        "input.pause()",
        "output.once('drain', handleDrain)",
        "input.resume()",
    )
    missing = [fragment for fragment in required_launcher if fragment not in launcher]
    if missing:
        raise ContractError(f"runtime JSON normalizer is missing: {', '.join(missing)}")
    required_launcher_tests = (
        "accepts the standard WARN severity",
        "rejects category-inapplicable fields",
        "enforces exact per-category types and numeric bounds",
        "canonicalizes accepted JSON",
        "requires a real bounded RFC3339 timestamp",
        "pauses every child stream on stdout backpressure",
        "coalesces invalid lines into one capped, content-free event per window",
    )
    missing = [fragment for fragment in required_launcher_tests if fragment not in launcher_test]
    if missing:
        raise ContractError(f"runtime launcher regressions are missing: {', '.join(missing)}")
    required_dockerfile = (
        "COPY --chown=root:root docker-entrypoint.sh",
        "COPY --chown=root:root infra/runtime/observability-launcher.mjs",
        'ENTRYPOINT ["/usr/local/bin/seoul-fit-entrypoint"]',
        "FROM runner AS runtime-contract",
        '>"${contract_log}" 2>&1',
        "isSafeNormalizedOutputLine",
        'document.event_name==="http.server.request"',
        'document.event_name==="runtime.unstructured.output"',
        'test "${runtime_status}" -eq 143',
        "FROM runtime-contract AS release",
    )
    missing = [fragment for fragment in required_dockerfile if fragment not in dockerfile]
    if missing:
        raise ContractError(f"runtime image contract is missing: {', '.join(missing)}")


def validate_base() -> None:
    source = BASE_DEPLOYMENT.read_text(encoding="utf-8")
    required_fragments = (
        f"observability.damecasol.com/log-schema: {LOG_SCHEMA}",
        "name: OTEL_SERVICE_NAME",
        f"value: {SERVICE_NAME}",
        "name: OTEL_SERVICE_NAMESPACE",
        f"value: {SERVICE_NAMESPACE}",
        "name: OTEL_SERVICE_VERSION",
        "metadata.annotations['observability.damecasol.com/service-version']",
        "name: OTEL_SERVICE_INSTANCE_ID",
        "fieldPath: metadata.uid",
        "name: DEPLOYMENT_ENVIRONMENT_NAME",
        "metadata.labels['app.kubernetes.io/environment']",
        "name: K8S_WORKLOAD_NAME",
        "value: seoul-fit-fe",
    )
    missing = [fragment for fragment in required_fragments if fragment not in source]
    if missing:
        raise ContractError(f"base deployment is missing identity wiring: {', '.join(missing)}")


def validate_overlay(environment: str) -> None:
    overlay_dir = OVERLAY_ROOT / environment
    source = (overlay_dir / "kustomization.yaml").read_text(encoding="utf-8")

    image_digest = require(r"^\s*digest:\s*(sha256:[0-9a-f]{64})\s*$", source, "image digest")
    service_version = require(
        r"path:\s*/spec/template/metadata/annotations/observability\.damecasol\.com~1service-version"
        r"\s*\n\s*value:\s*([^\s]+)",
        source,
        "service.version annotation patch",
    )
    deployment_environment = require(
        r"path:\s*/spec/template/metadata/labels/app\.kubernetes\.io~1environment"
        r"\s*\n\s*value:\s*([^\s]+)",
        source,
        "deployment environment label patch",
    )

    if service_version.lower() in INVALID_IDENTITY or service_version.lower().startswith(
        "unknown_service:"
    ):
        raise ContractError(f"{environment}: invalid service.version {service_version!r}")
    if service_version != image_digest:
        raise ContractError(
            f"{environment}: service.version must equal the pinned image digest "
            f"({service_version!r} != {image_digest!r})"
        )
    if deployment_environment != environment:
        raise ContractError(
            f"{environment}: deployment environment label is {deployment_environment!r}"
        )

    kubectl = shutil.which("kubectl")
    if kubectl is None:
        raise ContractError("kubectl is required to validate rendered overlays")
    rendered = subprocess.run(
        [kubectl, "kustomize", str(overlay_dir)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    if "PLACEHOLDER" in rendered:
        raise ContractError(f"{environment}: rendered desired state still contains PLACEHOLDER")

    required_rendered = (
        f"image: registry.damecasol.com/seoul-fit/frontend@{image_digest}",
        f"observability.damecasol.com/log-schema: {LOG_SCHEMA}",
        f"observability.damecasol.com/service-version: {image_digest}",
        f"app.kubernetes.io/environment: {environment}",
        "name: OTEL_SERVICE_NAME\n          value: seoul-fit-frontend",
        "name: OTEL_SERVICE_NAMESPACE\n          value: seoul-fit",
        "name: OTEL_SERVICE_VERSION",
        "fieldPath: metadata.annotations['observability.damecasol.com/service-version']",
        "name: OTEL_SERVICE_INSTANCE_ID",
        "fieldPath: metadata.uid",
        "name: DEPLOYMENT_ENVIRONMENT_NAME",
        "fieldPath: metadata.labels['app.kubernetes.io/environment']",
        "name: BACKEND_INTERNAL_URL",
    )
    missing = [fragment for fragment in required_rendered if fragment not in rendered]
    if missing:
        raise ContractError(
            f"{environment}: rendered desired state is missing {', '.join(repr(item) for item in missing)}"
        )


def main() -> int:
    try:
        validate_access_log_source()
        validate_runtime_start_source()
        validate_base()
        for environment in ("dev", "prod"):
            validate_overlay(environment)
    except (ContractError, OSError, subprocess.CalledProcessError) as error:
        print(f"observability contract invalid: {error}", file=sys.stderr)
        return 1
    print("observability contract valid: dev/prod release, pod identity, and access schema are exact")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
