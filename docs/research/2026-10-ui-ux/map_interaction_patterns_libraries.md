# 서울핏 지도 중심 디스커버리 UI — 인터랙션 패턴·라이브러리 조사 (바텀시트 · 마커/클러스터 · 검색 · 필터/프리셋 · 상태 피드백 · 모션 · 다크모드 · 데모 · 성능)

> 조사 기준일 **2026-10-11** · 대상 스택: Next.js 16.3.1(설치본) / React
> 19.1.0(설치본) / Tailwind CSS 3.4.19 / shadcn(Radix) / Kakao Maps JS SDK(이번
> 실측에서 관찰한 버전: main 4.5.28, clusterer 1.1.4, services 1.1.3) · 저장소는
> **읽기 전용**으로만 참조(수정 없음).
>
> **근거 표기**: `[문서]` 공식 문서·레포 원문 / `[이슈]` GitHub 이슈·PR /
> `[검증]` 이번 조사에서 직접 실행·측정(헤드리스 Chrome for Testing 153 +
> Playwright-core 1.64, Node 24.15, esbuild 0.25.10, Tailwind CLI 3.4.19;
> 스크립트·산출물 위치는 문서 끝 "직접 실험 목록 E1–E11") / `[추론]` 근거에서
> 이끌어낸 판단 / `[미검증]` 확인하지 못한 것. **크기 측정법**:
> `esbuild --bundle --minify --target=es2020`, React·ReactDOM은 external,
> `gzip -9` 바이트. 서브패스 네임스페이스 전체를 import한 **상한치**(트리셰이킹
> 여지 있음). 사이즈 표는 §10에 통합. **사람 확인용 캡처**:
> `D:\download\project\seoul-fit-fe\index.html` →
> `2026-10-11-map-interaction-research\index.html`(WSL
> `/mnt/d/download/project/seoul-fit-fe/…`; 다크 지도 필터 비교·모바일 시트 3단
> 스냅·검색/토스트/테마 동시 렌더). 원본: `<scratchpad>/probe_out/*.png`. **실험
> 환경 주의**: 실험 머신은 데스크톱 CPU(i5-13600K, 20스레드)의 헤드리스
> 소프트웨어 렌더링이다. 절대 시간은 모바일보다 낙관적이며(추론: 3–6배 느릴 수
> 있음) **상대 비교**로만 쓸 것. 실기기(iOS Safari/Android
> Chrome)·스크린리더(VoiceOver/TalkBack)는 테스트하지 못했다.

## 한눈에 보는 결론 (구현자용 10줄)

1. **바텀시트**: Vaul은 신규 채택 비권장(README에 "unmaintained", 마지막 릴리스
   2024-12-14, `modal={false}` 버그 다수). **모바일 시트 =
   `@base-ui/react@1.9.0` Drawer(`modal={false}` + `snapPoints`)** 를 lazy-load,
   **데스크톱(≥768px) = Drawer 없이 `<aside>` 사이드 패널**. 비모달·스냅·스크롤
   핸드오프·Esc 단계 접기를 헤드리스 Chromium에서 직접 검증했다(§1).
2. **마커**: Kakao `Marker`(기본 이미지)는 개당 DOM 5노드·뷰포트 컬링 없음,
   `CustomOverlay`는 뷰포트 컬링(2,000개 중 76개만 DOM). **공식
   `MarkerClusterer`에 `CustomOverlay` 객체를 넣는 구성**(문서에는 `Marker`만
   명시, 실측상 동작)이 5,000개에서 생성 91ms+추가 37ms, DOM ≈139로 가장 가볍다.
   `react-kakao-maps-sdk`는 지금 필수 아님(§2).
3. **검색**: 현 커스텀 콤보박스는 `aria-activedescendant`·IME 가드·결과 수
   라이브 리전이 없다. **`cmdk@1.1.1`(`shouldFilter={false}`) + `es-hangul` 초성
   매칭**이 최소 변경으로 APG 패턴을 충족(React 19.3 실측)(§3).
4. **필터/프리셋**: 카테고리 칩은 `aria-pressed` + **라벨 고정**(현재는 상태에
   따라 라벨이 바뀜 → APG 위반). 프리셋 6개는 iPhone 세그먼트 컨트롤 권장
   한도(≈5) 초과 → 가로 스크롤 칩(§4).
5. **상태 피드백**: 토스트는 `sonner@2.0.8`로 교체(aria-live polite 실측),
   스켈레톤은 NN/g 기준(<1s 생략, 전체 화면 로딩에만), 위치 권한 거부는 **차단형
   오류가 아니라 서울시청 기준 + 복구 안내**로(§5).
6. **모션**: `motion` 불필요. 그리고 **`tw-animate-css@1.3.6`은 Tailwind 3.4에서
   `animate-in`/`slide-in-from-*`를 생성하지 않는다(실측 0건)** → 기존 코드의
   해당 클래스는 무동작일 가능성이 높음(Tailwind CLI 단계까지 검증, 실제 빌드
   산출물은 미확인). `tailwindcss-animate@1.0.7`(v3용)로 교체. React 19.3의
   `<ViewTransition>`은 Next 16.4 문서상 설정 플래그 불필요(§6).
7. **다크모드**: `next-themes@0.4.6`은 동작하나 React 19.2+ 개발 빌드에서
   `<script>` 콘솔 에러(실측 재현). **Kakao 타일은 `<img>` 래스터 → CSS
   `filter: invert(1) hue-rotate(180deg)…`로 가독성 있는 다크 지도 확보,
   오버레이는 영향 없음**(스크린샷 검증). 진짜 작업량은 하드코딩 색상 577곳의
   시맨틱 토큰 이행(§7).
8. **데모**: 잘못된 앱키는 HTTP 401(JSON) → 스크립트 `onerror`로 감지
   가능(검증). 도메인 미등록 환경(프리뷰 URL·localhost)에서는 지도가 실패할 수
   있으므로 **정적 미리보기 + 목록 전용 모드 + 재시도**를 폴백으로(§8).
9. **성능**: Kakao SDK 37KB(gz)+타일 PNG(타일당 ≈21.8KB). 시트·검색 패널은
   `next/dynamic`(Client Component 안에서만 `ssr:false`). Pretendard 가변 폰트
   전체는 2.06MB → 도입하려면 동적 서브셋(92조각, 8–44KB)만(§9).
10. **선행 위생(우선 처리)**: `tw-animate-css`→`tailwindcss-animate`,
    `tailwind-merge@3.3.1`→`2.6.0`(Tailwind 3용), `react/react-dom`→19.3,
    `components.json`의 `tailwind.config` 공란(=v4 출력) 정책 결정(§10).

---

## 1. 바텀시트 — 모바일 시트/데스크톱 사이드 패널, Vaul vs 커스텀 vs shadcn Sheet(Radix Dialog)

### Takeaway

모바일은 **Base UI Drawer 1.9.0의 non-modal + snapPoints**(직접 검증 완료)를
lazy-load로 쓰고, 데스크톱은 Drawer 없이 사이드 패널(`<aside>`)로 분기하는 것을
권고한다. Vaul은 유지보수 중단 + `modal={false}` 미해결 버그 때문에, shadcn
Sheet(Radix Dialog 기반)는 스냅/드래그가 없어 단독으로는 부적합하다.

### Cited Findings

#### 1.1 패턴 표준 (플랫폼 가이드·접근성 기준)

- Material 3(표준 vs 모달): "Standard bottom sheets co-exist with the screen's
  main UI region and allow for simultaneously viewing and interacting with both
  regions." / "Modal bottom sheets present a set of choices while blocking
  interaction with the rest of the screen." 모달만 scrim(딤)이 있고
  해부도(container, drag handle(optional), scrim)는 동일. 기본값: peekHeight
  `auto`, 표준 `hideable=false`/모달 `true`, `halfExpandedRatio` 0.5,
  `significantVelocityThreshold` 500px/s, 시트 최대 폭 640dp —
  [Material Components Android · BottomSheet.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)
  (m3.material.io 본문은 JS 렌더링이라 직접 읽지 못해 Google 공식 Android 문서로
  대체).
- Material 3 드래그 핸들 접근성: `BottomSheetDragHandleView`는 접근성
  서비스(TalkBack, Voice Access, Switch Access)의 확장/접기 명령을 처리하고,
  "The handle also supports tapping to cycle through expanded and collapsed
  states as well as double tapping to hide", 최소 48dp 터치 타깃 — 같은 문서.
