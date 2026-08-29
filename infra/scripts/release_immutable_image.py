#!/usr/bin/env python3
"""Build, publish, verify, and pin one immutable Seoul Fit frontend image.

The command is local-only. Harbor credentials and browser-public build inputs
come from separate documents exposed through the project-scoped release-agent
Vault Proxy socket. Build inputs reach BuildKit through anonymous memory file
descriptors, never argv, stdout, an image layer, or a persistent Docker
configuration.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import http.client
import json
import os
import re
import shutil
import socket
import stat
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Mapping, Sequence
from urllib.parse import urlencode, urlsplit


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BRANCH = "master"
REGISTRY = "registry.damecasol.com"
IMAGE_REPOSITORY = f"{REGISTRY}/seoul-fit/frontend"
REGISTRY_REPOSITORY = "seoul-fit/frontend"
PLATFORM = "linux/amd64"
HARBOR_SOCKET = Path("/run/vault-proxy/seoul-fit-release-agent.sock")
HARBOR_DOCUMENT = "/v1/kv/data/projects/seoul-fit/harbor-ci"
BUILD_DOCUMENTS = {
    "dev": "/v1/kv/data/projects/seoul-fit/frontend-build-dev",
    "prod": "/v1/kv/data/projects/seoul-fit/frontend-build-prod",
}
OVERLAY_ROOT = REPO_ROOT / "infra/k8s/seoul-fit-fe/overlays"
RECEIPT_ROOT = REPO_ROOT / "infra/releases"
SOURCE_PATTERN = re.compile(r"[0-9a-f]{40}")
DIGEST_PATTERN = re.compile(r"sha256:[0-9a-f]{64}")
PUBLIC_INPUTS = {
    "NEXT_PUBLIC_APP_URL": "next_public_app_url",
    "NEXT_PUBLIC_BACKEND_URL": "next_public_backend_url",
    "NEXT_PUBLIC_KAKAO_CLIENT_ID": "next_public_kakao_client_id",
    "NEXT_PUBLIC_KAKAO_MAP_API_KEY": "next_public_kakao_map_api_key",
    "NEXT_PUBLIC_KAKAO_REDIRECT_URI": "next_public_kakao_redirect_uri",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "next_public_ga_measurement_id",
}
NONEMPTY_PUBLIC_INPUTS = {
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_BACKEND_URL",
    "NEXT_PUBLIC_KAKAO_CLIENT_ID",
    "NEXT_PUBLIC_KAKAO_MAP_API_KEY",
}


class ReleaseError(RuntimeError):
    """A fail-closed release contract violation."""


class UnixSocketHTTPConnection(http.client.HTTPConnection):
    def __init__(self, socket_path: Path, timeout: float = 10.0) -> None:
        super().__init__("localhost", timeout=timeout)
        self.socket_path = socket_path

    def connect(self) -> None:
        connection = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        connection.settimeout(self.timeout)
        connection.connect(str(self.socket_path))
        self.sock = connection


def exact_source_sha(value: str) -> str:
    if SOURCE_PATTERN.fullmatch(value) is None:
        raise ReleaseError(
            "source SHA must be exactly 40 lowercase hexadecimal characters"
        )
    return value


def exact_digest(value: str) -> str:
    if DIGEST_PATTERN.fullmatch(value) is None:
        raise ReleaseError(
            "digest must be exactly sha256 followed by 64 lowercase hexadecimal characters"
        )
    return value


def run_checked(
    argv: Sequence[str],
    *,
    env: Mapping[str, str] | None = None,
    input_text: str | None = None,
    pass_fds: Sequence[int] = (),
) -> str:
    try:
        result = subprocess.run(
            list(argv),
            cwd=REPO_ROOT,
            env=dict(env) if env is not None else None,
            input=input_text,
            text=True,
            capture_output=True,
            check=False,
            pass_fds=tuple(pass_fds),
        )
    except OSError as error:
        raise ReleaseError(f"required command could not start: {argv[0]}") from error
    if result.returncode != 0:
        raise ReleaseError(f"command failed without output disclosure: {argv[0]}")
    return result.stdout.strip()


def git_output(*arguments: str) -> str:
    return run_checked(("git", *arguments))


def verify_git_checkout(source_sha: str, *, publish: bool) -> None:
    if git_output("status", "--porcelain=v1"):
        raise ReleaseError("the repository must be clean")
    branch = git_output("symbolic-ref", "--quiet", "--short", "HEAD")
    if branch != DEFAULT_BRANCH:
        raise ReleaseError(
            f"execution is allowed only on the canonical {DEFAULT_BRANCH} branch"
        )
    head = git_output("rev-parse", "HEAD")
    if head != git_output("rev-parse", f"origin/{DEFAULT_BRANCH}"):
        raise ReleaseError(
            "the canonical branch must exactly match its origin tracking ref"
        )
    if publish:
        if head != source_sha:
            raise ReleaseError("publish source SHA must exactly equal HEAD")
    elif (
        subprocess.run(
            ["git", "merge-base", "--is-ancestor", source_sha, "HEAD"],
            cwd=REPO_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        ).returncode
        != 0
    ):
        raise ReleaseError("pin source SHA must be an ancestor of canonical HEAD")


def read_vault_document(document_path: str, purpose: str) -> dict[str, object]:
    try:
        metadata = HARBOR_SOCKET.lstat()
    except FileNotFoundError as error:
        raise ReleaseError(
            "the Seoul Fit release-agent Vault Proxy socket is absent"
        ) from error
    if not stat.S_ISSOCK(metadata.st_mode):
        raise ReleaseError("the configured release-agent endpoint is not a Unix socket")
    connection = UnixSocketHTTPConnection(HARBOR_SOCKET)
    try:
        connection.request(
            "GET", document_path, headers={"Accept": "application/json"}
        )
        response = connection.getresponse()
        body = response.read(65537)
    except (OSError, http.client.HTTPException) as error:
        raise ReleaseError("the release-agent document request failed") from error
    finally:
        connection.close()
    if response.status != 200 or len(body) > 65536:
        raise ReleaseError(f"the release-agent {purpose} document is unavailable")
    try:
        document = json.loads(body)
        values = document["data"]["data"]
    except (KeyError, TypeError, ValueError, RecursionError) as error:
        raise ReleaseError(
            f"the release-agent {purpose} document is malformed"
        ) from error
    if not isinstance(values, dict):
        raise ReleaseError(f"the release-agent {purpose} document is malformed")
    return values


def read_harbor_credentials() -> tuple[str, str]:
    values = read_vault_document(HARBOR_DOCUMENT, "Harbor credential")
    if not isinstance(values, dict) or set(values) != {"username", "password"}:
        raise ReleaseError(
            "the Harbor credential document must contain exactly username and password"
        )
    username, password = values["username"], values["password"]
    for name, value in (("username", username), ("password", password)):
        if (
            not isinstance(value, str)
            or not 1 <= len(value) <= 4096
            or "\x00" in value
            or "\n" in value
            or "\r" in value
        ):
            raise ReleaseError(f"Harbor {name} has an invalid shape")
    return username, password


def registry_token(username: str, password: str) -> str:
    basic = base64.b64encode(f"{username}:{password}".encode()).decode("ascii")
    connection = http.client.HTTPSConnection(REGISTRY, timeout=15)
    try:
        connection.request(
            "GET",
            "/service/token?"
            + urlencode(
                {
                    "service": "harbor-registry",
                    "scope": f"repository:{REGISTRY_REPOSITORY}:pull,push",
                }
            ),
            headers={"Authorization": f"Basic {basic}", "Accept": "application/json"},
        )
        response = connection.getresponse()
        body = response.read(65537)
    except (OSError, http.client.HTTPException) as error:
        raise ReleaseError("the Harbor repository token request failed") from error
    finally:
        connection.close()
    if response.status != 200 or len(body) > 65536:
        raise ReleaseError("the Harbor repository token is unavailable")
    try:
        document = json.loads(body)
        bearer = document.get("token") or document.get("access_token")
        if not isinstance(bearer, str) or not bearer:
            raise ValueError
        parts = bearer.split(".")
        if len(parts) != 3:
            raise ValueError
        claims = json.loads(
            base64.urlsafe_b64decode(parts[1] + "=" * (-len(parts[1]) % 4))
        )
        access = claims["access"]
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise ReleaseError("the Harbor repository token is malformed") from error
    actions = (
        access[0].get("actions", []) if isinstance(access, list) and access else []
    )
    if (
        not isinstance(access, list)
        or len(access) != 1
        or not isinstance(access[0], dict)
        or access[0].get("type") != "repository"
        or access[0].get("name") != REGISTRY_REPOSITORY
        or not isinstance(actions, list)
        or not all(isinstance(action, str) for action in actions)
        or sorted(actions) != ["pull", "push"]
    ):
        raise ReleaseError(
            "the Harbor token is not exact pull/push for the frontend repository"
        )
    return bearer


def registry_digest(tag: str, bearer: str) -> str | None:
    connection = http.client.HTTPSConnection(REGISTRY, timeout=15)
    try:
        connection.request(
            "HEAD",
            f"/v2/{REGISTRY_REPOSITORY}/manifests/{tag}",
            headers={
                "Accept": (
                    "application/vnd.oci.image.manifest.v1+json, "
                    "application/vnd.docker.distribution.manifest.v2+json"
                ),
                "Authorization": f"Bearer {bearer}",
            },
        )
        response = connection.getresponse()
        response.read()
    except (OSError, http.client.HTTPException) as error:
        raise ReleaseError("the Harbor manifest pre/post check failed") from error
    finally:
        connection.close()
    if response.status == 404:
        return None
    if response.status != 200:
        raise ReleaseError(
            "the Harbor manifest pre/post check was not authorized or available"
        )
    return exact_digest(response.getheader("Docker-Content-Digest", ""))


def validate_public_inputs(values: object) -> tuple[dict[str, str], str]:
    if not isinstance(values, dict) or set(values) != set(PUBLIC_INPUTS):
        raise ReleaseError(
            "the public build-input document must contain exactly the six named keys"
        )
    for name, value in values.items():
        if (
            not isinstance(value, str)
            or len(value) > 4096
            or "\x00" in value
            or "\n" in value
            or "\r" in value
        ):
            raise ReleaseError(f"{name} has an invalid shape")
        if name in NONEMPTY_PUBLIC_INPUTS and not value:
            raise ReleaseError(f"{name} must be present and non-empty")
    for name in ("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BACKEND_URL"):
        parsed = urlsplit(values[name])
        if (
            parsed.scheme != "https"
            or not parsed.netloc
            or parsed.username
            or parsed.password
        ):
            raise ReleaseError(f"{name} must be an absolute credential-free HTTPS URL")
    redirect = values["NEXT_PUBLIC_KAKAO_REDIRECT_URI"]
    if redirect:
        parsed = urlsplit(redirect)
        if (
            parsed.scheme != "https"
            or not parsed.netloc
            or parsed.username
            or parsed.password
        ):
            raise ReleaseError(
                "NEXT_PUBLIC_KAKAO_REDIRECT_URI must be empty or an HTTPS URL"
            )
    if values["NEXT_PUBLIC_GA_MEASUREMENT_ID"]:
        raise ReleaseError(
            "NEXT_PUBLIC_GA_MEASUREMENT_ID must stay empty; GA4 is owned by Zaraz"
        )
    canonical = json.dumps(
        values, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode()
    fingerprint = "sha256:" + hashlib.sha256(canonical).hexdigest()
    return values, fingerprint


def build_document(environment_name: str) -> str:
    try:
        return BUILD_DOCUMENTS[environment_name]
    except KeyError as error:
        raise ReleaseError("the build environment is not allowlisted") from error


def read_public_inputs(environment_name: str) -> tuple[dict[str, str], str]:
    values = read_vault_document(
        build_document(environment_name), "public build-input"
    )
    return validate_public_inputs(values)


def canonical_private_runtime_directory() -> Path:
    """Return the only runtime directory accepted by the release CLI."""

    expected_runtime = Path(f"/run/user/{os.geteuid()}")
    configured_runtime = Path(os.environ.get("XDG_RUNTIME_DIR", ""))
    try:
        metadata = configured_runtime.lstat()
    except (FileNotFoundError, OSError) as error:
        raise ReleaseError("XDG_RUNTIME_DIR is unavailable") from error
    if (
        configured_runtime.resolve() != expected_runtime
        or not stat.S_ISDIR(metadata.st_mode)
        or metadata.st_uid != os.geteuid()
        or stat.S_IMODE(metadata.st_mode) & 0o077
    ):
        raise ReleaseError(
            "XDG_RUNTIME_DIR is not the private canonical user runtime directory"
        )
    return configured_runtime


@contextmanager
def isolated_docker_environment() -> Iterator[dict[str, str]]:
    configured_runtime = canonical_private_runtime_directory()
    with tempfile.TemporaryDirectory(
        prefix="seoul-fit-frontend-release-", dir=configured_runtime
    ) as name:
        directory = Path(name)
        directory.chmod(0o700)
        environment = {
            "DOCKER_CONFIG": str(directory),
            "HOME": str(configured_runtime),
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "PATH": os.environ.get(
                "PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ),
        }
        yield environment


@contextmanager
def build_input_descriptors(
    values: Mapping[str, str],
) -> Iterator[tuple[list[str], list[int]]]:
    descriptors: list[int] = []
    arguments: list[str] = []
    try:
        for name, secret_id in PUBLIC_INPUTS.items():
            descriptor = os.memfd_create(f"seoul-fit-{secret_id}", flags=0)
            descriptors.append(descriptor)
            os.write(descriptor, values[name].encode())
            os.lseek(descriptor, 0, os.SEEK_SET)
            arguments.extend(
                ("--secret", f"id={secret_id},src=/proc/self/fd/{descriptor}")
            )
        yield arguments, descriptors
    finally:
        for descriptor in descriptors:
            os.close(descriptor)


def docker_login(environment: Mapping[str, str], username: str, password: str) -> None:
    run_checked(
        ("docker", "login", REGISTRY, "--username", username, "--password-stdin"),
        env=environment,
        input_text=password,
    )


def inspect_labels(image: str, environment: Mapping[str, str]) -> tuple[str, str, str]:
    output = run_checked(
        (
            "docker",
            "image",
            "inspect",
            "--format",
            '{{ index .Config.Labels "org.opencontainers.image.revision" }}\n'
            '{{ index .Config.Labels "io.damecasol.release.environment" }}\n'
            '{{ index .Config.Labels "io.damecasol.release.public-input-sha256" }}',
            image,
        ),
        env=environment,
    ).splitlines()
    if len(output) != 3 or output[1] not in {"dev", "prod"}:
        raise ReleaseError("the frontend image release labels are malformed")
    return exact_source_sha(output[0]), output[1], exact_digest(output[2])


def publish(environment_name: str, source_sha: str) -> dict[str, object]:
    verify_git_checkout(source_sha, publish=True)
    if shutil.which("docker") is None:
        raise ReleaseError("docker is required")
    values, input_fingerprint = read_public_inputs(environment_name)
    tag = f"{environment_name}-{source_sha}"
    image = f"{IMAGE_REPOSITORY}:{tag}"
    username, password = read_harbor_credentials()
    with isolated_docker_environment() as docker_environment:
        docker_login(docker_environment, username, password)
        bearer = registry_token(username, password)
        before = registry_digest(tag, bearer)
        resumed = before is not None
        if before is None:
            with build_input_descriptors(values) as (secret_arguments, descriptors):
                run_checked(
                    (
                        "docker",
                        "build",
                        "--pull",
                        "--platform",
                        PLATFORM,
                        "--target",
                        "release",
                        "--label",
                        f"org.opencontainers.image.revision={source_sha}",
                        "--label",
                        f"org.opencontainers.image.version={source_sha}",
                        "--label",
                        f"io.damecasol.release.environment={environment_name}",
                        "--label",
                        f"io.damecasol.release.public-input-sha256={input_fingerprint}",
                        *secret_arguments,
                        "--tag",
                        image,
                        ".",
                    ),
                    env=docker_environment,
                    pass_fds=descriptors,
                )
            if inspect_labels(image, docker_environment) != (
                source_sha,
                environment_name,
                input_fingerprint,
            ):
                raise ReleaseError(
                    "the local image release labels differ from reviewed inputs"
                )
            run_checked(
                (
                    "docker",
                    "run",
                    "--rm",
                    "--platform",
                    PLATFORM,
                    "--network",
                    "none",
                    "--entrypoint",
                    "/bin/sh",
                    image,
                    "-eu",
                    "-c",
                    "test -f /app/server.js && test -x /usr/local/bin/seoul-fit-entrypoint",
                ),
                env=docker_environment,
            )
            if registry_digest(tag, bearer) is not None:
                raise ReleaseError(
                    "the immutable environment tag appeared during build; refusing overwrite"
                )
            run_checked(("docker", "push", image), env=docker_environment)
        after = registry_digest(tag, bearer)
        if after is None or registry_digest(tag, bearer) != after:
            raise ReleaseError("the registry digest is absent or unstable after push")
        immutable_image = f"{IMAGE_REPOSITORY}@{after}"
        run_checked(
            ("docker", "pull", "--platform", PLATFORM, immutable_image),
            env=docker_environment,
        )
        if inspect_labels(immutable_image, docker_environment) != (
            source_sha,
            environment_name,
            input_fingerprint,
        ):
            raise ReleaseError("the registry image labels differ from reviewed inputs")
        run_checked(
            (
                "docker",
                "run",
                "--rm",
                "--platform",
                PLATFORM,
                "--network",
                "none",
                "--entrypoint",
                "/bin/sh",
                immutable_image,
                "-eu",
                "-c",
                "test -f /app/server.js && test -x /usr/local/bin/seoul-fit-entrypoint",
            ),
            env=docker_environment,
        )
    return {
        "digest": after,
        "environment": environment_name,
        "image": image,
        "public_input_sha256": input_fingerprint,
        "resumed_existing_immutable_tag": resumed,
        "service_version": after,
        "source_sha": source_sha,
    }


def replace_overlay_digest(environment_name: str, digest: str) -> None:
    path = OVERLAY_ROOT / environment_name / "kustomization.yaml"
    source = path.read_text(encoding="utf-8")
    digest_expression = re.compile(r"(?m)^(\s*digest:\s*)(sha256:[0-9a-f]{64})(\s*)$")
    version_expression = re.compile(
        r"(?m)(^\s*path:\s*/spec/template/metadata/annotations/"
        r"observability\.damecasol\.com~1service-version\s*\n\s*value:\s*)"
        r"(sha256:[0-9a-f]{64})(\s*$)"
    )
    digest_matches = digest_expression.findall(source)
    version_matches = version_expression.findall(source)
    if len(digest_matches) != 1 or len(version_matches) != 1:
        raise ReleaseError(
            f"{environment_name} overlay must contain one image and one service version digest"
        )
    if digest_matches[0][1] != version_matches[0][1]:
        raise ReleaseError(
            f"{environment_name} overlay preimage is internally inconsistent"
        )
    updated = digest_expression.sub(rf"\g<1>{digest}\g<3>", source, count=1)
    updated = version_expression.sub(rf"\g<1>{digest}\g<3>", updated, count=1)
    path.write_text(updated, encoding="utf-8")


def dev_receipt(source_sha: str) -> None:
    path = RECEIPT_ROOT / "dev.json"
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, RecursionError) as error:
        raise ReleaseError(
            "prod pin requires the committed dev release receipt"
        ) from error
    if receipt.get("source_sha") != source_sha or receipt.get("environment") != "dev":
        raise ReleaseError(
            "prod pin must follow a dev pin of the exact same source SHA"
        )


def write_receipt(
    environment_name: str, source_sha: str, digest: str, public_input_sha256: str
) -> None:
    RECEIPT_ROOT.mkdir(parents=True, exist_ok=True)
    receipt = {
        "digest": digest,
        "environment": environment_name,
        "image": f"{IMAGE_REPOSITORY}:{environment_name}-{source_sha}",
        "public_input_sha256": public_input_sha256,
        "schema_version": 1,
        "service_version": digest,
        "source_sha": source_sha,
    }
    (RECEIPT_ROOT / f"{environment_name}.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )


def pin(environment_name: str, source_sha: str, digest: str) -> dict[str, str]:
    verify_git_checkout(source_sha, publish=False)
    if environment_name == "prod":
        dev_receipt(source_sha)
    username, password = read_harbor_credentials()
    tag = f"{environment_name}-{source_sha}"
    with isolated_docker_environment() as docker_environment:
        docker_login(docker_environment, username, password)
        bearer = registry_token(username, password)
        if registry_digest(tag, bearer) != digest:
            raise ReleaseError(
                "the requested digest differs from the immutable environment tag"
            )
        immutable_image = f"{IMAGE_REPOSITORY}@{digest}"
        run_checked(
            ("docker", "pull", "--platform", PLATFORM, immutable_image),
            env=docker_environment,
        )
        image_source, image_environment, public_input_sha256 = inspect_labels(
            immutable_image, docker_environment
        )
        if image_source != source_sha or image_environment != environment_name:
            raise ReleaseError(
                "the pinned image labels differ from source or environment"
            )
    replace_overlay_digest(environment_name, digest)
    write_receipt(environment_name, source_sha, digest, public_input_sha256)
    return {
        "digest": digest,
        "environment": environment_name,
        "public_input_sha256": public_input_sha256,
        "service_version": digest,
        "source_sha": source_sha,
    }


def safe_plan(environment_name: str, source_sha: str) -> dict[str, object]:
    return {
        "default_branch": DEFAULT_BRANCH,
        "docker_config": "$XDG_RUNTIME_DIR/seoul-fit-frontend-release-* (temporary, mode 0700)",
        "environment": environment_name,
        "git_publish": False,
        "image": f"{IMAGE_REPOSITORY}:{environment_name}-{source_sha}",
        "kubernetes_or_argocd_write": False,
        "public_input_keys": sorted(PUBLIC_INPUTS),
        "public_input_values_printed": False,
        "source_sha": source_sha,
        "vault_documents": {
            "harbor": HARBOR_DOCUMENT.removeprefix("/v1/"),
            "public_build_inputs": build_document(environment_name).removeprefix(
                "/v1/"
            ),
        },
        "vault_socket": str(HARBOR_SOCKET),
    }


def parse_arguments(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    plan_parser = subparsers.add_parser(
        "plan", help="print a secret-free execution contract"
    )
    plan_parser.add_argument("--environment", choices=("dev", "prod"), required=True)
    plan_parser.add_argument("--source-sha", required=True)
    publish_parser = subparsers.add_parser(
        "publish", help="build/push one environment image"
    )
    publish_parser.add_argument("--environment", choices=("dev", "prod"), required=True)
    publish_parser.add_argument("--source-sha", required=True)
    publish_parser.add_argument("--execute", action="store_true", required=True)
    pin_parser = subparsers.add_parser("pin", help="pin exactly one environment")
    pin_parser.add_argument("--environment", choices=("dev", "prod"), required=True)
    pin_parser.add_argument("--source-sha", required=True)
    pin_parser.add_argument("--digest", required=True)
    pin_parser.add_argument("--execute", action="store_true", required=True)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    try:
        arguments = parse_arguments(argv if argv is not None else sys.argv[1:])
        source_sha = exact_source_sha(arguments.source_sha)
        if arguments.command == "plan":
            result = safe_plan(arguments.environment, source_sha)
        elif arguments.command == "publish":
            result = publish(arguments.environment, source_sha)
        else:
            result = pin(
                arguments.environment, source_sha, exact_digest(arguments.digest)
            )
    except (ReleaseError, OSError) as error:
        print(f"immutable release refused: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
