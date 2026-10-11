# Decision records

이 색인은 `scripts/gen_decisions_index.py`가 생성한다. 손으로 고치지 않는다.
규칙: devkit `policy/decision-records.md` (단일 카운터, 불변 + 대체, status enum).

| ID | Type | Status | Scope | Date | Title | Path |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-0001 | architecture | Accepted | frontend | 2026-10-11 | Run one frontend replica with an in-process cache and scheduler | [0001-single-replica-in-process-cache.md](0001-single-replica-in-process-cache.md) |
| ADR-0002 | architecture | Accepted | product | 2026-10-11 | Recommend with a rule-based score that shows its reasons, not a learned model | [0002-rule-based-recommendation-with-visible-reasons.md](0002-rule-based-recommendation-with-visible-reasons.md) |
| ADR-0003 | architecture | Accepted | frontend | 2026-10-11 | Serve public place pages from the server and keep the Kakao map client-only | [0003-ssr-public-pages-client-side-kakao-map.md](0003-ssr-public-pages-client-side-kakao-map.md) |
| ADR-0004 | architecture | Accepted | frontend | 2026-10-11 | Release immutable image digests and promote dev to prod by hand | [0004-immutable-digest-releases-manual-gitops-promotion.md](0004-immutable-digest-releases-manual-gitops-promotion.md) |
| ADR-0005 | architecture | Accepted | frontend | 2026-10-11 | Stay on Tailwind CSS 3.4 with tailwindcss-animate instead of migrating to v4 | [0005-stay-on-tailwind-3-with-tailwindcss-animate.md](0005-stay-on-tailwind-3-with-tailwindcss-animate.md) |

## 결번

없음 — 발급된 번호는 모두 기록이 있다.
