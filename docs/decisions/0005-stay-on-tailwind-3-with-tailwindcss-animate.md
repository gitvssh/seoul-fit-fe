---
id: ADR-0005
type: architecture
status: Accepted
date: 2026-10-11
deciders: [owner]
supersedes: []
superseded_by: []
aliases: []
scope: frontend
---

# ADR-0005: Stay on Tailwind CSS 3.4 with tailwindcss-animate instead of migrating to v4

## Context and Problem Statement

The shadcn-style primitives had been generated for Tailwind v4 while the project
compiles with Tailwind 3.4. Two independent measurements in the 2026-10 research
(`docs/research/2026-10-ui-ux/report.md`, section "Tailwind 3.4 위의 v4
프리미티브…") showed that v4-only utilities (`shadow-xs`, `outline-hidden`,
`animate-in`, `fade-in-0`, `max-h-(--radix…)`, `tw-animate-css` blocks) produced
zero CSS, so sheets and dropdowns had no enter/exit animation and buttons had no
shadow. The design system needed a stack where every class it specifies is
actually generated.

## Considered Options

1. **Keep Tailwind 3.4, add `tailwindcss-animate@1.0.7`, translate the ~11
   v4-only utilities** (chosen). The HSL token scheme, contrast checks and every
   sketched interaction class were already verified on 3.4.19.
2. **Migrate to Tailwind v4.** Matches the generated primitives, but throws away
   the verified token and class measurements, and the interaction of v4's
   preflight with the DOM injected by the Kakao SDK was never evaluated.
3. **Leave as is.** Zero cost today, but the broken animations and shadows are
   exactly the "unfinished" signals reviewers notice first.

## Decision Outcome

Chosen option 1. In the context of measured breakage from mixed Tailwind
generations, facing the choice between a verified v3 token system and the newer
v4 syntax, we chose to stay on 3.4 with `tailwindcss-animate` to achieve
animations, shadows and focus rings that are proven to compile, accepting that
the v4 migration is deferred to a separate decision.

## Consequences

- Positive: `.animate-in`, `slide-in-from-*`, `zoom-in-95` and
  `data-[state=open]:` variants exist in the build output; one primitive
  generation; `components.json` points `shadcn add` at the v3 config.
- Negative: newer v4-only features (CSS-first config, `@utility`) are
  unavailable; `tailwind-merge` stays on the 2.x line for v3 class semantics.
- Follow-up: a v4 migration, if wanted, needs its own ADR that re-runs the
  contrast and class-generation checks and evaluates v4 preflight against the
  Kakao SDK DOM.

## Confirmation

- `package.json` pins `tailwindcss ^3.4.19`, `tailwindcss-animate 1.0.7` and
  `tailwind-merge 2.6.x`; `tailwind.config.js` registers the plugin.
- After `npm run build`, `grep -rl "animate-in" .next/static/css` returns at
  least one stylesheet (the research report's closing check).
- `src/shared/ui/__tests__/checkbox.test.tsx` and the accessibility suites run
  against the v3 primitives.
