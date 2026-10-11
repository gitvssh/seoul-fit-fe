---
id: ADR-0003
type: architecture
status: Accepted
date: 2026-10-11
deciders: [owner]
supersedes: []
superseded_by: []
aliases: []
scope: frontend
---

# ADR-0003: Serve public place pages from the server and keep the Kakao map client-only

## Context and Problem Statement

The map screen depends on browser-only capabilities: the Kakao Maps SDK,
geolocation and the query string. It cannot be meaningfully server-rendered, so
search engines, link previews and users without JavaScript would see an empty
shell. At the same time each place has a stable public identity (the source
record id) worth a crawlable URL.

## Considered Options

1. **Server-rendered `/places/*` pages plus a client-only map at `/`** (chosen).
   Public pages are React Server Components that read the backend's public
   catalogue; the home route streams an app-shell fallback and hydrates the map
   in the browser; `/?place=<category>:<id>` deep-links from a public page into
   the map.
2. **Everything client-rendered.** One surface, but no indexable content, no
   Open Graph previews with real data, and nothing for no-JS visitors.
3. **Server-render the map screen with a static tile image.** Visually closer to
   the app, but the SDK and licence terms do not support a server tile render,
   and it would duplicate the interactive UI.

## Decision Outcome

Chosen option 1. In the context of an SDK-bound map and stable public place ids,
facing the choice between one rendering model and crawlable content, we chose
two surfaces, server-rendered public pages and a client-only map, to achieve
indexable, shareable place URLs without faking the map, accepting that two
layouts must share one brand, header, footer and data contract.

## Consequences

- Positive: `/places`, category lists and details render without the SDK; robots
  and sitemap decisions are made per request host; the home fallback is shaped
  like the app shell so hydration does not jump layouts.
- Negative: two surfaces to design and test; the public list depends on the
  backend catalogue (duplicates in the backend index are de-duplicated by stable
  id on the frontend until the backend adds a unique key).
- Follow-up: keep `/places` and the map's place model in sync through the shared
  `src/shared/lib/seo/public-places.ts` contract.

## Confirmation

- `app/__tests__/sitemap.test.ts`, `app/__tests__/robots.test.ts`,
  `src/shared/lib/seo/__tests__/site.test.ts` and
  `src/shared/lib/seo/__tests__/structured-data.test.ts` pin the canonical
  origin, host-gated indexing and JSON-LD.
- `src/shared/lib/seo/__tests__/public-places.test.ts` pins de-duplication,
  closed-facility filtering and the 404-vs-failure distinction.
- `src/widgets/home-landing/__tests__/HomeLanding.test.tsx` pins the
  server-rendered home content.
