# 서울핏 프런트엔드 — 앱 셸·패널·보조 페이지 코드 감사 (지도 코어 제외)

- 대상 저장소: `/home/lsh/dev/side/seoul-fit-fe`, HEAD `da98ea5` (commit date 2026-09-28, 감사일 2026-10-11), working tree clean, read-only 감사.
- 모든 인용은 저장소 루트 기준 `경로:라인`이다. 도구 검증 결과(아래 §0.1)는 실제 실행 결과이며, 브라우저 렌더링은 수행하지 않았다(§7 Gaps 참고).
- 용어: "셸" = `app/layout.tsx` → `app/page.tsx` → `MainApp` → `Header`/`SideBar`; "패널" = `PlaceExplorerPanel`(+`ActivityPlanner`), `EngagementPanel`; "보조 페이지" = `/places/**`, `/profile`, `/auth/**`, `/home`(Pages Router).

## 0. 우선순위 결함 표

### 0.1 검증 도구 실행 결과 (근거)

| 명령 | 결과 |
|---|---|
| `npm run type-check` | exit 0 (오류 없음) |
| `npx jest HomeLanding SideBar PlaceExplorerPanel AuthProvider I18nProvider checkbox toast robots sitemap seo notificationStore authStore useFocusTrap` | 42 suites / 276 tests 모두 통과, Snapshots 0 |
| `npx eslint <scope>` | 0 errors / 27 warnings (파일별 목록은 §5.4) |
| `npx prettier --check <scope>` | 44개 파일 형식 불일치 (exit 1) — `npm run format:check`가 실패하는 상태 |
| Tailwind 3.4.19 CLI로 `app/globals.css` 컴파일 (`npx tailwindcss -c tailwind.config.js -i app/globals.css`) | `.shadow-xs`, `.outline-hidden`, `.rounded-xs`, `.animate-in`, `.fade-in-0`, `.zoom-in-95`, `.slide-in-from-*`, `.max-h-(--radix…)`, `.origin-(--radix…)`, `.has-data-*` 모두 **0건 생성**; `tw-animate-css`의 `@theme inline`/`@utility` 블록 51개가 CSS에 그대로 통과(브라우저 무시). 반면 `.hover\:bg-primary\/90{background-color:hsl(var(--primary) / 0.9)}`, `.has-\[\>svg\]`, `.size-9`, `.text-\[11px\]` 는 정상 생성 |

### 0.2 결함 표 (P0 치명 → P3 사소)

