---
id: ADR-0001
type: architecture
status: Accepted
date: 2026-10-11
deciders: [owner]
supersedes: []
superseded_by: []
aliases: []
scope: frontend
---

# ADR-0001: Run one frontend replica with an in-process cache and scheduler

## Context and Problem Statement

The Next.js server fetches Seoul Open Data that changes often (Seoul Bike
station status every minute, subway stations once at start, live city data on
demand) and serves it to many browsers. Calling the upstream API per request
would exceed its rate limits and add latency, so the server keeps a cache. The
cache (`lib/serverCache.ts`) and the refresh scheduler
(`src/shared/lib/scheduler/`, started from `instrumentation.ts`) live inside the
Node process. A second replica would start a second scheduler, double the
upstream polling and give two pods different cache views. This decision was made
for the 2026-07 release and is recorded here so the trade-off is explicit.

## Considered Options

1. **Single replica, in-process cache** (chosen). Deployment `replicas: 1`,
   cache and scheduler in the process, cold start reloads subway data.
2. **External cache (Redis) with leader election.** Multiple replicas share one
   cache; one pod polls. Needs Redis operation, TTL/key versioning, a lock and
   fallback behaviour.
3. **No cache, upstream per request.** Simplest code, but rate limits and
   latency make the map unusable under light traffic.

## Decision Outcome

Chosen option 1. In the context of a portfolio deployment with no production
users, facing the choice between operational simplicity and horizontal
scalability, we chose a single replica with in-process state to achieve correct,
duplicate-free upstream polling and a deployment one person can run, accepting
that the frontend cannot scale out and restarts briefly lose cache until the
scheduler reloads.

## Consequences

- Positive: no shared infrastructure, exactly one upstream poller, deterministic
  cache for all requests, instant rollback (`docs/IMMUTABLE_RELEASE.md`).
- Negative: no horizontal scaling; a pod restart means a cold cache; rolling
  updates briefly run two pollers. Replica count must not be raised without the
  backlog work in `docs/BACKLOG.md` (cache externalisation, leader election).
- Follow-up: ADR-0001 is superseded when the cache moves out of process.

## Confirmation

- `infra/k8s/seoul-fit-fe/base/deployment.yaml` pins `replicas: 1`; overlays
  must not patch it upward without a superseding record.
- `instrumentation.ts` documents the single-replica assumption at the scheduler
  bootstrap.
- `src/shared/lib/scheduler/__tests__` cover the refresh behaviour of the
  in-process scheduler.
