# 프런트엔드 관측 계약

Seoul Fit 프런트엔드는 Nginx 없이 Next.js standalone Node 프로세스로 실행됩니다.
Node HTTP 서버의 완료 이벤트를 `diagnostics_channel`에서 받아 요청 한 건당
stdout JSON 한 줄을 남깁니다. 등록은 `instrumentation.ts`의 Node 런타임 초기화
단계에서 한 번만 수행합니다.

이미지 entrypoint는 identity를 먼저 검증한 뒤 Next.js보다 앞서
`homelab-runtime-start-v1`을 정확히 한 번 남깁니다. 그 뒤 전용 launcher가
Next.js의 stdout/stderr를 함께 받아 계약에 맞는 JSON만 통과시킵니다. 프레임워크
banner나 기존 평문 출력은 원문을 버리고 `runtime.unstructured.output` 고정
JSON으로 바꾸므로 query, API 응답, 오류 메시지·스택이 컨테이너 로그로 새지
않습니다. 이미지 기본 build는 실제 entrypoint와 standalone server를 실행해
marker가 첫 레코드이고 이후 모든 레코드가 `http_access_json_v1` JSON인지
검사합니다.

launcher는 access/application별 exact key와 값, RFC3339 timestamp, 제한된
route·상태·수명주기 전이만 허용하고, 통과한 JSON도 다시 직렬화해 중복 키의 숨은
값까지 제거합니다. stdout이 밀리면 child의 두 출력 stream을 함께 멈췄다가
`drain` 뒤 재개합니다. 계약 밖 출력은 1초 구간당 한 JSON으로 합치며
stdout/stderr별 개수는 각각 1,024에서 포화시켜 메모리와 출력 증폭을 제한합니다.
브라우저와 Node trace export는 현재 `not_expected`이므로 access, application,
suppression 모든 envelope는 `trace_id`와 `span_id`를 정확히 한 번씩 포함하고 두
값을 항상 빈 문자열로 둡니다. launcher는 누락, 비어 있지 않은 값, 한쪽만 있는
pair를 모두 거부합니다.

캐시 초기화 수명주기 역시 `http_access_json_v1` envelope와
`log_category=application`을 사용합니다. 초기화 오류는 오류 객체·메시지·스택을
직렬화하지 않고 `error_type`의 제한된 분류만 기록합니다.

## 접근 로그 계약

접근 로그 스키마는 `http_access_json_v1`입니다. 모든 접근 로그는 다음 필드를
가집니다.

- `@timestamp`, `message`, `severity_text`
- `log_schema`, `log_category`
- `trace_id`, `span_id` (현재는 둘 다 빈 문자열)
- `service_name`, `service_namespace`, `service_version`, `service_instance_id`,
  `deployment_environment_name`
- `event_name`, `event_action`, `event_outcome`
- `http_method`, `http_route`, `http_status_code`, `duration_ms`

`http_route`는 원본 URL이 아니라 제한된 route template입니다. 등록되지 않은
경로는 `/_unmatched`, 파싱할 수 없는 경로는 `/_invalid`로 기록합니다. query,
fragment, userinfo, 요청·응답 header와 body, 클라이언트 주소는 수집하지
않습니다. Kubernetes probe 요청은 접근 로그에서 제외해 정상 상태 점검이 로그
대부분을 차지하지 않게 합니다.

현재 프런트엔드 범위는 stdout 접근 로그입니다. 브라우저 RUM과 Node trace/metric
export는 아직 연결하지 않았으므로, 별도 설계와 개인정보 검토 없이 이 문서의 완료
범위로 간주하지 않습니다.

## 리소스 식별자

dev/prod Pod는 아래 식별자를 모두 제공해야 합니다. 하나라도 비어 있거나 `local`,
`none`, `null`, `unknown`, `unset`, `unknown_service:*` 같은 임시값이면 서버
초기화를 중단합니다. Kubernetes 밖의 `local`/`test` 실행만 안전한 기본값을
허용합니다.

| 관측 필드                     | 값 또는 출처                                               |
| ----------------------------- | ---------------------------------------------------------- |
| `service.name`                | `seoul-fit-frontend`                                       |
| `service.namespace`           | `seoul-fit`                                                |
| `service.version`             | 배포 이미지의 고정 `sha256` digest                         |
| `service.instance.id`         | Downward API의 Pod UID                                     |
| `deployment.environment.name` | Pod의 `app.kubernetes.io/environment` label (`dev`/`prod`) |

Kubernetes Deployment 이름 `seoul-fit-fe`는 선택 필드 `workload_name`으로만
기록하며 서비스 식별자로 사용하지 않습니다. overlay는 이미지 digest와
`service.version` annotation을 같은 값으로 갱신해야 합니다.

## 검증과 배포 전제

```bash
npm test -- --runInBand src/shared/lib/observability/__tests__/http-access-log.test.ts
npm run test:runtime
npm run type-check
python3 infra/scripts/validate_observability_contract.py
docker build -t seoul-fit-fe-observability-contract .
kubectl kustomize infra/k8s/seoul-fit-fe/overlays/dev >/dev/null
kubectl kustomize infra/k8s/seoul-fit-fe/overlays/prod >/dev/null
```

실제 HTTP 요청 테스트는 민감한 query, userinfo, header, request/response body를
보내고 stdout JSON 어디에도 그 sentinel이 없음을 확인합니다. 매니페스트 검사는
각 환경의 이미지 digest와 버전이 일치하고, Pod UID와 환경 label이 Downward API로
연결되며, 기존 `BACKEND_INTERNAL_URL`이 유지되는지 검사합니다.

배포하려면 변경이 포함된 새 프런트엔드 이미지를 먼저 빌드하고, 각 overlay의
이미지 digest와 `service-version`을 그 digest로 함께 갱신해야 합니다. 이
저장소의 Argo CD Application은 manual sync이므로 검증된 Git 변경 이후 별도 정상
sync가 필요합니다.
