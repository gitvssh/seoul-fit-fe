---
class: current
owner: frontend
last_verified: 2026-10-11
---

# Seoul Fit 디자인 시스템

서울핏 화면이 공유하는 시각 언어와 조작 규칙의 정본이다. 값의 정본은
`app/globals.css`(CSS 변수)와 `tailwind.config.js`(클래스 이름)이고, 이 문서는 역할과
사용 규칙을 설명한다. 근거 조사는 [`docs/research/2026-10-ui-ux/`](research/2026-10-ui-ux/README.md)에 있다.

## 1. 방향 결정 기록 (2026-10-11)

| 항목 | 내용 |
| --- | --- |
| 과업 | 서울 공공시설·실시간 도시데이터를 지도에서 탐색해 "지금 갈 곳"을 고르는 생활 의사결정 도구 |
| 사용자·기기 | 서울 시민·방문객, 모바일 390px 우선, 데스크톱 병행, 한국어 기본·영어 병행 |
| 비교 후보 | A. 지도 유틸리티 골격(Google·Naver·Kakao 지도: 라이트 타일 + 흰 solid 표면 + 단일 브랜드 색 + 카테고리 색 마커) · B. 단일 브랜드색 대면적(Citymapper식) · C. 소프트 톤·사진 의존(Airbnb 2025식) |
| 선택 | **A "한강 블루 유틸리티"** — A의 골격에 KRDS 한국어 가독성 수치, Pretendard, 색 2개(primary 한강 블루, live 스카이코랄 계열), 글리프 필수 9색 카테고리를 얹는다. Airbnb에서는 검색 pill 규모와 플래너 타임라인 카드만 가져온다. |
| 이유 | 지도 서비스의 신뢰감은 장식이 아니라 상태의 정직함에서 나온다. 9개 카테고리·4단계 상태색과 충돌하지 않으려면 브랜드 색은 적어야 한다. 사진 자산이 없는 공공데이터 서비스에서 소프트 톤은 장식으로 읽힌다. |
| 대안의 제약 | B는 카테고리·상태색과 충돌, C는 사진 없이는 빈약해 보임. 서울서체는 공공누리 유형이 두 공식 페이지에서 상충해 웹폰트로 쓰지 않는다. |
| 선택 주체 | 사용자가 "그럴듯하고 멋지게"로 위임 → 에이전트 결정. 같은 선택에 재승인을 요구하지 않는다. |
| 재검토 조건 | 핵심 과업이 바뀌거나(예: 예약·결제 중심), 브랜드 자산이 생기거나, 사용자가 다른 방향을 요청할 때 |

## 2. 색 역할

모든 색은 `hsl(var(--토큰))`을 감싼 Tailwind 클래스로만 쓴다. `bg-blue-500`·`text-gray-600`·hex 리터럴은
새 코드에 쓰지 않는다(지하철 노선색 `subway-colors.ts`만 예외).

| 역할 | 클래스 | 라이트 | 다크 | 규칙 |
| --- | --- | --- | --- | --- |
| 앱 셸 배경 / 본문 잉크 | `bg-background` / `text-foreground` | #F9FAFB / #161C27 | #101319 / #F0F2F5 | 패널·페이지 배경 |
| 카드·시트·목록 | `bg-card text-card-foreground` | #FFFFFF | #181D25 | 텍스트가 있는 표면은 항상 solid |
| 지도 위 부유 표면 | `bg-surface-elevated` + `shadow-float-*` + `border-border` | #FFFFFF | #212630 | pill·칩·컨트롤·마커 라벨. 다크에서는 1px 테두리 필수 |
| 글라스 띠 | `.surface-glass` | 흰색 84% + blur | 어두운 84% + blur | 헤더 띠·칩 행에만. 텍스트 본문에 쓰지 않음 |
| 주 행동·선택·링크 | `bg-primary text-primary-foreground`, `text-primary` | #086ABA | #47A7F5 | 한강 블루. 화면당 주 행동 1~2개 |
| 선택 칩·hover 틴트 | `bg-accent text-accent-foreground` | #E5F4FF / #085391 | #19364D / #94CCF9 | |
| 보조 텍스트 | `text-muted-foreground` | #5C687A | #A4ACB7 | 메타·캡션 |
| 장식 구분선 | `border-border` | #DAE0E7 | #2C313A | 컴포넌트 경계로 쓰지 않음(대비 1.3:1) |
| 입력 테두리 | `border-input` | #7F8C9F | #677183 | 3:1 경계 대비 |
| 포커스 링 | `focus-visible:ring-ring/50` (프리미티브 내장) | #097DDC | #47A7F5 | 전역 `:focus-visible` outline과 같은 색 |
| 성공·운영 중·여유 | `success` / `success-soft` | #178250 | #33CC85 | 배지는 soft, 버튼·점은 solid |
| 주의·지연·보통 | `warning` / `warning-soft` | #B35C05 | #FAB62E | |
| 정보 | `info` / `info-soft` | primary와 동일 hue | | |
| 서울 지금·진행 중 | `live` / `live-soft` | #DD0E3B | #F65A7C | 실시간 값에만. `live-brand`(#F8496C)는 점·그라디언트 장식 전용 |
| 파괴·오류 | `destructive` | #D11A29 | #ED5A66 | |

