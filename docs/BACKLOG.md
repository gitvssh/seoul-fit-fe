# Frontend backlog

현재 배포는 정확성을 위해 1 replica로 고정합니다. 아래 선행 작업 없이 replica 수만 늘리지 않습니다.

## 서버 캐시 외부화

- 범위: `serverCache`, scheduler가 관리하는 지하철·따릉이 캐시를 Redis로 옮기고 TTL, key version, 장애 시 fallback, 동시 갱신 방지 lock을 정의합니다.
- 지금 하지 않는 이유: 현재 트래픽은 단일 replica로 충분하고, Redis 운영과 분산 lock을 추가하면 이번 품질 마감 범위를 넘어섭니다.

## 멀티 replica 전환

- 선행 조건: 캐시 외부화, scheduler leader election 또는 별도 worker 분리, readiness와 rolling-update 시나리오 검증이 필요합니다.
- 완료 기준: 2개 이상 replica에서 중복 서울시 API polling이 없고, 어느 pod로 요청해도 동일한 cache view를 제공해야 합니다.
- 지금 하지 않는 이유: 현재 scheduler와 캐시가 프로세스 로컬이므로 replica를 늘리면 API 호출과 메모리 상태가 중복·분기됩니다.

## GitHub Actions CI 재개

- 범위: type-check, Jest, `next build`, 환경별 standalone 이미지 build·scan·push, digest 갱신 검증을 Actions로 복원합니다.
- 지금 하지 않는 이유: 인프라 전역에서 Actions가 중지되어 있어 현재 승인된 배포 경로는 로컬 빌드와 수동 GitOps 승격입니다.
- 시작 조건: 조직/runner 정책이 다시 열리고 build-time 공개 변수 및 Harbor 자격증명 공급 방식이 확정될 때 진행합니다.
