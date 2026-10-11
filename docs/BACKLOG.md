# Frontend backlog

현재 배포는 정확성을 위해 1 replica로 고정합니다. 아래 선행 작업 없이 replica
수만 늘리지 않습니다.

## 서버 캐시 외부화

- 범위: `serverCache`, scheduler가 관리하는 지하철·따릉이 캐시를 Redis로 옮기고
  TTL, key version, 장애 시 fallback, 동시 갱신 방지 lock을 정의합니다.
- 지금 하지 않는 이유: 현재 트래픽은 단일 replica로 충분하고, Redis 운영과 분산
  lock을 추가하면 이번 품질 마감 범위를 넘어섭니다.

## 멀티 replica 전환

- 선행 조건: 캐시 외부화, scheduler leader election 또는 별도 worker 분리,
  readiness와 rolling-update 시나리오 검증이 필요합니다.
- 완료 기준: 2개 이상 replica에서 중복 서울시 API polling이 없고, 어느 pod로
  요청해도 동일한 cache view를 제공해야 합니다.
- 지금 하지 않는 이유: 현재 scheduler와 캐시가 프로세스 로컬이므로 replica를
  늘리면 API 호출과 메모리 상태가 중복·분기됩니다.

## GitHub Actions CI 재개

- 범위: type-check, Jest, `next build`, 환경별 standalone 이미지
  build·scan·push, digest 갱신 검증을 Actions로 복원합니다.
- 지금 하지 않는 이유: 인프라 전역에서 Actions가 중지되어 있어 현재 승인된 배포
  경로는 로컬 빌드와 수동 GitOps 승격입니다.
- 시작 조건: 조직/runner 정책이 다시 열리고 build-time 공개 변수 및 Harbor
  자격증명 공급 방식이 확정될 때 진행합니다.

## 지하철 실시간 도착 정보 권한 (사용자 결정 필요)

- 현상: 서울 열린데이터 실시간 지하철 API가 현재 인증키에 `ERROR-338` (실시간
  서비스 사용 불가)을 돌려줍니다. 역 상세는 "실시간 도착 정보를 지금은 받을 수
  없어요"로 정직하게 표시합니다.
- 다음 조치: data.seoul.go.kr에서 실시간 지하철 도착정보 서비스 권한을 신청하고
  승인된 키를 `kv/data/projects/seoul-fit/fe-dev`·`fe-prod`의 `SEOUL_API_KEY`로
  교체합니다. 코드 변경은 필요 없습니다.

## 로컬 개발 백엔드 프록시

- 현상: `localhost`에서는 공개 게이트웨이가 CORS를 거부해 체육·맛집·문화
  데이터가 비고, 카카오 지도 SDK도 등록 도메인이 아니라 401을 냅니다. 배포
  환경은 동일 출처라 발생하지 않습니다.
- 다음 조치: `NEXT_PUBLIC_BACKEND_URL`이 비어 있을 때 `/api/v1`·`/api/sports`
  등을 `BACKEND_INTERNAL_URL`로 넘기는 개발 전용 rewrite를 추가하고, 카카오
  콘솔에 `http://localhost:3000`을 등록합니다(사용자 결정).

## 검색 결과의 동명 항목 정리

- 현상: 무더위쉼터 목록이 도서관 이름을 그대로 쓰므로 "가양도서관"이 도서관과
  쉼터 두 그룹에 모두 나타납니다. 카테고리 가중치로 도서관이 먼저 오지만 중복은
  남습니다.
- 다음 조치: 이름+주소가 같은 항목을 한 결과로 합치고 부가 카테고리를 배지로
  표시합니다.

## 백엔드 데이터 이슈 (seoul-fit-backend)

- `/api/v1/cultural-reservations/nearby`가 500을 돌려줍니다(dev, 2026-10-11).
  프런트는 소스별 실패로 처리하지만 문화예약 카테고리가 비어 보입니다.
- `/api/public/places?category=library&size=2`가 같은 행을 두 번 돌려줍니다
  (페이지 정렬 키 중복). 공개 목록 페이지에서 항목이 중복될 수 있습니다.
