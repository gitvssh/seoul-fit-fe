---
class: current
owner: frontend
last_verified: 2026-10-11
---

# 배포와 환경 변수

README에서 옮겨 온 운영 상세다. 릴리스 절차의 정본은
[`IMMUTABLE_RELEASE.md`](IMMUTABLE_RELEASE.md), 관측 계약은
[`OBSERVABILITY.md`](OBSERVABILITY.md), 미룬 작업과 이유는
[`BACKLOG.md`](BACKLOG.md)다.

## 환경 변수 역할

환경 변수 목록과 공개/서버 전용 구분의 정본은
[`.env.example`](../.env.example)이다. `NEXT_PUBLIC_*` 변수는 브라우저 번들에
포함되므로 비밀값을 넣으면 안 된다.

| 구분           | 변수                             | 용도                                                               |
| -------------- | -------------------------------- | ------------------------------------------------------------------ |
| build/public   | `NEXT_PUBLIC_APP_URL`            | 브라우저가 보는 앱 origin                                          |
| build/public   | `NEXT_PUBLIC_BACKEND_URL`        | 브라우저의 backend 요청 주소                                       |
| build/public   | `NEXT_PUBLIC_KAKAO_CLIENT_ID`    | 카카오 OAuth 공개 client id                                        |
| build/public   | `NEXT_PUBLIC_KAKAO_MAP_API_KEY`  | 카카오 지도 JavaScript key                                         |
| build/public   | `NEXT_PUBLIC_KAKAO_REDIRECT_URI` | OAuth callback override                                            |
| build/public   | `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | 빌드 계약의 예약 키, 항상 빈 값. 앱은 읽지 않으며 GA4는 Zaraz 소유 |
| runtime/server | `BACKEND_INTERNAL_URL`           | Route Handler·SSR의 backend 주소                                   |
| runtime/server | `SEOUL_API_KEY`                  | 서울 열린데이터 요청 key                                           |

`next build`는 환경 변수 없이도 완료된다. 실제 지도·OAuth 동작 검증에는 유효한
`.env.local`이 필요하다.

## 런타임 구성

- Next.js `output: 'standalone'` 산출물을 멀티스테이지 Dockerfile로 패키징한다.
- 서버 캐시와 갱신 스케줄러가 프로세스 안에 있어 Deployment는 1 replica로
  고정한다 ([ADR-0001](decisions/0001-single-replica-in-process-cache.md)).
- prod는 `https://seoulfit.damecasol.com`에서 Cloudflare Tunnel을 거쳐 공개되고,
  dev는 내부 DNS 존에서만 접근한다.

## 배포

애플리케이션 매니페스트는
[`infra/k8s/seoul-fit-fe`](../infra/k8s/seoul-fit-fe)가 소유한다.

- `base`: 1 replica Deployment, Service, ServiceAccount, Vault VSO 리소스
- `overlays/dev`, `overlays/prod`: backend 연결, HTTPRoute, 환경별 이미지 digest
- `NEXT_PUBLIC_*`는 환경별 이미지 빌드 때 주입하므로 dev/prod 이미지가 분리된다.
  빌드 도구가 release-agent Vault Proxy에서 환경에 맞는 전용 문서를 선택하며
  파일·임의 경로로 우회할 수 없다.
- 컨테이너 이미지는 tag가 아니라 `sha256` digest로 고정한다
  ([ADR-0004](decisions/0004-immutable-digest-releases-manual-gitops-promotion.md)).
- Argo CD Application `seoul-fit-fe-dev`와 `seoul-fit-fe-prod`는 각각 `master`의
  overlay를 추적하며 manual sync다.
- Vault Secrets Operator는 런타임 서버 전용 값을 Kubernetes Secret으로 공급한다.

Vault KV v2 경로는 다음과 같다. 경로만 공개하며 값은 저장소에 두지 않는다. 빌드
문서는 브라우저 공개 값만 담고, 런타임 문서는 `SEOUL_API_KEY`만 공급한다.

- `kv/data/projects/seoul-fit/frontend-build-dev`
- `kv/data/projects/seoul-fit/frontend-build-prod`
- `kv/data/projects/seoul-fit/fe-dev`
- `kv/data/projects/seoul-fit/fe-prod`
- `kv/data/projects/seoul-fit/harbor-pull`

## CI

`.github/workflows/ci.yml`은 type-check, lint, Jest(coverage), 런타임 launcher
테스트, `next build`, SonarQube 품질 게이트를 자체 ARC
러너(`homelab-seoul-fit-fe`) 에서만 실행한다. 러너 정책으로 Actions가 멈춘
동안의 승인된 배포 경로는 로컬 불변 이미지 빌드와 수동 GitOps 승격이다
([`BACKLOG.md`](BACKLOG.md)).