- Apple HIG(Sheets): "In iOS and iPadOS, a sheet can be either modal or
  nonmodal. When a nonmodal sheet is onscreen, people use its functionality to
  affect the parent view without dismissing the sheet." / 리사이즈 시트는
  detent(large=완전 확장, medium≈절반)에서 쉬고, "Include a grabber in a
  resizable sheet… they can also tap it to cycle through the detents… a grabber
  also works with VoiceOver so people can resize the sheet without seeing the
  screen." / "Support swiping to dismiss a sheet." —
  [HIG · Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
  (Apple JSON 엔드포인트
  `developer.apple.com/tutorials/data/design/human-interface-guidelines/sheets.json`로
  본문 확인).
- Apple HIG(Maps): "Keep the location on your map visible when displaying a
  place card." / "Cluster overlapping points of interest to improve map
  legibility… As people zoom in on a map, clusters expand to progressively
  reveal individual points of interest." / "Help people find places in your map.
  Consider offering a search feature combined with a way to filter locations by
  category." / 사용자 지정 컨트롤이 움직일 때 지도 로고·법적 링크를 카드의 가장
  낮은 정지 위치 위(10pt)에 둘 것 —
  [HIG · Maps](https://developer.apple.com/design/human-interface-guidelines/maps).
- WCAG 2.2 SC 2.5.7 Dragging Movements(AA): "All functionality that uses a
  dragging movement for operation can be achieved by a single pointer without
  dragging" → 시트 핸들의 **탭/버튼 대안** 필요. 예시로 "지도에 상하좌우 이동
  버튼" 언급 —
  [Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
  SC 2.5.8 Target Size(Minimum)(AA): 포인터 타깃 최소 24×24 CSS px(간격 예외 등)
  —
  [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- WAI-ARIA APG Window Splitter: 분할선은 포커스 가능한 `role="separator"`,
  `aria-valuenow/min/max`, `aria-controls`로 주 패널 참조, 방향키로 이동,
  Enter로 접기/복원, Home/End — 지도↔시트 경계 핸들의 키보드 모델로 차용
  가능(APG는 이 패턴이 아직 검토 중이라고 명시) —
  [APG · Window Splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).
- MDN `overscroll-behavior`: `contain`은 요소 내부 바운스는 유지하되 스크롤
  체이닝을 막고(풀투리프레시 등 브라우저 내비게이션도 비활성), 시트 내부 스크롤
  영역에 쓰는 표준 수단 —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior).
  MDN `touch-action`: `none`은 "Disable browser handling of all panning and
  zooming gestures", 단 "may inhibit operating a browser's zooming
  capabilities"(저시력 접근성 경고) → **핸들에만** 적용 —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action). MDN
  `will-change`: "last resort… Don't use it to anticipate performance problems",
  스타일시트에 상시 두지 말고 변화 직전/직후 스크립트로 토글 —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change).
- React 17 변경 로그: "Keep `onTouchStart`, `onTouchMove`, and `onWheel`
  passive." → React 이벤트 핸들러 안의 `preventDefault()`는 무효(현
  `FacilityBottomSheet`가 해당) —
  [React v17 changelog](https://legacy.reactjs.org/blog/2020/10/20/react-v17.html).
  (형제 노트 `code_audit_map_core.md` D-11도 라이브에서 "Unable to
  preventDefault inside passive event listener" 콘솔 오류를 관찰.)
- Next.js `Viewport` 타입에 `viewportFit?: 'auto'|'cover'|'contain'`,
  `interactiveWidget`이 존재(설치본 16.3.1의
  `dist/lib/metadata/types/extra-types.d.ts` `[검증]`; 공식 문서 페이지에는
  미기재) —
  [generateViewport 문서](https://nextjs.org/docs/app/api-reference/functions/generate-viewport).
  Tailwind 3.4는 `h-dvh/min-h-dvh/max-h-dvh`, `size-*`, `has-*`를 기본 지원 —
  [Tailwind v3.4 블로그](https://tailwindcss.com/blog/tailwindcss-v3-4).

#### 1.2 후보 라이브러리 비교 (정확한 버전·발행일·크기·React 19·비모달 지원)

| 후보                                              | 버전 / 발행일                                                                                                                                                                                                            | gz 크기(실측)                                                                    | React 19                                                                                                                                       | 지도 상호작용 유지(비모달)                                                                                                                                                                                                                                                                                                                                                | 스냅 포인트                                                                                                                                                                                                           | 유지보수 신호                                                                                                                                                                                                                                                                                     | 판정                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Vaul**                                          | 1.1.2 / 2024-12-14 ([npm](https://www.npmjs.com/package/vaul))                                                                                                                                                           | 22.3KB (Radix Dialog 포함. 이미 Radix Dialog를 쓰면 +8.3KB)                      | peer `^19.0.0` 포함 / 단 [#525](https://github.com/emilkowalski/vaul/issues/525), [#567](https://github.com/emilkowalski/vaul/issues/567) 열림 | `modal={false}` 있으나 버그: [#497](https://github.com/emilkowalski/vaul/issues/497) 포커스 트랩, [#492](https://github.com/emilkowalski/vaul/issues/492)·[#509](https://github.com/emilkowalski/vaul/issues/509) 제어형에서 body `pointer-events:none`, 수정 PR #580은 main에 병합(2025-07-25)됐지만 **미배포**([#647](https://github.com/emilkowalski/vaul/issues/647)) | `snapPoints`, `activeSnapPoint`, `fadeFromIndex`, `snapToSequentialPoint` ([API](https://vaul.emilkowal.ski/api), [snap-points](https://vaul.emilkowal.ski/snap-points): "Combine `modal={false}` with snap points…") | README: "This repo is unmaintained." (커밋 "Explain maintenance" 2025-10-03). 이슈+PR 164건 열림. [#630 Vaul's future](https://github.com/emilkowalski/vaul/issues/630)에서 포크·대체(Base UI, Ark UI) 논의                                                                                       | **비권장**                     |
| **Base UI Drawer** (`@base-ui/react`)             | 1.9.0 / 2026-10-09 ([npm](https://www.npmjs.com/package/@base-ui/react)); 1.0.0=2025-12-11, **Drawer 도입 v1.2.0=2026-02-12**("Create new Drawer / Sheet component") ([릴리스](https://github.com/mui/base-ui/releases)) | **38.7KB**(Drawer 네임스페이스; Radix Dialog와 합치면 52.2KB → 거의 겹치지 않음) | peer `^17 \|\| ^18 \|\| ^19`; React **19.3.0** CSR에서 콘솔 경고 0건 `[검증 E6]`                                                               | `modal: true \| false \| 'trap-focus'`, `disablePointerDismissal` ([문서](https://base-ui.com/react/components/drawer)); **직접 검증 통과** `[E6]`                                                                                                                                                                                                                        | `snapPoints`(0–1=뷰포트 비율, >1=px, `'148px'`/`'31rem'` 문자열), `snapPoint`, `onSnapPointChange`, `snapToSequentialPoints`                                                                                          | MUI 팀, 거의 월 1회 릴리스(1.2.0→1.9.0 사이 매 릴리스에 Drawer 항목). `component: drawer` 열린 이슈 7건(예: [#4541](https://github.com/mui/base-ui/issues/4541) `dismissible` prop 부재, [#5878](https://github.com/mui/base-ui/issues/5878) iOS 27 Safari 재생 중 비디오 위에서 열 때 렌더 지연) | **권고(모바일 시트 한정)**     |
| react-modal-sheet                                 | 5.6.0 / 2026-03-27 ([npm](https://www.npmjs.com/package/react-modal-sheet))                                                                                                                                              | 54.6KB (motion 번들 포함 기준)                                                   | peer `motion>=11`, `react>=16`                                                                                                                 | 루트가 "fixed positioned wrapper element that covers the whole screen" ([README](https://github.com/Temzasse/react-modal-sheet)); 백드롭은 선택. 비모달 동작은 README에 명시 없음 `[미검증]`                                                                                                                                                                              | `snapPoints`, `initialSnap`, `onSnap`, `snapTo`, `detent: default\|content\|full`, `disableDismiss`, `avoidKeyboard`                                                                                                  | 단독 메인테이너                                                                                                                                                                                                                                                                                   | 비권장(motion 의존, 모달 지향) |
| pure-web-bottom-sheet                             | 1.1.1 / 2026-10-09 (npm 생성 2025-10-30; README는 v0.7.0 열람) ([README](https://cdn.jsdelivr.net/npm/pure-web-bottom-sheet@0.7.0/README.md))                                                                            | 미측정(웹 컴포넌트)                                                              | 프레임워크 무관 + React 래퍼                                                                                                                   | `dialog.show()`로 비모달 가능, host `pointer-events:none`·sheet `pointer-events:all`([작성자 글](https://dev.to/viliket/native-like-bottom-sheets-on-the-web-the-power-of-modern-css-ld6)). iOS Safari의 pointer-events 상속 버그 우회 코드 필요                                                                                                                          | CSS scroll-snap(`--snap`)                                                                                                                                                                                             | 1인 메인테이너, 약 1년차                                                                                                                                                                                                                                                                          | 관찰용 대안                    |
| Radix Dialog(`modal={false}`) = shadcn Sheet 변형 | `@radix-ui/react-dialog` 1.2.0 / 2026-10-05 (설치본 1.1.14)                                                                                                                                                              | 14.2KB(이미 포함)                                                                | peer `^19`                                                                                                                                     | 소스상 비모달은 `trapFocus={false}`, `disableOutsidePointerEvents={false}`; 모달은 `hideOthers`(aria-hidden)+`RemoveScroll` ([dialog.tsx](https://github.com/radix-ui/primitives/blob/main/packages/react/dialog/src/dialog.tsx)). shadcn `SheetContent`는 항상 `SheetOverlay`를 렌더 → 제거 필요                                                                         | 없음(직접 구현)                                                                                                                                                                                                       | WorkOS 유지, 2026-10-05 1.2.0([CHANGELOG](https://github.com/radix-ui/primitives/blob/main/packages/react/dialog/CHANGELOG.md))                                                                                                                                                                   | 드래그/스냅 직접 구현 필요     |
| 직접 구현(Pointer Events + CSS 변수)              | —                                                                                                                                                                                                                        | ≈1–3KB(추정)                                                                     | —                                                                                                                                              | 완전 제어                                                                                                                                                                                                                                                                                                                                                                 | 직접                                                                                                                                                                                                                  | 유지·테스트 부담                                                                                                                                                                                                                                                                                  | 폴백                           |

- shadcn/ui 공식 문서: Base UI 변형 Drawer는 **"The drawer component now uses
  Base UI instead of Vaul."**(마이그레이션: `- npm install vaul` /
  `+ npm install @base-ui/react`) —
  [shadcn Drawer](https://ui.shadcn.com/docs/components/drawer). Radix 변형
  Drawer는 여전히 **"Drawer is built on top of Vaul by emilkowalski."** —
  [shadcn Drawer (Radix)](https://ui.shadcn.com/docs/components/radix/drawer).
  즉 shadcn(Radix)로 `add drawer` 하면 Vaul이 설치된다.
- Base UI Drawer 문서 요약: `swipeDirection`(기본 `'down'`), `Drawer.SwipeArea`,
  스와이프 제외 `data-base-ui-swipe-ignore`,
  `Drawer.Provider/Indent/IndentBackground`,
  `Drawer.VirtualKeyboardProvider`(`--drawer-keyboard-inset`), Popup
  `initialFocus/finalFocus`, `onOpenChange`의 이유(`'escape-key'`)와
  `eventDetails.cancel()`, CSS 변수 `--drawer-swipe-movement-y`,
  `--drawer-snap-point-offset`, `--drawer-swipe-strength`,
  `--drawer-swipe-progress`, 속성 `data-starting-style/ending-style/swiping` —
  [Base UI Drawer](https://base-ui.com/react/components/drawer). 공식 비모달
  데모는 Viewport `pointer-events-none` + Popup `pointer-events-auto` +
  `modal={false} disablePointerDismissal` —
  [non-modal 데모 소스](<https://github.com/mui/base-ui/tree/master/docs/src/app/(docs)/react/components/drawer/demos/non-modal>).
  데모 CSS는 Tailwind v4 문법(`data-swiping:`, `bg-(--x)` 등)이라 3.4에서는
  `data-[swiping]:` 형태로 번역 필요.
- 타입 선언: `DrawerRootChangeEventReason`에 `'swipe'`, `'escape-key'`,
  `'outside-press'`, `'close-press'`, `'focus-out'` 등 포함 — 설치본
  `drawer/root/DrawerRoot.d.ts` `[검증]`.

#### 1.3 직접 검증 결과 — Base UI Drawer 1.9.0 + React 19.3.0, 모바일 에뮬레이션(390×844, CDP 터치 이벤트) [E6]

- 구성: `modal={false}`, `disablePointerDismissal`,
  `snapPoints={['148px', 0.5, 1]}`, Viewport `pointer-events:none`, Popup
  `pointer-events:auto`, `box-sizing:border-box`(Tailwind preflight와 동일 가정;
  빠뜨리면 padding-bottom 때문에 Popup 높이가 2,188px로 폭주),
  `transform: translateY(calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))`.
- 피크(148px): 시트 top=696/844 → **지도 뒤 버튼을 2회 클릭하면 2회 반응**(지도
  상호작용 유지). 바깥 `<input>`에 포커스·입력 가능(포커스 트랩 없음), Tab 4번
  후 시트 내부로 자연스럽게 진입(Portal이 문서 끝).
- 핸들 터치 드래그 −220px → `snap=0.5`(top 422), −400px → `snap=1`(top 16).
  `onSnapPointChange`가 상태에 반영.
- 풀 스냅에서 콘텐츠 터치 스크롤 → `scrollTop` 393, 시트 위치 불변. 스크롤된
  상태에서 아래로 드래그 → 콘텐츠만 스크롤(시트 불변). **`scrollTop=0`에서
  콘텐츠를 아래로 드래그 → 시트가 0.5로 이동(핸드오프 정상)**. 짧고 빠른 위로
  플릭(120px/3스텝) → 0.5(풀로 건너뛰지 않음).
- 피크에서 아래로 스와이프 → **기본은 닫힘**(`openChange:false:swipe`).
  `onOpenChange`에서 `reason==='swipe'`일 때 `details.cancel()` → **피크
  유지**(영구 시트 구현 가능). `escape-key`는 풀/하프에서 `cancel()` +
  `setSnap(peek)`로 한 단계 접기, 피크에서는 닫힘(검증).
- Popup은 `role="dialog"`, `aria-labelledby`(Drawer.Title), `tabindex=-1`,
  **`aria-modal` 없음**(비모달 시). React 19.3.0 프로덕션 번들 콘솔 경고·오류
  0건.
- **초기 포커스**: 비모달인데도 기본값에서는 열린 직후
  `document.activeElement`가 Popup(`#sheet`)이 되어 포커스 링이 보임(스크린샷
  `probe_out/bui_peek.png`의 시트 윤곽선). `initialFocus={false}`를 주면
  포커스가 `BODY`에 남음 → 포인터로 마커를 고른 경우 지도 포커스를 빼앗지 않는
  데 사용 `[검증 E6, bui_focus.mjs]`.
- 한계: 헤드리스 Chromium의 터치 에뮬레이션이며 iOS Safari 러버밴딩·실제 가상
  키보드·VoiceOver는 `[미검증]`. 풀 스냅에서 iOS 주소창 변화는
  `100dvh`·`env(safe-area-inset-bottom)`로 대응하는 것이 일반적(Base UI 데모도
  `pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` 사용).

#### 1.4 현재 코드(읽기 전용 확인) — 개선 대상

- `src/widgets/map-container/ui/FacilityBottomSheet.tsx`:
  `role='dialog' aria-modal='true'` + 전체 화면
  오버레이(`fixed inset-0 bg-black/40 backdrop-blur-sm z-40`) → **지도는 시트가
  열려 있는 동안 조작 불가**. `useFocusTrap` + 문서 레벨 keydown(Esc/↑/↓).
  드래그는 React `onTouchStart/Move/End`에서 `preventDefault()`(passive라
  무효) + `setDragState`를 move마다 호출(리렌더) + 마우스 이벤트. 높이는
  `50vh/80vh`(dvh 아님, safe-area 처리 없음).
- 형제 노트 `live_site_ux_audit.md §2.4`: 라이브에서 시트 열림 시 헤더 검색창이
  오버레이 위(z-50)에 남음, 모바일 시트 408px/80vh 토글만 존재(스냅 3단 아님).

### Inferences

#### 권장 패턴 (행동 명세)

- **상태 3단**: `peek`(핸들+제목+상태 배지+주요 액션 3개: 길찾기/전화/저장; 약
  148–168px) → `half`(0.5: 운영시간·혼잡·추천 이유·대안) → `full`(1.0 − 상단
  16px: 전체). 초기 진입은 항상 peek.
- **비모달(peek·half)**: 백드롭 없음, 포커스 트랩 없음, 지도 드래그·줌·마커 탭
  가능(M3 standard / HIG nonmodal과 동일 모델). **풀에서만** 약한 스크림(선택) —
  이때도 `modal={false}` 유지하고 시각 처리만.
- **스냅/제스처**: 속도 기반 스냅은 기본값 유지(빠른 스와이프가 단계를 건너뛸 수
  있음); 단계를 반드시 순차로 하려면 `snapToSequentialPoints`. 핸들 영역에서만
  드래그 시작, 본문은 `overscroll-behavior: contain`; 풀+`scrollTop=0`에서
  아래로 끌면 시트가 내려가는 핸드오프(검증됨).
- **닫기 규칙(단계 사다리)**: Esc·뒤로가기 → full→peek(접기) → peek에서 한 번 더
  Esc = 선택 해제/닫기. 피크에서의 아래 스와이프는 `cancel()`(우발 해제 방지),
  명시적 닫기는 X 버튼·지도 빈 곳 탭. 지도 빈 곳 탭: half/full이면 peek로 접고,
  peek면 선택 해제(Google/Apple 지도 관례, `[추론]`).
- **지도와의 관계**: 선택 시 마커가 **시트에 가리지 않게** 지도를 이동(HIG "Keep
  the location on your map visible"). Kakao
  `panBy(dx,dy)`/`getProjection().containerPointFromCoords`로 오프셋 계산. 줌
  컨트롤·내 위치 버튼·Kakao 로고는 시트 상단 위에 떠 있도록
  `bottom: calc(var(--sheet-visible) + 12px)`(HIG의 로고 배치 지침과 동일 취지).
- **데스크톱(≥768px)**: 좌측 고정 사이드 패널(폭 360–400px, `<aside aria-label>`
  랜드마크, 항상 비모달, 접이식). 시트 코드를 아예 로드하지
  않음(`next/dynamic`). 지도 컨테이너 크기를 바꾸지 말고 패널을 **지도 위에
  겹쳐** 두고 `panBy`로 중심만 보정(Kakao `relayout()` 호출·타일 재요청 회피,
  §9).
- **세이프 에어리어**:
  `viewport-fit=cover`(`export const viewport = { viewportFit: 'cover' }`) +
  콘텐츠 하단 `env(safe-area-inset-bottom)` 패딩, 높이는 `dvh`.

#### 추천 + 통합 스케치

(1) 분기 컴포넌트 — 데스크톱에는 Drawer 코드를 싣지 않음

```tsx
// src/widgets/map-container/ui/FacilityPanel.tsx  ('use client')
'use client';
import dynamic from 'next/dynamic'; // ssr:false 는 Client Component 안에서만 허용 [Next lazy-loading 문서]
import { useMediaQuery } from '@/shared/lib/hooks/useMediaQuery'; // 신규(10줄): matchMedia('(min-width: 768px)')

const MobileSheet = dynamic(() => import('./FacilityMobileSheet'), {
  ssr: false,
});

export function FacilityPanel(props: FacilityPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const shown = useLastDefined(props.facility); // 닫히는 동안에도 마지막 시설 유지(퇴장 애니메이션 보존) — 신규 훅
  if (!shown) return null;
  return isDesktop ? (
    <aside
      aria-label='시설 상세'
      className='pointer-events-auto absolute inset-y-0 left-0 z-20 flex w-[400px] flex-col border-r bg-card text-card-foreground shadow-lg'
    >
      <FacilityDetail {...props} facility={shown} variant='panel' />{' '}
      {/* 헤더/액션/본문 공용 컴포넌트 */}
    </aside>
  ) : (
    <MobileSheet {...props} facility={shown} open={props.facility !== null} />
  );
}
```

(2) 모바일 시트 — 위 직접 검증 구성을 Tailwind 3.4 클래스로 옮긴 형태(아래
클래스는 모두 Tailwind CLI 3.4.19에서 개별 생성 확인 `[검증 E9]`)

```tsx
// FacilityMobileSheet.tsx — Base UI Drawer 1.9.0
'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { cn } from '@/shared/lib/utils';

const PEEK = '160px';
const SNAP_POINTS = [PEEK, 0.5, 1];

export default function FacilityMobileSheet({
  facility,
  open,
  fromKeyboard,
  onDeselect,
  children,
}: Props) {
  const [snap, setSnap] = React.useState<string | number | null>(PEEK);
  const sheetVisiblePx = useSnapVisiblePx(snap); // 지도 컨트롤 bottom 오프셋·panBy 보정용 (신규 훅)

  return (
    <Drawer.Root
      open={open}
      modal={false} // 포커스 트랩·스크롤 락·바깥 포인터 차단 없음
      disablePointerDismissal // 지도 탭으로 자동 닫히지 않게(우리가 규칙대로 처리)
      snapPoints={SNAP_POINTS}
      snapPoint={snap}
      onSnapPointChange={setSnap}
      onOpenChange={(next, details) => {
        if (next) return;
        if (details.reason === 'swipe') {
          details.cancel();
          return;
        } // 피크에서 스와이프로 해제 금지
        if (details.reason === 'escape-key' && snap !== PEEK) {
          details.cancel();
          setSnap(PEEK);
          return;
        } // Esc = 한 단계 접기
        onDeselect();
      }}
    >
      <Drawer.Portal>
        <Drawer.Viewport className='pointer-events-none fixed inset-0 flex items-end justify-center'>
          <Drawer.Popup
            initialFocus={fromKeyboard ? undefined : false} // [검증] 기본값은 열릴 때 Popup이 포커스를 가져감 → 포인터 선택 시엔 끔
            className={cn(
              'pointer-events-auto box-border flex min-h-0 w-full flex-col rounded-t-2xl border-t bg-card text-card-foreground',
              'max-h-[calc(100dvh-1rem)] shadow-[0_-8px_32px_rgba(0,0,0,.18)]',
              '[padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]',
              '[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]',
              'transition-[transform] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
              'data-[swiping]:transition-none', // 드래그 중에는 손가락 1:1 추종
              'data-[starting-style]:[transform:translateY(100%)] data-[ending-style]:[transform:translateY(100%)]'
            )}
          >
            <SheetHandle snap={snap} onCycle={() => setSnap(next(snap))} />{' '}
            {/* <button> — 아래 접근성 항목 */}
            <Drawer.Title className='px-4 text-base font-semibold'>
              {facility.name}
            </Drawer.Title>
            <Drawer.Content className='min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]'>
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

(3) 선택 마커가 시트에 가리지 않도록 지도 이동 (문서: `panBy(dx,dy)`는 중심을
픽셀만큼 부드럽게 이동, `containerPointFromCoords`는 지도 좌상단 기준 픽셀 반환)

```ts
export function revealAboveSheet(
  map: kakao.maps.Map,
  target: kakao.maps.LatLng,
  el: HTMLElement,
  { sheetPx = 0, panelPx = 0 } = {}
) {
  const p = map.getProjection().containerPointFromCoords(target);
  const wantX = panelPx + (el.clientWidth - panelPx) / 2; // 데스크톱: 패널 오른쪽 영역의 중앙
  const wantY = (el.clientHeight - sheetPx) / 2; // 모바일: 시트 위 영역의 중앙
  map.panBy(p.x - wantX, p.y - wantY); // 마커를 want 위치로 가져오려면 중심을 (p - want)만큼 이동
}
```

(4) 핸들(탭=단계 순환, 키보드 ↑/↓=단계 이동) — WCAG 2.5.7·2.5.8·M3·HIG 모두 충족

```tsx
<button
  type='button'
  aria-label='시설 정보 크기 조절'
  aria-expanded={snap !== PEEK}
  onClick={onCycle}
  onKeyDown={e => {
    if (e.key === 'ArrowUp') up();
    if (e.key === 'ArrowDown') down();
  }}
  className='mx-auto flex h-6 min-w-12 touch-none items-center justify-center'
>
  <span className='h-1.5 w-10 rounded-full bg-muted-foreground/40' />
</button>
```

(APG Window Splitter 방식을 원하면
`role="separator" aria-orientation="horizontal" aria-valuenow={percent}`로
바꾸고 Enter=접기/복원.)

#### 접근성

- 비모달 시트는 `aria-modal`을 쓰지 않는다(검증: Base UI도 비모달에서 미설정).
  이름은 `Drawer.Title`(aria-labelledby). 지도 마커를 **포인터로** 선택했을 때는
  포커스를 시트로 가져오지 않는 편이 지도 탐색을 방해하지 않는다 →
  `initialFocus={false}`(검증: 포커스가 BODY에 남음, 기본값은 Popup으로 이동);
  **목록/검색 결과를 키보드로 선택**했을 때는 기본 동작(시트로 포커스 이동)을
  쓰고 `finalFocus`로 호출 요소 복귀 `[finalFocus 동작은 미검증]`.
- 시트가 열릴 때 `role="status"`(polite) 문구("서울숲 선택됨 · 상세 정보 보기
  가능")로 스크린리더 사용자에게 알림(터치 탐색 사용자는 DOM 끝의 시트를 놓치기
  쉬움, `[추론]`).
- 핸들은 `<button>`(탭=순환), 최소 24×24(AA) — M3는 48dp 권장이므로 터치 영역은
  `h-6`(24) + 주변 패딩으로 확장. `prefers-reduced-motion`은
  `motion-reduce:transition-none`.
- `touch-action: none`은 **핸들에만**(MDN의 줌 차단 경고). 본문은 `touch-auto`.

#### 위험·대안

- Base UI Drawer는 출시 8개월차(2026-02-12 도입): 열린 이슈 7건 중 `dismissible`
  prop 부재(우리는 `cancel()`로 우회), iOS 27 Safari 재생 비디오 위 열림
  지연(#5878)은 우리 앱과 무관할 가능성이 높음. **+38KB(gz)** 는 lazy-load로
  초기 번들에서 제외(모바일 시트는 선택 이후에만 필요).
- 데모 CSS가 Tailwind v4 문법 → 3.4 번역 필요(위 스케치는 번역 완료·클래스 생성
  확인).
- 폴백 1: **직접 구현**(Pointer Events: 핸들에서 `setPointerCapture` → rAF로
  `--sheet-y` CSS 변수 갱신 → 해제 시 속도·위치로 최근접 스냅, `transform` 만
  애니메이션, 드래그 동안에만 `will-change: transform`). 장점 무의존, 단점 iOS
  관성·키보드·접근성 테스트 부담. 폴백 2: pure-web-bottom-sheet(CSS scroll-snap,
  네이티브 관성) — 단 1인 메인테이너·젊음.
- Vaul을 꼭 써야 한다면: `1.1.2` 고정 + #580 패치(patch-package) +
  `noBodyStyles` 등 회피책이 필요하고 포커스 핑퐁(#497) 위험이 남음 → 권하지
  않음.

### Gaps

- Base UI Drawer의 iOS Safari 실기기 거동(러버밴딩·주소창·가상 키보드),
  VoiceOver/TalkBack에서의 시트 읽기 순서는 확인하지 못함.
- Material 3 사양 페이지(m3.material.io)와 Smashing/CSS-Tricks의 2024–2026
  바텀시트 글은 열람 불가/미발견 → Google의 Android 문서와 DEV 글로 대체.
- `snapToSequentialPoints`, `finalFocus`의 동작은 직접 확인하지
  않음(`initialFocus={false}`는 검증).

---

## 2. Kakao Maps 마커·클러스터 — SDK 기능, 성능 한계(2–5k), react-kakao-maps-sdk 도입 가치, hover/selected/cluster/현재위치 상태

### Takeaway

대량 마커는 **공식 `MarkerClusterer` + `CustomOverlay` 객체** 조합이 DOM·시간
모두 가장 유리했다(5,000개: 객체 생성 91ms + `addMarkers` 37ms, DOM ≈139 —
헤드리스 데스크톱 실측; 문서는 `Marker`만 명시하므로 "동작하나 미문서화"). 기본
`Marker`는 개당 DOM 5노드에 뷰포트 컬링이 없고, `CustomOverlay`를 개별 `setMap`
하면 5,000개에서 1.6초가 걸린다. `react-kakao-maps-sdk@1.2.2`는 React 19.3에서
정상 동작하지만(검증) `CustomOverlayMap`을 클러스터링하지 못해 지금 마이그레이션
이득이 작다 → **명령형 유지 + 얇은 `createPortal` 오버레이 훅(검증)** 을
권고한다.

### Cited Findings

#### 2.1 공식 문서 (apis.map.kakao.com)

- `kakao.maps.Marker` 옵션:
  `map, position, image, title(마커 엘리먼트의 title=툴팁), draggable, clickable, zIndex, opacity, altitude, range`;
  이벤트 `click, mouseover, mouseout, rightclick, dragstart, dragend` —
  [Documentation › Marker](https://apis.map.kakao.com/web/documentation/).
- `MarkerImage(src, size[, options])`:
  `alt, coords, offset(기본 이미지 가운데 아래), shape, spriteOrigin, spriteSize`;
  "shape와 coords는 HTML `<area>`의 shape/coords에 대응" — 같은 문서.
- `CustomOverlay` 옵션: `content`(Node|String), `position`,
  `xAnchor/yAnchor`(0–1, 기본 0.5), `zIndex`, `map`, **`clickable`: "true로
  설정하면 컨텐츠 영역을 클릭했을 경우 지도 이벤트를 막아준다."**; 보조로
  `kakao.maps.event.preventMap()`: "보통 CustomOverlay의 content 혹은 외부
  Element의 이벤트 핸들러에서 지도의 이벤트를 막고 싶을 경우 사용" — 같은 문서.
- `MarkerClusterer` 옵션·기본값: `gridSize` 60(px), `averageCenter` false,
  `minLevel` 0("지정한 숫자에 해당하는 레벨 **미만**에서는 클러스터링 하지
  않는다"), `minClusterSize` 2, `styles`(인라인 스타일 객체 배열), `texts`,
  `calculator` `[10, 100, 1000, 10000]`, `disableClickZoom` false, `clickable`
  true, `hoverable` true. 메서드
  `addMarker(s)/removeMarker(s)/clear/redraw/set*`, 이벤트
  `clusterclick/clusterover/clusterout/clusterdblclick/clusterrightclick/clustered`.
  "클러스터 마커 클릭 시 지도가 줌인 되는 경우 원하는 Cluster 객체를 얻지 못할
  수도 있다. … `disableClickZoom: true`" . `Cluster`:
  `getCenter/getBounds/getSize/getMarkers/getClusterMarker()`(반환은
  `CustomOverlay`) — 같은 문서. 라이브러리 로드는
  `libraries=services,clusterer,drawing` —
  [Guide](https://apis.map.kakao.com/web/guide/); 샘플
  [마커 클러스터러 사용하기](https://apis.map.kakao.com/web/sample/basicClusterer/).
- `Map` 옵션 `keyboardShortcuts: Boolean|Object`(**기본 false**; "키보드의
  방향키와 +, – 키로 지도 이동,확대,축소"), `tileAnimation`(기본 true);
  `relayout()`: "크기를 변경한 후에는 반드시 이 함수를 호출해야 한다. 단,
  window의 resize 이벤트에 대해서는 자동으로 호출한다.";
  `panBy(dx,dy)`·`panTo(latlng_or_bounds[, padding])`는 "부드럽게 이동"(거리가
  화면보다 크면 애니메이션 없이), `jump(center, level, options)`,
  `setBounds(bounds[, paddingTop, paddingRight, paddingBottom, paddingLeft])`(기본
  패딩 32), 이벤트 `idle`("애니메이션 도중에는 발생하지 않는다"), `tilesloaded`,
  `zoom_changed`;
  `getProjection().containerPointFromCoords/coordsFromContainerPoint`; 컨트롤
  `ZoomControl/MapTypeControl` — 같은 문서. 기본 지도 타입은
  `ROADMAP/SKYVIEW/HYBRID`뿐(다크 로드맵 타입 없음; `BICYCLE_HYBRID`는 "어두운
  지도에서 활용"하는 오버레이) — 같은 문서.
- SDK 파일 크기(gz 전송량 / 원본): `main/4.5.28/kakao.js` 37,447B / 103,665B,
  `libs/clusterer/1.1.4/clusterer.js` 3,536B / 10,579B,
  `libs/services/1.1.3/services.js` 2,469B / 6,349B,
  `cache-control: max-age=21600` `[검증 E1]`. 타일:
  `https://mts.kakaocdn.net/api/v1/tile/PNGSD02/<ver>/latest/<z>/<x>/<y>.png`(256×256
  PNG, 샘플 타일 1장 21,823B, `x-cached-mts: true`, max-age 21600) `[검증]`.

#### 2.2 DOM 구조·접근성·z-index·이벤트 — Kakao 샘플 페이지(공식 라이브 데모 iframe)에서 직접 관찰 [E1, E3, E4, E11]

- 지도 DOM 전체에 `role/tabindex/aria-*`가 없고 `canvas`
  없음(타일=`<img alt="">`, SVG 1개). 상호작용 요소는 Kakao 로고 링크
  `<a href="http://map.kakao.com/"><img alt="Kakao 맵으로 이동(새창열림)">` 뿐.
  드래그 표면은 `div{touch-action:none; cursor:url(...)}`이 타일·오버레이
  레이어를 감쌈.
- **기본 `Marker`(이미지 미지정)** = 개당 **5노드**: 래퍼
  `div(position:absolute; margin; left/top px)`, 마커
  `<img role="presentation" alt="">`, 투명 `<img usemap>`, `<map>`,
  **`<area href="javascript:void(0)" alt="" role="presentation" shape="poly" coords=… title=…>`**
  → `<area>`의 `tabIndex`가 0이라 **키보드로 포커스되지만
  `alt=""`·`role="presentation"`에 `title`만 있는 요소**(접근성 안티패턴; 형제
  노트 `live_site_ux_audit.md §4`도 Tab 순서에서 Kakao `AREA`를 관찰). **커스텀
  `MarkerImage`(shape 없음)** 마커 = 개당 **2노드**(래퍼 +
  `<img role="presentation" alt=<MarkerImage.alt> title=<Marker.title>>`),
  포커스 불가.
- `CustomOverlay` = 래퍼
  `div(position:absolute; z-index=<zIndex>; margin; left/top)` + 우리 콘텐츠
  그대로 → `<button>` 등 네이티브 포커스 요소 사용 가능. **DOM은 뷰포트로
  컬링**됨(2,000개 중 뷰포트 내 76개만 DOM에 존재, `bounds.contain` 76과 일치).
  반대로 `Marker`는 컬링 없음(2,000개 → DOM +10,000).
- 클러스터러(1.1.4)가 만드는 클러스터는 `div`(inline style:
  `cursor:pointer; background:url(.../mapclusterer/cluster.png)`)이며
  role/tabindex 없음. **`clustered` 이벤트에서
  `cluster.getClusterMarker().getContent()`에 `role="button"`, `tabindex=0`,
  `aria-label`을 주입하면 동작**(레벨 7에서 6개, 줌 후 9개 모두 재적용), 포커스
  후 Enter가 우리 핸들러 호출 `[검증 E3]`.
- **z-index**: 오버레이 래퍼의 `z-index`는 `zIndex` 옵션 값이며 `setZIndex()`가
  순서를 바꿈. `Marker`(zIndex 1)와 `CustomOverlay`(zIndex 9999)가 겹치면
  오버레이가 위, `Marker.setZIndex(100000)` 후에는 마커가 위 → 숫자 비교가
  종류를 넘어 유효 `[검증 E3]`. 래퍼가 `position:absolute + z-index`로 쌓임
  맥락을 만들므로 **콘텐츠 내부 `z-index`는 다른 오버레이를 이기지 못한다**
  `[추론: CSS 규칙 + 래퍼 검증]` → 현 `marker-animations.css`의
  `.custom-marker:hover{z-index:1001 !important}`/`.marker-selected{z-index:1002 !important}`는
  효과가 없고 `overlay.setZIndex()`를 호출해야 한다.
- **`clickable` 실측(실제 마우스 클릭)**: `clickable:false` 오버레이 안 버튼을
  클릭하면 버튼 핸들러 **+ 지도 `click`** 둘 다 발생, `clickable:true`면 지도
  `click` 미발생 `[검증 E3]`.
- **키보드 지도 조작**: `keyboardShortcuts: true`를 **생성자에 지정**하고
  컨테이너에 `tabindex=0` + `.focus()` 했을 때만 동작(방향키 4회+위 1회로 중심
  이동, `+`로 레벨 5→3, `-`로 4). 생성 후 `setKeyboardShortcuts(true)`는 내
  실험에서 효과 없음, 마우스 클릭은 컨테이너에 포커스를 주지
  않음(`activeElement`=BODY) `[검증 E4]`. 앱의 `useKakaoMap`은 이 옵션을 쓰지
  않음(코드 확인).

#### 2.3 성능 실측 — 마커 렌더 방식 비교 (Chrome for Testing 153 헤드리스, 479×693 지도, 서울 임의 분포, 모든 수치는 `[검증 E2]`)

| 방식                                                                        | 개수                | 추가 시간                               | DOM 노드(지도 내부)     | 비고                                                     |
| --------------------------------------------------------------------------- | ------------------- | --------------------------------------- | ----------------------- | -------------------------------------------------------- |
| 기본 `Marker` ×N, 클러스터 없음                                             | 500 / 2,000 / 5,000 | 39 / 209 / 334 ms                       | 2,631 / 10,143 / 25,143 | 개당 5노드, 컬링 없음                                    |
| `Marker`+커스텀 `MarkerImage` ×N                                            | 2,000               | (미측정)                                | +4,000                  | 개당 2노드 `[검증 E11]`                                  |
| `CustomOverlay`(HTML+SVG) 개별 `setMap` ×N                                  | 500 / 2,000 / 5,000 | 65 / 369 / **1,591** ms                 | 326 / 1,001 / 2,266     | 뷰포트 컬링, 5,000에서 50ms 프레임 1회                   |
| `MarkerClusterer` + 기본 `Marker` (grid 60, minLevel 1)                     | 500 / 2,000 / 5,000 | 14 / 89 / 113 ms                        | 217 / 258 / 248         | 줌 레벨 7→5 재그리기 3 / 11 / 14 ms                      |
| **`MarkerClusterer` + `CustomOverlay` 객체**(HTML+SVG, grid 70, minLevel 1) | 500 / 2,000 / 5,000 | 객체 생성 5/31/91 + 추가 4/17/**37** ms | 137 / 133 / 139         | 줌 재그리기 4 / 5 / 10 ms. **문서에 없는 조합이나 동작** |
| `react-kakao-maps-sdk` `MarkerClusterer`+`MapMarker`                        | 1,500 / 5,000       | 첫 클러스터 가시화까지 172 / 397 ms     | 108 / 95                | StrictMode 포함 콘솔 경고 0 `[검증 E8]`                  |

- 드래그(패닝) 프레임 간격은 모든 구성에서 p95 16.7ms(하나의 50ms 예외) → **패닝
  비용은 마커 수와 무관**(컨테이너 단위 합성), 비용은 "추가/재그리기/줌" 시점에
  발생. 모바일 CPU는 3–6배 느릴 수 있음 `[추론]` → 개별 `setMap` 5,000개(1.6s)는
  모바일에서 수 초.

#### 2.4 react-kakao-maps-sdk 평가

- 버전/상태: 1.2.2 / 2026-08-13(rollup external 수정), 1.2.1 /
  2026-02-18(**"React 19버전의 strict mode 에서 clusterer가 정상 동작하지 않는
  이슈를 해결"**), 1.2.0 / 2025-06-07; peer React `^16.8 … ^19`,
  **`kakao.maps.d.ts ^0.1.40` peer**; GitHub 319★, 열린 이슈 1건 —
  [repo](https://github.com/JaeSeoKim/react-kakao-maps-sdk),
  [npm](https://www.npmjs.com/package/react-kakao-maps-sdk). 문서:
  `useKakaoLoader`("재설치되거나, 제거되지 않습니다"), Next.js는 `Script`로 SDK
  로드(`strategy="beforeInteractive"`, `autoload=false`) —
  [withHook](https://react-kakao-maps-sdk.jaeseokim.dev/docs/setup/withHook),
  [next.md](https://github.com/JaeSeoKim/react-kakao-maps-sdk/blob/main/docs/docs/setup/next.md).
  크기: `Map, MapMarker, CustomOverlayMap, MarkerClusterer, useKakaoLoader`
  5.6KB gz(React 제외) `[검증 E10]`.
- React 19.3.0 + 라이브 SDK 프레임에서 `[검증 E8]`: `<Map keyboardShortcuts>`,
  `<CustomOverlayMap clickable>` 안 `<button onClick>`이 **마우스·키보드(Enter)
  모두 React `onClick` 발화**, `clickable={false}`는 지도 `onClick`도 같이
  발화(공식 의미 유지). **`<MarkerClusterer>` 자식으로 넣은 `CustomOverlayMap`
  30개는 클러스터링되지 않음(클러스터 0)** — 래퍼는 `MapMarker`만 클러스터에
  등록. (반면 순수 SDK에서 `CustomOverlay` 객체는 클러스터링됨.)
- **얇은 포털 훅**(검증 `[E8 portal_probe]`):
  `new CustomOverlay({content: div})` + `createPortal(children, div)`로 만든
  `KakaoOverlay`가 React 19.3에서 정상 — zIndex 반영, 클릭·Space로 `onClick`,
  `clickable`로 지도 클릭 차단, 언마운트 시 DOM 제거/재마운트 재생성.
- 타입: 저장소에 직접 쓴 `src/shared/lib/kakao/index.ts`(418줄)가 있음. 공식
  타입 패키지는 `kakao.maps.d.ts@0.1.40`(2024-06-16), DefinitelyTyped
  `@types/kakaomaps@1.1.7`(2025-07-19) `[npm]`.

### Inferences

#### 권장 패턴 (행동 명세)

- **2계층 구조**: ① _벌크 계층_ = `CustomOverlay` 객체(리치 HTML: 카테고리
  아이콘·혼잡도 링·따릉이 배지) → 공식 `MarkerClusterer`. ② _포커스 계층_ =
  클러스터러 밖의 별도 오버레이 — **선택 시설, 호버(데스크톱), 추천 Top-N 랭크
  배지, 현재 위치**. 선택 시설이 클러스터 안에 묻혀도 항상 보이게 하는 것이
  핵심(선택 오버레이를 따로 두고, 원본 오버레이는 `data-hidden`).
- **클러스터 확장**: `disableClickZoom:true` + `clusterclick`에서 — 레벨 ≤3(건물
  단위) 또는 크기 ≤6이면 **클러스터 시트(목록)**, 아니면
  `map.setBounds(cluster.getBounds(), top, right, bottom+시트 피크 높이, left)`로
  영역 맞춤 확대(HIG "클러스터는 줌인하면서 점진적으로 개별 POI를 드러낸다").
  `minLevel`은 "지정값 **미만**에서 클러스터 해제"이므로 거리 단위(레벨
  1–3)에서는 개별 표시되도록 4 이상 권장 `[추론]`.
- **z-index 상수**(래퍼에 적용됨):
  `cluster 0 < marker 1 < hover 10 < selected 20 < me 30`. 호버/선택 시
  `overlay.setZIndex()`로 올림(콘텐츠 내부 z-index 금지).
- **현재 위치**: 클러스터러 밖 `CustomOverlay`, `clickable:false` + 콘텐츠
  `pointer-events:none`(아래 마커 탭 방해 금지), 정확도 반경은
  `kakao.maps.Circle`(`coords.accuracy`).
- **접근성 경계**: 수백~수천 개 지도 마커를 Tab 순서에 넣지
  않는다(`tabindex=-1`; 기본 `Marker`의 `<area>` 포커스 문제도 피함).
  **키보드·스크린리더 경로는 목록/검색/시트**, 지도 위에서는 _클러스터
  버튼(패치)_, _선택 마커_, _줌/내 위치 버튼_, *`keyboardShortcuts` 지도 패닝*만
  포커스 가능하게 `[추론]`.

#### 추천 + 통합 스케치

(1) 클러스터 레이어(명령형 유지)

```ts
// src/features/map-markers/lib/cluster-layer.ts
export const Z = {
  cluster: 0,
  marker: 1,
  hover: 10,
  selected: 20,
  me: 30,
} as const;

export function createFacilityLayer(
  map: kakao.maps.Map,
  h: {
    openClusterList: (f: Facility[]) => void;
    sheetPeekPx: () => number;
    select: (f: Facility) => void;
  }
) {
  const facilityOf = new WeakMap<object, Facility>(); // Kakao 객체 → 시설 (clusterclick 역참조)
  const expand = (c: any) => {
    if (map.getLevel() <= 3 || c.getSize() <= 6)
      h.openClusterList(c.getMarkers().map((m: object) => facilityOf.get(m)!));
    else map.setBounds(c.getBounds(), 96, 48, h.sheetPeekPx() + 24, 48); // setBounds(bounds, top, right, bottom, left) — 문서
  };
  const clusterer = new kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    gridSize: 64,
    minClusterSize: 2,
    minLevel: 4,
    disableClickZoom: true, // 문서 권고: clusterclick에서 직접 처리
    calculator: [10, 50],
    styles: CLUSTER_STYLES, // 3단계 크기 (인라인 스타일 객체)
    texts: (n: number) => (n > 99 ? '99+' : String(n)),
  });
  kakao.maps.event.addListener(clusterer, 'clustered', (clusters: any[]) => {
    for (const c of clusters) {
      // [검증] 줌 후에도 재적용됨
      const el = c.getClusterMarker().getContent() as HTMLElement;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.setAttribute(
        'aria-label',
        `시설 ${c.getSize()}곳이 모여 있어요. 눌러서 확대`
      );
      if (!(el as any).__bound) {
        (el as any).__bound = true;
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            expand(c);
          }
        });
      }
    }
  });
  kakao.maps.event.addListener(clusterer, 'clusterclick', expand);

  const overlays = new Map<string, kakao.maps.CustomOverlay>();
  return {
    set(facilities: Facility[]) {
      // 필터/뷰 변경 시 diff 갱신 (clear 후 재생성 금지)
      /* 새 목록과 overlays 비교 → 제거분 clusterer.removeMarkers(.., true), 추가분 생성 후 clusterer.addMarkers(.., true), 마지막에 clusterer.redraw() */
    },
    clusterer,
    facilityOf,
    overlays,
  };
}
// 미문서 조합이므로 기능 탐지 가드를 둔다: 클러스터가 하나도 안 그려지면 Marker+MarkerImage 경로로 폴백.
```

(2) 오버레이 콘텐츠 상태(CSS) — `transition: all`·`!important` 제거, 호버는
`(hover:hover)`에서만, 선택은 `aria-current`

```css
.fac-marker {
  transition:
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out;
}
@media (hover: hover) {
  .fac-marker:hover {
    transform: scale(1.12);
  }
} /* 터치의 sticky hover 방지 */
.fac-marker:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
.fac-marker[aria-current='true'] {
  transform: scale(1.2);
  box-shadow:
    0 0 0 4px hsl(var(--primary) / 0.28),
    0 6px 16px rgb(0 0 0 / 0.35);
}
@media (prefers-reduced-motion: reduce) {
  .fac-marker {
    transition: none;
  }
}
```

```ts
btn.addEventListener('mouseenter', () => overlay.setZIndex(Z.hover)); // 포커스(키보드)에서도 동일하게
btn.addEventListener('mouseleave', () => overlay.setZIndex(Z.marker));
```

(3) 현재 위치 펄스(접근성: 이름 있는 이미지, 모션 감소 시 정지, 클릭 방해 없음)

```css
.me-dot {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  pointer-events: none;
}
.me-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  background: #2563eb;
  opacity: 0.35;
  animation: me-pulse 2s ease-out infinite;
} /* transform/opacity 만 애니메이션 */
@keyframes me-pulse {
  from {
    transform: scale(1);
    opacity: 0.35;
  }
  to {
    transform: scale(3);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .me-dot::after {
    animation: none;
    transform: scale(2);
    opacity: 0.2;
  }
}
```

```html
<div class="me-dot" role="img" aria-label="현재 위치"></div>
<!-- CustomOverlay{ clickable:false, zIndex: Z.me } -->
```

(4) React 컴포넌트 오버레이가 필요할 때 — 라이브러리 없이 포털 훅(React 19.3 +
SDK 4.5.28에서 검증)

```tsx
export function KakaoOverlay({
  map,
  lat,
  lng,
  zIndex = 1,
  clickable = true,
  yAnchor = 1,
  children,
}: Props) {
  const [el] = React.useState(() => document.createElement('div'));
  const ref = React.useRef<kakao.maps.CustomOverlay | null>(null);
  React.useEffect(() => {
    const ov = new kakao.maps.CustomOverlay({
      content: el,
      position: new kakao.maps.LatLng(lat, lng),
      zIndex,
      clickable,
      xAnchor: 0.5,
      yAnchor,
    });
    ov.setMap(map);
    ref.current = ov;
    return () => {
      ov.setMap(null);
      ref.current = null;
    };
  }, [map, el]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    ref.current?.setPosition(new kakao.maps.LatLng(lat, lng));
  }, [lat, lng]);
  React.useEffect(() => {
    ref.current?.setZIndex(zIndex);
  }, [zIndex]);
  return createPortal(children, el);
}
// 사용: <KakaoOverlay map={map} lat={f.lat} lng={f.lng} zIndex={Z.selected}><SelectedMarker facility={f} /></KakaoOverlay>
```

(5) 지도 키보드·줌 대안(WCAG 2.5.7)

```ts
const map = new kakao.maps.Map(el, {
  center,
  level,
  keyboardShortcuts: true, // 생성자에서 지정해야 동작(검증)
  tileAnimation: !matchMedia('(prefers-reduced-motion: reduce)').matches,
});
el.tabIndex = 0;
el.setAttribute('role', 'region');
el.setAttribute(
  'aria-label',
  '서울 시설 지도. 방향키로 이동, 더하기·빼기 키로 확대·축소'
);
el.addEventListener('pointerdown', () => el.focus({ preventScroll: true })); // 마우스 사용 후에도 키 입력이 지도로 가게
```

화면 `+/−` 버튼은 `map.setLevel(map.getLevel() ∓ 1, { animate: true })`, 또는
`new kakao.maps.ZoomControl()`.

#### 접근성

- 지도 마커는 보조적 시각 요소, **같은 정보의 키보드/스크린리더
  경로(목록·검색·시트)** 를 항상 제공. 오버레이 마커는
  `<button aria-label="서울숲, 공원, 운영 중">` + `tabindex=-1`(기본), 선택
  마커만 `aria-current="true"` + 포커스 가능 `[추론]`.
- 클러스터 버튼은 개수·행동을 읽어주는 이름 필수(검증된 패치). 색만으로 혼잡도
  표현 금지: 링 색 + 아이콘/텍스트 보조.
- 현재 위치 펄스는 `prefers-reduced-motion`에서 정지, `role="img"`로 이름 제공.

#### 위험·대안

- `MarkerClusterer`에 `CustomOverlay`를 넣는 것은 **문서에 없는 사용**: Kakao가
  SDK를 버전 고정 없이 서빙(`main/4.5.28`, `clusterer/1.1.4`는 현재
  관찰값)하므로 회귀 가능 → 배포 후 스모크 테스트(클러스터 ≥1개 렌더) +
  `Marker`+SVG data-URI `MarkerImage` 폴백(개당 2노드, 클러스터러는 문서 지원)을
  준비.
- 카테고리×혼잡도×선택 상태 조합을 SVG data-URI `MarkerImage`로 사전 생성하면
  HTML 없이도 리치 외형이 가능하나 hover/pulse/접근성은 포기해야 함.
- `react-kakao-maps-sdk`는 MapView(796줄)·marker-factory를 전면 재작성해야 하고
  `CustomOverlayMap`은 클러스터링 불가 → **지금은 불필요**. 재작성 시점이 오면
  `useKakaoLoader` 기반으로 SDK 로딩/폴백(§8)과 함께 재검토.
- Kakao 로고는 지도 좌하단 고정(SDK 레이어) → 모바일 피크 시트가 가릴 수 있음.
  HIG의 로고 배치 지침을 참고해 **시트 피크 높이만큼 지도 컨테이너 하단 여백**을
  주는 방식 필요 — 로고 이동 방법과 Kakao 약관은 `[미검증]`.

### Gaps

- Kakao 약관상 타일/로고의 시각 변형(필터 등) 허용 범위, 로고 위치 이동 방법은
  확인하지 못함.
- 모바일 실기기 수치 없음(데스크톱 헤드리스 상대 비교만).
  `Marker`+`shape/coords` 조합의 DOM/포커스 거동 미측정.
- 클러스터러 내부 알고리즘 복잡도·메모리는 소스 열람하지 않음(측정값만 보고).
  Kakao SDK는 버전이 서버에서 바뀔 수 있음.

---

## 3. 검색 — 지도 검색창 패턴(제안·최근 검색·카테고리·하이라이트·키보드·빈/오류 상태), cmdk vs Radix/shadcn Combobox vs 현행 커스텀

### Takeaway

현행 Header 콤보박스는 APG의 뼈대(`role=combobox/listbox/option`,
`aria-expanded/controls/autocomplete`)는 갖췄지만 **옵션 `aria-selected`가 상시
`'false'`이고 ↓키가 첫 옵션으로 DOM 포커스를 옮기는 방식**(APG는 입력에 포커스를
두고 `aria-activedescendant`), **IME(한글) 가드·결과 수 라이브
리전·하이라이트·그룹이 없다**. 최소 변경 경로는
**`cmdk@1.1.1`(`shouldFilter={false}`)로 교체 + `es-hangul`로 초성/자모 매칭**:
cmdk는 APG 패턴을 이미 구현(React 19.3 실측), 증분은 약 4KB gz. Radix에는
Combobox 프리미티브가 없고(`radix-ui@1.7.0` 구성 목록·npm 404로 확인), shadcn의
Radix 변형 Combobox 문서도 Base UI 문서를 안내한다.

### Cited Findings

#### 3.1 패턴 표준

- APG Combobox: 입력은 `role="combobox"`, 팝업은 `listbox`; `aria-controls`는
  "only needs to be set when the popup is visible"; 팝업 항목으로 이동해도 "DOM
  focus remains on the combobox"(→ `aria-activedescendant`); Down=팝업 진입,
  Up=마지막 항목(선택), Esc=팝업 닫기(이미 닫혀 있으면 값 지우기 선택),
  Enter=제안 수락, Alt+Down=열기(포커스 이동 없이), Home/End;
  `aria-autocomplete`는 `none/list/both` —
  [APG · Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).
- NN/g(Site Search Suggestions, 2018-05-20): 제안은 "good results"로 이어져야
  하며 0건·무관 결과 제안은 "worse than unhelpful"; **입력한 부분과 제안 부분을
  다르게 스타일링**(제안이 뒤에 덧붙는 경우 덧붙는 글자를 강조, 사용자 질의가
  어디든 포함되는 경우 질의를 강조) — 이미 입력한 글자를 굵게 하면 반복 강조;
  **모바일은 단순 텍스트 제안 위주**의 적응형; 풍부한 드롭다운은 "overkill"일 수
  있음; 제안은 제공된 경우의 23%에서만 선택됨 —
  [NN/g](https://www.nngroup.com/articles/site-search-suggestions/).
- Apple HIG(Search fields): "start search immediately when a person types",
  "display recent searches before search begins, or predictive search
  suggestions as a person types", "categorizing them to help people find what
  they want", 스코프 바는 "Default to a broader scope" —
  [HIG](https://developer.apple.com/design/human-interface-guidelines/search-fields).
  HIG Maps는 "search feature combined with a way to filter locations by
  category" —
  [HIG · Maps](https://developer.apple.com/design/human-interface-guidelines/maps).
- MDN: `KeyboardEvent.isComposing`은 "fired within a composition session, i.e.,
  after compositionstart and before compositionend"(한글 IME 조합 중
  Enter/방향키 오작동 방지에 사용; MDN 페이지에 CJK 설명·Safari 순서 차이는
  없음) —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing).
- NN/g 빈 상태(2021-09-19): "Totally empty states cause confusion about how and
  whether the system is working"; 결과 없음 메시지 + **직접 경로(CTA)**,
  "inaccurate system-status messages… particularly harmful"(로딩 중 "No records"
  금지) —
  [NN/g](https://www.nngroup.com/articles/empty-state-interface-design/). NN/g
  오류 메시지(2023-05-14): 눈에 띄고, 쉬운 말, 비난 없이, 정확하게, **해결책
  제시**, 입력 보존 —
  [NN/g](https://www.nngroup.com/articles/error-message-guidelines/).

#### 3.2 후보 비교

| 후보                           | 버전 / 발행일                                                  | gz 크기                                                 | React 19                                                                  | 접근성/기능                                                                                                                                                                                                                                                                                                                                                        | 유지보수                                                                                       | 판정                                                    |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 현행 커스텀(Header.tsx)        | —                                                              | 0                                                       | —                                                                         | `role=combobox/listbox/option` 있음, `aria-selected` 상시 false, 포커스 이동 방식, IME·라이브 리전·그룹·하이라이트 없음, 디바운스 `setTimeout` 클로저(언마운트 정리 없음) (코드 확인)                                                                                                                                                                              | 자체                                                                                           | 보강 시 유지 가능(저비용 대안)                          |
| **cmdk**                       | 1.1.1 / 2025-03-14 ([npm](https://www.npmjs.com/package/cmdk)) | 17.8KB (Radix Dialog와 합치면 18.3KB → **증분 ≈4.2KB**) | peer `^18 \|\| ^19`; React 19.3.0 개발 빌드에서 경고·오류 0건 `[검증 E7]` | 소스에 `aria-activedescendant/expanded/controls/autocomplete`, `role=combobox/listbox/option/group/progressbar`; `shouldFilter={false}`(수동 필터·가상화), `Command.Empty/Loading/Group`, `loop`; **v1.1.1이 "IME composition 중 키 바인딩 이중 발동" 수정(#339)**                                                                                                 | 마지막 릴리스 2025-03-14, 마지막 커밋 2025-10-29(README), 13.0k★, 열린 이슈 76 — "안정·저활동" | **권고**                                                |
| Base UI Autocomplete/Combobox  | `@base-ui/react` 1.9.0 / 2026-10-09                            | **50.4KB**(Autocomplete)                                | peer `^17..^19`                                                           | `filter={null}`(비동기), `Autocomplete.Group/Empty/Status`, `ComboboxStatus`는 소스에 `aria-live: polite`, `ComboboxInput`에 `aria-activedescendant` ([문서](https://base-ui.com/react/components/autocomplete))                                                                                                                                                   | 활발                                                                                           | 무겁다. Drawer 도입 시 일부 공유되나 단독 채택은 비권장 |
| Downshift `useCombobox`        | 9.4.0 / 2026-06-30                                             | 13.5KB                                                  | peer `react >=16.12`                                                      | 헤드리스 훅(prop getters, 상태 메시지), 스타일 자유                                                                                                                                                                                                                                                                                                                | 활발                                                                                           | cmdk 폴백                                               |
| react-aria-components ComboBox | 1.22.1 (npm 수정 2026-10-09)                                   | 미측정                                                  | peer `^19.0.0-rc.1` 포함                                                  | 접근성·i18n에 강점으로 알려져 있으나 번들·학습 비용이 클 것으로 `[추론]`                                                                                                                                                                                                                                                                                           | 활발                                                                                           | 과함(미평가)                                            |
| Radix                          | `radix-ui` 1.7.0                                               | —                                                       | —                                                                         | **Combobox/Autocomplete/Command/Drawer 프리미티브 없음**: 통합 패키지 `radix-ui@1.7.0`의 구성 목록(accordion … toolbar, tooltip)에 없고 `@radix-ui/react-combobox\|autocomplete\|command\|drawer`는 npm 404 `[검증]`; shadcn의 Radix 변형 Combobox 문서도 "See the Base UI documentation…"을 안내 ([shadcn](https://ui.shadcn.com/docs/components/radix/combobox)) | —                                                                                              | —                                                       |

- **cmdk 직접 검증 `[E7]`**(React 19.3.0 dev 번들, Chromium): 입력에
  `role="combobox" aria-expanded="true" aria-controls=<list id> aria-autocomplete="list"`;
  ↓ 입력 시 `aria-activedescendant`가 항목 id로 설정되고 **DOM 포커스는 입력에
  유지**; ↓↓+Enter로 `onSelect` 발화; **`Command.Empty`는
  `role="presentation"`(라이브 리전 아님)**; **`Command.List`의 기본
  `aria-label`이 영어 "Suggestions"**(prop으로 덮어써야 함); `Command.Input`은
  `id` prop을 무시(내부 id 사용).
- **es-hangul** 2.4.0 / 2026-07-09
  ([toss/es-hangul](https://github.com/toss/es-hangul), MIT, 마지막 push
  2026-08-27): `getChoseong('따릉이') → 'ㄸㄹㅇ'`,
  `disassemble('서울ㄷ') → 'ㅅㅓㅇㅜㄹㄷ'`; v2.4.0은
  `chosungIncludes/hangulIncludes` 류 헬퍼를 **내보내지 않음**(내보내기 목록
  확인) → `getChoseong+disassemble` 두 함수로 직접 매칭(1.9KB gz, 헬퍼 동작 검증
  `[E10, hangul_test.mjs]`).
- `use-debounce` 10.1.1(2026-03-29, 1.1KB gz) 등 디바운스 라이브러리는 선택 사항
  — 검색 인덱스가 메모리 내 로컬(`useSearchCache`)이면 렌더 지연은 React의
  `useDeferredValue`로 충분 `[추론]`.

#### 3.3 현재 코드 확인 (Header.tsx)

- 입력
  `role='combobox' aria-expanded aria-controls='global-search-suggestions' aria-autocomplete='list'`,
  목록 `role='listbox'`, 옵션 `<button role='option' aria-selected='false'>`;
  `onKeyDown`은 Esc(닫기)·ArrowDown(첫 옵션으로 `.focus()`)만 처리; 디바운스는
  `useMemo` 안 `setTimeout(…, 200)`; `isComposing`/`compositionstart` 처리는
  저장소 전체에서 검색되지 않음(grep 0건).

### Inferences

#### 권장 패턴 (행동 명세)

- **빈 입력 + 포커스**: 최근 검색(최대 5, 항목별 삭제 + 전체 삭제) + 상황 프리셋
  바로가기(HIG: 검색 시작 전 최근/제안 노출).
- **입력 중**: 로컬 인덱스라면 디바운스 없이 즉시(또는 `useDeferredValue`), 서버
  호출이면 150–250ms. 결과 ≤10건, **카테고리 그룹 헤딩**(HIG "categorizing"),
  항목=아이콘·이름(일치부 `<mark>` 강조)·거리/상태. 자연어 규칙 제안("비 오는 날
  실내")은 맨 위 별도 그룹(현행 보라색 카드 유지 가능).
- **한글**: 초성(ㅅㅇㅅ)·미완성 자모(서울ㄷ) 매칭; 조합 중(`isComposing`)에는
  Enter/방향키 선택을 무시.
- **키보드**: ↓/↑(loop), Home/End, Enter=선택, **Esc 1회=팝업 닫기, 2회=입력
  비우기**(APG), Tab=닫기. 포커스는 항상 입력에 유지.
- **상태 문구**: 결과 수는 `role="status"`(polite)로 "검색 결과 8건"(입력 멈춘
  뒤 300ms); 0건은 Empty(+ CTA: 필터 초기화 / 현재 지도 영역에서 다시 검색 /
  추천 보기); 오류는 입력 유지 + "다시 시도". 로딩 중에는 Empty를 **절대 먼저
  보여주지 않음**(NN/g).
- **모바일**: 제안은 단순 텍스트 중심(NN/g); 포커스 시 소프트 키보드가 올라오면
  시트·칩을 숨기거나 검색 전용 전체 화면 레이어(Base UI
  `VirtualKeyboardProvider`/`visualViewport` 대응은 `[미검증]`). 입력 글자
  크기는 16px 이상(iOS Safari 포커스 확대 방지, 일반 지식 `[미검증]`).

#### 추천 + 통합 스케치

```tsx
'use client';
import * as React from 'react';
import { Command } from 'cmdk';
import { getChoseong, disassemble } from 'es-hangul'; // 선택: +1.9KB gz

// 한글 매칭 (직접 실행 검증: '서울' → 서울숲·서울도서관·…, 'ㅅㅇㅅ' → 서울숲·서울시립미술관, '서울ㄷ' → 서울도서관)
const isChoseong = (q: string) => /^[ㄱ-ㅎ]+$/.test(q);
export function matchKo(name: string, q: string): 0 | 1 | 2 | 3 {
  const n = name.replace(/\s+/g, '').toLowerCase(),
    k = q.replace(/\s+/g, '').toLowerCase();
  if (!k) return 0;
  if (n.startsWith(k)) return 3;
  if (n.includes(k)) return 2;
  if (
    (isChoseong(k) && getChoseong(n).includes(k)) ||
    disassemble(n).includes(disassemble(k))
  )
    return 1;
  return 0;
}

export function SearchCombobox({ search, recent, onPick, onApplyRule }: Props) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const deferred = React.useDeferredValue(q);
  const groups = React.useMemo(
    () => groupByCategory(search(deferred, 10)),
    [deferred, search]
  ); // 기존 useSearchCache 재사용
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Command
      shouldFilter={false}
      loop
      label='시설 검색'
      className='relative'
      onKeyDown={e => {
        if (e.nativeEvent.isComposing) return; // 한글 조합 중 무시 (cmdk 1.1.1도 IME 이중 발동 수정)
        if (e.key === 'Escape') {
          if (open) {
            setOpen(false);
            e.stopPropagation();
          } else if (q) setQ('');
        }
      }}
    >
      <Command.Input
        value={q}
        onValueChange={v => {
          setQ(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder='공원·도서관·행사를 검색해요'
        inputMode='search'
        enterKeyHint='search'
        autoComplete='off'
        className='h-11 w-full bg-transparent px-3 text-base outline-none'
      />
      {open && (
        <Command.List
          aria-label='검색 제안'
          className='absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg'
        >
          {!q && recent.length > 0 && (
            <Command.Group heading='최근 검색'>
              {recent.map(r => (
                <Command.Item
                  key={r.id}
                  value={`recent-${r.id}`}
                  onSelect={() => onPick(r)}
                >
                  {r.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {groups.map(g => (
            <Command.Group key={g.category} heading={g.label}>
              {g.items.map(it => (
                <Command.Item
                  key={it.id}
                  value={it.id}
                  onSelect={() => {
                    onPick(it);
                    setOpen(false);
                  }}
                >
                  <Highlight text={it.name} query={q} />
                </Command.Item>
              ))}
            </Command.Group>
          ))}
          {q && count === 0 && (
            <Command.Empty>
              ‘{q}’에 맞는 시설이 없어요.{' '}
              <button type='button' onClick={onClearFilters}>
                필터 초기화
              </button>
            </Command.Empty>
          )}
        </Command.List>
      )}
      <p role='status' className='sr-only'>
        {q && open
          ? count
            ? `검색 결과 ${count}건`
            : '검색 결과가 없어요'
          : ''}
      </p>{' '}
      {/* Empty는 라이브 리전이 아님(검증) */}
    </Command>
  );
}
// Highlight: query 위치를 찾아 <mark className="bg-transparent font-semibold text-foreground">…</mark> 로 감싸기 (NN/g: 일치부 강조)
```

- 위 구조에서 `useSearchCache`(기존)·자연어 규칙 파서·최근 검색 저장은 그대로
  재사용하고 **표시·키보드·ARIA만 cmdk로 위임**한다.

#### 접근성

- 입력만 포커스, 후보는 `aria-activedescendant`(cmdk가 처리, 검증). 결과 수는
  별도 `role="status"`. 영어 기본 라벨("Suggestions")·`Empty`의 비라이브 특성은
  반드시 보완. `aria-controls`는 팝업이 열렸을 때만(APG).
- 조합 중 Enter/방향키 무시(MDN `isComposing`). 터치 타깃 ≥24px(AA), 후보 행
  높이 40–44px 권장.

#### 위험·대안

- cmdk는 릴리스가 2025-03 이후 없음(안정/저활동). 문제 발생 시 Downshift
  `useCombobox`(13.5KB)로 교체 가능(스타일 비종속).
- cmdk의 `Command`는 원래 커맨드 팔레트용: 팝오버(shadcn Combobox 패턴)로 감싸면
  포커스가 팝오버로 이동해 검색 입력 UX가 어색해지므로 **인라인 `Command` + 절대
  위치 리스트**(위 스케치)를 권장.
- 현행 구조를 유지하는 경우의 최소 보강(무의존): `aria-activedescendant`
  도입(옵션에 `id`, 입력에 포커스 유지), `aria-selected` 실제 반영,
  `isComposing` 가드, 결과 수 `role=status`, 일치부 `<mark>`.

### Gaps

- IME 조합 중 Enter 처리의 Safari 순서 차이(keydown/compositionend)는 MDN
  페이지에서 확인되지 않음 → 실기기 테스트 필요.
- 실제 한글 IME(조합)를 Playwright에서 재현하지 못해 cmdk의 IME 동작은 릴리스
  노트(#339) 수준으로만 확인.
- react-aria ComboBox·Downshift는 번들 외 동작 직접 검증하지 않음(다운시프트
  크기만 측정).

---

## 4. 필터·프리셋 — 칩/세그먼트 패턴, 모바일 가로 스크롤, 선택 상태 의미(`aria-pressed`), 결과 수, "모두 지우기"

### Takeaway

카테고리 토글은 **`aria-pressed` 토글 칩 + 고정 라벨**, 6개 상황 프리셋은 **가로
스크롤 단일선택 칩**(iPhone 세그먼트 컨트롤 권장 한도 ≈5를 넘음)으로 구성하고,
칩에 현재 결과 수, 요약 줄에 `role=status`, 필터가 걸리면 "모두 지우기"를
노출한다. 현행 코드의 **상태에 따라 바뀌는 `aria-label`(숨기기/표시하기)은 APG
토글 버튼 규칙과 충돌**하므로 수정해야 한다.

### Cited Findings

- APG Button(토글): "A two-state button that can be either off (not pressed) or
  on (pressed)"; `aria-pressed` true/false; **"it is critical the label on a
  toggle does not change when its state changes."**; Space/Enter —
  [APG · Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
- 현행 코드: `MapView.tsx` 카테고리 칩은 `aria-pressed={isActive}` **와**
  `aria-label={`${config.label} ${count}곳 ${isActive ? '숨기기' :
  '표시하기'}`}`를 동시에 사용; `PlaceExplorerPanel.tsx`의 프리셋은
  `aria-pressed={activePreset === preset.id}`; 칩 높이 `h-8`(32px), 컨테이너
  `overflow-x-auto` — 코드 확인. 프리셋 6종: 지금 갈 곳 / 한산한 곳 / 비 오는 날
  / 오늘 행사 / 따릉이로 / 더위 피하기(단일 선택 `activeRecommendationPreset`) —
  `recommendation-engine.ts`.
- Material 3 Filter chip: "Filter chips use tags or descriptive words to filter
  content… They are a good alternative to toggle buttons or checkboxes."(선택 시
  체크 아이콘), 최소 터치 타깃 48dp(`chipMinTouchTargetSize`,
  `ensureMinTouchTargetSize` 기본 true), 4종(assist/filter/input/suggestion) —
  [Material Components Android · Chip.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Chip.md).
- Apple HIG Segmented controls: "offers a single choice from among a set of
  options"; "Aim for no more than about five to seven segments in a wide
  interface and no more than about five segments on iPhone."; 라벨은 명사/명사구
  —
  [HIG](https://developer.apple.com/design/human-interface-guidelines/segmented-controls).
- Baymard(가로 필터 툴바, 2015-05-05 / 2025-03-13 갱신): "Horizontal filtering
  toolbars can be troublesome if there are more than 6–8 filter types", "the
  filter options within each filter type are not visible by default", "All
  Filters" 버튼은 "overlooked by some participants" —
  [Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design). (우리
  카테고리 8종은 경계선.)
- Airbnb 패턴: 권위 있는 1차 자료를 찾지 못함. 2차 자료: "지도 전체 화면 +
  드래그 가능한 목록 시트가 peek/half/full로 스냅, 지도 이동에 따라 목록 갱신,
  목록 항목을 탭하면 지도에서 강조"
  ([VP0 블로그](https://vp0.com/blogs/airbnb-style-bottom-sheet-react-native),
  벤더 글), 칩이 검색 시작 트리거로도 쓰임·세그먼트는 배타성을
  시사([designsystems.surf](https://designsystems.surf/blueprints/chip)), 가장
  자주 쓰는 필터를 화면에 두고 나머지는 "More
  Filters"([TechCrunch](https://techcrunch.com/?p=906056), 오래된 기사).
  Baymard의 Airbnb 모바일 필터 해부는 유료 벽 → **참고용(낮은 신뢰)**.
- WCAG 2.5.8: 포인터 타깃 최소 24×24 CSS px(AA) —
  [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Tailwind 3.4.19에서 아래 스케치의 클래스가 모두 생성됨(`aria-[pressed=true]:`,
  `overscroll-x-contain`, `snap-x snap-mandatory`, `[scrollbar-width:none]`,
  `[&::-webkit-scrollbar]:hidden`, `[mask-image:linear-gradient(...)]`;
  `scrollbar-none` 유틸리티는 v3에 없음) `[검증 E9]`.

### Inferences

#### 권장 패턴 (행동 명세)

- **두 줄 구조**: (A) 프리셋 6개 = "상황" 단일 선택 칩(재탭하면 해제 → 그래서
  라디오보다 `aria-pressed` 토글이 적합, "없음"이 유효 상태), (B) 카테고리 8개 =
  다중 선택 칩(+개수). 지도 위 빠른 칩 줄은 헤더 아래 고정(sticky)·가로 스크롤,
  상세 필터는 탐색 패널/시트 half에서.
- **스크롤 칩**: `overflow-x-auto overscroll-x-contain`, 가장자리 페이드 마스크,
  선택 칩을 `scrollIntoView({inline:'center'})`, 스크롤바 숨김, 칩 사이 8px,
  높이 36–40px(WCAG 24px·M3 48dp 사이 절충; 터치 영역은 패딩으로 확장).
- **선택 표현은 색 + 아이콘/체크**(색만으로 의미 전달 금지, HIG/M3 filter chip의
  체크 관례).
- **결과 수**: 칩 우측 보조 숫자(`tabular-nums`), 요약 줄 "지도 안 128곳 · 필터
  3개"를 `role="status"`(polite, 300ms 디바운스). 0건 카테고리는 비활성화하지
  말고 "0"으로 표시하되 목록 끝으로(비활성 칩의 포커스·설명 문제 회피,
  `[추론]`).
- **모두 지우기**: 프리셋/카테고리/검색어 중 하나라도 걸리면 요약 줄 오른쪽에
  텍스트 버튼. 누르면 초기화 + 포커스를 첫 칩으로 + 상태 문구 갱신 + (필요 시)
  실행 취소 토스트. 필터 진입 버튼에는 적용 개수 배지.
- **프리셋 UX**: 6개는 한 줄에 다 안 보이므로 첫 화면에 3.5개가 보이게(다음 칩이
  잘려 스크롤 가능성을 암시), 이름은 명사구/상황 문구 유지. 프리셋 적용 시 "왜
  이 결과인가"를 요약 줄에 한 줄 표시(이미 추천 이유 코드 있음).

#### 추천 + 통합 스케치

```tsx
// 가로 스크롤 칩 줄 — 라벨 고정 + aria-pressed (APG)
export function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role='group'
      aria-label={label}
      className='flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]'
    >
      {children}
    </div>
  );
}
export function FilterChip({ pressed, onToggle, icon, label, count }: Props) {
  return (
    <button
      type='button'
      aria-pressed={pressed}
      onClick={onToggle}
      className='inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border bg-card px-3 text-sm text-foreground
                 transition-colors motion-reduce:transition-none aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary/10
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
    >
      {pressed ? <Check className='size-4' aria-hidden /> : icon}
      <span>{label}</span> {/* 라벨은 상태와 무관하게 고정 */}
      {count != null && (
        <span className='tabular-nums text-muted-foreground'>{count}</span>
      )}
    </button>
  );
}
```

- 상황 프리셋도 같은 `FilterChip`을 쓰되 부모가 "하나만 true"를 보장(재탭 시
  해제). 요약 줄: `<p role="status">지도 안 {n}곳 · 필터 {k}개</p>` +
  `<button>모두 지우기</button>`.

#### 접근성

- 토글 칩은 `aria-pressed`, 그룹은 `role="group"` + `aria-label`. 라벨 변경
  금지(APG). 개수는 라벨 일부로 읽혀도 무방하나 "숨기기/표시하기" 같은 동사는
  넣지 않는다.
- 상태 변경 안내는 라이브 리전 1곳(요약 줄)에서만(칩마다 알림 금지). 키보드: 칩
  줄은 Tab 정지점 8–14개가 부담이면 `role="toolbar"` + 화살표 이동(roving
  tabindex, APG Toolbar)을 고려 `[추론, 미검증]`.

#### 위험·대안

- 가로 스크롤은 "숨은 옵션" 문제(Baymard) → 첫 화면에서 잘린 칩으로 암시 + 탐색
  패널에 전체 목록 병행.
- 프리셋을 세그먼트 컨트롤로 만들면 HIG 한도(5) 초과·모바일 폭에서 라벨 축약
  필요 → 비권장. 2×3 그리드(탐색 패널 안)로 표시하는 대안은 가능.
- 필터 변경 때 전체 마커 재생성 금지(§2의 diff 갱신) — 카운트 갱신과 지도 갱신을
  분리해 입력 지연 방지.

### Gaps

- Airbnb·Google Maps의 현행 필터 칩 해부(1차 자료)는 접근 불가. Material 3 웹
  칩의 공식 a11y 스펙은 JS 렌더링 페이지라 열람 못 함(Android 문서로 대체).
  실사용자 테스트 없음.

---

## 5. 상태 피드백 — 스켈레톤, 지도 로딩 오버레이, 토스트(sonner vs 커스텀), 빈 상태, 신선도 배지, 위치 권한 거부 복구, 모션 감소 정책

### Takeaway

**스켈레톤은 "전체 화면 로드 + 1초 이상 + 10초 미만"에만**(NN/g), 모듈 단위·짧은
갱신은 기존 내용 유지 + 작은 인디케이터. **토스트는 `sonner@2.0.8`로
교체**(polite 라이브 리전·호버 일시정지·스택을 실측 확인)하되, 복구가 필요한
오류(위치 권한 거부·지도 로드 실패)는 자동 소멸하지 않는 **인라인 배너**로. 위치
권한 거부는 "실패"가 아니라 **서울시청 기준 + 켜는 방법 + 자동 복구 감지**로
설계. 신선도 배지는 상대 시간(`Intl.RelativeTimeFormat('ko')`) +
아이콘/텍스트로(색만 금지). 모션 감소는 현 전역 CSS 기준선을 유지하고
라이브러리별로 보완.

### Cited Findings

#### 5.1 로딩·빈 상태·오류 지침

- NN/g Skeleton Screens 101(2023-06-04, 2026-09-02 재검토): "This specific type
  of progress indicator is used exclusively for full-page loads."; "should be
  used with a wait time that's under 10 seconds"; 스피너는 2–10초·단일
  모듈(카드/비디오), 진행 막대는 10초 초과; "If a page takes less than 1 second
  to load, skeleton screens or spinners aren't necessary."; 정적 vs
  애니메이션(펄스·그라데이션): "animations of this sort can potentially be
  distracting" + 접근성 문제 가능; **"While skeleton screens are useful, they do
  not replace performance-optimization efforts."** —
  [NN/g](https://www.nngroup.com/articles/skeleton-screens/).
- NN/g 응답 시간 3한계: 0.1초(즉각), 1.0초(사고 흐름 유지; 0.1–1초는 피드백
  불필요), 10초(집중 유지 한계; 초과 시 퍼센트 진행·취소 수단) —
  [NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/).
- NN/g 빈 상태: ① 시스템 상태를 알려라 ② 학습 단서 ③ **직접 경로(CTA)**; "Do not
  default to totally empty states."; 로딩 중 "No records"는 신뢰를 해침 —
  [NN/g](https://www.nngroup.com/articles/empty-state-interface-design/). 오류
  메시지: 눈에 띄고(색·애니메이션만으로 알리지 않기), 쉬운 말, 비난 없이,
  정확하게, "offer some potential remedies", 입력 보존 —
  [NN/g](https://www.nngroup.com/articles/error-message-guidelines/).

#### 5.2 현재 코드(읽기 전용 확인)

- 지도 로딩: `MapView.tsx` —
  `absolute inset-0 z-10 bg-background/80 backdrop-blur-sm` 위에 원형 Skeleton
  1 + 막대 Skeleton 1(지도 형태 아님). 지도 오류: 빨간 문구 `role='alert'` +
  **`window.location.reload()` 버튼** 하나. `useKakaoMap`은 `autoload=false`
  동적 삽입, `script.onerror`는 에러 문구만 세팅, 이미 `dapi.kakao.com` 스크립트
  태그가 있으면 50×100ms 폴링 후 타임아웃(실패한 태그를 제거하지 않아 **재시도
  시 같은 실패 태그를 다시 기다림**). 위치: 지도 준비 시 즉시
  `getCurrentPosition({enableHighAccuracy:true, timeout:10000, maximumAge:0})`(사용자
  제스처 없이 권한 프롬프트), 실패 시 `console.error` + 애널리틱스만(사용자 안내
  UI 없음; 형제 노트 §3: 권한 거부 시 매 로드 콘솔 오류 2건, 날씨/혼잡도 API 502
  반복).
- 토스트: `src/shared/lib/utils/toast.ts` — `document.body.appendChild(div)` +
  인라인 스타일(우하단 고정, 흰 글씨 on `#10b981/#ef4444/#3b82f6/#f59e0b`),
  `setTimeout`으로 제거, 중복/스택/호버 일시정지/스와이프/닫기 없음,
  `role`·`aria-live` 없음(스크린리더에 안 읽힘), 모듈 로드 시 `<style>` 주입.
  지도 UI의 우하단(마커 개수 칩·시트)과 겹칠 수 있음. **텍스트 대비**: 흰
  글씨(14px/500, 큰 글씨 아님) on `#10b981` **2.54:1**, `#ef4444` **3.76:1**,
  `#3b82f6` **3.68:1**, `#f59e0b` **2.15:1** — 전부 일반 텍스트 AA 기준 4.5:1
  미달(직접 계산; 기준
  [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html):
  "contrast ratio of at least 4.5:1", 큰 글씨는 18pt 또는 14pt bold부터 3:1).
- `Skeleton`은 `animate-pulse`; 전역 CSS는 `prefers-reduced-motion: reduce`에서
  `animation-duration/transition-duration: 0.01ms !important`,
  `scroll-behavior:auto`(`app/globals.css`).

#### 5.3 sonner 대 대안

- **sonner** 2.0.8 / 2026-08-09, 9.6KB gz, peer React `^18 || ^19`, 13.0k★,
  마지막 push 2026-08-10 — [repo](https://github.com/emilkowalski/sonner). 문서
  기본값: `position bottom-right`, `visibleToasts 3`, `closeButton false`,
  `offset 32px`/`mobileOffset 16px`(600px 미만), `hotkey alt+T`, `gap 14`,
  `theme light`(next-themes로 구동 가능), `richColors false` —
  [Toaster 문서](https://sonner.emilkowal.ski/toaster); 기본 수명
  4000ms(`TOAST_LIFETIME = 4000`, 배포 번들 확인); `containerAriaLabel?: string`
  prop 존재(`index.d.ts`) `[검증]`.
- **실측 DOM `[E7]`(React 19.3.0)**:
  `section[aria-label="Notifications alt+T"][aria-live="polite"][aria-relevant="additions text"][tabindex="-1"]` >
  `ol[tabindex=-1]` > 토스트 `li[tabindex=0]`(role 없음). 기본 라벨이 영어 →
  한국어로 지정 필요. 번들에
  `@media (prefers-reduced-motion){ …transition:none!important }` 포함. 콘솔
  경고·오류 0건.
- shadcn: Radix 변형 문서는 **Sonner**("An opinionated toast component for
  React.") —
  [shadcn Sonner](https://ui.shadcn.com/docs/components/radix/sonner); 기본(Base
  UI) 변형 문서는 Base UI Toast(`toast.add`, `@/components/ui/toast`) —
  [shadcn Toast](https://ui.shadcn.com/docs/components/sonner); Tailwind v4
  안내문은 "The `toast` component is deprecated in favor of `sonner`" —
  [shadcn · Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4). Base UI Toast
  번들은 26.4KB gz `[검증 E10]` → sonner(9.6KB)가 가볍다.

- **토스트 후보 비교**

| 후보                                  | 버전 / 발행일                            | gz     | React 19                             | 접근성·기능                                                                                                | 판정                                       |
| ------------------------------------- | ---------------------------------------- | ------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 커스텀 `toast.ts`                     | —                                        | 0      | —                                    | `role`/`aria-live` 없음, 색 대비 2.15–3.76:1, 스택·닫기·호버 일시정지·스와이프 없음, 우하단 고정           | 교체                                       |
| **sonner**                            | 2.0.8 / 2026-08-09                       | 9.6KB  | peer `^18‖^19`, 19.3.0 경고 0 `[E7]` | `aria-live=polite` 섹션·`aria-relevant`, 핫키, 모션 감소 CSS 내장, 스택/호버/스와이프/`toast.promise`/액션 | **권고**(shadcn Radix 변형도 Sonner)       |
| Base UI Toast                         | `@base-ui/react` 1.9.0 / 2026-10-09      | 26.4KB | peer `^17‖^18‖^19`                   | shadcn 기본(Base UI) 변형이 채택(`toast.add`)                                                              | Drawer와 함께 도입하는 경우의 대안(무거움) |
| Radix Toast (`@radix-ui/react-toast`) | `radix-ui@1.7.0` 통합 패키지의 구성 요소 | 미측정 | 미확인                               | shadcn: "The `toast` component is deprecated in favor of `sonner`"                                         | 비권장                                     |

#### 5.4 위치 권한·API 사실

- MDN Permissions API: `geolocation`은 권한 조회 대상 API이며 상태는
  granted/denied/prompt, "permissions policy로 제한되면 denied가 반환되고
  사용자에게 프롬프트되지 않는다", `PermissionStatus`는 변경 이벤트 핸들러 제공
  — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API).
  Geolocation 오류 코드 `1 PERMISSION_DENIED`, `2 POSITION_UNAVAILABLE`,
  `3 TIMEOUT`, 보안 컨텍스트(HTTPS) 전용 —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code).
  저장소 `next.config.ts`에는 이미 `Permissions-Policy: geolocation=(self)`.
- `Intl.RelativeTimeFormat('ko', {numeric:'auto'})`:
  `format(-3,'minute') → "3분 전"`, `(-1,'hour') → "1시간 전"`,
  `(-1,'day') → "어제"`, **`(0,'minute') → "현재 분"`**(1분 미만은 별도 "방금"
  처리 필요) `[검증: node 24]`.

#### 5.5 모션 감소 관련 사실

- Motion: `<MotionConfig reducedMotion="user">`는 transform·레이아웃
  애니메이션을 자동 비활성화하고 opacity·backgroundColor는 유지 —
  [Motion 접근성](https://motion.dev/docs/react-accessibility). React
  `<ViewTransition>`: "React doesn't automatically disable animations for this
  case. We recommend always using the `@media (prefers-reduced-motion)` media
  query" — [react.dev](https://react.dev/reference/react/ViewTransition); Next
  가이드의 전체 비활성 CSS:
  `::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) { animation-duration: 0s !important; animation-delay: 0s !important; }`
  — [Next.js 가이드](https://nextjs.org/docs/app/guides/view-transitions). Kakao
  `Map` 옵션 `tileAnimation`(기본 true), `jump()`(즉시 이동) —
  [Kakao 문서](https://apis.map.kakao.com/web/documentation/).

### Inferences

#### 권장 패턴 (행동 명세)

| 상황                                                  | 패턴                                                                                                        | 이유/규칙                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 지도 SDK·타일 첫 로딩                                 | **지도 형태 플레이스홀더**(회색 타일 격자 + 컨트롤 자리 + "지도를 불러오는 중") + `aria-busy`/`role=status` | 전체 화면 로드 → 스켈레톤(NN/g). 200ms 지연 후 표시, 한 번 보이면 ≥400ms 유지(깜빡임 방지, `[추론]`)                |
| 목록/추천 첫 로딩                                     | 결과 카드 모양 스켈레톤 3–5행(높이 고정 → CLS 방지)                                                         | 구조를 닮은 회색 박스(NN/g). 펄스는 감속 모드에서 정지                                                              |
| 시트 내 날씨·혼잡·도착정보                            | 모듈 단위 인라인 스피너/문구("혼잡도 확인 중")                                                              | 단일 모듈은 스피너(NN/g). **실패 시** "불러오지 못했어요 · 다시 시도"(+ 마지막 성공 값과 시각 표시)                 |
| 지도 이동·필터 변경 후 재조회(<1s)                    | 기존 결과 유지 + 요약 줄에 미세 스피너                                                                      | 1초 미만은 인디케이터 불필요(NN/g) → stale-while-revalidate                                                         |
| 결과 0건                                              | 상태 문구 + CTA 2개(필터 초기화 / 이 지역에서 다시 검색)                                                    | NN/g Empty: 상태 + 직접 경로. 로딩 중에는 Empty 금지                                                                |
| 일반 성공/정보                                        | sonner 토스트 4s, 닫기 가능, 호버 시 일시정지                                                               | 사소한 확인용                                                                                                       |
| **복구가 필요한 오류**(위치 거부, 지도 실패, API 502) | 인라인 배너(자동 소멸 없음) + 복구 버튼                                                                     | 토스트의 자동 소멸은 중요한 정보를 놓치게 함(WCAG 2.2.1 Timing Adjustable 관련, 이번 조사에서 원문 미확인 `[추론]`) |

- **위치 권한 거부 복구**: ① 페이지 로드 시 자동 프롬프트 대신 **"내 위치"
  버튼(사용자 제스처)에서 요청**(+ `permissions.query`로 `denied`면 프롬프트
  시도 없이 안내); ② 거부/불가 시 서울시청 기준 데모 위치로 계속 진행하며 배너
  "위치 권한이 꺼져 있어 서울시청 주변을 보여드려요 · [내 위치 켜는 방법]
  [서울시청 유지]"; ③ `TIMEOUT/POSITION_UNAVAILABLE`은 "위치를 찾지 못했어요 ·
  다시 시도"(코드별 문구); ④ 첫 요청은 저정밀(`enableHighAccuracy:false`,
  `maximumAge` 수 분)로 빠르게, 필요 시 정밀 갱신(현재 `maximumAge:0` + 고정밀은
  실내에서 느림 `[추론]`); ⑤ `PermissionStatus.onchange`로 사용자가 설정에서
  켜면 **자동 복구**; ⑥ "내 위치" 버튼은 상태(대기/거부/활성)를 `aria-pressed`가
  아닌 **고정 라벨 + `aria-describedby` 상태 문구**로.
- **신선도 배지(stale-data)**: 데이터별 임계값(예: 따릉이 대수 3–5분, 혼잡도
  10–30분, 날씨 60분 — 임계값은 `[추론]`) 초과 시 **호박색 배지 + 시계 아이콘 +
  "N분 전 정보"**, 기준 시각을 모르면 중립 배지 "갱신 시각 알 수 없음". 이미
  있는 `stale_data`/`freshness_unknown` 경고 코드를 배지로 매핑.
  `<time dateTime>` + `Intl.RelativeTimeFormat('ko')`(1분 미만 "방금"). 피크
  높이 시트에서도 보이도록 영업 여부 배지 옆에 배치.
- **토스트 정책**: 위치(모바일은 상단 중앙 권장: 하단은 시트·마커 개수 칩·Kakao
  로고와 충돌, `[추론]`), `containerAriaLabel="알림"`, `visibleToasts={2}`, 중복
  억제(같은 id), 토스트에 필수 정보를 두지 않음.
- **모션 감소**: 전역 CSS 기준선 유지(애니메이션 0.01ms, scroll-behavior auto) +
  ① `matchMedia('(prefers-reduced-motion: reduce)')`일 때 Kakao
  `tileAnimation:false`, `panTo→setCenter/jump`; ② `<ViewTransition>`/Motion은
  위 CSS·`MotionConfig reducedMotion="user"`; ③ 펄스·스켈레톤은 정지(정적 대체);
  ④ 시트 `motion-reduce:transition-none`.

#### 추천 + 통합 스케치

```tsx
// shared/ui/toaster.tsx — sonner + next-themes (Korean label, 헤더 아래 상단)
'use client';
import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position='top-center'
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      closeButton
      visibleToasts={2}
      containerAriaLabel='알림'
      offset={{ top: 72 }}
      mobileOffset={{ top: 64 }}
      toastOptions={{
        duration: 4000,
        closeButtonAriaLabel: '알림 닫기', // 타입: ToastOptions.closeButtonAriaLabel
        classNames: {
          toast:
            'rounded-xl border border-border bg-card text-card-foreground shadow-lg',
        },
      }}
    />
  );
}
// shared/lib/utils/toast.ts — 기존 호출부(toast.success(msg) 등)는 그대로 두고 구현만 교체
import { toast as s } from 'sonner';
export const toast = {
  success: (m: string, o?: { duration?: number }) => s.success(m, o),
  error: (m: string, o?: { duration?: number }) => s.error(m, o),
  info: (m: string, o?: { duration?: number }) => s.info(m, o),
  warning: (m: string, o?: { duration?: number }) => s.warning(m, o),
};
```

```ts
// 위치 요청 — 사용자 제스처에서 호출, 코드별 결과를 UI가 분기
export async function requestLocation() {
  const st = await navigator.permissions
    ?.query({ name: 'geolocation' as PermissionName })
    .catch(() => null);
  if (st?.state === 'denied')
    return { ok: false as const, reason: 'denied' as const, status: st };
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60_000,
      })
    );
    return { ok: true as const, pos };
  } catch (e) {
    const c = (e as GeolocationPositionError).code; // 1 DENIED · 2 UNAVAILABLE · 3 TIMEOUT
    return {
      ok: false as const,
      reason: c === 1 ? 'denied' : c === 3 ? 'timeout' : 'unavailable',
    };
  }
}
// st.onchange = () => st.state === 'granted' && retry();   // 설정에서 켜면 자동 복구
```

```tsx
// 신선도 배지
const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });
const ago = (ms: number) =>
  ms < 60_000
    ? '방금'
    : ms < 3_600_000
      ? rtf.format(-Math.round(ms / 60_000), 'minute')
      : rtf.format(-Math.round(ms / 3_600_000), 'hour');
<time
  dateTime={iso}
  className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200'
>
  <Clock className='size-3' aria-hidden /> {ago(Date.now() - t)} 정보{' '}
  <span className='sr-only'>· 최신이 아닐 수 있어요</span>
</time>;
```

#### 접근성

- 토스트는 `aria-live=polite`(sonner 검증), 중요 내용은 토스트 밖(배너/상태
  줄)에 한 번 더. 스켈레톤 영역에는 `aria-busy="true"` + 화면 밖 상태 문구
  하나(스켈레톤 자체를 읽히지 않게). 오류 배너는 `role="alert"`(즉시) 또는
  `role="status"`(비긴급)로 구분.
- 상태를 색만으로 구분하지 않기(배지: 아이콘+텍스트). `<time>`에 절대 시각을
  `title`/툴팁으로.

#### 위험·대안

- sonner 기본 라벨 "Notifications alt+T"(영어) →
  `containerAriaLabel`·`toastOptions.closeButtonAriaLabel`로 한국어화(타입
  `index.d.ts`에서 확인). `hotkey`는 `string[]`(예: `['altKey','KeyT']`)
  타입이며 `alt+T`가 일부 입력기/OS 조합과 충돌할 수 있어 변경 고려 `[추론]`.
- 지도 SDK 재시도: 실패한 `<script>`를 DOM에서 제거하고 새로 삽입해야 함(§8).
- 임계값·문구는 제품 결정 사항 — 데이터 소스별 갱신 주기 확인 후 확정.

### Gaps

- WCAG 2.2.1(Timing Adjustable) 원문과 토스트의 자동 소멸 관계는 이번에 원문
  확인하지 못함.
- iOS/Android 설정 화면 경로(위치 권한 켜는 방법) 문구는 공식 문서를 확인하지
  않음 → 플랫폼별 문구는 구현 시 검증.
- sonner의 스와이프/호버 동작은 DOM 구조만 확인(제스처 직접 테스트 안 함).

---

## 6. 모션 — `motion`(구 framer-motion) vs CSS/tw-animate vs View Transitions, 최소 세트

### Takeaway

**최소 세트 = ① CSS transition/keyframes(+`@starting-style`) ② Tailwind 3용
`tailwindcss-animate`(현재 `tw-animate-css`는 3.4에서 아무 유틸리티도 만들지
못함 — 실측) ③ React 19.3 `<ViewTransition>`(Next 16.4 문서상 설정 플래그
불필요)로 필터 목록·화면 전환에 선택 적용.** 시트는 Base UI가 CSS 변수로
처리하므로 모션 라이브러리가 필요 없다. `motion@14.1.0`은 꼭 필요할 때만
`LazyMotion`+`m`+비동기 `domAnimation`으로.

### Cited Findings

#### 6.1 `tw-animate-css`가 Tailwind 3.4에서 무동작 `[검증 E9]`

- 설치본 `tw-animate-css@1.3.6`(2025-07-25)의 `dist/tw-animate.css`는 v4 전용
  문법(`@theme inline{…}`, `@utility animation-duration-*{… --value(number) …}`,
  `@property`)으로 구성. 저장소 `app/globals.css` 1행
  `@import 'tw-animate-css';`.
- Tailwind CLI **3.4.19**로 같은 CSS 파일 +
  `@tailwind base/components/utilities`를 빌드하고
  `animate-in slide-in-from-left-5 fade-in-0 data-[state=open]:animate-in …`을
  쓴 HTML을 스캔 → 출력에 `.animate-in`, `slide-in-from-left-5`, `fade-in-0`,
  `data-[state=open]:animate-in`이 **0건**, `@utility`/`@theme` 원문만 남음. v4
  전용 문법 `max-h-(--radix-…)`, `shadow-xs`, `rounded-xs`, `outline-hidden`,
  `bg-(--foo)`도 0건(`size-4`는 Tailwind 3.4가 지원하여 생성됨).
- 같은 스캔에 `tailwindcss-animate@1.0.7`(2023-08-28, peer
  `tailwindcss >=3.0.0`)을 플러그인으로 붙이면 `.animate-in`,
  `slide-in-from-left-5`, `fade-in-0`, `data-[state=open]:animate-in`,
  `slide-out-to-bottom`, `zoom-in-95`가 모두 생성되고
  `max-h-[--radix-dropdown-menu-content-available-height]`(v3 문법)도 생성.
- shadcn 문서: "We've deprecated `tailwindcss-animate` in favor of
  `tw-animate-css`." — 단 이는 **Tailwind v4 신규 프로젝트** 기준이며 "Your
  existing apps with Tailwind v3 and React 18 will still work." —
  [shadcn · Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4).
  `components.json`의 `tailwind.config`는 "For Tailwind CSS v4, leave this
  blank."이며 저장소는 공란(= v4 출력) —
  [components.json 문서](https://ui.shadcn.com/docs/components-json).
  `tailwind-merge`: "Supports Tailwind v4.0 up to v4.3 (if you use Tailwind v3,
  use tailwind-merge v2.6.0)"인데 설치본은 3.3.1 —
  [README](https://github.com/dcastil/tailwind-merge).
- 영향:
  `WeatherPanel/CongestionPanel`(`animate-in slide-in-from-left-5 duration-300`),
  `FacilityBottomSheet`(`animate-in fade-in`),
  `sheet.tsx`·`dropdown-menu.tsx`(`data-[state=open]:animate-in …`)의 입장/퇴장
  애니메이션은 현재 빌드에서 **CSS가 없어 무동작**일 가능성이 높다(빌드
  산출물·실제 브라우저 확인은 못 함; CSS 생성 단계까지 검증). 형제 노트
  `code_audit_map_core.md` D-11의 "등장 애니메이션은 `tw-animate-css`(이미
  import됨)로"라는 제안은 이 결과와 모순 → **채택 금지, `tailwindcss-animate`로
  교체**.

#### 6.2 motion 현황

- `motion` 14.1.0(2026-10-09), 14.0.0(2026-10-02: 내부 API 제거만),
  13.0.0(2026-08-05: "Removed optional `@emotion/is-prop-valid` dependency in
  favour of explicit `<MotionConfig isValidProp={isPropValid}>`") —
  [CHANGELOG](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md).
  13.4.4→14.1.0이 2주 안에 연속 패치(릴리스 매우 잦음) → **정확 버전 고정 +
  lockfile**. peer React `^18 || ^19`; `motion`과 `framer-motion`은 같은
  14.1.0(별칭). 서브패스: `motion/react`, `motion/react-m`,
  `motion/react-client`, `motion/react-mini`, `motion/mini` (패키지 exports
  확인).
- 크기(문서, Rollup): `motion` 컴포넌트 34kb, `m`+`LazyMotion` 4.6kb,
  `domAnimation` +15kb, `domMax` +25kb, `animate` mini 2.3kb / hybrid 17kb —
  [Motion 번들 가이드](https://motion.dev/docs/react-reduce-bundle-size). **이번
  측정(esbuild)**: `motion`+`AnimatePresence` 43.2KB gz;
  `LazyMotion`+`m`+`AnimatePresence` 9.4KB(기능 번들 제외); `domAnimation` 단독
  24.4KB / `domMax` 38.6KB; LazyMotion+domAnimation 동기 31.2KB; `motion/mini`의
  `animate` 3.4KB; hybrid `animate` 20.4KB `[E10]`(문서값보다 큰 것은
  번들러·AnimatePresence 포함 차이).
- 임포트: `import * as m from "motion/react-m"`,
  `import { LazyMotion, domAnimation } from "motion/react"`, 비동기
  `features={() => import('./features').then(r => r.default)}`, `strict`로
  `motion` 혼용 방지 — 같은 가이드.

#### 6.3 View Transitions / React 19.3 / Next 16

- React **19.3.0(2026-09-09)** CHANGELOG "New React Features":
  "`<ViewTransition />`: Adds `<ViewTransition />` and `addTransitionType` APIs"
  (+ Fragment Refs, `browser()`) —
  [CHANGELOG](https://github.com/facebook/react/blob/main/CHANGELOG.md). 동작:
  `setState` 즉시 업데이트는 활성화하지 않고
  **Transition/Suspense/useDeferredValue**만; enter/exit/update/share 4종,
  `name`으로 공유 요소; popstate(뒤로가기)에서는 애니메이션 생략; DOM 노드보다
  앞에 있어야 enter/exit —
  [react.dev](https://react.dev/reference/react/ViewTransition).
- Next.js 16.4 문서(lastUpdated 2026-09-10): **"View transitions work in the App
  Router with no configuration. React 19.3 includes the `<ViewTransition>`
  component and `addTransitionType` API"**,
  `<Link transitionTypes={['nav-forward']}>`·`router.push(..., { transitionTypes })`,
  "In Next.js, route navigations are transitions", "available in Chromium 125+
  and recent Safari and Firefox versions… Without browser support, your
  application works normally" —
  [Next 가이드](https://nextjs.org/docs/app/guides/view-transitions).
  **`experimental.viewTransition` 플래그**: 문서 URL
  `/config/next-config-js/viewTransition`은 404,
  `config-shared.ts`·`config-schema.ts`(canary)에 `viewTransition` 항목 없음,
  v16.4.0 릴리스 노트에 "stop requiring the removed viewTransition flag" 언급 →
  **플래그는 제거된 것으로 판단** —
  [소스](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/config-shared.ts),
  [릴리스](https://github.com/vercel/next.js/releases/tag/v16.4.0). 설치본은
  React 19.1.0이므로 **19.3으로 올려야** 사용 가능.
- 브라우저: same-document View Transitions는 Firefox 144 출시로 "Baseline Newly
  available as of October 14, 2025"(web.dev 2025-10-16) —
  [web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available).
  `<ViewTransition>`은 `::view-transition` 중 오버레이가 포인터를 가로채므로
  `::view-transition { pointer-events: none }`를 권장(Next 가이드).
- CSS-only 입장: `@starting-style`은 "Since August 2024, this feature works
  across the latest devices and browser versions"(Baseline 2024, Newly
  available), 상위(`display`/`overlay`) 전환은
  `transition-behavior: allow-discrete` 필요 —
  [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style).
- Base UI Drawer는 CSS 변수(`--drawer-swipe-movement-y`)와
  `data-starting-style/ending-style`로 전환을 구동 → 시트 자체엔 JS 모션
  라이브러리가 불필요(§1 검증).

#### 6.4 수단 비교

| 수단                               | 버전 / 날짜                     | gz                                         | Tailwind 3.4·React 19                     | 적합한 용도                                   | 한계                                                      |
| ---------------------------------- | ------------------------------- | ------------------------------------------ | ----------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `tailwindcss-animate`              | 1.0.7 / 2023-08-28              | 플러그인(CSS)                              | Tailwind 3 ✓ 생성 확인 `[E9]`             | Radix `data-[state]` 입·퇴장, 슬라이드/페이드 | 2023-08 이후 릴리스 없음(정체)                            |
| `tw-animate-css`                   | 1.4.0 / 2025-09-24 (설치 1.3.6) | CSS                                        | **Tailwind v4 전용 — 3.4에서 0건** `[E9]` | (v4 전환 시)                                  | 현 스택 부적합                                            |
| CSS transition + `@starting-style` | 브라우저 기능 (Baseline 2024)   | 0                                          | ✓                                         | 조건부 렌더 패널 입장, 마커 상태              | 퇴장·`display` 전환은 `allow-discrete` 필요               |
| React `<ViewTransition>`           | React 19.3.0 / 2026-09-09       | 0                                          | Next 16.4 가이드: 설정 불필요             | 라우트·목록 전환, 공유 요소                   | Transition/Suspense에서만, popstate 생략, 브라우저별 차이 |
| `motion`                           | 14.1.0 / 2026-10-09             | 43.2 (전체) / 9.4+24.4 (Lazy) / 3.4 (mini) | peer `^18‖^19`                            | 스프링·제스처·레이아웃 애니메이션             | 번들·릴리스 빈도, 현재 요구엔 불필요                      |
| Base UI Drawer 내장 전환           | 1.9.0                           | (Drawer 포함)                              | ✓                                         | 시트 드래그/스냅                              | —                                                         |

### Inferences

#### 최소 세트 (무엇에 무엇을 쓰나)

| 대상                                  | 권장 수단                                                                       | 비고                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 시트 드래그·스냅·등장/퇴장            | Base UI Drawer(+CSS 변수/transition)                                            | Motion 불필요                                                 |
| 탐색/날씨/혼잡도 패널 입장            | `tailwindcss-animate`(`animate-in slide-in-from-left-5`) 또는 `@starting-style` | Radix 컴포넌트의 `data-[state]` 애니메이션도 이 플러그인 전제 |
| 마커 hover/selected/펄스              | CSS(transform/opacity만)                                                        | §2, 감속 모드 대응 포함                                       |
| 필터 변경 시 목록 재배열·크로스페이드 | `<ViewTransition>` + `startTransition`                                          | React ≥19.3; 선택 적용                                        |
| 라우트 전환(/places 등)               | `<Link transitionTypes>` + `<ViewTransition>`                                   | 뒤로가기는 생략됨                                             |
| 스프링 물리가 꼭 필요한 맞춤 제스처   | `motion` LazyMotion+`m`+비동기 `domAnimation`                                   | 정확 버전 고정; 그 외엔 도입 금지                             |

#### 통합 스케치

```js
// tailwind.config.js — v3 용 플러그인으로 교체 (app/globals.css 1행의 @import 'tw-animate-css' 삭제, 패키지 제거)
module.exports = { /* … */ plugins: [require('tailwindcss-animate')] }; // tailwindcss-animate@1.0.7
```

```css
/* CSS-only 입장 애니메이션 예 — 조건부 렌더 패널 (Baseline 2024) */
.panel {
  opacity: 1;
  transform: none;
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}
@starting-style {
  .panel {
    opacity: 0;
    transform: translateX(-12px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
  }
}
```

```tsx
// 필터 목록 크로스페이드 (React 19.3 + Next 16.4: 설정 플래그 불필요)
import { ViewTransition, startTransition } from 'react';
<ViewTransition default='none' update='auto'>
  {' '}
  {/* default none: 무관한 전환에서는 애니메이션 끔 */}
  <ul>
    {results.map(r => (
      <li key={r.id}>…</li>
    ))}
  </ul>
</ViewTransition>;
// 필터 토글: startTransition(() => setFilters(next));   // 일반 setState는 ViewTransition을 켜지 않음
```

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
::view-transition {
  pointer-events: none;
}
```

```tsx
// motion 이 꼭 필요할 때만 — 초기 번들 ≈9KB, 기능 번들은 비동기
import { LazyMotion, MotionConfig } from 'motion/react';
import * as m from 'motion/react-m';
const loadFeatures = () => import('./motion-features').then((r) => r.default);   // export default domAnimation
<MotionConfig reducedMotion="user"><LazyMotion features={loadFeatures} strict>…<m.div …/></LazyMotion></MotionConfig>
```

#### 접근성

- 모든 모션은 `prefers-reduced-motion`에서 정지/즉시 전환. 위치 이동(슬라이드)이
  가장 위험 → 감속 모드에서 페이드만 남기는 방식 권장(Next 가이드: "A more
  refined approach would preserve crossfades… while removing positional
  movement"). 번쩍임·깜빡임 없음(펄스는 느리게, 2s).

#### 위험·대안

- `<ViewTransition>`은 Transition/Suspense/useDeferredValue에서만 켜지고(일반
  setState 아님) 뒤로가기에서 생략 — 모든 곳에 기대하지 말 것. 지도(Kakao DOM)
  내부 마커는 React 트리가 아니라 공유 요소 전환 대상이 아님.
- `tailwindcss-animate`는 2023-08 이후 릴리스가 없지만 Tailwind 3.x 대상이라
  안정적(`[추론]`). 대안: 필요한 keyframes(enter/exit)만 `tailwind.config.js`에
  직접 정의(의존 0).
- `motion`은 릴리스 주기가 매우 짧아 호환성 확인 부담 → 도입 안 하는 편이 단순.

### Gaps

- `tw-animate-css` 무동작은 Tailwind CLI 출력까지 검증했고 **실제 `next build`
  산출 CSS/브라우저 렌더는 확인하지 못함**(저장소를 수정하지 않는 조건).
- Safari/Firefox에서의 `<ViewTransition>` 시각 차이는 직접 테스트하지 않음(Next
  문서가 "Some animations may behave differently in Safari" 경고).

---

## 7. 다크 모드 — next-themes(React 19 상태), Tailwind 3.4 class 전략, FOUC 방지, Kakao 지도 타일 처리

### Takeaway

`next-themes@0.4.6`(마지막 릴리스 2025-03-11)은 `attribute="class"`로 Tailwind
3.4의 `darkMode: ['class']`에 바로 맞고 깜빡임 없이 동작하지만, **React 19.2+
개발 빌드에서 `<script>` 콘솔 에러**가 재현되고(실측 + 이슈 #385/#387/#397)
수정(`ThemeScript` 내보내기)은 main에만 있고 미배포다. **Kakao 타일은 래스터
`<img>`라서 타일 레이어에만 CSS `filter: invert(1) hue-rotate(180deg) …`를 주면
가독성 있는 다크 지도가 되고 오버레이는 영향받지 않는다(스크린샷 검증).** 진짜
비용은 **하드코딩 색상 약 577곳(28개 파일)을 시맨틱 토큰으로 옮기는 작업**이다.

### Cited Findings

#### 7.1 next-themes

- 버전/상태: 0.4.6 / 2025-03-11, peer React `^16.8 … ^19 || ^19.0.0-rc`, 6.3k★,
  마지막 push 2026-02-25. README: "No flash on load (both SSR and SSG)", "System
  setting with prefers-color-scheme", "Themed browser UI with color-scheme",
  "Sync theme across tabs and windows", "Disable flashing when changing themes";
  `ThemeProvider`는 Client Component, **`<html suppressHydrationWarning>`
  필요**, Tailwind는 `attribute="class"`, `useTheme()`는 마운트 전 `theme`이
  `undefined`라 토글 UI는 마운트 후 렌더 —
  [README](https://github.com/pacocoursey/next-themes).
- v0.4.6 이후 main의 **미배포 커밋 3개**: "Export `<ThemeScript>`
  (#355)"(프로바이더의 스크립트 삽입 opt-out), "ensure `setTheme` receives the
  latest state (#347)", `@types/react 17` 타입 수정(#356) —
  [compare v0.4.6…main](https://github.com/pacocoursey/next-themes/compare/v0.4.6...main).
- 열린 이슈: [#385](https://github.com/pacocoursey/next-themes/issues/385)(Next
  16.2.0 업그레이드 후 "Encountered a script tag while rendering React
  component…" — "next-themes still seems to work as expected, I am just provided
  with an annoying error message now"),
  [#387](https://github.com/pacocoursey/next-themes/issues/387),
  [#397](https://github.com/pacocoursey/next-themes/issues/397)(React 19.2 개발
  오류, ThemeProvider가 다시 마운트될 때),
  [#375](https://github.com/pacocoursey/next-themes/issues/375)(Next 16
  `cacheComponents`/Activity 사용 시 숨겨진 프로바이더가 낡은 테마를 재적용),
  [#374](https://github.com/pacocoursey/next-themes/issues/374)(`react-hooks/set-state-in-effect`
  린트). 커뮤니티 우회: 패치 파일 또는 서드파티 드롭인 `@wrksz/themes`(이슈
  댓글에서 언급, **미검증·비권장**).
- **직접 재현 `[E7]`**: React 19.3.0 개발 번들 +
  `createRoot().render(<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>…)`
  → 콘솔
  `error: Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead…`.
  기능은 정상(`<html class="dark" style="color-scheme: dark;">`,
  `useTheme → "system/dark"`, 배경색 에뮬레이션 `colorScheme: dark`).
- Next.js `viewport`: `themeColor`는
  `[{ media: '(prefers-color-scheme: light)', color: … }, { media: '(prefers-color-scheme: dark)', color: … }]`
  배열 지원, `colorScheme` 필드 지원 —
  [generateViewport 문서](https://nextjs.org/docs/app/api-reference/functions/generate-viewport).

#### 7.2 현재 코드·라이브 사이트

- `tailwind.config.js` `darkMode: ['class']` ✓, `app/globals.css`에
  `.dark { --background … }` 토큰 ✓. `app/layout.tsx`에는
  ThemeProvider·`suppressHydrationWarning`·`viewport` export 없음, `next/font`
  미사용(`--font-geist-sans: Arial` 문자열만). 형제 노트
  `live_site_ux_audit.md §2.8`: `prefers-color-scheme: dark` 에뮬레이션에서 변화
  없음, 토글 UI 없음, Kakao 타일도 라이트.
- 하드코딩 색 규모(`grep`, `src/`+`app/` `.tsx`):
  `bg-white|text-gray-*|bg-gray-*|border-gray-*|bg-blue-*|text-blue-*` 총
  **577회/28개 파일**, `dark:` 변형을 쓰는 파일은 **4개**뿐.

#### 7.3 Kakao 지도 타일의 다크 처리 `[E5]`

- 공식 문서의 기본 지도 타입은 `ROADMAP/SKYVIEW/HYBRID`뿐이며 다크 로드맵은
  없음(§2.1). 웹 검색으로 Kakao 전용 다크 타일 레시피·공식 지침은 찾지 못함.
  일반 기법 참고: Stamen의 다크모드 지도 글이 CSS 반전을 "첫 단계로 유용하나
  완성된 디자인은 아님"으로 소개(검색 요약, 원문 미열람) —
  [Stamen](https://stamen.com/more-ways-to-make-your-maps-go-dark-mode/).
- 타일은 `<img>`(256×256 PNG, `mts.kakaocdn.net/api/v1/tile/…`)이고 타일
  레이어는 오버레이 레이어와 **형제 DOM**(§2.2). 공식 샘플(customOverlay1)에서 ①
  `#map img[src*="/api/v1/tile/"]{filter:invert(1) hue-rotate(180deg) brightness(.92) contrast(.88) saturate(.75)}`
  ② 타일 레이어 컨테이너에 같은 필터 → **동일하게 가독성 있는 다크
  지도**(레이블이 밝게, 도로 어둡게, 공원 올리브톤), **커스텀 오버레이 "카카오!"
  라벨과 Kakao 로고는 필터 영향 없음**; ③ `brightness(.55) saturate(.8)`만 주는
  "딤" 방식은 탁한 회색 지도에 어두운 글자가 남아 가독성이 떨어짐. 스크린샷:
  `probe_out/dark_co_A_img_invert.png`, `…_B_layer_invert.png`,
  `…_C_layer_dim.png`.
- 선택자 `.dark #map div:has(> img[src*="/tile/"])`가 타일 레이어(초기 1개, 줌
  전환 중 2개)에만 일치하고 줌 변경 후에도 유지, 오버레이와 그 조상은
  `filter: none` `[검증 E5 dark_has_probe.mjs]`. `:has()`는 Tailwind 3.4가
  `has-*` 변형을 지원하는 현대 브라우저 기능 —
  [Tailwind 3.4](https://tailwindcss.com/blog/tailwindcss-v3-4).

### Inferences

#### 권장 패턴 / 통합 스케치

(1) 프로바이더·레이아웃 (Tailwind 3.4 `class` 전략)

```tsx
// app/providers.tsx
'use client';
import { ThemeProvider } from 'next-themes';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
// app/layout.tsx (Server Component)
import type { Viewport } from 'next';
export const viewport: Viewport = {
  viewportFit: 'cover', // env(safe-area-inset-*) 사용을 위해 (타입 존재 확인)
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='antialiased'>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

(2) 3단 토글(시스템/라이트/다크), 마운트 후에만 렌더, 라벨 고정

```tsx
const { theme, setTheme } = useTheme();
const [mounted, setMounted] = React.useState(false);
React.useEffect(() => setMounted(true), []);
if (!mounted) return <span className='size-9' aria-hidden />; // 하이드레이션 불일치 방지
<div role='group' aria-label='화면 테마'>
  {(['system', 'light', 'dark'] as const).map(v => (
    <button
      key={v}
      type='button'
      aria-pressed={theme === v}
      onClick={() => setTheme(v)}
    >
      {{ system: '시스템', light: '라이트', dark: '다크' }[v]}
    </button>
  ))}
</div>;
```

(3) 지도 타일 다크 필터(선택적 "지도 색 유지" 토글 제공)

```css
/* globals.css — 오버레이·로고·컨트롤은 타일 레이어가 아니므로 영향 없음(검증) */
.dark #kakaoMap div:has(> img[src*='/tile/']) {
  filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88)
    saturate(0.75);
}
.dark[data-map-light] #kakaoMap div:has(> img[src*='/tile/']) {
  filter: none;
} /* 사용자가 밝은 지도를 원할 때 */
```

(4) 하드코딩 색 → 시맨틱 토큰 이행 매핑(제안; 대비 4.5:1은 구현 시 계산) | 현재
| 토큰 | |---|---| | `bg-white`, `bg-white/90 backdrop-blur-sm` | `bg-card`,
`bg-card/90 backdrop-blur-sm` | | `bg-gray-50/100` | `bg-muted` | |
`text-gray-900/800` | `text-foreground` | | `text-gray-500/600` |
`text-muted-foreground` | | `border-gray-200` | `border-border` | |
`bg-blue-50 text-blue-600` | `bg-primary/10 text-primary` | | 마커 흰
테두리·그림자 | `--marker-ring` 변수로 다크에서 약간 어두운 링 |

- 클러스터 `styles`·마커 인라인 스타일에는 `hsl(var(--primary))`처럼 CSS 변수를
  써서 테마를 따라가게 할 수 있음
  `[추론: 인라인 style 값에서 var() 해석은 일반 CSS 동작이나 Kakao 클러스터 스타일 적용 경로는 미검증]`.

#### 구현 방식·지도 처리 비교

| 테마 구현                                                         | 장점                                          | 단점                                                                            | 판정           |
| ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- | -------------- |
| `next-themes@0.4.6`                                               | 검증된 FOUC 방지·탭 동기화·system 추종, 1.5KB | React 19.2+ 개발 콘솔 에러(재현), 수정은 미배포, `cacheComponents`와 이슈(#375) | **권고(감수)** |
| 직접 구현(서버 컴포넌트 인라인 스크립트 + `useSyncExternalStore`) | 의존 0, 경고 경로 회피 가능성                 | 직접 유지, 경고 회피는 미검증                                                   | 대안           |
| 서드파티 드롭인(`@wrksz/themes` 등)                               | 이슈 댓글에서 호평                            | 근거 약함(작성자 본인 홍보·댓글), 미검증                                        | 비권장         |

| 지도 타일 옵션                                                                 | 결과                                                          | 비용·위험                                   | 판정     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------- | -------- |
| A 항상 라이트                                                                  | 안전                                                          | 다크 UI에서 눈부심                          | 폴백     |
| **B 타일 레이어 CSS 필터**(invert + hue-rotate + brightness/contrast/saturate) | 가독성 있는 다크 지도, 오버레이·로고 영향 없음(스크린샷 검증) | 색 의미 변화, 합성 비용 미측정, 약관 미확인 | **권고** |
| C 딤(`brightness(.55)`)                                                        | 탁한 회색 지도                                                | 라벨 대비 저하                              | 비권장   |
| D 스카이뷰/하이브리드 지도 타입                                                | 어두운 위성 영상                                              | 시설 지도 가독성 낮음                       | 비권장   |

#### 접근성

- 사용자의 OS 설정 존중(`system` 기본) + 명시 토글, `color-scheme`로 폼
  컨트롤·스크롤바 일치, 다크에서 텍스트 대비 재계산. 필터로 뒤집은 지도의 라벨
  대비는 육안으로 양호하나 수치 검증은 하지 못함 `[미검증]`.

#### 위험·대안

- **next-themes 개발 콘솔 에러**: ① 허용(React 경고는 개발 빌드 전용, 프로덕션
  영향 없을 것 `[추론]`) ② 이슈 #385의 패치 적용 ③ **직접 구현**: 서버 컴포넌트
  `<head>`에 블로킹 인라인 스크립트(`localStorage` 읽고
  `documentElement.classList.toggle('dark')` + `style.colorScheme`) +
  `useSyncExternalStore` 훅(약 40줄). 서버가 낸 HTML의 스크립트는
  하이드레이션에서 새로 생성되지 않으므로 해당 경고 경로를 피할 것으로 보이나
  `[추론, 미검증]`. 서드파티 대체(`@wrksz/themes`)는 검증 전까지 비권장.
- 필터 방식은 타일 색 의미(공원=녹색, 도로 위계)를 일부 잃음. 필터 비용(타일
  레이어 합성)·Kakao 약관상 변형 허용 여부는 확인 못 함 → 문제 시 "지도는 항상
  라이트" 폴백(위험 0).
- `cacheComponents`(Activity) 활성화 시 #375 재현 가능 — 현재
  `next.config.ts`에는 없음.

### Gaps

- Kakao 약관의 타일 시각 변형 조항, 필터 적용 시 실제 모바일 GPU 성능, WCAG 대비
  수치 검증은 수행하지 못함. next-themes 개발 에러가 `next dev`에서 동일하게
  나는지는 Next 앱으로 직접 재현하지 못함(React 19.3 CSR 번들에서만 재현).

---

## 8. 데모 친화성 — 로그인 없는 체험, Kakao SDK 실패 시 폴백(정적 미리보기 + 재시도)

### Takeaway

리뷰어가 **로그인·권한·API 키 없이** 곧바로 쓸 수 있어야 한다(NN/g: 실콘텐츠
먼저, 로그인 벽 금지). 위치 거부/불가는 서울시청 기준으로 계속 진행, 6개 상황
프리셋을 "데모 투어"로 활용, **지도 SDK 실패(잘못된 키 → HTTP 401, 네트워크/DNS
오류 → `script.onerror`; 도메인 미등록은 별도 가능성)** 는 정적 미리보기 + 목록
전용 모드 + 재시도로 폴백한다. 시설 데이터·목록·시트는 SDK와 독립이므로 지도가
죽어도 대부분 동작시킬 수 있다.

### Cited Findings

- NN/g Login Walls(2014-03-02): 저자들은 "rarely see users more annoyed than
  when they hit a login wall"; "Show real content before asking for login.
  Reserve walls for highly personal services such as email or banking.";
  미리보기·투어는 "vague", 게스트 대안 권장 —
  [NN/g](https://www.nngroup.com/articles/login-walls/).
- Kakao 가이드: "등록된 사이트 도메인에서만 지도API를 사용할 수 있기 때문에
  반드시 등록해주세요." → **프리뷰 배포 URL·다른 로컬 포트·포크 환경에서는
  지도가 실패할 수 있음**(로컬 테스트도 `http://localhost:8080` 예시처럼 등록
  필요) — [Kakao 가이드](https://apis.map.kakao.com/web/guide/). 도메인 불일치
  시 SDK 응답/타일 거동은 **직접 확인하지 못함**.
- SDK 로드 실패 신호 `[검증 sdk_onerror.mjs]`:
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=<잘못된 값>` → HTTP **401**
  `{"errorType":"AccessDeniedError","message":"wrong appKey format"}`(32자리
  형식이라도 없는 키면 `appKey(…) does not exist`), 브라우저에서 `<script>`의
  **`onerror` 발화**; DNS 실패도 `onerror`. 샘플처럼 `autoload`를 끄지 않은
  로딩은 Chrome이 "A parser-blocking, cross site script… is invoked via
  document.write" 경고(kakao.js, clusterer.js, services.js 등) → 앱이 이미 쓰는
  `autoload=false` + `kakao.maps.load()`가 안전.
- 이벤트: `tilesloaded`("타일 이미지 로드가 모두 완료되면 발생… 미세한 이동으로
  로드가 일어나지 않으면 발생하지 않는다"), `idle` —
  [Kakao 문서](https://apis.map.kakao.com/web/documentation/).
- 현재 코드: 오류 오버레이는 문구 + 전체 새로고침 버튼 하나(`MapView.tsx`),
  `useKakaoMap`은 실패한 `<script>` 태그를 제거하지 않아 같은 실패를 다시
  기다림, 시설 데이터는 자체 API(`/api/...`)로 지도와 독립. 로컬 즐겨찾기
  훅(`useLocalFacilityFavorite`)·설정 패널이 이미 있음(로그인 선택적).
- NN/g 오류 메시지 가이드: 정확하고 해결책을 제시, 입력 보존 —
  [NN/g](https://www.nngroup.com/articles/error-message-guidelines/).

### Inferences

#### 권장 패턴 (행동 명세)

1. **첫 화면 3초 규칙**: 로그인/권한/설정 없이 ① 서울시청 기준 지도 ② 프리셋 칩
   6개 ③ 결과 카드가 보임. 위치 권한은 "내 위치" 버튼에서만 요청(§5).
2. **로그인 선택적**: 즐겨찾기·알림은 "로그인 없이 이 기기에 저장돼요"라고
   명시하고(로컬 저장), 로그인은 "여러 기기에서 동기화"가 필요할 때만 제안.
3. **데모 시나리오**: 프리셋 6개 = 투어. 첫 방문에 닫을 수 있는 안내 카드("비
   오는 날·한산한 곳·따릉이로…를 눌러보세요"; `localStorage`), 공유 가능한
   **딥링크 3개**(예: `?preset=rainy_day`, `?preset=quiet`,
   `?preset=bike_trip`)를 README/포트폴리오에 게시 `[추론]`. 현재 앱은
   `lat`/`lng` 쿼리만 처리(`MapView.tsx` 184–191행: 중심 이동 + 레벨 3)하므로
   **`preset` 파라미터는 신규 구현이 필요**하다(코드 확인).
4. **외부 API 실패에도 화면 유지**: 날씨/혼잡도 502(라이브에서 관찰됨)는 마지막
   성공 값 + 신선도 배지 또는 "예시 데이터" 라벨의 번들 샘플로 대체(데모에서 빈
   화면 방지) `[추론]`.
5. **지도 SDK 폴백(상태기계)**:
   `loading(≤8s) → ready | failed(reason: script | timeout | tiles)`. 실패 시 ①
   **정적 미리보기**(서울 구 경계 + 샘플 핀의 SVG/PNG를 `public/`에 정적
   에셋으로; "실제 지도를 불러오지 못했어요" 캡션) ② **"목록으로
   보기"**(시트/목록은 지도 없이도 동작) ③ **"다시 시도"**(실패 태그 제거 후
   재삽입, 자동 재시도 3회 백오프 1s/3s/9s + 수동 버튼) ④ 원인 문구 분기(키
   거부/네트워크/도메인 확인 필요), 개발자용 상세는 콘솔·텔레메트리로. 도메인
   미등록은 SDK는 로드돼도 타일이 안 뜰 수 있으므로 `kakao.maps.load` 후 N초 내
   `tilesloaded` 미발생이면 `tiles` 실패로 간주 `[미검증]`.

#### 추천 + 통합 스케치

```ts
// shared/lib/kakao/load-sdk.ts — 재시도 가능한 로더 (script.onerror 는 401/네트워크 모두 검증됨)
export function loadKakaoSdk(appkey: string, timeoutMs = 8000) {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps?.Map) return resolve();
    document.querySelector('script[data-kakao-sdk]')?.remove(); // 이전 실패 태그 제거 (재시도의 핵심)
    const s = document.createElement('script');
    s.dataset.kakaoSdk = '1';
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=clusterer&autoload=false`;
    const t = setTimeout(() => {
      s.remove();
      reject(new Error('timeout'));
    }, timeoutMs);
    s.onload = () => {
      clearTimeout(t);
      window.kakao?.maps
        ? window.kakao.maps.load(() => resolve())
        : reject(new Error('script'));
    };
    s.onerror = () => {
      clearTimeout(t);
      s.remove();
      reject(new Error('script'));
    };
    document.head.appendChild(s);
  });
}
// 호출부: for (const wait of [0, 1000, 3000, 9000]) { await sleep(wait); try { await loadKakaoSdk(key); return 'ready'; } catch {} } return 'failed';
```

```tsx
<MapFallback
  reason={reason}
  onRetry={retry}
  onShowList={() => setListMode(true)}
>
  {/* public/map-fallback.svg: 서울 윤곽 + 구 경계 + 샘플 핀 (정적) */}
  <img
    src='/map-fallback.svg'
    alt='서울 지도 미리보기(실제 지도를 불러오지 못했어요)'
    className='size-full object-cover opacity-80'
  />
</MapFallback> // role="alert" 문구 + [다시 시도] [목록으로 보기]
```

#### 접근성

- 폴백 안내는 `role="alert"`(또는 비긴급 `status`), 이미지에는 대체 텍스트,
  재시도 버튼은 포커스 이동. 목록 전용 모드는 지도 의존이 없어 스크린리더
  사용자에게도 완전한 대체 경로가 됨.

#### 위험·대안

- 정적 미리보기는 "가짜 지도" 오해를 줄 수 있어 **정적임을 명시**하고 핀 클릭
  상호작용은 제공하지 않거나 목록으로 연결.
- 샘플 데이터 대체는 "예시 데이터" 라벨 없이 쓰면 오해(신선도 배지와 같은 원칙).
  키는 공개 JS 키(도메인 제한)이므로 저장소 노출 자체는 설계상 허용되나 도메인
  제한 설정 확인 필요(저장소의 `test-kakao-map.html`에 하드코딩 키 존재
  `[추론: 확인만]`).

### Gaps

- 도메인 미등록 시 실제 SDK 응답/오류 신호(401? 타일 403?)를 재현하지 못함.
  오프라인/Service Worker 기반 폴백은 조사하지 않음.

---

## 9. 성능 가드레일 — next/font, 동적 import, 마커 DOM, 시트 드래그 `transform`, 지도 리사이즈, Lighthouse 모바일 목표

### Takeaway

이 앱의 성능 병목은 라이브러리보다 **(a) 서드파티 지도(SDK 37KB gz + 타일 PNG
수백 KB), (b) 마커 DOM/생성 비용(§2), (c) 큰 JSON(검색 인덱스 871KB), (d) 폰트
선택**이다. 가드레일: SDK `autoload=false` + preconnect, 시트·검색·패널
`next/dynamic`, 마커는 클러스터링·diff 갱신, 시트는 `transform`만 애니메이션,
지도 컨테이너 리사이즈 회피, 한글 폰트는 동적 서브셋만. 현실적 목표는 Lighthouse
모바일 ≥85(스트레치 90), LCP ≤2.5s, CLS ≤0.1 `[추론]`.

### Cited Findings

- Core Web Vitals "good" 임계값(75퍼센타일, 모바일/데스크톱 분리): LCP ≤2.5s,
  INP ≤200ms, CLS ≤0.1(web.dev 2020-05-04, 2024-10-31 갱신) —
  [web.dev/vitals](https://web.dev/articles/vitals). Lighthouse(문서의
  Lighthouse 10 표) 성능 점수 가중치: FCP 10%, Speed Index 10%, LCP 25%, **TBT
  30%**, CLS 25%; 0–49 빨강, 50–89 주황, 90–100 초록 —
  [Chrome Developers](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).
- Next.js 16.4 문서(lastUpdated 2026-03-10): `next/dynamic`·`React.lazy`로
  Client Component 지연 로드, **`ssr: false`는 Client Component 안에서만
  허용**("`ssr: false` is not allowed with `next/dynamic` in Server
  Components"), 외부 라이브러리는 이벤트 시점에 `await import()`(문서 예: 입력
  시 `fuse.js`), "When a Server Component dynamically imports a Client
  Component, automatic code splitting is currently not supported" —
  [Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading).
- `next/font`(문서 2026-09-24): 빌드 시 자체 호스팅·CLS 최소화; `display` 기본
  `'swap'`; `preload` 기본 `true`(`subsets` 미지정 + preload 시 경고);
  `adjustFontFallback` 기본(로컬은 `'Arial'`); Tailwind v3는
  `fontFamily: { sans: ['var(--font-inter)'] }` + `variable` 옵션 —
  [Font API](https://nextjs.org/docs/app/api-reference/components/font),
  [Fonts 가이드](https://nextjs.org/docs/app/getting-started/fonts).
- **Pretendard v1.3.9(2023-11-05)**: `PretendardVariable.woff2`
  **2,057,688B(≈2.06MB)**; 가변 동적 서브셋 woff2 **92조각(8,252–43,920B, 전부
  합치면 2.96MB; 브라우저는 `unicode-range`로 필요한 조각만 내려받음)** —
  [pretendard repo](https://github.com/orioncactus/pretendard)(파일 크기는
  GitHub contents API로 확인 `[검증]`). 앱은 현재 웹폰트 요청 0(라이브 노트 §3),
  `--font-geist-sans: Arial` 문자열만 정의됨.
- Kakao SDK/타일(§2.1): kakao.js 37.4KB gz, 타일 1장 ≈21.8KB, 모두
  `max-age=21600`; 호스트: `dapi.kakao.com`(로더), `t1.kakaocdn.net`(SDK
  본체·라이브러리), `mts.kakaocdn.net`(타일) `[검증]`.
- 라이브 사이트 기준선(형제 노트 `live_site_ux_audit.md §3`, 1회 측정): 모바일
  first-party JS 283KB(14 chunks), `/api/search/index?page=0&size=20000`
  871KB·1.6s, `/api/subway` 중복 호출 ×2, 마커 첫 등장 3.1–3.3s.
- MDN: `will-change`는 최후 수단이며 스크립트로 전후 토글(§1.1); Kakao:
  `relayout()`은 컨테이너 크기를 바꾼 뒤 필요, window resize는 자동; `idle`은
  애니메이션 중 발생하지 않음(§2.1). `pure-web-bottom-sheet` 작성자: "not
  advisable to animate the element height"(레이아웃 유발; 대신 transform) —
  [DEV 글](https://dev.to/viliket/native-like-bottom-sheets-on-the-web-the-power-of-modern-css-ld6).
- 마커: 기본 `Marker` 개당 DOM 5노드·컬링 없음, `CustomOverlay`는 뷰포트
  컬링·개별 `setMap` 5,000개 1.6s, 클러스터러 경유 시 DOM≈139(§2.3).
- 번들 실측(§10 표): Base UI Drawer 38.7KB gz(lazy), sonner 9.6KB, cmdk +4.2KB,
  next-themes 1.5KB.

### Inferences

#### 권장 가드레일

1. **지도 SDK**: `<link rel="preconnect" href="https://dapi.kakao.com">`,
   `https://t1.kakaocdn.net`, `https://mts.kakaocdn.net`(이미지는 crossorigin
   없이) `[추론: 호스트는 실측, 효과는 미측정]`;
   `next/script strategy="afterInteractive"`(지도가 메인 콘텐츠이므로
   lazyOnload는 부적합), `libraries=clusterer`(+필요 시 services만),
   `autoload=false`. 지도 컨테이너 높이를 CSS로 고정(`h-dvh` 등)해 CLS 방지.
2. **번들 분할**: 모바일 시트(+38KB), 검색 패널, 활동 계획/알림 패널은
   `next/dynamic`(Client Component 안에서 `ssr:false`), 데스크톱에서는 시트
   청크를 아예 요청하지 않음. 큰 유틸(es-hangul 등)은 첫 입력 시점에 동적
   import.
3. **마커**: 화면 내 DOM 노드 상한을 **≈300(마커 유래)** 로 두고(`[추론]`)
   클러스터링 `minLevel`/`gridSize`로 조절; 갱신은 `idle` 이벤트 기준
   diff(추가/삭제만), 필터 변경에 전체 재생성 금지; 개별 `setMap` 대량 호출
   금지(`addMarkers(…, nodraw=true)` 후 `redraw()` 1회).
4. **시트 드래그**: `transform`(+opacity)만 애니메이션, 높이 애니메이션 금지,
   드래그 중에만 `will-change: transform`(상시 금지). Base UI 데모의
   `padding-bottom` 트릭은 프레임마다 시트 내부 레이아웃을 유발하므로 콘텐츠가
   무거우면 `contain: layout`/단순화 `[추론: 미측정]`. 본문 스크롤 영역
   `overscroll-behavior: contain`.
5. **지도 리사이즈**: 패널·시트가 지도 컨테이너의 **크기를 바꾸지 않도록
   오버레이**로 배치(§1) → `relayout()`·타일 재요청 회피. 불가피하면
   `ResizeObserver` → rAF 1회 합치기 → `map.relayout()`; 사이드 패널 토글
   애니메이션 동안에는 호출하지 말고 `transitionend`에서 1회.
6. **폰트**: 지금은 시스템 폰트(웹폰트 요청 0)가 가장 빠름. 도입한다면
   **Pretendard 가변 동적 서브셋**(92조각, `unicode-range`)만 — 2.06MB 가변 전체
   파일을 `next/font/local`로 preload 금지. 적용법은 `npm i pretendard` 후
   `import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'`(CSS의
   `url()`을 번들러가 자산으로 처리; Turbopack 동작은 **미검증**) 또는
   `public/`에 복사. `font-display: swap`, 폴백
   `system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR'`. 아이콘은
   `lucide-react`(이미 트리셰이킹).
7. **측정**: 프로덕션 빌드를 모바일 프로파일로 Lighthouse(성능 가중치상 TBT
   30%·LCP 25%·CLS 25%), 필드 지표는 INP(Lighthouse는 TBT로 대체) — 도메인이
   Kakao에 등록된 URL에서만 지도 포함 측정 가능.
8. **개발 모드 주의**: `next.config.ts`의 `reactStrictMode:false`는 Kakao 맵
   초기화/정리의 이중 실행 버그를 가린다 → 최소한 로컬에서 켜고
   `react-kakao-maps-sdk`가 겪은 StrictMode 이슈류를 점검 `[추론]`.

#### 접근성/UX 연계

- 성능 최적화(스켈레톤·지연 로드)는 `aria-busy`/상태 문구와 함께(§5). 스켈레톤이
  성능 개선을 대체하지 않는다는 NN/g 경고를 따른다.

#### 위험·대안

- preconnect·`afterInteractive`의 이득은 이번에 측정하지 않았다. 타일 수(모바일
  12–20장 ≈ 240–400KB `[추론: 1장 21.8KB × 장수]`)는 LCP 후보이므로 LCP 요소
  식별 후 조정.

### Gaps

- Lighthouse 실측(점수)은 이번 조사에서 수행하지 않음(Kakao 도메인 등록·프로덕션
  빌드 필요). 모바일 기기 CPU 기준 마커 비용 미측정. Pretendard 동적 서브셋을
  Turbopack에서 처리하는 방식 미검증.

---

## 10. 종합 — 의존성 권고(추가 / 회피 / 유지), 스택 위생 선행 조치, 출처

### Takeaway

**추가**: `@base-ui/react@1.9.0`(Drawer만, 모바일 lazy), `sonner@2.0.8`,
`next-themes@0.4.6`, `cmdk@1.1.1`(+선택 `es-hangul@2.4.0`),
`tailwindcss-animate@1.0.7`. **교체/조정**: `tw-animate-css` 제거,
`tailwind-merge` 3.3.1→2.6.0, `react/react-dom` 19.1→19.3.0. **회피**: `vaul`,
`motion`/`framer-motion`, `react-modal-sheet`, `@react-spring/web`,
`@use-gesture/react`, `react-kakao-maps-sdk`(현 시점), `@ark-ui/react`.
**유지**: Radix(Dialog/Dropdown 등), `lucide-react`, 명령형 Kakao 코드(+공식
클러스터러), `zustand`. 즉시(eager) 번들 순증은 약 **17KB gz**(sonner 9.6 +
next-themes 1.5 + cmdk 증분 4.2 + es-hangul 1.9), 모바일 시트 **38.7KB gz는
lazy**.

### Cited Findings

#### 10.1 버전·발행일·크기·React 19 종합표 (2026-10-11 기준 npm; 크기는 esbuild 실측 gz, React external)

| 패키지                                 | 최신 안정 / 발행일                                                  | gz 크기                                                                                         | React 19 근거                                                | 메모                                                                             |
| -------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `@base-ui/react` (Drawer)              | 1.9.0 / 2026-10-09 (1.0.0=2025-12-11, Drawer 도입 1.2.0=2026-02-12) | Drawer 38.7KB · Dialog 24.0KB · Autocomplete 50.4KB · Toast 26.4KB                              | peer `^17‖^18‖^19`; React 19.3.0에서 경고 0건 `[E6]`         | MIT. 열린 drawer 이슈 7건                                                        |
| `vaul`                                 | 1.1.2 / 2024-12-14                                                  | 22.3KB (Radix 공유 시 +8.3KB)                                                                   | peer `^19.0.0` 포함                                          | README "unmaintained"(2025-10-03), `modal={false}` 미해결 버그 다수, 이슈+PR 164 |
| `motion` (= `framer-motion`)           | 14.1.0 / 2026-10-09 (14.0.0=10-02, 13.0.0=08-05)                    | 전체 43.2KB · LazyMotion 코어 9.4KB + domAnimation 24.4KB(비동기) · `motion/mini` animate 3.4KB | peer `^18‖^19`                                               | 릴리스 매우 잦음 → 도입 시 정확 고정                                             |
| `sonner`                               | 2.0.8 / 2026-08-09                                                  | 9.6KB                                                                                           | peer `^18‖^19`; React 19.3.0 경고 0건 `[E7]`                 | 13.0k★, MIT                                                                      |
| `next-themes`                          | 0.4.6 / 2025-03-11                                                  | 1.5KB                                                                                           | peer `…‖^19`; **개발 빌드 `<script>` 콘솔 에러 재현** `[E7]` | 미배포 수정 3건, 열린 이슈 #385/#387/#397/#375                                   |
| `cmdk`                                 | 1.1.1 / 2025-03-14                                                  | 17.8KB (Radix Dialog 공유 시 +4.2KB)                                                            | peer `^18‖^19`; 경고 0건 `[E7]`                              | 마지막 커밋 2025-10-29, 13.0k★                                                   |
| `es-hangul`                            | 2.4.0 / 2026-07-09                                                  | `getChoseong`+`disassemble` 1.9KB                                                               | 무관(순수 TS)                                                | MIT, toss                                                                        |
| `downshift`                            | 9.4.0 / 2026-06-30                                                  | `useCombobox` 13.5KB                                                                            | peer `react >=16.12`                                         | cmdk 폴백                                                                        |
| `react-kakao-maps-sdk`                 | 1.2.2 / 2026-08-13 (1.2.1=02-18 React 19 StrictMode 수정)           | 5.6KB(주요 컴포넌트)                                                                            | peer `^19`; 19.3.0 + 라이브 SDK 정상 `[E8]`                  | 319★, 1인 메인테이너, `CustomOverlayMap` 클러스터링 불가                         |
| `kakao.maps.d.ts` / `@types/kakaomaps` | 0.1.40 / 2024-06-16 · 1.1.7 / 2025-07-19                            | 타입 전용                                                                                       | —                                                            | 저장소의 자체 타입(418줄) 대체 후보                                              |
| `@radix-ui/react-dialog`               | 1.2.0 / 2026-10-05 (설치 1.1.14)                                    | 14.2KB                                                                                          | peer `^19`                                                   | `radix-ui@1.7.0` 통합 패키지에 combobox/command/drawer 없음                      |
| `tw-animate-css`                       | 1.4.0 / 2025-09-24 (설치 1.3.6, 2025-07-25)                         | —                                                                                               | —                                                            | **Tailwind v4 전용 → 3.4 무동작 `[E9]`**                                         |
| `tailwindcss-animate`                  | 1.0.7 / 2023-08-28                                                  | 플러그인                                                                                        | —                                                            | Tailwind v3용, `animate-in` 등 생성 확인 `[E9]`                                  |
| `tailwind-merge`                       | 3.3.1 / 2025-06-10 (설치) vs 2.6.0 / 2024-12-23                     | —                                                                                               | —                                                            | 3.x는 Tailwind v4 대상, v3은 2.6.0 사용(README)                                  |
| `react` / `react-dom`                  | 19.3.0 / 2026-09-09 (설치 19.1.0)                                   | —                                                                                               | —                                                            | `<ViewTransition>`·Fragment Refs 포함                                            |
| `next`                                 | 16.4.0 / npm 2026-10-06 (설치 16.3.1, 2026-08-13)                   | —                                                                                               | peer `^18.2‖^19`                                             | 16.4 문서에 View Transitions 가이드(플래그 불필요)                               |
| `react-modal-sheet`                    | 5.6.0 / 2026-03-27                                                  | 54.6KB (motion 포함)                                                                            | peer `motion>=11`                                            | 비권장                                                                           |
| `@use-gesture/react`                   | 10.3.1 / 2024-03-21                                                 | 6.9KB                                                                                           | peer `>=16.8`                                                | 불필요                                                                           |
| `@react-spring/web`                    | 10.1.2 / 2026-10-01                                                 | 17.2KB                                                                                          | peer `^19` 포함                                              | 불필요                                                                           |
| `@ark-ui/react` (Drawer)               | 5.39.3 / 2026-10-05                                                 | 30.2KB                                                                                          | peer `>=18`                                                  | 생태계 추가 비용 → 비권장                                                        |
| `pure-web-bottom-sheet`                | 1.1.1 / 2026-10-09 (생성 2025-10-30)                                | 미측정                                                                                          | 프레임워크 무관                                              | 관찰용                                                                           |
| `use-debounce`                         | 10.1.1 / 2026-03-29                                                 | 1.1KB                                                                                           | peer `react *`                                               | 선택                                                                             |
| `pretendard`(폰트)                     | 1.3.9 / 2023-11-05                                                  | 가변 2.06MB · 동적 서브셋 92조각(8–44KB)                                                        | —                                                            | 동적 서브셋만                                                                    |

- 라이선스: 위 중 MIT 확인 — vaul, next-themes, sonner, cmdk,
  react-kakao-maps-sdk, motion, @base-ui/react, @ark-ui/react, es-hangul,
  pure-web-bottom-sheet(GitHub/npm 메타). 그 외는 미확인.
- **스택 위생 사실 모음(읽기 전용 확인 + 실측)**: ①
  `app/globals.css:1 @import 'tw-animate-css'` — Tailwind 3.4.19에서
  `animate-in` 등 0건(§6.1) ② `tailwind-merge ^3.3.1`(설치 3.3.1)은 Tailwind v3
  비대상(README) ③ `components.json`의 `"tailwind": { "config": "" }`는 문서상
  v4 모드이며, 저장소 shadcn 컴포넌트는 v4 전용 클래스(`max-h-(--radix-…)`,
  `origin-(--radix-…)`, `outline-hidden`, `shadow-xs`, `rounded-xs`)를 사용 —
  Tailwind 3.4.19 CLI에서 모두 미생성 `[E9]` ④ 설치 React 19.1.0 ⑤
  `layout.tsx`에 `viewport`/ThemeProvider/`next/font` 없음 ⑥
  `reactStrictMode: false`.
- `sibling` 노트와의 불일치 1건: `code_audit_map_core.md` D-11이 "등장
  애니메이션은 `tw-animate-css`(이미 import됨)로"를 제안 → §6.1 실측과 모순(채택
  금지).

### Inferences

#### 최종 의존성 권고 표

| 구분            | 패키지@버전                                                                                                                       | 용도                                                | 핵심 근거                                                 | 비용·메모                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Add**         | `@base-ui/react@1.9.0`                                                                                                            | 모바일 시트(Drawer, 비모달 + snapPoints)            | §1 직접 검증(지도 상호작용 유지·스냅·핸드오프·Esc 사다리) | +38.7KB gz **lazy**. 정확 버전 고정(발행 2일차 → 보수적으로는 1.8.0), 데스크톱엔 미로드 |
| **Add**         | `sonner@2.0.8`                                                                                                                    | 토스트 교체                                         | polite 라이브 리전·스택·호버·`containerAriaLabel`         | +9.6KB gz. 커스텀 `toast.ts` 삭제                                                       |
| **Add**         | `next-themes@0.4.6`                                                                                                               | 다크 모드                                           | `attribute="class"` + Tailwind 3.4, FOUC 없음             | +1.5KB. 개발 콘솔 에러 감수 또는 직접 구현(§7)                                          |
| **Add**         | `cmdk@1.1.1`                                                                                                                      | 검색 콤보박스(`shouldFilter={false}`)               | APG 패턴 구현·IME 수정(#339), React 19.3 경고 0           | +4.2KB(Radix 공유). 영어 기본 라벨 덮어쓰기                                             |
| Add(선택)       | `es-hangul@2.4.0`                                                                                                                 | 초성/자모 검색                                      | 직접 검증 헬퍼                                            | +1.9KB, 동적 import 가능                                                                |
| **Add**         | `tailwindcss-animate@1.0.7`                                                                                                       | `animate-in`/`data-[state]` 애니메이션(Tailwind v3) | §6.1 생성 확인                                            | CSS만. `tw-animate-css` 제거                                                            |
| Add(선택)       | `kakao.maps.d.ts@0.1.40` 또는 `@types/kakaomaps@1.1.7`                                                                            | 타입                                                | 자체 타입 418줄 대체                                      | dev 전용                                                                                |
| **Upgrade**     | `react`·`react-dom@19.3.0`                                                                                                        | `<ViewTransition>`                                  | Next 16.4 가이드 "React 19.3 includes…"                   | 설치 19.1.0                                                                             |
| **Downgrade**   | `tailwind-merge@2.6.0`                                                                                                            | `cn()`                                              | README: Tailwind v3은 2.6.0                               | 3.x는 v4 대상                                                                           |
| **Remove**      | `tw-animate-css`                                                                                                                  | —                                                   | v3 무동작                                                 | `globals.css` 1행 import 삭제                                                           |
| **Avoid**       | `vaul`                                                                                                                            | —                                                   | unmaintained + modal=false 버그                           | shadcn Radix `add drawer`가 설치하므로 수동 추가 금지                                   |
| **Avoid**       | `motion` / `framer-motion`                                                                                                        | —                                                   | 시트·마커·목록 전환에 불필요                              | 필요 시 LazyMotion(§6)                                                                  |
| **Avoid**       | `react-modal-sheet`, `@use-gesture/react`, `@react-spring/web`, `@ark-ui/react`                                                   | —                                                   | 무게·중복·모달 지향                                       | —                                                                                       |
| **Avoid(지금)** | `react-kakao-maps-sdk`                                                                                                            | —                                                   | 이득 < 재작성 비용, 클러스터링 제약                       | 포털 훅(§2)으로 대체                                                                    |
| **Keep**        | `@radix-ui/react-dialog`·`dropdown-menu`·`scroll-area`·`switch` 등, `lucide-react`, `zustand`, `class-variance-authority`, `clsx` | 모달·메뉴 등                                        | 변경 이유 없음(Radix 1.2.0 활발)                          | `sheet.tsx`(Radix)는 모달 용도로 유지                                                   |
| **Keep**        | Kakao SDK 명령형 코드 + 공식 `MarkerClusterer`(1.1.4)                                                                             | 지도                                                | §2 실측                                                   | 문서 외 조합(CustomOverlay in clusterer) 가드 필요                                      |

#### 권장 도입 순서

0. **위생(반나절)**: `tw-animate-css`→`tailwindcss-animate`,
   `tailwind-merge@2.6.0`, `react@19.3.0`, `viewport`
   export(`viewportFit: 'cover'`), `components.json` v3/v4 정책 결정(v3 유지면
   새 shadcn 컴포넌트는 손으로 번역).
1. **핵심 UX**: 모바일 시트(Base UI Drawer) + 데스크톱 `<aside>`, sonner,
   클러스터 레이어(공식 클러스터러 + 선택 오버레이), 지도 키보드/줌 버튼.
2. **폴리시**: 검색(cmdk + 초성), 칩 접근성 수정(라벨 고정), 스켈레톤/빈
   상태/신선도 배지, 위치 권한 복구, 다크 모드(토큰 이행이 최대 작업).
3. **선택**: `<ViewTransition>`(필터 목록), Pretendard 동적 서브셋, 데모
   모드(딥링크 3개)·SDK 폴백 UI.

### Gaps (전체 조사의 미확인 항목 요약)

- 실기기(iOS Safari/Android Chrome)·스크린리더 검증 없음; 모든 성능 수치는
  데스크톱 헤드리스 상대값.
- Airbnb 필터/지도 패턴 1차 자료, Smashing/CSS-Tricks의 2024–2026 바텀시트 글,
  m3.material.io 본문 미열람.
- Kakao 약관(타일 변형·로고), 도메인 미등록 시 SDK 거동, `Marker`+`shape/coords`
  조합, 클러스터러 내부 구현·장기 안정성 미확인.
- Base UI Drawer의 iOS 가상 키보드 대응·`finalFocus`·`snapToSequentialPoints`;
  cmdk 실제 IME 조합 테스트; View Transitions의 Safari 시각 차이 미확인.
- `tw-animate-css` 무동작은 Tailwind CLI 출력까지만 검증(실제 `next build`
  산출물·브라우저 확인 아님).

#### 출처 목록 (URL)

**Kakao**

- Documentation: https://apis.map.kakao.com/web/documentation/ · Guide:
  https://apis.map.kakao.com/web/guide/ · Samples:
  https://apis.map.kakao.com/web/sample/ , …/basicClusterer/ , …/customOverlay1/
  , …/multipleMarkerImage/
- SDK 자산: https://t1.kakaocdn.net/mapjsapi/js/main/4.5.28/kakao.js ·
  …/libs/clusterer/1.1.4/clusterer.js · …/libs/services/1.1.3/services.js · 타일
  호스트 mts.kakaocdn.net
- react-kakao-maps-sdk: https://github.com/JaeSeoKim/react-kakao-maps-sdk ·
  https://react-kakao-maps-sdk.jaeseokim.dev/docs/setup/withHook ·
  https://github.com/JaeSeoKim/react-kakao-maps-sdk/blob/main/docs/docs/setup/next.md
  · https://www.npmjs.com/package/react-kakao-maps-sdk **시트/드로어**
- Vaul: https://github.com/emilkowalski/vaul · https://vaul.emilkowal.ski/api ·
  https://vaul.emilkowal.ski/snap-points · 이슈
  https://github.com/emilkowalski/vaul/issues/630 , /497 , /492 , /509 , /647 ,
  /624 , /525 , /567
- Base UI: https://base-ui.com/react/components/drawer ·
  https://base-ui.com/react/components/autocomplete ·
  https://github.com/mui/base-ui/releases ·
  https://github.com/mui/base-ui/tree/master/docs/src/app/(docs)/react/components/drawer/demos
  · https://www.npmjs.com/package/@base-ui/react
- shadcn: https://ui.shadcn.com/docs/components/drawer ·
  https://ui.shadcn.com/docs/components/radix/drawer ·
  https://ui.shadcn.com/docs/tailwind-v4 ·
  https://ui.shadcn.com/docs/components-json ·
  https://ui.shadcn.com/docs/components/radix/sonner ·
  https://ui.shadcn.com/docs/components/sonner ·
  https://ui.shadcn.com/docs/components/radix/combobox
- Radix:
  https://github.com/radix-ui/primitives/blob/main/packages/react/dialog/src/dialog.tsx
  ·
  https://github.com/radix-ui/primitives/blob/main/packages/react/dialog/CHANGELOG.md
  · https://www.radix-ui.com/primitives/docs/components/dialog
- react-modal-sheet: https://github.com/Temzasse/react-modal-sheet ·
  pure-web-bottom-sheet:
  https://cdn.jsdelivr.net/npm/pure-web-bottom-sheet@0.7.0/README.md ·
  https://dev.to/viliket/native-like-bottom-sheets-on-the-web-the-power-of-modern-css-ld6
  **패턴/표준**
- Material(Android 공식 문서):
  https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
  · …/Chip.md
- Apple HIG:
  https://developer.apple.com/design/human-interface-guidelines/sheets · …/maps
  · …/search-fields · …/segmented-controls (JSON:
  https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json)
- WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ · …/button/ ·
  …/windowsplitter/ · WCAG 2.2:
  https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html ·
  …/target-size-minimum.html
- NN/g: https://www.nngroup.com/articles/site-search-suggestions/ ·
  …/skeleton-screens/ · …/empty-state-interface-design/ ·
  …/response-times-3-important-limits/ · …/error-message-guidelines/ ·
  …/login-walls/ · Baymard:
  https://baymard.com/blog/horizontal-filtering-sorting-design
- 보조(2차): https://vp0.com/blogs/airbnb-style-bottom-sheet-react-native ·
  https://designsystems.surf/blueprints/chip · https://techcrunch.com/?p=906056
  · https://stamen.com/more-ways-to-make-your-maps-go-dark-mode/
- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior ·
  …/touch-action · …/will-change · …/@starting-style ·
  …/Web/API/KeyboardEvent/isComposing · …/Web/API/Permissions_API ·
  …/Web/API/GeolocationPositionError/code **프레임워크/빌드**
- Next.js: https://nextjs.org/docs/app/guides/view-transitions ·
  …/guides/lazy-loading · …/getting-started/fonts ·
  …/api-reference/components/font · …/api-reference/functions/generate-viewport
  · https://nextjs.org/docs/llms.txt ·
  https://github.com/vercel/next.js/blob/canary/packages/next/src/server/config-shared.ts
  · https://github.com/vercel/next.js/releases/tag/v16.4.0
- React: https://github.com/facebook/react/blob/main/CHANGELOG.md ·
  https://react.dev/reference/react/ViewTransition ·
  https://legacy.reactjs.org/blog/2020/10/20/react-v17.html · web.dev:
  https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
  · https://web.dev/articles/vitals ·
  https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- Tailwind: https://tailwindcss.com/blog/tailwindcss-v3-4 · tailwind-merge:
  https://github.com/dcastil/tailwind-merge **라이브러리**
- Motion: https://motion.dev/docs/react-reduce-bundle-size ·
  https://motion.dev/docs/react-accessibility ·
  https://github.com/motiondivision/motion/blob/main/CHANGELOG.md
- next-themes: https://github.com/pacocoursey/next-themes (+ issues #385 #387
  #397 #375 #374, compare v0.4.6…main)
- sonner: https://sonner.emilkowal.ski/toaster ·
  https://github.com/emilkowalski/sonner · cmdk:
  https://github.com/pacocoursey/cmdk · es-hangul:
  https://github.com/toss/es-hangul · Pretendard:
  https://github.com/orioncactus/pretendard
- 형제 노트(참고): `code_audit_map_core.md`, `live_site_ux_audit.md` (같은
  디렉터리)

#### 직접 실험 목록 (재현용; 환경: Chrome for Testing 153.0.8010.12 headless-shell, Playwright-core 1.64.0, Node 24.15.0, esbuild 0.25.10, Tailwind CLI 3.4.19, react 19.3.0)

- **E1** Kakao 샘플 DOM·SDK 자산 크기·401 응답: [kakao_probe.mjs][E1] (+
  `probe_out/clusterer.json`, `customOverlay1.json`, `multipleMarkerImage.json`;
  크기/401은 `curl -H "Accept-Encoding: gzip"` 인라인)
- **E2** 마커/클러스터/오버레이 성능·DOM 수: [kakao_perf.mjs][E2],
  `kakao_perf2.mjs`(컬링·클러스터러+CustomOverlay),
  `kakao_perf3.mjs`(클러스터러+CustomOverlay 대량) — 결과
  `probe_out/perf_results.json`
- **E3** 클러스터 접근성 패치·`clickable` 전파·z-index: [kakao_probe3.mjs][E3],
  `kakao_probe4.mjs`
- **E4** 지도 키보드 단축키: [kakao_kbd2.mjs][E4] (`kakao_kbd.mjs`는 생성 후
  `setKeyboardShortcuts` 시도 → 무반응)
- **E5** 다크 타일 필터·`:has()` 선택자: [dark_has_probe.mjs][E5],
  `kakao_probe.mjs`(DARKTEST) — 스크린샷 `probe_out/dark_co_A_img_invert.png`,
  `dark_co_B_layer_invert.png`, `dark_co_C_layer_dim.png`,
  `dark_has_after_zoom.png`
- **E6** Base UI Drawer 비모달·스냅·핸드오프·swipe/Esc cancel: 앱
  `bui_test/src/app.jsx`, [bui_probe.mjs][E6], `bui_probe2.mjs`(스와이프
  닫힘·핸드오프·플릭), `bui_probe3.mjs`(swipe/Esc `cancel()`),
  `bui_focus.mjs`(초기 포커스), `bui_debug.mjs` — 스크린샷
  `probe_out/bui_peek.png`, `bui_half.png`, `bui_full.png`
- **E7** cmdk·sonner·next-themes(React 19.3 개발 번들): 앱
  `lib_test/src/app.jsx`, [lib_probe.mjs][E7], 스크린샷 `probe_out/lib_dark.png`
- **E8** react-kakao-maps-sdk + 포털 훅(라이브 SDK 프레임에 번들 주입):
  `rk_test/src/rk.jsx`·`rk2.jsx`·`portal.jsx`, [rk_probe.mjs][E8],
  `rk_probe2.mjs`, `portal_probe.mjs`
- **E9** Tailwind 3.4.19: `tw_test/`(tw-animate-css → 0건),
  `tw_test2/`(tailwindcss-animate → 생성), `tw_test3/`(스케치 클래스 개별 생성
  확인 `check_classes.sh`) — [tw_test][E9]
- **E10** 번들 크기: `entries/*.js` → `out/*.js`(esbuild
  `--bundle --minify --format=esm --target=es2020 --external:react --external:react-dom --external:react/jsx-runtime`,
  gzip -9), 헬퍼 [hangul_test.mjs][E10]
- **E11** 기본 `Marker` vs 커스텀 `MarkerImage` DOM·`<area>` 포커스, SDK
  `onerror`: [kakao_marker_a11y2.mjs][E11], `sdk_onerror.mjs`

[E1]: (세션 스크래치패드)/scripts/kakao_probe.mjs [E2]: (세션
스크래치패드)/scripts/kakao_perf.mjs [E3]: (세션
스크래치패드)/scripts/kakao_probe3.mjs [E4]: (세션
스크래치패드)/scripts/kakao_kbd2.mjs [E5]: (세션
스크래치패드)/scripts/dark_has_probe.mjs [E6]: (세션
스크래치패드)/scripts/bui_probe.mjs [E7]: (세션
스크래치패드)/scripts/lib_probe.mjs [E8]: (세션
스크래치패드)/scripts/rk_probe.mjs [E9]: (세션 스크래치패드)/tw_test [E10]:
(세션 스크래치패드)/scripts/hangul_test.mjs [E11]: (세션
스크래치패드)/scripts/kakao_marker_a11y2.mjs