### 카테고리 색 (`src/shared/lib/icons/facility.tsx` 단일 소스)

| 카테고리 | 클래스 | 채움 | 글리프 | lucide |
| --- | --- | --- | --- | --- |
| 공원 `park` | `bg-cat-park` / `text-cat-park-text` | #208858 | 흰색 | Trees |
| 도서관 `library` | `bg-cat-library` | #6549D4 | 흰색 | Library |
| 문화시설 `culture` | `bg-cat-culture` | #A22DB4 | 흰색 | Theater |
| 문화행사 `cultural_event` | `bg-cat-event` | #F00F47 | 흰색 | CalendarDays |
| 문화예약 `cultural_reservation` | `bg-cat-event` (색 공유) | #F00F47 | 흰색 | Ticket |
| 무더위쉼터 `cooling_shelter` | `bg-cat-cooling` | #0A91C2 | 흰색 | Snowflake |
| 맛집 `restaurant` | `bg-cat-restaurant` | #EB5C0A | 흰색 | UtensilsCrossed |
| 체육시설 `sports` | `bg-cat-sports` | #F5AF00 | **잉크** | Dumbbell |
| 따릉이 `bike` | `bg-cat-bike` | #6FA71B | **잉크** | Bike |
| 지하철 `subway` | `bg-cat-subway` | #485470 | 흰색 | TrainFront (노선 배지는 노선색) |

9색은 색각이상에서 완전히 분리되지 않는다(최약 쌍 ΔE≈10.7). **글리프·텍스트 라벨·숫자가 1차 신호이고 색은 보조 신호**다.
마커 안에는 글자를 넣지 않고 이름 라벨은 마커 밖 흰 칩에 둔다.

## 3. 타이포그래피

- 서체: Pretendard Variable(npm `pretendard`, dynamic subset 92조각, `app/layout.tsx`에서 import). 폴백 `Pretendard Fallback`은 hhea 메트릭(95.2% / 24.1%)을 맞춰 CLS를 줄인다.
- 스케일(클래스): `text-display` 28/36 · `text-title` 20/28(장소명·시트 제목) · `text-section` 17/24 · `text-body` 15/22 · `text-body-sm` 14/20 · `text-label` 13/18(칩·배지) · `text-caption` 12/16(메타 전용, 최소).
- 굵기 400/500/600/700만 쓴다. 이탤릭 없음(`font-synthesis: none`).
- 본문 `word-break: keep-all; overflow-wrap: anywhere`(전역). 시간·거리·대수·점수는 `tabular-nums`.
- 메타 구분자는 ` · `, 단위는 붙여 쓴다(`1.2km`, `3분`, `17°`).

## 4. 형태·엘리베이션·모션

| 요소 | 반경 | 그림자 |
| --- | --- | --- |
| 칩·배지 | `rounded-sm` 8px | 없음 |
| 버튼·입력 | `rounded-md` 10px | `shadow-sm` |
| 카드·목록 | `rounded-lg` 12px | `shadow-float-sm` |
| 바텀시트 상단·다이얼로그 | `rounded-xl` 16px | `shadow-float-lg` |
| 검색 pill·부유 컨트롤 | `rounded-2xl` 24px / 원형 | `shadow-float-md` |
| 마커 | 원형 28px(선택 36px) | `shadow-marker` |

모션은 CSS만 쓴다. 길이 `duration-fast`(120ms) · `duration-base`(200) · `duration-sheet`(300) · `duration-exit`(160),
곡선 `ease-standard` · `ease-enter` · `ease-exit`. 시트 열기 300/닫기 200, 마커 선택 150, 칩 토글은 색만 120ms(scale 금지),
목록 진입은 첫 렌더와 프리셋 전환에만 `animate-fade-up`(stagger 30ms × 최대 8개). `prefers-reduced-motion`에서는 이동을 페이드로
바꾸고(`.motion-keep-fade`), 지도 이동은 `setCenter`로 대체한다.

## 5. 레이어 (z-index 토큰)

