---
id: ADR-0002
type: architecture
status: Accepted
date: 2026-10-11
deciders: [owner]
supersedes: []
superseded_by: []
aliases: []
scope: product
---

# ADR-0002: Recommend with a rule-based score that shows its reasons, not a learned model

## Context and Problem Statement

The product promises to answer "where can I go right now?". A recommendation
that cannot explain itself is not trusted, and the data is often incomplete:
opening hours may be unknown, live city data covers only designated hotspots,
and freshness varies by source. The team chose this approach in the 2026-07
product plan (`docs/PRODUCT_IMPLEMENTATION_PLAN.md` §4.3); this record makes the
decision and its trade-offs explicit.

## Considered Options

1. **Rule-based additive score with reason codes** (chosen). Interest match,
   distance, open-now, availability, freshness, preset fit and risk penalties
   sum to 0–100; the top three reasons and every warning are returned with the
   score; missing data yields a neutral score plus an explicit "unknown".
2. **Learned ranking model.** Needs interaction data the project does not have
   (no users), cannot explain individual results, and would invite the label "AI
   recommendation" that the product refuses to use.
3. **Simple filters only, no ranking.** Honest but leaves the user to compare
   dozens of places by hand; the "Seoul now" differentiator would be lost.

## Decision Outcome

Chosen option 1. In the context of live but patchy public data and no user
history, facing the choice between explainability and personalised accuracy, we
chose an additive rule score with visible reasons to achieve results a user can
verify in one glance, accepting lower personalisation and the need to tune
weights by hand.

## Consequences

- Positive: every card shows why it ranks where it does; data gaps surface as
  "정보 없음" instead of false confidence; the same engine serves all six
  situation presets; the UI never calls it AI.
- Negative: weights are hand-tuned and global; no learning from behaviour;
  presets must activate the categories they need or results degrade.
- Follow-up: when weights change, update the factor table in
  `docs/PRODUCT_IMPLEMENTATION_PLAN.md` and `/about` together.

## Confirmation

- `src/features/recommendation/lib/recommendation-engine.ts` implements the
  factor ranges; `src/features/recommendation/lib/__tests__/` pin score bounds,
  reason codes and the neutral-score behaviour for missing data.
- Copy review: no customer-facing string describes the recommendation as AI
  (`docs/DESIGN_SYSTEM.md` §7).
