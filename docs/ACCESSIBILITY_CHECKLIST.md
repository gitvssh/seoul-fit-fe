# Seoul Fit 접근성 검증 체크리스트

검증일: 2026-07-25
대상: 홈 지도 핵심 탐색 흐름과 우측 설정 dialog
기준: WCAG 2.2 AA 핵심 키보드·포커스·상태 전달 항목
결과: 로컬 릴리스 게이트 통과

## 자동 회귀 검증

- [x] 닫힌 사이드바 dialog가 접근성 트리에 존재하지 않는다.
- [x] dialog를 열면 닫기 버튼으로 포커스가 이동한다.
- [x] Tab·Shift+Tab 포커스가 열린 dialog 안에서 순환한다.
- [x] Escape로 dialog를 닫고 열기 버튼으로 포커스가 복귀한다.
- [x] 장소 필터 목록의 checkbox·button 이름과 상태가 노출된다.
- [x] 한국어·영어 전환이 저장되고 `html[lang]`과 live region이 갱신된다.
- [x] `prefers-reduced-motion`에서는 비필수 애니메이션을 제거한다.
- [x] `forced-colors`에서는 포커스·경계·선택 상태를 시스템 색상으로 보존한다.

근거 테스트:

- `src/shared/lib/hooks/__tests__/useFocusTrap.test.tsx`
- `src/shared/ui/layout/__tests__/SideBar.test.tsx`
- `src/features/place-filter/ui/__tests__/PlaceExplorerPanel.accessibility.test.tsx`
- `src/shared/i18n/__tests__/I18nProvider.test.tsx`

## 실제 Chromium 키보드·접근성 트리 검증

- [x] 페이지 진입 후 첫 Tab이 `지도와 장소 결과로 건너뛰기`에 도달한다.
- [x] 건너뛰기 링크의 Enter가 `main#main-map`으로 포커스를 옮긴다.
- [x] header의 검색은 이름이 있는 combobox이고 결과는 listbox로 노출된다.
- [x] 사이드바가 닫혀 있을 때 dialog 노드가 없다.
- [x] `Open menu`를 누르면 `Map marker settings` dialog와 `Close menu` 활성
  포커스가 생성된다.
- [x] Escape를 누르면 dialog가 제거되고 `Open menu`가 다시 활성 포커스가 된다.
- [x] 영어 전환 시 건너뛰기 링크, 검색, 지도 제어, 필터, 추천, 활동 계획,
  시설 수, 사이드바 카테고리·설명이 영어로 바뀐다.
- [x] 지도 SDK를 읽지 못한 상태도 이름이 있는 alert와 `Reload` 버튼으로
  전달된다.

## 색상·시각 설정 점검

핵심 텍스트·버튼 조합의 WCAG 상대 명도 대비를 샘플 계산했다.

| 조합 | 대비 |
|---|---:|
| gray-800 / white | 14.68:1 |
| blue-800 / blue-100 | 7.15:1 |
| gray-700 / blue-50 | 9.47:1 |
| gray-900 / yellow-400 | 11.58:1 |
| white / blue-600 | 5.17:1 |

- [x] 일반 텍스트 AA 기준 4.5:1 이상이다.
- [x] 키보드 포커스는 색상 외 ring·outline으로도 구분된다.
- [x] 혼잡·신선도 상태는 색상만이 아니라 텍스트로 함께 표시된다.
- [x] 확대를 막는 viewport 설정이 없다.

## 검증 환경과 외부 연결 게이트

로컬 프로덕션 빌드에는 의도적으로 Kakao 지도 키, 공공데이터 키,
`BACKEND_INTERNAL_URL`을 주입하지 않았다. 따라서 지도 SDK와 일부 데이터 요청은
실패했지만, 실패 상태의 접근 가능한 alert·재시도 동작과 나머지 UI 흐름을
검증할 수 있었다.

실제 배포 연결 후에는 다음 smoke check만 다시 수행한다.

- 대표 모바일·데스크톱 브라우저에서 지도 제어의 키보드 접근 확인
- VoiceOver 또는 NVDA로 검색 결과 → 상세 → 주요 CTA 한 차례 확인
- 외부 지도 SDK가 만든 control의 접근 가능한 이름 확인
- 200% 확대에서 헤더·필터·상세 패널의 가로 스크롤과 가림 확인

이는 외부 연결 결과에 대한 재검증이며, 현재 로컬 기능 구현의 미완료 항목은
아니다.
