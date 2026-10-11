---
class: current
owner: frontend
last_verified: 2026-10-11
---

# Seoul Fit 접근성 검증 체크리스트

검증일: 2026-10-11 (리디자인 셸, 브랜치 `feat/ui-redesign-portfolio`) 대상: 홈
지도 탐색 흐름(헤더 검색, 카테고리 칩, 마커·클러스터, 상세 패널, 설정 시트,
모바일 바텀시트) 기준: WCAG 2.2 AA의 키보드·포커스·이름/역할/상태·대비 항목
결과: 헤드리스 Chromium 프로브 통과, 실사용 스크린리더·200% 확대는 미평가. 이전
검증(2026-07-25, 구 셸)은 이 문서로 대체한다.

## 자동 회귀 검증 (Jest + Testing Library)

- [x] 장소 탐색 패널의 region 이름, 거리·지역 combobox, 버튼 이름과 비어 있는
      상태 문구가 노출된다.
- [x] 설정 시트(dialog)는 닫혀 있을 때 접근성 트리에 없고, 열면 닫기 버튼으로
      포커스가 이동하며 Escape로 닫힌다.
- [x] 한국어·영어 전환이 저장되고 `html[lang]`과 live region이 갱신된다.
- [x] 푸터 링크의 이름과 외부 링크 속성이 유지된다.

근거 테스트:

- `src/features/place-filter/ui/__tests__/PlaceExplorerPanel.accessibility.test.tsx`
- `src/shared/ui/layout/__tests__/SideBar.test.tsx`
- `src/shared/i18n/__tests__/I18nProvider.test.tsx`
- `src/shared/ui/layout/__tests__/SiteFooter.test.tsx`

## 실제 Chromium 키보드·접근성 트리 검증 (헤드리스, 1280×800)

프로브 스크립트는 세션 스크래치패드의 `a11y_probe.py`이며 결과 JSON은 소유자
검토 폴더 `D:\download\project\seoul-fit-fe\2026-10-11-ui-ux-redesign\`에 사본이
있다.

- [x] 페이지 진입 후 첫 Tab이 `지도와 장소 결과로 건너뛰기`에 도달하고, Enter가
      `main#main-map`(이름 `지도와 장소 결과`)으로 포커스를 옮긴다.
- [x] 지도 컨테이너는 `role="application"`과 조작 안내가 담긴 이름을 가지며,
      마커는 `role="button"`과 시설명·카테고리 이름을 가진다(프로브 시점 20개).
- [x] 헤더 검색은 이름 `장소와 조건 검색`의 combobox다. 입력 시 listbox
      1개·option 41개가 노출되고, ArrowDown이 `aria-activedescendant`를
      갱신하며, Escape가 listbox를 닫는다.
- [x] `설정 열기`를 누르면 dialog 1개가 생기고 `메뉴 닫기`가 활성 포커스가 된다.
      Tab 25회 동안 포커스가 dialog 안에 머물고, Escape 후 dialog가 제거되며
      `설정 열기`로 복귀한다.
- [x] 랜드마크는 `main(지도와 장소 결과)`, `header`, `aside(장소 탐색 패널)`이고
      문서 언어는 `ko`다. 제목은 h1(서울 공공시설 지도) → h2(지도 안 N곳 /
      시설명) → h3(섹션) 순서다.
- [x] 카카오 SDK가 그리는 저작권 링크에는 마운트 후 `aria-label`을 부여해 빈
      링크로 읽히지 않는다.
- [x] 지도 SDK를 읽지 못한 상태는 이름 있는 alert와 `지도 다시 불러오기`
      버튼으로 전달된다.
- [x] 모바일(390×844)에서 헤더의 메뉴·검색이 터치로 동작하고, 바텀시트 손잡이
      (`패널 크기 조절`)가 peek → half → full을 순환한다.

## 색상·시각 설정 점검

`app/globals.css`의 HSL 토큰으로 WCAG 상대 명도 대비를 계산했다(2026-10-11).

| 조합                                 | 라이트 |  다크 |
| ------------------------------------ | -----: | ----: |
| foreground / background              |  16.28 | 16.63 |
| muted-foreground / background        |   5.39 |  8.11 |
| primary-foreground / primary         |   5.57 |  7.21 |
| primary / background (링크·아이콘)   |   5.32 |  7.19 |
| live-foreground / live (실시간 배지) |   5.02 |  5.96 |

- [x] 본문·보조 텍스트·버튼 텍스트 모두 AA 4.5:1 이상이다.
- [x] 키보드 포커스는 색 외에 `focus-visible` ring으로 구분된다(지도 컨테이너는
      inset ring).
- [x] 혼잡·신선도·운영 상태는 색만이 아니라 텍스트 배지로 함께 표시된다.
- [x] `prefers-reduced-motion`에서는 진입 애니메이션을 끄고 필수 페이드만
      남긴다.
- [x] 확대를 막는 viewport 설정이 없다.

## 미평가·재검증 항목

- 브라우저 200% 확대에서 헤더·칩·상세 패널의 가로 스크롤과 가림 여부
- VoiceOver 또는 NVDA로 검색 결과 → 상세 → 주요 CTA 한 차례 확인
- `forced-colors` 모드의 마커 글리프·선택 상태(토큰은 정의했으나 실기기 확인
  없음)
- 배포 환경에서 카카오 지도 기본 컨트롤(확대·축소는 자체 버튼으로 대체)의 접근
  가능한 이름
