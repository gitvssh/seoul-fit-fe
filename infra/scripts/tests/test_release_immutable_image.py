from __future__ import annotations

import importlib.util
import inspect
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).resolve().parents[1] / "release_immutable_image.py"
SPEC = importlib.util.spec_from_file_location("frontend_immutable_release", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(release)

SOURCE_SHA = "1" * 40
DIGEST = "sha256:" + "2" * 64
OLD_DIGEST = "sha256:" + "3" * 64
VALID_INPUTS = {
    "NEXT_PUBLIC_APP_URL": "https://dev.example.test",
    "NEXT_PUBLIC_BACKEND_URL": "https://dev.example.test/api",
    "NEXT_PUBLIC_KAKAO_CLIENT_ID": "public-client-id",
    "NEXT_PUBLIC_KAKAO_MAP_API_KEY": "public-map-key",
    "NEXT_PUBLIC_KAKAO_REDIRECT_URI": "",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "",
}


class ImmutableReleaseContractTest(unittest.TestCase):
    def test_exact_identifiers_reject_ambiguous_values(self) -> None:
        self.assertEqual(release.exact_source_sha(SOURCE_SHA), SOURCE_SHA)
        self.assertEqual(release.exact_digest(DIGEST), DIGEST)
        for invalid in ("1" * 39, "A" * 40, "master", SOURCE_SHA + "x"):
            with self.assertRaises(release.ReleaseError):
                release.exact_source_sha(invalid)
        for invalid in ("2" * 64, "sha256:" + "A" * 64, DIGEST + "0"):
            with self.assertRaises(release.ReleaseError):
                release.exact_digest(invalid)

    def test_public_inputs_are_exact_bounded_and_fingerprinted_without_values(
        self,
    ) -> None:
        values, fingerprint = release.validate_public_inputs(VALID_INPUTS)
        self.assertEqual(values, VALID_INPUTS)
        self.assertRegex(fingerprint, r"^sha256:[0-9a-f]{64}$")
        plan = json.dumps(release.safe_plan("dev", SOURCE_SHA))
        for value in VALID_INPUTS.values():
            if value:
                self.assertNotIn(value, plan)

    def test_public_inputs_reject_missing_extra_and_ga_id(self) -> None:
        cases = []
        missing = dict(VALID_INPUTS)
        missing.pop("NEXT_PUBLIC_KAKAO_CLIENT_ID")
        cases.append(missing)
        extra = dict(VALID_INPUTS, PRIVATE_TOKEN="never-allowed")
        cases.append(extra)
        ga = dict(VALID_INPUTS, NEXT_PUBLIC_GA_MEASUREMENT_ID="G-NOT-IN-APP")
        cases.append(ga)
        for values in cases:
            with self.subTest(keys=sorted(values)):
                with self.assertRaises(release.ReleaseError):
                    release.validate_public_inputs(values)

    def test_public_inputs_reject_invalid_shapes_and_urls(self) -> None:
        cases = []
        empty_required = dict(VALID_INPUTS, NEXT_PUBLIC_APP_URL="")
        cases.append(empty_required)
        newline = dict(VALID_INPUTS, NEXT_PUBLIC_KAKAO_CLIENT_ID="invalid\nvalue")
        cases.append(newline)
        too_long = dict(VALID_INPUTS, NEXT_PUBLIC_KAKAO_MAP_API_KEY="x" * 4097)
        cases.append(too_long)
        insecure_url = dict(VALID_INPUTS, NEXT_PUBLIC_BACKEND_URL="http://example.test")
        cases.append(insecure_url)
        credential_url = dict(
            VALID_INPUTS, NEXT_PUBLIC_APP_URL="https://user@example.test"
        )
        cases.append(credential_url)
        invalid_redirect = dict(
            VALID_INPUTS, NEXT_PUBLIC_KAKAO_REDIRECT_URI="relative/callback"
        )
        cases.append(invalid_redirect)
        for values in cases:
            with self.subTest(keys=sorted(values)):
                with self.assertRaises(release.ReleaseError):
                    release.validate_public_inputs(values)

    def test_environment_selects_only_the_exact_build_document(self) -> None:
        expected = {
            "dev": "/v1/kv/data/projects/seoul-fit/frontend-build-dev",
            "prod": "/v1/kv/data/projects/seoul-fit/frontend-build-prod",
        }
        self.assertEqual(release.BUILD_DOCUMENTS, expected)
        for environment, path in expected.items():
            with self.subTest(environment=environment):
                with mock.patch.object(
                    release, "read_vault_document", return_value=VALID_INPUTS
                ) as read:
                    values, fingerprint = release.read_public_inputs(environment)
                read.assert_called_once_with(path, "public build-input")
                self.assertEqual(values, VALID_INPUTS)
                self.assertRegex(fingerprint, r"^sha256:[0-9a-f]{64}$")
        with self.assertRaises(release.ReleaseError):
            release.read_public_inputs("staging")

    def test_build_input_reader_has_no_runtime_secret_or_file_override(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8")
        runtime_documents = (
            "/v1/kv/data/projects/seoul-fit/fe-dev",
            "/v1/kv/data/projects/seoul-fit/fe-prod",
        )
        for path in runtime_documents:
            self.assertNotIn(path, source)
        self.assertNotIn("SEOUL_API_KEY", source)
        self.assertNotIn("public-input-file", source)

    def test_build_inputs_use_memfd_paths_not_values(self) -> None:
        with release.build_input_descriptors(VALID_INPUTS) as (arguments, descriptors):
            serialized = " ".join(arguments)
            self.assertEqual(len(descriptors), len(VALID_INPUTS))
            self.assertEqual(arguments.count("--secret"), len(VALID_INPUTS))
            self.assertIn("src=/proc/self/fd/", serialized)
            for value in VALID_INPUTS.values():
                if value:
                    self.assertNotIn(value, serialized)

    def test_overlay_pin_updates_digest_and_service_version_together(self) -> None:
        source = f"""images:
  - name: example
    digest: {OLD_DIGEST}
patches:
  - patch: |-
      - op: replace
        path: /spec/template/metadata/annotations/observability.damecasol.com~1service-version
        value: {OLD_DIGEST}
"""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            overlay = root / "dev"
            overlay.mkdir()
            path = overlay / "kustomization.yaml"
            path.write_text(source, encoding="utf-8")
            with mock.patch.object(release, "OVERLAY_ROOT", root):
                release.replace_overlay_digest("dev", DIGEST)
            updated = path.read_text(encoding="utf-8")
        self.assertEqual(updated.count(DIGEST), 2)
        self.assertNotIn(OLD_DIGEST, updated)

    def test_prod_pin_requires_dev_receipt_for_same_source(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "dev.json").write_text(
                json.dumps({"source_sha": SOURCE_SHA, "environment": "dev"}),
                encoding="utf-8",
            )
            with mock.patch.object(release, "RECEIPT_ROOT", root):
                release.dev_receipt(SOURCE_SHA)
                with self.assertRaises(release.ReleaseError):
                    release.dev_receipt("4" * 40)

    def test_harbor_password_is_stdin_only(self) -> None:
        source = inspect.getsource(release.docker_login)
        self.assertIn("input_text=password", source)
        self.assertNotIn("password,", source.split("input_text=password", 1)[0])

    def test_docker_subprocess_environment_does_not_inherit_session_secrets(
        self,
    ) -> None:
        with mock.patch.dict(os.environ, {"SHOULD_NOT_REACH_DOCKER": "sensitive"}):
            with release.isolated_docker_environment() as environment:
                self.assertNotIn("SHOULD_NOT_REACH_DOCKER", environment)

    def test_failed_command_does_not_disclose_captured_output(self) -> None:
        completed = mock.Mock(
            returncode=1, stdout="sensitive stdout", stderr="sensitive stderr"
        )
        with mock.patch.object(release.subprocess, "run", return_value=completed):
            with self.assertRaises(release.ReleaseError) as raised:
                release.run_checked(("docker", "example"))
        self.assertNotIn("sensitive", str(raised.exception))

    def test_dockerfile_requires_all_buildkit_public_input_mounts(self) -> None:
        dockerfile = (SCRIPT.parents[2] / "Dockerfile").read_text(encoding="utf-8")
        self.assertEqual(dockerfile.count("--mount=type=secret,id=next_public_"), 6)
        self.assertEqual(dockerfile.count("required=true"), 6)
        self.assertNotIn("ARG NEXT_PUBLIC_", dockerfile)
        self.assertNotIn("ENV NEXT_PUBLIC_", dockerfile)

    def test_no_git_publish_force_or_actions_storage(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn('("git", "push"', source)
        self.assertNotIn("--force", source)
        forbidden = (
            "actions/cache",
            "actions/upload-artifact",
            "actions/download-artifact",
            "actions/upload-pages-artifact",
            "type=gha",
            "cache-dependency-path",
        )
        for path in (SCRIPT.parents[2] / ".github/workflows").glob("*.y*ml"):
            workflow = path.read_text(encoding="utf-8")
            for marker in forbidden:
                self.assertNotIn(
                    marker, workflow, f"{path}: forbidden Actions storage marker"
                )

    def test_harbor_contract_is_exactly_project_scoped(self) -> None:
        self.assertEqual(
            release.HARBOR_DOCUMENT, "/v1/kv/data/projects/seoul-fit/harbor-ci"
        )
        self.assertEqual(
            release.HARBOR_SOCKET,
            Path("/run/vault-proxy/seoul-fit-release-agent.sock"),
        )
        self.assertEqual(
            set(release.BUILD_DOCUMENTS.values()),
            {
                "/v1/kv/data/projects/seoul-fit/frontend-build-dev",
                "/v1/kv/data/projects/seoul-fit/frontend-build-prod",
            },
        )


if __name__ == "__main__":
    unittest.main()