`z-map-status`(10) < `z-map-controls`(30) < `z-map-popover`(40) < `z-header`(50) < `z-sheet-overlay`(60) < `z-sheet`(61) <
`z-sidebar`(70) < `z-dialog`(80) < `z-toast`(90) < `z-skip-link`(100). Kakao 내부 998~1002는 `useMapMarkers`의 상수로만 다룬다.
숫자 z-index를 새로 쓰지 않는다.

## 6. 컴포넌트 규칙

- **Button**: `default`(주 행동) · `secondary` · `outline` · `ghost` · `link` · `float`(지도 위 컨트롤). 지도 컨트롤은 `size="icon-lg"`(44px)이고 반드시 `aria-label`을 가진다.
- **Badge**: 상태는 `success`/`warning`/`info`/`live`/`muted`(soft). 색만으로 뜻을 전달하지 않고 라벨을 같이 쓴다.
- **칩(필터·프리셋)**: 라벨은 상태와 무관하게 고정("공원 132"), 선택은 색 + 체크 아이콘 + `aria-pressed`. 높이 36~40px, 가로 스크롤 행은 `edge-fade-x` + `snap-x`.
- **시트·패널**: 모바일은 비모달 3단 스냅 바텀시트(peek 기본, 지도 조작 유지), 데스크톱은 좌측 solid `<aside>` 400px. 탐색과 상세는 같은 호스트의 두 콘텐츠다.
- **마커**: 원형 28px, 2px 흰 링 + 1px 헤어라인, 글리프 14px. 선택 36px + primary 링 + 이름 라벨 칩. 클러스터 36/44/52(건수 <10/<100/≥100). 상태는 `dataset`과 `overlay.setZIndex()`로만 바꾼다.
- **다이얼로그**: 진짜 모달(로그아웃·경고·설정)만 Radix Dialog + 포커스 트랩 + Escape.
- **토스트**: `sonner`(`containerAriaLabel="알림"`). 복구가 필요한 오류는 토스트가 아니라 인라인 배너 + 복구 버튼.

## 7. 상태와 문구

- 모든 데이터 영역은 로딩·빈·오류·권한 거부·오래됨 상태를 가진다. 실패를 성공처럼 꾸미지 않고, 실패한 섹션은 숨기거나 하나의 일관된 배너로 알린다.
- "실시간"은 원천 갱신 시각이 있고 정상 범위일 때만 쓴다. 신선도 라벨은 `freshness.*` 키(`실시간/최근 갱신/갱신 지연/기준 시각 미확인`)와 공통 임계값만 쓴다.
- 위치 권한 거부는 오류가 아니라 정상 경로다: "위치 권한이 꺼져 있어 서울시청 주변을 보여드려요" + 켜는 방법.
- 문구는 `src/shared/i18n/messages/<도메인>.ts`에 ko/en 함께 둔다. 용어: 사용자 대면 "장소", 설정 "카테고리", 보관 "저장".
- 고객 화면에 내부 검수 결과·정책 준수 선언·에이전트 설명을 넣지 않는다.

## 8. 접근성·반응형

- 터치 타깃 44px, 포인터 타깃 최소 24px. 아이콘 버튼은 `aria-label` 필수.
- 포커스는 프리미티브의 `focus-visible` 링만 쓴다(`focus:` 변형 금지).
- 지도 마커는 Tab 순서에서 제외(`tabindex=-1`)하고 선택 마커만 `aria-current`. 키보드·스크린리더 경로는 검색·목록·시트다.
- 드래그 기능에는 단일 포인터 대안(핸들 버튼 탭 = 단계 순환)을 둔다.
- 390/768/1440에서 가로 스크롤 없음, 긴 이름·주소·숫자 밀집에서 잘림 없음.

## 9. 다크 모드

`class` 전략(`<html class="dark">`)이며 `src/shared/lib/theme`의 inline script가 첫 페인트 전에 적용한다.
지도 타일은 기본 라이트이고, "지도도 어둡게"는 사용자 설정의 opt-in(`data-map-dark="true"`, 타일 레이어만 반전)이다.
새 컴포넌트는 `dark:` 변형 없이 토큰만으로 다크가 되어야 한다.

## 10. 검수

UI 변경 묶음마다 [제품 UI/UX 정책](https://github.com/gitvssh/seoul-fit-fe/blob/master/docs/DESIGN_SYSTEM.md)의 관점(기획·흐름, 위계·구성, 기능·문구, 상태·회복, 일관성·반응형, 접근성, 필요한 정보)을
`충족 / 수정 필요 / 미평가 / 해당 없음`으로 기록한다. 브라우저 검수는 headless 스크린샷과 DOM으로 한다. 정적 검토만으로 동작 통과를 적지 않는다.
