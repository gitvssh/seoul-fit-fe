---
id: ADR-0004
type: architecture
status: Accepted
date: 2026-10-11
deciders: [owner]
supersedes: []
superseded_by: []
aliases: []
scope: frontend
---

# ADR-0004: Release immutable image digests and promote dev to prod by hand

## Context and Problem Statement

`NEXT_PUBLIC_*` values are embedded at build time, so a dev image and a prod
image of the same commit differ. On 2026-09-26 a layer-cache reuse shipped dev
URLs to production. GitHub Actions is paused by the homelab runner policy, so
builds happen locally. The release process must make "what is running" provably
equal to "what was built from this commit for this environment".

## Considered Options

1. **Immutable `sha256` digests, per-environment builds, dev-first manual
   promotion** (chosen). `infra/scripts/release_immutable_image.py` binds the
   source SHA, environment, public-input fingerprint and registry digest; the
   overlay pins the digest and `service.version`; Argo CD applications are
   manual sync; a prod pin is refused without a committed dev receipt.
2. **Mutable tags with automatic sync.** Fewer steps, but a tag can change under
   a running deployment and the dev/prod input mix-up cannot be detected from
   the manifest.
3. **CI-driven releases.** Preferred long term, but the organisation's runner
   policy currently forbids it; waiting would block every release.

## Decision Outcome

Chosen option 1. In the context of build-time public inputs and paused CI,
facing the choice between release convenience and release traceability, we chose
immutable digests with manual, dev-first promotion to achieve a 1:1 link between
commit, environment inputs and the running image, accepting extra manual steps
per release.

## Consequences

- Positive: rollbacks are a pin change; the manifest states the exact image; dev
  and prod builds cannot share a stale `.next` layer; secrets never appear in
  arguments or logs.
- Negative: every release is a local, human-triggered sequence; no automatic
  deploy on merge; the receipt files must be committed with the pins.
- Follow-up: when CI resumes (`docs/BACKLOG.md`), keep the digest contract and
  move only the build step.

## Confirmation

- `docs/IMMUTABLE_RELEASE.md` is the runbook; `infra/scripts/tests/test_*.py`
  (run with
  `python3 -m unittest discover -s infra/scripts/tests -p 'test_*.py'`) cover
  the plan, publish and pin rules including the dev-receipt gate.
- `python3 infra/scripts/validate_observability_contract.py` checks that each
  overlay's image digest and `service.version` match.