| ID | 심각도 | 파일:라인 | 증상 / 사용자 영향 | 원인 | 수정 제안 | 관련 테스트 |
|---|---|---|---|---|---|---|
| D01 | **P1 (조건부 P0)** | `src/shared/ui/layout/SideBar.tsx:226-235`, `app/profile/page.tsx:335-342`, `next.config.ts:22-29` | 프로필 이미지가 있는 로그인 사용자가 메뉴를 열거나 `/profile`에 들어가면 `next/image`가 "hostname is not configured" 오류를 던져 클라이언트 전체가 에러 화면으로 떨어질 수 있음 | `images.remotePatterns`에 `culture.seoul.go.kr`만 등록, 카카오 CDN(`*.kakaocdn.net` 등) 미등록. `unoptimized`/custom loader 사용 없음(grep 0). `oauth-flow.ts:30`은 값이 없으면 `''`로 대체하므로 백엔드가 실제 URL을 돌려줄 때만 발생 | `remotePatterns`에 카카오 CDN 추가 또는 프로필 아바타는 `<img referrerPolicy="no-referrer">`/`unoptimized`로 전환; 백엔드 `profileImageUrl` 실제 값 확인 | 없음(갭) |
| D02 | **P1** | `src/features/place-filter/ui/PlaceExplorerPanel.tsx:122-125`, `src/widgets/map-container/ui/MapView.tsx:745-778`, `MapControls.tsx:150,182`, `MapStatusIndicator.tsx:59,67` | 모바일(≤768px)에서 탐색 패널이 지도를 거의 다 덮는다. `absolute left-3 right-3 top-14 max-h-[calc(100%-7rem)]`이며 내용(지역 select, 서울 지금 카드, 필터 chip, 추천 preset+3건, 활동 계획, 목록 ≤100건)이 항상 렌더링됨. 390×844 기준 main 높이 772px → 패널 y≈56~716px, 지도는 하단 56px만 노출되고 `bottom-24`의 지도 컨트롤(y 676~716)과 겹침. 패널 자체를 접는 조작이 없음(목록 toggle만 존재 :162-177) | 데스크톱용 floating 카드를 모바일에 그대로 적용 | 모바일은 snap point가 있는 bottom sheet(접힘/반/전체)로 전환, 활동 계획·추천은 탭으로 분리, md 이상은 좌측 side panel 고정 | `PlaceExplorerPanel.accessibility.test.tsx`가 region 이름 '장소 탐색 필터와 목록', combobox '최대 거리'·'지역 바로가기'(option `gangnam`), button '내 생활'·'목록 닫기'(aria-expanded), 빈 상태 문구를 고정 |
| D03 | **P1** | `src/widgets/header/ui/Header.tsx:594,651` | 폰에서 언어 전환 버튼과 '장소 둘러보기' 링크가 `hidden sm:inline-flex`로 사라져 영어 전환·공개 목록 진입 경로가 없음. 사이드 메뉴에도 내비게이션 링크가 없음(`src/shared/ui/layout/SideBar.tsx` 전체) | 반응형 처리가 "숨김"뿐 | 메뉴(SideBar) 하단에 언어·장소 둘러보기·프로필 항목 추가, 또는 overflow 메뉴 | `SideBar.test.tsx`(dialog 이름·닫기 버튼 포커스) |
| D04 | **P1** | `Header.tsx:516-525` | 최근 검색 삭제 버튼이 `opacity-0 group-hover:opacity-100 focus:opacity-100` → hover가 없는 터치 기기에서 보이지 않아 기록 삭제 불가 | hover 전용 노출 | 터치 환경(`@media (hover:none)`)에서는 항상 표시, 또는 swipe/long-press 대안 | 없음 |
| D05 | **P1** | `pages/home/index.tsx:18-85`, `pages/_app.tsx:1-14`, `src/shared/lib/observability/http-access-log.ts:25`, `app/robots.ts:21` | Pages Router의 `/home`이 실제 라우트로 노출됨(접근 로그 패턴에도 `/home` 존재). 검색 콜백이 `() => {}`(:58-59)라 검색이 죽어 있고, `activeCategories`를 `Object.keys(preferences)`('language','theme','preferredCategories')로 계산해 카테고리 토글이 틀림(:72-76), `console.log`(:46), Suspense/SEO/skip link 없음, robots disallow·sitemap 어디에도 없음 → 크롤 가능한 중복·고장 홈 | 마이그레이션 잔재 | `pages/` 디렉터리 삭제(두 파일 모두) 또는 `/home → /` redirect; 삭제 시 Pages Router 번들·`_app` 이중 Provider도 제거됨 | `app/__tests__/robots.test.ts`가 disallow 목록을 고정(목록을 바꾸면 테스트 수정) |
| D06 | **P1** | `app/globals.css:1`, `package.json`(`tw-animate-css ^1.3.6`, `tailwindcss ^3.4.19`), `src/shared/ui/dropdown-menu.tsx:36,204`, `src/shared/ui/sheet.tsx:33,55-63` (지도 코어: `CongestionPanel.tsx:27`, `WeatherPanel.tsx:26`, `FacilityBottomSheet.tsx:754`) | 드롭다운·시트·패널 enter/exit 애니메이션이 전혀 적용되지 않음(열림이 뚝 끊김) | `tw-animate-css`는 Tailwind v4 전용 문법(`@theme inline`, `@utility`). v3 파이프라인에서 유틸리티가 생성되지 않음(§0.1 컴파일 증거) | v3 유지 시 `tailwindcss-animate` 플러그인으로 교체, v4 전환 시 그대로 사용 — 단일 결정 필요 | 없음 |
| D07 | **P1** | `src/shared/ui/button.tsx:12-17`, `switch.tsx:13`, `dropdown-menu.tsx:36,64,82,113,185,204`, `sheet.tsx:69`, `card.tsx:23`, `alert.tsx:7` | shadcn 프리미티브가 Tailwind v4용 레지스트리 버전이라 v3에서 조용히 깨짐: `shadow-xs` 미생성(버튼·스위치 그림자 없음), `outline-hidden` 미생성(드롭다운 항목에 브라우저 기본 outline + 전역 `:focus-visible` outline 이중 표시), `rounded-xs` 미생성, `max-h-(--radix…)`/`origin-(--radix…)` 미생성(가용 높이 제한 없음), `has-data-[slot=card-action]`·`@container/card-header` 미생성, `alert.tsx:7`의 `calc(var(--spacing)*4)`는 v3에 `--spacing`이 없어 아이콘 열이 `grid-cols-[0_1fr]`로 떨어져 아이콘·본문 겹침 | 프리미티브 세대 혼재: `input.tsx`·`checkbox.tsx`는 v3 세대(forwardRef, `h-10`, `ring-offset-background`), 나머지는 v4 세대 | Tailwind v4 전환 + shadcn v4 토큰(`@theme`) 채택, 또는 v3용 프리미티브로 재생성. 어느 쪽이든 §2.4 체크리스트 전체를 한 번에 | `src/shared/ui/__tests__/checkbox.test.tsx`(role, `custom-class` 전달, disabled, 제어 모드) |
| D08 | P2 | `src/widgets/main-app/ui/MainApp.tsx:8,37-41,95,97-105` | 지도 오류 Alert 분기가 절대 렌더링되지 않음(`mapStatus`에 setter 없음) — 사용자는 지도 오류를 `MapView.tsx:643` 경로로만 봄. `SideBar` import(:8)·`FacilityCategory`(:14)·`refreshPreferences`(:29) 미사용, 빈 주석 `{/* 사이드바 */}`(:95) | 리팩터링 잔재 | 죽은 분기·import 제거, 오류 표시는 MapView 한 곳으로 | ESLint warning 5건 |
| D09 | P2 | `app/`(루트에 `error.tsx`·`not-found.tsx`·`loading.tsx` 없음, `ls app` 확인), `app/places/[category]/page.tsx:45-49`, `app/places/[category]/[id]/page.tsx:60-62`, `src/shared/lib/seo/public-places.ts:84-99` | 404·런타임 오류가 Next 기본 영문 화면으로 노출. 백엔드 일시 장애 시 `requestPublicData`가 `null`을 돌려주고 페이지는 `notFound()` → 사용자·크롤러 모두에게 "없는 페이지"로 보임 | 실패와 미존재를 구분하지 않음 | `requestPublicData`에서 네트워크/5xx는 throw → segment `error.tsx`(재시도 버튼)로, 404만 `notFound()`; 브랜드 `not-found.tsx`·`loading.tsx` 추가 | `sitemap.test.ts`는 `getPublicPlaceSitemapEntries` mock만 사용 — 영향 없음 |
| D10 | P2 | `Header.tsx:380-402,425-432,449-455,491-527,541-547` | 검색 combobox/listbox ARIA 조합이 깨져 있고 키보드가 불완전: `role='listbox'` 안에 `div role='presentation'` + 삭제 `<button>`(option 아님)이 섞임, 모든 option이 `aria-selected='false'` 고정, ArrowDown은 `document.querySelector`로 첫 option에 포커스만 옮기고 option 간 Up/Down 이동·`aria-activedescendant` 없음, `aria-controls`가 닫힌 상태에서 존재하지 않는 id를 가리킴 | 수작업 ARIA | combobox 패턴(activedescendant 또는 roving tabindex) 구현 또는 Radix/cmdk 기반으로 교체 | `docs/ACCESSIBILITY_CHECKLIST.md:30`가 "이름 있는 combobox + listbox" 동작을 명시 |
| D11 | P2 | `Header.tsx:281-294,303-308,646-652,691-695,704-711` | 알림 드롭다운: 로딩/빈 상태를 `DropdownMenuItem`(포커스 가능한 no-op 메뉴 항목)으로 렌더링, 알림 유형 아이콘이 색 점만(의미 전달 색상 의존), '알림이 없습니다'·'내 정보'·'방금 전/시간 전/일 전' 한국어 하드코딩(영어 모드에서도 한국어), 프로필 버튼이 `window.location.href='/profile'`(전체 새로고침)이고 `header.openProfile` 키는 정의만 있고 미사용 | 부분 i18n, 메뉴 컴포넌트 오용 | 로딩/빈 상태는 `DropdownMenuLabel`/일반 노드로, `Link href='/profile'` + `aria-label={t('header.openProfile')}`, 상대 시각은 `Intl.RelativeTimeFormat(locale)` | 없음 |
| D12 | P2 | `src/features/engagement/ui/EngagementPanel.tsx:226-230`, `src/shared/ui/layout/SideBar.tsx:101` | 비로그인 안내문 "왼쪽 메뉴에서 로그인해 주세요"가 틀림 — 로그인 버튼은 **오른쪽** 사이드 메뉴(`fixed inset-y-0 right-0`) 하단에 있고 메뉴 버튼도 헤더 우측(`Header.tsx:715-721`). 패널 안에 로그인 CTA 자체가 없음 | 레이아웃 변경 뒤 문구 미갱신 | 패널에 `onLogin` 전달해 인라인 '카카오 로그인' 버튼 제공, 문구 수정 | 없음 |
| D13 | P2 | `EngagementPanel.tsx:277,318`(`<a href="/?lat=…">`), `:251-254`(message) | 저장 장소·최근 장소 클릭이 전체 페이지 새로고침(지도 상태·패널 상태 소실). 성공/오류 메시지가 같은 회색 `role='status'` 한 줄에 섞여 오류를 구분할 수 없고 `role='alert'`가 없음 | `Link`/콜백 미사용, 단일 message state | `onPlaceSelect(lat,lng)` 콜백으로 지도 이동 + 패널 닫기; 오류는 `variant='destructive'` Alert | 없음 |
| D14 | P2 | `app/profile/page.tsx:169-196,272-281,294,353,358,313-320,417-437,569-580,583-586,606-613` | 비로그인 진입 시 '로딩 중...' 스피너 후 100ms+500ms 뒤 말없이 `/`로 튕김(안내 없음). `useAuthStore.getState()`를 render에서 읽어 닉네임·이미지가 갱신에 반응하지 않음. '서울 거주'·'활동중'은 데이터 없는 가짜 문구. 뒤로가기·수정·취소·저장 버튼이 아이콘 전용인데 `aria-label` 없음. '앱 설정'은 toast '준비 중' dead-end. 로그아웃이 LogoutModal을 거치지 않아 메인과 흐름이 다름. 회원탈퇴는 `confirm()` 2회 | 초기 프로토타입 잔재 | 로그인 필요 상태 화면(설명+카카오 로그인 CTA), 훅 기반 구독, placeholder 제거, 아이콘 버튼 레이블, 로그아웃 단일 경로, 탈퇴는 Dialog | 없음 |
| D15 | P2 | `src/shared/ui/auth/LogoutModal.tsx:21-57,62-68`, `src/shared/ui/warning-modal.tsx:13-33`, `MainApp.tsx:138-155` | 두 모달 모두 `role='dialog'`·`aria-modal`·`aria-labelledby`·포커스 트랩·Escape가 없고 닫기 X 버튼에 `aria-label` 없음. 로그아웃 성공 화면은 ✅ 이모지 + 2초 뒤 `window.location.href='/'` 강제 새로고침(try/catch 양쪽에 중복 코드). WarningModal 문구 '관심사'는 사이드바의 '마커/카테고리'와 용어가 다름 | 커스텀 div 모달 | 이미 의존성인 `@radix-ui/react-dialog`(sheet.tsx) 기반 Dialog로 통일, 성공은 toast/inline으로 | 없음 (`useFocusTrap.test.tsx`는 훅만 검증) |
| D16 | P2 | `src/features/auth/ui/LoadingStates.tsx:22,31,41`, `AuthCallback.tsx:49`, `src/features/auth/model/oauth-flow.ts:48`, `app/auth/error.tsx:6-55` | 로그인 처리 화면이 128px 스피너와 ✅/❌ 이모지(레이블 없음). 실패 시 3초 뒤 자동 홈 이동이라 느린 독자는 오류를 못 읽고 재시도 버튼이 없음. `app/auth/error.tsx`는 Next segment error boundary 파일인데 `error`/`reset` props를 무시하고 어떤 런타임 오류든 '로그인 실패'로 표시하며, `/auth/error` 경로로 이동하는 코드는 없음(grep 0) | 역할 혼동 | error boundary는 `reset()` 버튼 포함으로 정리, 콜백 실패는 자동 이동 대신 '다시 시도'·'홈으로' 버튼, 스피너·아이콘은 lucide로 통일 | 없음 |
| D17 | P2 | `app/page.tsx:20-22`, `src/widgets/map-container/ui/MapContainer.tsx:120`, `MapView.tsx:85`, `src/widgets/home-landing/ui/HomeLanding.tsx:16-50` | 서버 HTML은 `HomeLanding`(slate-50 배경, 제목·설명·6개 카테고리 카드)이고 hydration 직후 완전히 다른 레이아웃(흰 헤더+지도)으로 통째로 교체됨 → 눈에 띄는 layout jump. 앱 셸 자체에는 히어로/온보딩/첫 사용 안내가 없음 | `MapContainer`·`MapView`의 `useSearchParams()`가 가장 가까운 Suspense(`app/page.tsx`)까지 CSR bailout | fallback을 앱 셸 모양(헤더 스켈레톤 + 지도 영역 스켈레톤)으로 맞추고 랜딩 콘텐츠는 `noscript`/SEO 영역으로 유지하거나, 셸은 SSR하고 지도 영역만 Suspense | `HomeLanding.test.tsx`가 h1·설명·`aria-busy`·status 문구·nav 이름·카테고리 링크·'모든 장소 둘러보기' 링크를 고정 |
| D18 | P2 | `app/globals.css:61-64`, `Header.tsx:342,455,501`, `src/shared/ui/layout/SideBar.tsx:124`, `PlaceExplorerPanel.tsx:197,284,306,330,346,410`, `src/shared/ui/button.tsx:8` | 포커스 표시가 세 가지: 전역 `:focus-visible` 파랑 outline(#2563eb 하드코딩) + 컴포넌트별 `focus:outline-none focus:ring-2 focus:ring-blue-500`(마우스 클릭에도 ring) + shadcn `focus-visible:ring-ring/50 ring-[3px]` → 같은 화면에서 chip·버튼·링크 포커스 모양이 제각각이고 일부는 이중 표시 | 규칙 부재 | 토큰 기반 단일 `focus-visible` 규칙, 컴포넌트의 `focus:` → `focus-visible:` | 없음 |
| D19 | P2 | `src/shared/i18n/messages.ts:28,29,39,126-135`, `warning-modal.tsx:25`, `SignupForm.tsx:56`, `app/profile/page.tsx:366`, `src/widgets/facility-list/ui/FacilityList.tsx:81`, `EngagementPanel.tsx:268`, `messages.ts:110-111` | 같은 개념에 용어가 흔들림: 시설/장소/마커/카테고리/관심사(`'{count}개 시설'`, `'지도 마커 설정'`, `'현 지도 {count}곳'`, `'관심사를 선택'`, `'관심 카테고리'`), 저장/즐겨찾기/북마크, '카카오 로그인' vs '카카오로 로그인'. 영어 `explorer.myLife` = 'My places'인데 한국어는 '내 생활'(생활권·알림 포함) | 글로서리 부재 | 용어집 확정(예: 사용자 대면 "장소", 설정 대면 "카테고리", 저장 = "저장") 후 사전·하드코딩 일괄 치환 | `SideBar.test.tsx`('지도 마커 설정','메뉴 닫기'), `PlaceExplorerPanel` 테스트('내 생활') |
| D20 | P3 | 표 §2.3 참조 (예: `PlaceExplorerPanel.tsx` 79건, `Header.tsx` 71건, `app/profile/page.tsx` 109건) | 셸·패널·페이지 파일 전부가 semantic 토큰 0건, 팔레트 클래스 약 560건. 강조색이 blue-600(필터)·violet-600(추천)·emerald(활동 계획)·amber(경고)·`bg-[#0F284E]`(로고)로 분산, radius는 md/lg/xl/2xl/full 혼용, 그림자 sm/md/lg/xl/2xl 혼용, `text-[11px]` 임의 크기 7곳 | 토큰 미채택 | §2.4 토큰 오버홀 | 클래스 단언 테스트 없음(자유) |
| D21 | P3 | §3.2 표 | i18n이 된 컴포넌트 안에도 하드코딩 한국어가 남음(`MainApp.tsx:81,111,115` 삼항, `Header.tsx` 7곳), `EngagementPanel` 57줄·`/profile` 65줄·`/places` 24줄·auth 14줄은 i18n 자체가 없음 → 영어 전환 시 반쪽 영어 화면 | 범위 불명확 | 범위를 명시(앱 셸+패널만 ko/en, 공개 페이지는 ko 전용)하거나 전면 적용 | `I18nProvider.test.tsx`(`explorer.noPlaces` 영문값·storage key·`html[lang]`) |
| D22 | P3 | `src/shared/lib/utils/toast.ts:8-70,73-111,116-169` | 토스트 구현이 둘(class `toast` 우하단 vs `showToast` 상단 중앙), hex 색 하드코딩, `zIndex 9999`, import 시점에 `<style>` 주입, `role='status'`/`aria-live` 없음(스크린리더 미공지), `document.body.removeChild` 중복 제거 시 throw 가능. 실제 사용은 `/profile`의 `toast.*` 7곳뿐, `showToast*`는 테스트만 사용 | 중복 구현 | live region이 있는 단일 토스트(또는 shadcn `sonner`)로 교체, 토큰 색 | `toast.test.ts`가 `showToast` 계약(className `toast`, `toast-${type}`, 상단 중앙 위치, zIndex>1000, 제거 타이밍)을 고정 — 교체 시 테스트도 교체 |
| D23 | P3 | `README.md:8,127-133`, `docs/BACKLOG.md:748-752`(출력 기준 줄), `docs/ACCESSIBILITY_CHECKLIST.md:3,10-17` | README "Next.js 15"(실제 `next ^16.3.1`), 저장소 구조에 `pages/`·`lib/`·`config/`·`styles/`·`proxy.ts` 누락. BACKLOG는 "Actions CI 중지" 상태라 하지만 `.github/workflows/ci.yml`이 ARC 러너로 존재(정합 확인 필요). 접근성 체크리스트(2026-07-25)는 D03·D04·D10·D15를 다루지 않음 | 문서 갱신 누락 | README 버전·구조 갱신, BACKLOG 항목 상태 확인, 체크리스트에 터치·모바일·모달 항목 추가 | — |
| D24 | P3 | `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`, `public/assets/logo.svg`, `Header.tsx:345-368`, `app/opengraph-image.tsx:28-43`, `test-kakao-map.html:10` | create-next-app 보일러플레이트 SVG 5개가 참조 0건으로 남아 있고, `logo.svg`도 참조 0건인데 헤더가 같은 path를 inline 복제, OG 이미지는 로고 대신 "S" 타일을 그림. 루트 `test-kakao-map.html`은 카카오 JS appkey를 평문으로 포함한 수동 테스트 파일 | 정리 누락 | 보일러플레이트 삭제, 로고는 단일 컴포넌트(`Logo.tsx`)로 공유해 헤더·OG·favicon 일치, `test-kakao-map.html` 삭제(키 교체 여부는 사용자 결정 사항으로 보고만) | 없음 |
| D25 | P3 | `src/shared/ui/layout/SideBar.tsx:166-182,254-260` | 카카오 로그인 버튼이 `bg-yellow-400`(#facc15, 브랜드 #FEE500과 다름), 카카오 심볼 path가 두 사이드바에 중복, 설정 항목 카드마다 `transform hover:scale-[1.02] active:scale-[0.98]` + 아이콘 `group-hover:scale-110` + stagger `slideInRight` 애니메이션 — 설정 목록치고 과한 모션 | — | 브랜드 색 상수화, 모션 축소(목록은 배경 전환만) | `SideBar.test.tsx` |
| D26 | P3 | `app/page.tsx:8`, `app/layout.tsx:16-19`, `src/shared/lib/seo/site.ts:14` | 탭 제목은 "서울 공공시설 지도 \| Seoul Fit", 공유 카드(OG/Twitter)는 "Seoul Fit \| 서울 공공시설 지도" — 순서가 뒤집혀 일관성 없음 | template vs SITE_TITLE | 하나로 통일 | `structured-data.test.ts`는 name/description만 고정 |
| D27 | P3 | `app/opengraph-image.tsx:24,57,68`, `node_modules/next/dist/compiled/@vercel/og/index.node.js:21364` | OG 이미지가 `fontFamily: 'sans-serif'`로 한글을 그림. `next/og`는 한글 글리프를 런타임에 외부에서 동적 로드(`loadDynamicAsset`)하므로 파드의 외부 egress가 막히면 □□로 렌더링될 위험 | 폰트 미번들 | 본문과 같은 한글 웹폰트 파일을 `fs.readFile`로 로드해 `fonts` 옵션에 전달 | 없음 |
| D28 | P3 | `.prettierrc.js:19,39`, `src/features/auth/ui/*.tsx`(큰따옴표 JSX), `src/widgets/map-container/ui/FacilityList.tsx:12`(CRLF) 외 44파일 | `npm run format:check` 실패 상태, auth UI는 `jsxSingleQuote` 위반, 한 줄 CRLF 혼입 | 포매터 미실행 | `npm run format` 1회 실행을 리디자인 첫 커밋으로 분리 | — |
| D29 | P3 | `Header.tsx:104,147-149,246-254,119-139,433` | `searchTimeoutRef`는 대입되는 곳이 없어 clear 로직이 죽은 코드이고, 실제 디바운스 타이머(`debouncedSearch` 클로저)는 언마운트 시 정리되지 않음. `aria-expanded={showSuggestions \|\| cacheLoading}` | 리팩터링 잔재 | 디바운스를 `useRef` 타이머 하나로 통합·cleanup | 없음 |
| D30 | P2 | `PlaceExplorerPanel.tsx:268-271,192-199,328,341,392,409` | `div aria-label`(role 없음)은 보조기기에 전달되지 않음; 목록 항목 선택을 `aria-pressed`로 표현(토글 버튼 의미), 추천 영역과 목록이 모두 `aria-live='polite'`라 지도 이동마다 두 영역이 낭독; 지역 select는 sr-only label과 `aria-label` 이중; preset chip은 `title` 툴팁 | — | `role='group'` 부여, 선택은 `aria-current`/listbox, live region은 요약 1곳으로 | `PlaceExplorerPanel.accessibility.test.tsx` |
| D31 | P2 | `PlaceExplorerPanel.tsx:226-245,371-375,394-398`, `ActivityPlanner.tsx:150-154` | 장소 목록·추천에 로딩/오류 상태가 없음(빈 상태만). `liveDataLoading`은 날씨·혼잡도에만 적용되고, 도시데이터 API 실패는 "이 위치는 지원하지 않음" 문구(:242-244)로 보여 오류와 미지원이 구분되지 않음. 활동 계획은 '만들기' 전까지 빈 영역 | 상태 모델 부족 | skeleton·오류+재시도 상태 추가, 미지원/오류 문구 분리 | 위와 동일 |
| D32 | P2 | `src/shared/model/authStore.ts:217-221,235-243`, `Header.tsx:608,703` | SSR은 비로그인 헤더, hydration 뒤 localStorage persist로 알림·프로필 버튼이 뒤늦게 등장(헤더 우측이 밀림). `checkAuthStatus`는 네트워크 오류에도 `clearAuth()` → 일시 장애에 로그아웃됨 | persist + 낙관적 초기화 없음 | `isLoading` 동안 우측 슬롯을 고정 폭 skeleton으로, 네트워크 오류는 토큰 유지 | `authStore.test.ts`(미열람, §7) |
| D33 | P3 | §5 목록 | 죽은 코드·중복 파일 다수(두 번째 사이드바 315줄, 동일한 FacilityList 2개, 미사용 FacilityFilter·sheet·checkbox·compatibility layer·SignupForm 등) | 마이그레이션 잔재 | §5 순서대로 삭제 | 삭제 대상에 테스트 의존 없음(`checkbox.test.tsx`만 예외: 프리미티브 유지 or 테스트 동반 삭제) |

## 1. 화면 구성 현황

### Takeaway
`/`의 서버 HTML은 `HomeLanding`이고, hydration 뒤 `MainApp`(헤더 + 전체 화면 지도)로 통째로 바뀐다. 패널들은 전부 지도 위 `absolute`/`fixed` 오버레이로 z-index 10~100(토스트 9999, 마커 998~1002)에 흩어져 있고, 모바일 폭에서는 탐색 패널이 지도와 컨트롤을 덮는다. 보조 페이지(`/places`, `/profile`, `/auth`)는 앱 헤더·푸터를 공유하지 않는 독립 레이아웃이며 사이트 전역 푸터는 없다.

### Cited Findings — 라우트 → 컴포넌트 → 패널

| 라우트 | 구성(상위→하위) | 근거 |
|---|---|---|
| `/` | `app/layout.tsx`(`html[lang=ko]`, `body.antialiased`, `I18nProvider > AuthProvider`) → `app/page.tsx`(JSON-LD script + `Suspense fallback=<HomeLanding/>` → `MainApp`) | `app/layout.tsx:66-71`, `app/page.tsx:13-24` |
| `/` SSR 결과 | `HomeLanding`: `main[aria-busy=true]` + eyebrow "Seoul Fit" + h1 '서울 공공시설 지도' + `SITE_DESCRIPTION` + `<output>`(role=status) '지도를 준비하고 있습니다…' + 6개 카테고리 카드 nav + '모든 장소 둘러보기' 링크. 이유: `MapContainer.tsx:120`과 `MapView.tsx:85`의 `useSearchParams()`가 CSR bailout을 일으켜 가장 가까운 Suspense(`app/page.tsx:20`)의 fallback이 서버 HTML이 됨 | `HomeLanding.tsx:14-50`, `MapContainer.tsx:11,120`, `MapView.tsx:5,85` |
| `/` hydration 후 | `MainApp`: skip link(`sr-only`, `z-[100]`) → `div.sticky.top-0.z-50.bg-white.border-b.shadow-sm > Header` → `main#main-map.relative.flex-1`(sr-only h1) → `MapContainer` → `LogoutModal` | `MainApp.tsx:76-157` |
| `MapContainer` 내부 | `div.className(w-full h-full)` → `Suspense(fallback div[aria-busy])` → `MapView` → `ClusterBottomSheetWrapper` → `FacilityBottomSheetWrapper` → sr-only status; 형제로 `SideBar`(+내부 `WarningModal`) | `MapContainer.tsx:315-342` |
| `MapView` 오버레이(DOM 순서) | 로딩 오버레이(`absolute inset-0 z-10`) → `#kakaoMap` → 오류 카드(`z-20`) → `MapControls`(`top-4 right-4 z-30`, `bottom-24 left-4 z-30`, `bottom-24 right-4 z-30`) → 혼잡도 click-away(`fixed inset-0 z-40`) + 팝오버(`absolute top-16 right-4 z-50`) → 날씨 click-away/팝오버(`bottom-24 left-16 z-50`) → 카테고리 chip 행(`absolute left-3 right-3 top-3 z-30`, md: `left-4 right-auto max-w-[calc(100%-7rem)]`) → `PlaceExplorerPanel`(`absolute left-3 right-3 top-14 z-30`, md: `left-4 w-[25rem]`) → `EngagementPanel`(`fixed inset-0 z-40` 버튼 오버레이 + `fixed inset-y-0 right-0 z-50 w-full max-w-md`) → `MapStatusIndicator`(`bottom-4 right-4 z-30`, `bottom-4 left-1/2 z-30`) | `MapView.tsx:628-790`, `MapControls.tsx:115,150,182`, `MapStatusIndicator.tsx:59,67`, `PlaceExplorerPanel.tsx:123`, `EngagementPanel.tsx:190-203` |
| `PlaceExplorerPanel` 내부(위→아래) | 헤더 행(현 지도 N곳·필터 수 / '내 생활'·'초기화'·'목록 보기' 버튼) → 자연어 규칙 status → 지역 select 카드 → '서울 지금' 라이브 카드(신선도 pill) → 거리 select + 토글 chip 4개(가로 스크롤) → '상황별 추천' preset chip 6개(가로 스크롤) + 추천 카드 ≤3 → `ActivityPlanner`(예산 select + 만들기 + 결과) → (`isListOpen`) 목록 `#map-place-list`(`max-h-64`, ≤100건) | `PlaceExplorerPanel.tsx:126-450`, `ActivityPlanner.tsx:65-156` |
| `SideBar`(실사용본 `src/shared/ui/layout/SideBar.tsx`) | 닫힘: `WarningModal`만 렌더 → 열림: 오버레이(`fixed inset-0 z-[59] bg-black opacity-30 backdrop-blur-sm`) + `aside[role=dialog aria-modal]`(`fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] md:w-96`) = 헤더(제목 '지도 마커 설정', N개 선택 pill, 닫기) → 설명 카드 → 카테고리 8개 `div[role=checkbox]` 카드(subway, bike, library, park, cooling_shelter, culture, cultural_event, cultural_reservation; sports/restaurant 주석 처리) → 푸터(로그인 사용자: 아바타+닉네임+로그아웃 / 비로그인: 카카오 로그인 버튼) | `SideBar.tsx:84-282`, `:147-158` |
| `/home`(Pages Router) | `pages/_app.tsx`(`I18nProvider > AuthProvider`, `globals.css` 재import) → `pages/home/index.tsx`(`'use client'` 지시어는 Pages Router에서 무의미) = `Header`(검색 무동작) + `MapContainer(initialCenter, initialZoom)` + `SideBar` | `pages/_app.tsx:1-14`, `pages/home/index.tsx:6-85` |
| `/places` | 독립 `main.min-h-screen.bg-slate-50`(앱 헤더 없음) = '← 지도 보기' 링크 → h1 → 설명 → 카테고리 카드 6개(`sm:grid-cols-2 lg:grid-cols-3`) | `app/places/page.tsx:11-40` |
| `/places/[category]` | `dynamic='force-dynamic'`; breadcrumb nav('지도 / 장소 둘러보기') → h1 '서울 {label}' → 설명 → '총 N곳' → `article` 카드 그리드(`sm:grid-cols-2`, 24건/페이지) → 빈 상태 문구 → 이전/다음 nav(`<span/>` 자리 채움, 페이지 번호 표시 없음) | `app/places/[category]/page.tsx:11,51-121` |
| `/places/[category]/[id]` | JSON-LD + `article.max-w-3xl.rounded-2xl.bg-white` = breadcrumb → 카테고리 eyebrow → h1 → 이미지(`alt=''`) → `dl`(주소/운영 정보/일정/지역) → 설명 → `PlaceActionLinks`('지도에서 보기' = `/?lat=&lng=&place=cat:id`, 전화, 공식 페이지) | `app/places/[category]/[id]/page.tsx:64-69,103-161`, `PlaceActionLinks.tsx:22-54` |
| 지도 복귀 deep link | `/?lat&lng&place=` 쿼리를 `MapContainer`가 읽어 `revealFacility` 실행, 실패 시 sr-only status '장소를 지도에 표시하지 못했습니다.' | `MapContainer.tsx:120,300-312` |
| `/profile` | `app/profile/layout.tsx`(title '내 정보', noindex) → `page.tsx`: 자체 sticky 헤더(`bg-white/80 backdrop-blur-md z-50`, 뒤로가기 아이콘 + h1 '내 프로필') → 사용자 카드(아바타 80px, 닉네임, '서울 거주', '활동중', 통계 3칸) → 안내 카드 → 관심사 카드(`bg-gradient-to-r from-blue-500 to-purple-600` 헤더, 수정/취소/저장) → 계정 설정 목록(앱 설정/로그아웃/회원탈퇴) | `app/profile/page.tsx:306-653` |
| `/auth/callback` | `AuthCallback`(Suspense 스피너) → `useOAuthCallback` 상태별 `LoadingStates.Loading/Success/Error`(전체 화면, 자동 이동 1.2s/3s) | `AuthCallback.tsx:13-56`, `oauth-flow.ts:43-107` |
| `/auth/*` 오류 경계 | `app/auth/error.tsx`('로그인 실패' + 메인으로/다시 로그인) — `error`/`reset` 미사용 | `app/auth/error.tsx:6-55` |

### Cited Findings — 헤더 레이아웃·상태

- 구조: `div.p-4 > header.flex.items-center.justify-between.gap-3` = 로고 `Link`(40×40, `bg-[#0F284E]`, inline SVG) | 검색(`flex-1`, `input[role=combobox]` + 지우기 버튼) | 우측 그룹(언어 토글 `hidden sm:inline-flex`, '장소 둘러보기' `hidden sm:inline-flex`, 알림 `Button variant=outline size=icon`(로그인 시), 프로필 아이콘 버튼(로그인 시), 메뉴 버튼). `nav` 랜드마크 없음. 흰 배경·하단 border·그림자는 `MainApp.tsx:84`의 래퍼가 소유 — `Header.tsx:335-724`.
- 처리된 상태: 검색 로딩(`cacheLoading` → 스피너 + 'header.loading'), 결과 없음('header.noResults'), 캐시 오류(`cacheError` 빨간 텍스트), 최근 검색(포커스 시 표시, 개별 삭제·전체 삭제), 자연어 규칙 제안(violet 카드), 알림 로딩/빈 목록/읽지 않음 뱃지(99+), 로그인 여부에 따른 버튼 노출 — `Header.tsx:433-438,572-583,629-631,646-695`.
- 누락 상태: 검색 입력 중(디바운스 200ms 동안) 피드백 없음; 알림 API 실패 상태 없음(`notificationStore.ts:36-39,51-54`는 console.error만); 비로그인 사용자에게 "로그인" 진입점이 헤더에 없음(메뉴 안 하단에만); 프로필 버튼 이름이 `title`(닉네임)뿐(`Header.tsx:704-711`).
- 반응형: 390px에서 헤더 높이 72px(`p-4` 16px×2 + 40px). 우측 그룹은 비로그인 2개 아이콘(언어·장소 링크 숨김) / 로그인 4개(알림 36px + 프로필 36px + 메뉴 40px + gap) → 검색 입력 가용 폭 ≈ 390−32−40−12−(36+36+40+8×2)−8 ≈ 150px. 제안 드롭다운은 입력 폭에 맞춤(`absolute top-full left-0 right-0`), 알림 드롭다운은 `w-80`(320px) 고정.
- 키보드/ARIA: D10 참조. Escape는 제안만 닫음(검색어 유지), 입력에 `outline-none`(:411)이고 포커스 링은 부모 wrapper의 `ring-2 ring-blue-500`(:376)으로 대체.

### Cited Findings — z-index 인벤토리(셸·패널·보조 페이지 + 인접 오버레이)

| 값 | 위치 |
|---|---|
| 9999 | `src/shared/lib/utils/toast.ts:24,133` |
| 1002/1001/1000/999/998 | 마커 DOM(`src/shared/lib/hooks/useMapMarkers.ts:185,194,221,225,355,364`, `src/features/map-markers/model/use-markers.ts:118,124,219,281,312,317`, `useCurrentLocationMarker.ts:104,114`), `styles/marker-animations.css:10,110,130` |
| 100 | skip link `MainApp.tsx:79` |
| 80 | 로그아웃 성공 화면 `LogoutModal.tsx:62` |
| 70 | `LogoutModal.tsx:21`, `warning-modal.tsx:13` |
| 60 | `SideBar.tsx:101`(aside), `ClusterBottomSheet.tsx:278`(이미지 라이트박스) |
| 59 | `SideBar.tsx:93`(오버레이) |
| 50 | 헤더 래퍼 `MainApp.tsx:84`, 검색 제안 `Header.tsx:431`, `EngagementPanel.tsx:202`, `MapView.tsx:676,697`(팝오버), `FacilityBottomSheet.tsx:338`, `ClusterBottomSheet.tsx:99`, `dropdown-menu.tsx:36,204`(portal), `sheet.tsx:33,55`, `app/profile/page.tsx:309` |
| 40 | `EngagementPanel.tsx:192`, `MapView.tsx:671,693`(click-away), `FacilityBottomSheet.tsx:328` |
| 30 | `PlaceExplorerPanel.tsx:123`, `MapView.tsx:714`(chip 행), `MapControls.tsx:115,150,182`, `MapStatusIndicator.tsx:59,67` |
| 20 / 10 | `MapView.tsx:643`(오류) / `MapView.tsx:630`(로딩), `EngagementPanel.tsx:204`(sticky 헤더), `ClusterBottomSheet.tsx:292` |

- 인라인 `style` (셸 범위): `SideBar.tsx:143`(`scrollbarWidth`), `:178-181`(stagger animation), 죽은 사이드바 `src/widgets/sidebar/ui/SideBar.tsx:208,229`, `app/opengraph-image.tsx:15-71`(Satori 특성상 불가피), `toast.ts:15-36,123-146`. 지도 코어는 `FacilityBottomSheet.tsx:341,426`, `ClusterBottomSheet.tsx:150`, `SubwayStationIcon.tsx:36`, `CongestionPanel.tsx:155`.
- hex 값(셸 범위): `Header.tsx:342`(`bg-[#0F284E]`), `globals.css:62`(`#2563eb`), `toast.ts:30-33,140-143`, `opengraph-image.tsx:22-23,36-37,44,65,71`.

### Inferences
- 스태킹 순서는 숫자 체계가 아니라 DOM 순서에 의존해 우연히 동작한다: `EngagementPanel`(z-50, `main` 내부)와 헤더 래퍼(z-50)는 같은 루트 스태킹 레벨에서 뒤에 오는 패널이 위에 그려지고, `FacilityBottomSheetWrapper`(z-50)가 `MapView` 뒤에 위치해 둘이 동시에 열리면 바텀시트가 '내 생활' 패널 위에 올라간다(`MapContainer.tsx:317-321`). 사이드바(z-60)와 '내 생활'(z-50)이 동시에 열리면 오버레이가 이중으로 어두워진다. z-index 스케일(예: controls 10, panel 20, sticky 30, overlay 40, sheet 50, dialog 60, toast 70)을 Tailwind theme에 정의하는 것이 선행 과제.
- 390px에서의 겹침(D02)은 좌표 산술로 도출했고 스크린샷으로 확인하지 않았다. 다만 패널이 `left-3 right-3` 전폭이고 `max-h`가 `100%-7rem`이므로 내용이 충분히 길면(항상 그렇다) 하단 컨트롤 영역(`bottom-24`)과 겹치는 것은 레이아웃 정의상 확정적이다.
- 세 가지 chip 스타일(필터 `rounded-full` blue-600, preset `rounded-full` violet-600, 카테고리 chip은 `Button variant=outline size=sm` = `rounded-md` + `config.color` 배경, `MapView.tsx:725-740`)이 같은 뷰포트 상단에 동시에 보인다. 카드도 다섯 종류(추천 violet-50/60, 목록 gray-200, 활동 계획 white, 사이드바 border-2 scale, 공개 페이지 slate-200 shadow-sm, 프로필 rounded-2xl).

### Gaps
- 실제 브라우저에서의 겹침·스크롤·포커스 순서는 미검증(개발 서버·카카오 키 미사용).
- `useFocusTrap.test.tsx`, 지도 코어 컴포넌트는 범위 밖이라 발췌만 읽음.

## 2. 테마·타이포 기반 현황

### Takeaway
Tailwind **3.4.19** 파이프라인 위에 shadcn **v4 세대** 프리미티브와 **v4 전용** `tw-animate-css`를 얹어 둔 상태라 일부 유틸리티가 조용히 생성되지 않는다(§0.1 증거). 토큰은 shadcn v3 HSL 삼중값(default/slate 값)이고, `components.json`은 new-york/neutral을 선언해 서로 맞지 않는다. 한국어 웹폰트는 없고 `--font-geist-*` 변수는 정의만 있을 뿐 아무도 쓰지 않으며, 실제 본문 폰트는 Tailwind preflight 기본 `ui-sans-serif, system-ui, …`이다.

### Cited Findings
- 파이프라인: `postcss.config.mjs:1-8`(tailwindcss + autoprefixer), `app/globals.css:1-5`(`@import 'tw-animate-css'`, `@import '../styles/marker-animations.css'`, `@tailwind base/components/utilities`), `tailwind.config.js:1-60`(`darkMode: ['class']`, content에 존재하지 않는 `./components/**` 포함(:5), colors/borderRadius/animation만 extend, `animation.spin/pulse/bounce`는 Tailwind 기본값과 동일한 중복(:52-56), `fontFamily`·`zIndex`·`container` 미정의, plugins 없음).
- 토큰: `globals.css:7-30` `:root`에 shadcn v3 형식 HSL 삼중값 — 값은 shadcn "default" 스타일의 slate 계열(`--foreground: 222.2 84% 4.9%`, `--primary: 222.2 47.4% 11.2%`)이며, `components.json:3,9`는 `"style": "new-york"`, `"baseColor": "neutral"`. `--radius: 0.625rem`(:10)은 v4 new-york 기본값. `chart-*`, `sidebar-*` 토큰 없음. `.dark` 블록(:32-52) 존재, 토글 코드 없음(`classList`/`'dark'` 사용 grep 0, `src/entities/user/model/types.ts:105`의 `theme` 타입만 존재), `dark:` 변형은 프리미티브 9곳에만 있음 → `.dark`를 켜면 셸은 `bg-white`/`text-gray-*` 그대로라 반쪽 다크가 된다.
- 폰트: `globals.css:8-9` `--font-geist-sans: Arial, Helvetica, sans-serif`, `--font-geist-mono` 정의; 소비처 0(grep `font-geist|next/font|font-sans|fontFamily` → `opengraph-image.tsx:24`의 `'sans-serif'`만). `app/layout.tsx:66-67`은 `<html lang='ko'><body className='antialiased'>`로 `next/font` 미사용. 따라서 본문 폰트 = preflight `html { font-family: theme('fontFamily.sans', ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji") }`(`node_modules/tailwindcss/src/css/preflight.css:36`). 한글 렌더링은 OS 폰트(Windows 맑은 고딕, macOS Apple SD Gothic, Linux는 Noto CJK 설치 여부)에 의존.
- 타이포 스케일: 임의 크기 `text-[11px]`(`PlaceExplorerPanel.tsx:248,262,363,430`, `ActivityPlanner.tsx:75,134,146`), 공개 페이지는 `text-3xl sm:text-4xl` h1, 프로필 h1은 `text-xl` + gradient text(`app/profile/page.tsx:321`), 사이드바 h2 `text-xl`, 패널 h3 `text-xs` — 제목 위계 규칙 없음.
- 포커스: `globals.css:61-64` `:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px }`(`@layer base`), 컴포넌트 `focus:` 링(D18), shadcn `focus-visible:ring-ring/50 ring-[3px]`.
- 모션: `tw-animate-css`(죽음, D06); `transition-all duration-200/300` 다수; `prefers-reduced-motion` 전역 차단(`globals.css:67-76`); `forced-colors` 보정(:78-85); 사이드바 `<style jsx>` keyframes `slideInRight`(`SideBar.tsx:270-281`) — 과거 빌드 산출물(`.next/static`)에서 keyframe 이름이 그대로 컴파일된 것을 확인했으므로 inline `style.animation` 참조는 동작함(비결함).
- 프리미티브 세대 대조(현재 shadcn new-york 레지스트리 기준):
  - v4 세대(그대로 복사됨): `button.tsx`(`shadow-xs`, `size-9`, `has-[>svg]:px-3`, `dark:` 변형), `badge.tsx`, `card.tsx`(`@container/card-header`, `has-data-[slot=card-action]`), `alert.tsx`(`calc(var(--spacing)*4)`), `sheet.tsx`(`outline-hidden`, `rounded-xs`), `skeleton.tsx`(`bg-accent`), `dropdown-menu.tsx`(`outline-hidden`, `max-h-(--radix…)`), `switch.tsx`(`shadow-xs`, `h-[1.15rem] w-8`), `scroll-area.tsx`, `separator.tsx`, `label.tsx`.
  - v3 세대: `input.tsx`(`React.forwardRef`, `h-10`, `ring-offset-background`, `focus-visible:ring-2`), `checkbox.tsx`(`React.ElementRef`, `h-4 w-4`).
  - 비-shadcn 커스텀: `warning-modal.tsx`, `auth/LogoutModal.tsx`, `layout/SideBar.tsx`.
  - 결과: 버튼(`h-9`)과 인풋(`h-10`) 높이가 다르고, 인풋 포커스는 2px ring + offset, 버튼은 3px 반투명 ring으로 서로 다른 포커스 언어를 쓴다(`EngagementPanel.tsx:338-369`에서 나란히 노출).
- 컴파일 증거(§0.1): 생성 안 됨 — `.shadow-xs`, `.outline-hidden`, `.rounded-xs`, `.animate-in`, `.fade-in-0`, `.zoom-in-95`, `.slide-in-from-right-5`, `.slide-in-from-top-2`, `.max-h-\(--radix…`, `.origin-\(--radix…`, `.has-data`; 생성됨 — `.hover\:bg-primary\/90{background-color:hsl(var(--primary) / 0.9)}`, `.focus-visible\:ring-ring\/50`, `.size-9`, `.has-\[\>svg\]`, `.text-\[11px\]`, `.bg-\[\#0F284E\]`, `.z-\[59\]`…`.z-\[100\]`.

### 2.3 팔레트 vs semantic 토큰 사용량 (정규식: `bg|text|border|ring|from|to|fill|stroke|…-{slate…black}` vs `-{background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring}`)

| 파일 | 팔레트 | semantic |
|---|---:|---:|
| `app/profile/page.tsx` | 109 | 0 |
| `src/features/place-filter/ui/PlaceExplorerPanel.tsx` | 79 | 0 |
| `src/widgets/header/ui/Header.tsx` | 71 | 0 |
| `src/widgets/sidebar/ui/SideBar.tsx` (죽은 파일) | 50 | 0 |
| `src/shared/ui/layout/SideBar.tsx` | 44 | 0 |
| `src/features/engagement/ui/EngagementPanel.tsx` | 44 | 0 |
| `src/features/auth/ui/SignupForm.tsx` | 27 | 0 |
| `src/features/activity-plan/ui/ActivityPlanner.tsx` | 19 | 0 |
| `src/shared/ui/auth/LogoutModal.tsx` | 17 | 0 |
| `src/widgets/facility-list/ui/FacilityList.tsx` (죽은 파일) | 16 | 0 |
| `app/places/[category]/page.tsx` | 15 | 0 |
| `app/auth/error.tsx` | 12 | 0 |
| `src/widgets/home-landing/ui/HomeLanding.tsx` | 11 | 0 |
| `src/shared/ui/warning-modal.tsx` | 10 | 0 |
| `app/places/[category]/[id]/page.tsx` | 10 | 0 |
| `app/places/page.tsx` | 8 | 0 |
| `src/features/analytics/ui/PlaceActionLinks.tsx` | 7 | 0 |
| `src/features/auth/ui/LoadingStates.tsx` | 7 | 0 |
| `src/widgets/main-app/ui/MainApp.tsx` | 4 | 0 |
| `src/features/auth/ui/AuthCallback.tsx` | 1 | 0 |
| 프리미티브: `button` 1/26, `badge` 1/19, `dropdown-menu` 0/22, `switch` 0/8, `alert` 0/6, `sheet` 1/5, `input` 0/4, `checkbox` 0/4, `card` 0/3, `skeleton` 0/1 | | |

- 합계: 비프리미티브 파일 약 **560건 팔레트 / 0건 semantic**(`text-white`/`bg-white`/`bg-black` 포함). radius 사용 분포(일부 파일 표본): `rounded-full` 35, `rounded-lg` 29, `rounded-xl` 20, `rounded-2xl` 8, `rounded-md` 7, `rounded` 3; shadow: `shadow-sm` 13, `shadow-lg` 4, `shadow-2xl` 4, `shadow-md` 3, `shadow` 2, `shadow-xl` 1.

### 2.4 토큰·타이포 오버홀이 건드려야 할 것 (Inferences)
1. **Tailwind 세대 결정**: (a) v4로 올리고 `@theme`·`@import "tailwindcss"`·`tw-animate-css` 유지 + `postcss.config.mjs`를 `@tailwindcss/postcss`로, `tailwind.config.js` 제거/축소; 또는 (b) v3 유지 + shadcn v3 프리미티브로 재생성 + `tailwindcss-animate`. (a)가 현재 프리미티브와 정합.
2. `app/globals.css`: 토큰 값(new-york/neutral 또는 브랜드 팔레트, `--chart-*`, `--sidebar-*`), `--font-sans`/`--font-mono` 정의 및 `--font-geist-*` 제거, `:focus-visible` 색을 `hsl(var(--ring))`로, z-index 스케일 변수.
3. `tailwind.config.js`(v3 유지 시): `fontFamily.sans = ['var(--font-sans)', …]`, `zIndex`, `container`, 죽은 `./components/**`·중복 `animation` 제거.
4. `app/layout.tsx`: `next/font`(예: Pretendard Variable `next/font/local` 또는 Noto Sans KR)로 `html className={font.variable}`; `metadata.icons`/`manifest`/`themeColor`(`viewport` export) 추가 검토 — 현재 `app/favicon.ico`만 있고 `icon.svg`/apple icon/manifest 없음(`ls app`).
5. `app/opengraph-image.tsx`: 동일 폰트 파일을 `fonts` 옵션으로 공급(D27), 로고 컴포넌트 공유(D24).
6. 27개 파일 약 560건 팔레트 클래스 → semantic 토큰 치환(표 §2.3), 강조색 2개(기본·추천)로 축소.
7. `FACILITY_CONFIGS.color`(`src/shared/lib/icons/facility.tsx:29-93`, `bg-*-500` 10종)·`src/shared/api/congestion.ts:27-35` hex·`styles/marker-animations.css`(지도 코어, 기록만) — 카테고리 색을 토큰(`--category-park` 등)으로 올려 사이드바·chip·마커·프로필(`INTEREST_CATEGORIES.color`, `app/profile/page.tsx:62-150` 세 번째 복사본)에서 공유.
8. `toast.ts` 색·z-index(D22), `LogoutModal`/`WarningModal` → Dialog(D15).

### Gaps
- 폰트 라이선스·번들 크기 결정은 사용자 결정 사항. 브라우저별 실제 한글 폰트 폴백은 미확인.

## 3. i18n·문구 현황

### Takeaway
사전(`messages.ts`)은 158키 ko/en이며 앱 셸·탐색 패널·활동 계획·바텀시트는 거의 전부 사전을 쓰지만, '내 생활' 패널·모달·auth·`/profile`·`/places`는 i18n이 전혀 없다. 사전 키 1개(`header.openProfile`)는 미사용이고, 같은 개념에 서로 다른 용어가 혼재한다.

### Cited Findings
- 메커니즘: `I18nProvider.tsx:18-57` — 초기 locale `'ko'`로 렌더 후 effect에서 localStorage(`seoul-fit.locale.v1`) 읽어 교체(ESLint `set-state-in-effect` 경고 :31), `document.documentElement.lang` 갱신(:34-36)은 클라이언트만(`app/layout.tsx:66`은 항상 `lang='ko'`) → 영어 사용자는 첫 페인트가 한국어였다가 바뀜. `t()`는 `{name}` 치환만, 복수형·숫자 포맷 없음(:48-57). 언어 변경 live region(:62-64)은 Provider 루트에 항상 렌더.
- 사용량(파일별 `t(` 호출 수 / 비주석 한글 줄 수): `PlaceExplorerPanel` 51/0, `ActivityPlanner` 15/0, `Header` 40/21(실제 하드코딩은 7줄: :303,305,308,596,693,708 + 주석), `shared/ui/layout/SideBar` 13/10(실제 하드코딩 0, 주석), `MainApp` 7/9(:81,111,115 삼항), `HomeLanding` 0/4, `EngagementPanel` 7/57(i18n 없음 — `t(` 수는 `trackEvent(` 등 오탐), `PlaceActionLinks` 3/3, `LogoutModal` 0/8, `warning-modal` 0/3, `LoadingStates` 0/4, `SignupForm` 0/5, `AuthCallback` 5/1, `app/auth/error.tsx` 0/5, `app/profile/page.tsx` 9/65, `app/places/page.tsx` 0/6, `[category]/page.tsx` 0/11, `[id]/page.tsx` 0/7. (지도 코어 참고: `WeatherPanel` 0/23, `CongestionPanel` 0/20, `FacilityFilter` 0/18(죽은 파일), `ClusterBottomSheet` 4/29, `MapControls` 8/16, `MapView` 36/33.)
- 사전에 없는 UI 문자열(셸·패널·보조 페이지):
  - `Header.tsx:303-308` '방금 전/{n}시간 전/{n}일 전', `:596` aria-label 'Switch to English'/'한국어로 전환', `:693` '알림이 없습니다', `:708` '내 정보'.
  - `MainApp.tsx:81` '지도와 장소 결과로 건너뛰기', `:111` '지도와 장소 결과', `:115` '서울 공공시설 지도'(모두 locale 삼항으로 처리, 사전 밖).
  - `EngagementPanel.tsx:59-65`(알림 유형 7개), `:112` '내 생활권', `:160,182` 오류 문구, `:194,207,209,217,226-230,236,246,258,268,278,288,291,299,311,325,336,341,348,353,382,385,395,411,415,425,428,443,449,464,498,501,506,522-524,541,545,555,558,582,585,590-596` 전부.
  - `LogoutModal.tsx:36,38,46,52,65,66`; `warning-modal.tsx:19,25,30`; `LoadingStates.tsx:19,33,42,44`; `SignupForm.tsx:56,57,59,119,123`; `app/auth/error.tsx:28,30,32,40,49`; `oauth-flow.ts:26,56,60,64,83,106`; `app/profile/page.tsx`(65줄); `app/places/**`(24줄); `PlaceActionLinks.tsx:29,37,50`; `HomeLanding.tsx:21-22,25,27,46`; `MapContainer.tsx:306`.
- 미사용 키: `header.openProfile`(`messages.ts:19,185`). 동적 접두 키(`category.*`, `categoryDescription.*`, `freshness.*`, `preset.*`, `reason.*`, `warning.*`)는 템플릿 리터럴로 사용됨(`PlaceExplorerPanel.tsx:258,328,336,359,365,422`, `FacilityBottomSheet.tsx:389,440,452,460,645,698`) — 리터럴 grep에는 미사용으로 보이나 실제 사용.
- 용어 불일치(동일 개념):
  - 시설/장소/마커/카테고리/관심사: `messages.ts:28` '{count}개 시설', `:29` '지도 마커 설정', `:31-32` '마커…카테고리의 시설', `:39` '현 지도 {count}곳', `:71` '장소', `warning-modal.tsx:25` '관심사', `SignupForm.tsx:56` '관심사 선택', `app/profile/page.tsx:366` '관심 카테고리', `src/widgets/facility-list/ui/FacilityList.tsx:36` '주변 시설'.
  - 저장/즐겨찾기/북마크: `messages.ts:110-111` '저장됨/저장', `EngagementPanel.tsx:268` '저장한 장소', `FacilityList.tsx:81`(주석) '즐겨찾기', 아이콘은 `Bookmark`.
  - 로그인: `messages.ts:37` '카카오 로그인', 죽은 사이드바 `src/widgets/sidebar/ui/SideBar.tsx:174` '카카오로 로그인', `app/auth/layout.tsx:4` title '카카오 로그인'.
  - 혼잡: `messages.ts:65` '혼잡 낮음', `:56` '혼잡 {value}', `FacilityList.tsx:140-143` '여유/보통/혼잡'.
  - 영어: `explorer.myLife` 'My places'(한국어 '내 생활'은 생활권·알림 포함), `category.cultural_reservation` 'Programs', `explorer.score` '{score} pts', `preset.available_now` 'Open now'와 `explorer.openNow` 'Open now' 중복 의미.
- 한/영 혼용 단일 화면: `HomeLanding.tsx:21` eyebrow "Seoul Fit" + 한국어 본문; 사이트명·로고 영문, 서비스 설명 한국어(`site.ts:13-16`); `language.toggle` 값이 상대 언어 이름('English'/'한국어')인 점은 관례상 허용.
- 날짜·숫자: `Header.tsx:297-310` 상대 시각 한국어 고정; `app/places/[category]/page.tsx:61` `toLocaleString('ko-KR')`.
- 어조: 사전은 '~해요/~이에요'(`reason.*`, `warning.*`)와 '~합니다/~세요'(`explorer.*`, `sidebar.*`)가 섞임(`messages.ts:146-162` vs `:38-79`); '내 생활' 패널은 '~합니다'.

### Inferences
- i18n 범위를 "앱 셸 + 지도 패널"로 명시하고 공개 SEO 페이지는 한국어 전용(검색엔진 대상)으로 두는 편이 현실적이다. 그래도 `EngagementPanel`·모달·auth는 셸의 일부이므로 사전에 편입해야 영어 토글이 성립한다.
- 용어는 "사용자 대면 = 장소, 설정 대면 = 카테고리, 보관 = 저장"으로 고정하면 테스트 수정은 `SideBar.test.tsx:31-32`('지도 마커 설정','메뉴 닫기')와 `PlaceExplorerPanel` 테스트 문자열 정도다.

### Gaps
- 영어 품질(네이티브 검수)은 평가하지 않았다.

## 4. SEO·OG·에셋·저장소 위생 (보조)

### Cited Findings
- 메타: `app/layout.tsx:13-58`(metadataBase, title template `%s | Seoul Fit`, OG `/opengraph-image`, robots, `category: 'travel'`), `app/page.tsx:7-11`, `app/places/*`의 `generateMetadata`(indexable 카테고리만 index, page>1 noindex: `[category]/page.tsx:33-36`), `app/profile/layout.tsx:5`·`app/auth/layout.tsx:5` noindex, `proxy.ts:12-20` 비정규 호스트 `X-Robots-Tag`, `app/robots.ts:21` disallow `/api/ /auth/ /health /profile`, `app/sitemap.ts:22-45`. 테스트가 이 계약을 고정(`app/__tests__/robots.test.ts`, `sitemap.test.ts`, `site.test.ts`, `structured-data.test.ts`).
- OG 이미지: `app/opengraph-image.tsx` 1200×630, 로고 대신 "S" 타일(:28-43), hex 하드코딩, 폰트 미번들(D27), 도메인 문자열 하드코딩(:72).
- 에셋: `public/{file,globe,next,vercel,window}.svg` 참조 0, `public/assets/logo.svg` 참조 0(헤더 inline SVG와 동일 path, `Header.tsx:345-368`), `app/favicon.ico`만 존재.
- 저장소 위생: `test-kakao-map.html:10` 카카오 JS appkey 평문; `.next/`·`coverage/`·`tsconfig.tsbuildinfo`·`.swc/`가 작업 트리에 존재(`.gitignore` 확인은 범위 밖, `git status` clean이므로 ignore됨); `lib/types.ts:1-28` `@deprecated` 호환 re-export를 30개 파일이 여전히 import; `src/app/compatibility/index.ts` 호환 레이어는 importer 0.

## 5. 정리 대상 (dead / duplicate / boilerplate / stale docs) — 모두 grep 근거 포함

### 5.1 삭제 가능(importer 0 확인)
| 대상 | 근거 |
|---|---|
| `src/widgets/sidebar/ui/SideBar.tsx` (315줄, 한국어 하드코딩, `onPreferencesRefresh` lint) | `src/widgets/sidebar/index.ts:6`이 `@/shared/ui/layout/SideBar`를 re-export; `grep -rn "sidebar/ui" app src pages` = 0 |
| `src/widgets/facility-list/ui/FacilityList.tsx` + `src/widgets/map-container/ui/FacilityList.tsx` | 두 파일은 12행 CRLF를 제외하고 동일(`diff` 결과); `grep -rn "FacilityList"`에서 두 파일 외 매치는 `lib/types/api.ts:154`·`lib/types/index.ts:101`의 타입명뿐. 즐겨찾기/예약 버튼이 `// TODO` no-op(:86-89,161-164) |
| `src/widgets/map-container/ui/FacilityFilter.tsx` | `grep -rn "FacilityFilter"` → 훅 `useFacilityFilter`(`FacilityProvider.tsx:868`)와 타입(`entities/facility/model/types.ts:243`)뿐, 컴포넌트 import 0. 이 파일이 `switch.tsx`·`separator.tsx`의 유일한 importer |
| `src/shared/ui/sheet.tsx`, `src/shared/ui/switch.tsx`, `src/shared/ui/separator.tsx`, `src/shared/ui/checkbox.tsx` | importer: sheet 0, switch/separator = FacilityFilter(죽음), checkbox = `__tests__/checkbox.test.tsx`만. 단, D15의 Dialog 전환 시 `sheet.tsx`는 재활용 가치가 있음 |
| `src/app/compatibility/index.ts` | `grep -rn "app/compatibility\|@/app/"` = 0 |
| `src/shared/ui/index.ts` barrel | `grep "from '@/shared/ui'"` = 0(compatibility 제외); `export * from './warning-modal'`은 default export뿐이라 아무것도 내보내지 않음; checkbox 누락 |
| `pages/_app.tsx`, `pages/home/index.tsx` | D05 |
| `src/features/auth/ui/SignupForm.tsx` | `grep -rn "SignupForm"` → `features/auth/index.ts:8` export만, 렌더 0; `oauth-flow.ts:112-118`의 `userInfo: null`, `handleSignUp: async () => undefined` 스텁과 함께 제거 |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | 참조 0 |
| `test-kakao-map.html` | 수동 테스트 파일, 키 포함 |
| `globals.css:8-9` `--font-geist-*` | 소비처 0 |
| `tailwind.config.js:5` `./components/**`, `:52-56` animation extend | 디렉터리 없음 / 기본값 중복 |
| `messages.ts:19,185` `header.openProfile` | 사용 0 (단, D11 수정 시 사용 권장) |
| `MainApp.tsx:8,14,29,37-41,95-105` | 미사용 import·상태·분기 |
| `Header.tsx:104,147-149,246-254` `searchTimeoutRef` | 대입 0 |
| `notificationStore.ts:8` `NotificationHistoryResult` import | ESLint unused |

### 5.2 중복(통합 대상)
- 카테고리 메타데이터 3벌: `FACILITY_CONFIGS`(`src/shared/lib/icons/facility.tsx:29-93`, label/description/color/icon), 사전 `category.*`/`categoryDescription.*`(`messages.ts:126-145`), `INTEREST_CATEGORIES`(`app/profile/page.tsx:47-154`, 이모지 아이콘·`bg-*-100` 색, WEATHER/CONGESTION/SUBWAY 추가), `INTEREST_OPTIONS`(`SignupForm.tsx:19-29`).
- 카카오 심볼 SVG path 2벌(`SideBar.tsx:256-258`, 죽은 사이드바 `:171-173`), 로고 path 2벌(`Header.tsx:345-368`, `public/assets/logo.svg`).
- 토스트 2벌(`toast.ts`), 로그아웃 경로 2벌(`MainApp.tsx:138-155` 모달 vs `app/profile/page.tsx:583-586` 즉시).
- 스피너 3종(`AuthCallback.tsx:49` 128px, `app/profile/page.tsx:276` 48px border-4, `Header.tsx:435` `Loader2`).
- 성공 화면 2벌(`LoadingStates.Success`, `LogoutModal.tsx:62-68`, 둘 다 ✅ 이모지).

### 5.3 오래된 문서·메타
- `README.md:8` "Next.js 15" vs `package.json` `next ^16.3.1`; `:127-133` 구조 설명에 `pages/`·`lib/`·`config/`·`styles/`·`proxy.ts` 없음.
- `docs/BACKLOG.md` "GitHub Actions CI 재개 — 지금 하지 않는 이유: Actions 중지" vs `.github/workflows/ci.yml`(push/PR 트리거, `runs-on: homelab-seoul-fit-fe`) 존재 — 어느 쪽이 현재인지 확인 필요.
- `docs/ACCESSIBILITY_CHECKLIST.md` 2026-07-25 기준; 모바일·터치·모달 항목 없음, 표의 대비 샘플은 팔레트 클래스 기준이라 토큰 전환 후 재측정 필요.
- `components.json:13-18` aliases(`@/components`, `@/components/ui`, `@/lib`, `@/hooks`)는 `tsconfig.json:22-35`의 실제 매핑(`@/components/*` → `src/shared/ui/*`, `@/hooks/*` → `src/shared/lib/hooks/*`)과 부분 일치; `"tailwind.config": ""`라 shadcn CLI가 v4 레지스트리를 가져오는 원인.
- `lib/types.ts:4` `@deprecated` 안내와 달리 신규 코드도 `@/lib/types`를 사용(30파일).

### 5.4 ESLint 경고(범위 내 27건, 0 errors)
`MainApp.tsx` 5(미사용 `SideBar`/`FacilityCategory`/`refreshPreferences`, `window.location.href` 2) · `Header.tsx` 3(658줄 max-lines, 581줄 함수, `window.location.href`) · `PlaceExplorerPanel.tsx` 3(440줄, 복잡도 37, 368줄 함수) · `EngagementPanel.tsx` 3(583줄, 492줄 함수, `set-state-in-effect` :169) · `app/profile/page.tsx` 2(602줄, 452줄 함수) · `src/widgets/sidebar/ui/SideBar.tsx` 2 · `shared/ui/layout/SideBar.tsx` 1(235줄 함수) · `facility-list/FacilityList.tsx` 1 · `I18nProvider.tsx:31` set-state-in-effect · `authStore.ts:35` 165줄 함수 · `notificationStore.ts:8` unused · `SignupForm.tsx:31` unused `userInfo` · `pages/home/index.tsx:46` no-console · `app/places/[category]/[id]/page.tsx:55` 복잡도 29 · `app/auth/error.tsx:45` `window.location.href`.

## 6. 리디자인 제약 (테스트·문서가 고정하는 것)

### Takeaway
스냅샷 테스트는 없고(Snapshots: 0), 클래스 단언은 `checkbox.test.tsx`의 `custom-class` 전달 하나뿐이다. 제약은 대부분 **접근 가능한 이름(한국어 문자열)·역할·속성**과 **SEO 계약**이며, 모두 `messages.ts` 값 또는 상수와 연결되어 있어 문구 변경 시 테스트를 함께 바꾸면 된다.

### Cited Findings
- `src/widgets/home-landing/__tests__/HomeLanding.test.tsx:10-24`: `h1` 텍스트 '서울 공공시설 지도', `SITE_DESCRIPTION` 텍스트 존재, `main[aria-busy=true]`, `role=status` 안에 '지도를 준비하고 있습니다', `nav[aria-label=장소 카테고리]` 안에 `a[href=/places/{slug}]`가 `category.label`을 포함, 링크 이름 '모든 장소 둘러보기' → `/places`.
- `src/shared/ui/layout/__tests__/SideBar.test.tsx:24-37`: 닫힘 상태에서 `role=dialog` 부재, 열면 `dialog` 이름 '지도 마커 설정'(= `sidebar.title` ko), 버튼 '메뉴 닫기'(= `sidebar.close`)에 초기 포커스, `Escape`로 닫히고 열기 버튼으로 포커스 복귀(`useFocusTrap` 의존). props 계약: `isOpen, onClose, activeCategories, onCategoryToggle`.
- `src/features/place-filter/ui/__tests__/PlaceExplorerPanel.accessibility.test.tsx:12-51`: 19개 props 인터페이스 직접 사용; `region` 이름 '장소 탐색 필터와 목록'(`explorer.label`), `combobox` '최대 거리'(`explorer.maxDistance`), `combobox` '지역 바로가기'(`explorer.regionShortcut`)에 option value `gangnam`(`SEOUL_REGIONS` 코드), 버튼 '내 생활'(`explorer.myLife`), 버튼 '목록 닫기'(`explorer.closeList`)에 `aria-expanded=true`, 빈 상태 텍스트 '현재 지도와 필터에 맞는 장소가 없습니다.'(`explorer.noPlaces`). → 패널을 bottom sheet로 바꿔도 이 이름·역할을 유지하면 통과.
- `src/shared/i18n/__tests__/I18nProvider.test.tsx:23-52`: `LOCALE_STORAGE_KEY='seoul-fit.locale.v1'`, `explorer.noPlaces` 영문값 'No places match this map and filters.', `document.documentElement.lang` 갱신.
- `src/shared/ui/__tests__/checkbox.test.tsx:5-55`: Radix Checkbox 기반 `role=checkbox`, `className` 루트 전달, `disabled`, 제어 모드 `onCheckedChange(false)`, 체크 시 `svg` 존재.
- `src/shared/lib/utils/__tests__/toast.test.ts:27-147`: `showToast(message, type, duration)` API — `className === 'toast'`, `classList.add('toast-${type}')`, `textContent`, `duration-500`에 `fade-out` 추가 후 `remove()`, `style.position='fixed'`, `top` 정의, `left='50%'`, `transform` 포함 `translateX(-50%)`, `zIndex > 1000`, `showErrorToast` 기본 5000ms.
- `src/shared/ui/auth/__tests__/AuthProvider.test.tsx`: children 투과, `checkAuthStatus` 1회 호출.
- `app/__tests__/robots.test.ts:14-29`: 정규 호스트에서 `disallow: ['/api/', '/auth/', '/health', '/profile']`, sitemap/host URL; 비정규 호스트 전면 disallow. `app/__tests__/sitemap.test.ts:42-53`: 정적 URL 순서(`/`, `/places`, `/places/park`, `/places/library`, `/places/restaurant`) + indexable 카테고리 항목, `cultural-event` 미포함, 중복 id 제거. `site.test.ts`, `structured-data.test.ts`: 원본 origin·`HOME_STRUCTURED_DATA` 형태.
- `docs/ACCESSIBILITY_CHECKLIST.md:28-38`: 첫 Tab이 '지도와 장소 결과로 건너뛰기', Enter로 `main#main-map` 포커스, 검색 = 이름 있는 combobox + listbox, 'Open menu' → 'Map marker settings' dialog + 'Close menu' 포커스, 영어 전환 시 건너뛰기·검색·지도 제어·필터·추천·활동 계획·시설 수·사이드바가 영어, 지도 SDK 실패 시 alert + 'Reload'.
- `jest.config.js:12-20` moduleNameMapper(`@/lib/*` → `lib/`, `@/*` → `src/`)와 `tsconfig.json:22-35` paths가 다름(`@/*` → `./*`) — 테스트에서 `@/app/...`·`@/config/...` 같은 루트 경로는 해석되지 않으므로 새 테스트 작성 시 주의.

### Inferences
- 리디자인에서 자유로운 것: 모든 색·간격·radius·그림자·폰트·레이아웃 구조·애니메이션, 헤더 구성, 패널의 배치 방식(absolute → sheet), 모달 구현체.
- 유지해야 하는 것: 위 접근 가능한 이름·역할(또는 테스트와 사전을 동시 수정), SEO 라우트·robots·sitemap 계약, `HomeLanding`의 SSR 콘텐츠(검색엔진·no-JS용), `useFocusTrap` 동작(dialog 전환 시 Radix Dialog가 대체 가능하되 `SideBar.test.tsx`의 포커스 복귀 기대는 그대로).

## 7. Gaps (미검증·확인 필요)
- 브라우저 렌더링·스크린샷·실기기 터치 검증 없음(개발 서버·카카오 키 미사용). D02의 겹침 수치는 CSS 좌표 산술.
- D01은 백엔드 `/api/users/me`의 `profileImageUrl` 실제 호스트를 확인하지 못함(저장소에 `kakaocdn` 문자열 없음).
- D27 OG 이미지의 실제 한글 렌더링은 프로덕션 URL(`/opengraph-image`)에서 확인 필요.
- `useFocusTrap.test.tsx`, `authStore.test.ts`, `notificationStore.test.ts` 본문은 읽지 않았다(통과만 확인).
- `docs/BACKLOG.md`의 CI 중지 서술과 `.github/workflows/ci.yml` 중 현재 유효한 쪽은 사용자 확인 필요.
- Tailwind v4 전환 시 Kakao 지도 SDK가 주입하는 DOM과 preflight 변경의 상호작용은 평가하지 않았다.
