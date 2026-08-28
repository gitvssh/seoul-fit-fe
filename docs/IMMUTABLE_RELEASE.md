# Immutable frontend image release

`infra/scripts/release_immutable_image.py` is the canonical, local-only release
entrypoint. It binds the full source commit, environment, browser-public input
fingerprint, OCI labels, Harbor manifest digest, Kubernetes image pin, and
`service.version`. It does not commit or push Git, change Kubernetes or Argo CD,
call `sudo`, or persist credentials.

## Runtime prerequisites

- canonical `master` is clean and exactly equals `origin/master` after an
  explicit `git fetch`; the publish SHA must be `HEAD`
- Docker with BuildKit is installed and the daemon is reachable
- `XDG_RUNTIME_DIR=/run/user/$(id -u)` is owner-only
- `/run/vault-proxy/seoul-fit-release-agent.sock` is healthy and returns HTTP
  200 for the exact release documents: `kv/data/projects/seoul-fit/harbor-ci`
  plus the environment-selected `frontend-build-dev` or `frontend-build-prod`;
  the Harbor document contains exactly `username` and `password`
- the Harbor robot can pull and push only `seoul-fit/frontend`
- the selected frontend build document exists with exactly these keys:
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BACKEND_URL`,
  `NEXT_PUBLIC_KAKAO_CLIENT_ID`, `NEXT_PUBLIC_KAKAO_MAP_API_KEY`,
  `NEXT_PUBLIC_KAKAO_REDIRECT_URI`, and `NEXT_PUBLIC_GA_MEASUREMENT_ID`

The first four values must be non-empty; URLs must be absolute HTTPS URLs.
Redirect may be empty. The GA measurement ID key must be present but empty
because public GA4 injection is owned by Cloudflare Zaraz. The build documents
are separate from `fe-dev` and `fe-prod`, which remain Kubernetes runtime-only
documents containing `SEOUL_API_KEY`. Neither runtime document nor that key is
read by this release command.

The tool creates `DOCKER_CONFIG` below `XDG_RUNTIME_DIR` with mode `0700`, sends
the Harbor password only to `docker login --password-stdin`, and removes the
directory on exit. Each public input reaches BuildKit through an anonymous
memory descriptor. Values are never placed in command arguments or output; only
a SHA-256 fingerprint is recorded in OCI labels and the release receipt.

## Review, publish, and pin

The plan command is read-only and contacts neither Vault nor Docker:

```bash
python3 infra/scripts/release_immutable_image.py plan \
  --environment dev --source-sha <40-lowercase-hex>
```

Dev and prod builds are deliberately separate because Next.js embeds their
public inputs. The environment selects its Vault document without a path or file
override:

```bash
python3 infra/scripts/release_immutable_image.py publish \
  --environment dev --source-sha <40-lowercase-hex> --execute
```

The publisher uses tag `dev-<full-SHA>` (or `prod-<full-SHA>`), checks it before
the one allowed push, runs a network-disabled static image smoke check, and
reads the registry digest twice afterward. An interrupted retry reuses an
existing tag only if source, environment, and public-input fingerprint labels
all match.

Pin and commit development first:

```bash
python3 infra/scripts/release_immutable_image.py pin \
  --environment dev --source-sha <40-lowercase-hex> \
  --digest sha256:<64-lowercase-hex> --execute
```

After development CI, manual sync, and runtime verification, build prod with its
own Vault document and run a separate prod pin. A prod pin is refused unless a
committed dev receipt for the exact same source already exists:

```bash
python3 infra/scripts/release_immutable_image.py publish \
  --environment prod --source-sha <40-lowercase-hex> --execute
python3 infra/scripts/release_immutable_image.py pin \
  --environment prod --source-sha <40-lowercase-hex> \
  --digest sha256:<64-lowercase-hex> --execute
```

Neither pin command commits, pushes, force-updates, syncs, prunes, or deletes.

## Source-only validation

```bash
python3 -m unittest discover -s infra/scripts/tests -p 'test_*.py'
python3 infra/scripts/release_immutable_image.py plan \
  --environment dev --source-sha "$(git rev-parse HEAD)"
python3 infra/scripts/validate_observability_contract.py
python3 .github/scripts/validate_workflow_runners.py homelab-seoul-fit-fe
```
