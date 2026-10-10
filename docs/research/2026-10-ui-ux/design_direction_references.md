# 서울핏(Seoul Fit) 시각 디자인 방향 — 레퍼런스 비교와 토큰 제안

조사일: 2026-10-11. 대상 스택: Next.js 16 (`next@^16.3.1`), React 19, Tailwind CSS `3.4.19`, shadcn/ui CSS-variable(HSL) 모드, `lucide-react@0.525.0`, Kakao Maps JS SDK(`dapi.kakao.com/v2/maps/sdk.js`). 현재 상태는 저장소(`app/globals.css`, `tailwind.config.js`, `components.json`, `src/shared/lib/icons/facility.tsx`, `styles/marker-animations.css`)와 `https://seoulfit.damecasol.com` headless 스크린샷으로 확인했다. 저장소 파일은 읽기만 했고 수정하지 않았다.

표기 규칙: **[공식]** = 공식 문서·브랜드 페이지의 값, **[측정]** = 이 세션에서 도구로 직접 측정한 값(fontTools, npm pack, WCAG 계산 스크립트, headless 스크린샷), **[추정]** = 스크린샷에서 눈으로 읽은 추정, **미확인** = 보지 못했거나 접근이 막힌 것.

---

## 1) 비교 후보와 관찰 근거

### Takeaway
실제로 확인한 지도 우선(map-first) 제품은 모두 "밝은 지도 타일 + 흰색 solid 표면 + 단일 브랜드 색 + 카테고리 색 마커" 구조를 공유한다. 차이는 (A) 유틸리티형(Google/Naver/Kakao: 좌측 패널·상단 칩·우측 컨트롤, 정보 밀도 높음)과 (B) 소프트/플레이풀형(Airbnb 2025: 큰 pill 검색, 3D 아이콘, 사진 카드)이다. 한국어 가독성 기준은 KRDS(공식)가 수치로 제공한다.

### 관찰 표 (실제로 본 화면만)

| 후보 | 확인한 화면·근거 (확인일 2026-10-11) | 정보 구조·밀도 | 위계·색 역할 | 타이포 | 표면·엘리베이션 | 마커 | 가져올 것 / 조정할 것 |
|---|---|---|---|---|---|---|---|
| **A1. Kakao Map 웹(데스크톱)** | `https://map.kakao.com/` headless 1280×800 스크린샷 **[측정]** (모바일 `m.map.kakao.com`은 403 `Restricted User Agent` → **미확인**) | 좌측 ~280px 패널: 브랜드 파랑 헤더+탭(검색/길찾기/버스/지하철/MY), 검색창, **현재 동네 + 날씨·미세먼지 한 줄**("구름많음 17° … 미세 보통 초미세 보통"), '주변 탐색' 아이콘 7개, '내 장소', 광고. 지도 위 상단에 흰 pill 카테고리 칩(음식점·카페·편의점·숙박·주유소·주차장), 우측 컨트롤 열, 좌하단 날씨 칩, 우하단 줌 **[추정]** | 브랜드 파랑은 헤더·탭 선택에만, 나머지는 흰색/회색; 칩은 흰 배경+색 아이콘 | 산세리프, 12~14px 밀도 높은 텍스트 **[추정]** | solid 흰 패널, 칩은 약한 그림자 **[추정]** | POI 아이콘은 타일에 포함, 사용자 마커는 미관찰 | '지금 상태 한 줄'(서울 지금과 같은 개념)이 검색창 바로 아래에 있다 → 서울핏의 "서울 지금" 카드 위치 근거. 광고·탭 과밀은 배제 |
| **A2. Naver Map 웹(데스크톱·모바일)** | `https://map.naver.com/p` 1280×800, `https://m.map.naver.com/` 390×844 스크린샷 **[측정]** | 데스크톱: 좌측 아이콘 레일(지도홈/길찾기/버스/지하철/기차/저장/더보기) + 300px 패널(검색, 현재 동네, 광고·기획전, 'Smart Around 주변'); 지도 상단 칩(음식점·카페·팝업스토어), 우상단 지도유형 썸네일(일반/위성/지형), 우측 컨트롤 스택(테마·저장·지적편집도·거리뷰·반경·면적·거리·다운로드·인쇄·공유), 좌하단 날씨 칩. 모바일: 흰 헤더(로고·'Go to App' 파랑 pill·메뉴), 연회색 둥근 검색 필드, 지도 우상단 '일반|위성' 세그먼트, 하단에 앱 유도 카드(파랑 CTA) **[추정]** | 브랜드 초록은 로고·검색 포커스 링에만; CTA는 파랑; 카테고리 칩은 흰색 | 산세리프, 모바일 검색 placeholder ~15px **[추정]** | 모바일 하단 카드는 solid 흰색, 상단 라운드 ~16px, 그림자 약함 **[추정]** | 지하철 노선색이 타일에 그대로 노출됨 | 모바일 "흰 헤더 + 회색 검색 필드 + 하단 카드" 골격과 지도유형 세그먼트. 광고·기획전 카드 배제 |
| **A3. Google Maps 웹** | `https://www.google.com/maps/@37.5665,126.978,14z?hl=ko` 1280×800(지도 노출), 390×844(앱 업그레이드 interstitial만 노출) **[측정]** | 데스크톱: 좌측 72px 레일(저장됨/최근/앱 설치) + 상단 좌측 검색 pill(길찾기 버튼 내장), 지도 전면. 모바일: 상단 검색 pill, 흰 다이얼로그(라운드 ~20px) + 어두운 scrim, 파랑 채움 CTA + outline 보조 버튼, 하단 이동수단 원형 버튼 **[추정]** | 파랑(채움 버튼·선택)만 브랜드 역할; 지도 POI는 보라/주황/파랑/초록 **원형 배경 + 흰 글리프** | Google Sans/Roboto 추정 **[추정]** | 검색 pill·다이얼로그 모두 solid 흰색 + 그림자, 블러 없음 **[추정]** | **원형 색 배경 + 흰 아이콘** POI(카테고리별 색) + 선택 시 확대 **[추정; 선택 상태는 미조작]** | 마커 해부(원형+흰 글리프+그림자), scrim 위 solid 다이얼로그, 검색 pill. 모바일 바텀시트는 interstitial 때문에 **미확인** |
| **B. Airbnb 2025 앱(공식 이미지)** | Newsroom 2025 Summer Release 본문 이미지 4장 다운로드 후 확인 **[측정]**: `All-new-app-US.jpg`, `Trips-tab-US.jpg`, `Experiences-flow-P0…`, `Services-flow-P0…` ([Airbnb Newsroom](https://news.airbnb.com/product-releases/airbnb-2025-summer-release/)) | 상단 큰 pill 검색("Start your search", 높은 그림자), 3탭(Homes/Experiences/Services) **3D 아이콘 + NEW 배지**, 사진 카드 가로 스크롤, Trips 탭은 **날짜 원형 배지 타임라인**(Thu 22 빨강 원) + 썸네일 카드 + 'Get directions' 버튼 | 흰 바탕, 빨강은 활성 탭·날짜 배지 등 극소량; 사진이 색을 담당 | 자체 서체, 큰 제목(~26px) + 작은 메타(~12px) 대비 **[추정]** | solid 흰 카드, 큰 라운드(~16~24px), 사진 위 반투명 'Original' 글라스 라벨 **[추정]** | 지도 화면 없음 | 검색 pill 크기·그림자, 활동 플래너용 **타임라인 카드**(날짜 배지), 라벨 글라스 칩. 3D 아이콘·사진 의존은 데이터 유틸리티인 서울핏에 부적합 |
| C. 한국형 명료성(참고 자료) | KRDS 타이포 페이지 **[공식]**, Toss 브랜드 사이트 **[공식 색만]**; Toss 앱 화면은 **미확인** | KRDS: 본문 17px(16px 이상), 행간 150%, 굵기 400/500/700 권장 | Toss Blue `#0064FF`, Toss Gray `#202632` **[공식]** — 복제 금지 대상 | Pretendard GOV(KRDS) | — | — | 수치 기준(행간·크기·굵기 수)만 차용 |
| (제외) Citymapper 웹 | `https://citymapper.com/seoul` 1280 **[측정]** | 도시 랜딩 + 큰 초록 패널 | 브랜드 초록 과다 | — | — | — | 지도 UI가 구식·브랜드 과다. 참고 가치 낮음 |
| (부분) Komoot | `https://www.komoot.com/discover` 1280: 쿠키 오버레이가 화면 대부분을 가림 → **부분 확인**(사진 카드 + 난이도 라벨 + 별점) | — | — | — | — | — | 카드에 난이도/별점 라벨을 겹치는 방식만 참고 |
| (차단) AllTrails | `https://www.alltrails.com/explore` 1280/390 모두 "Access is temporarily restricted" → **미확인** | | | | | | |
| (미확인) Apple Maps 앱, Mobbin 화면, Toss 앱 내부 | 로그인·앱 필요 → 보지 않음. Apple은 HIG 텍스트만 인용 | | | | | | |

### 현재 서울핏 관찰 (seoulfit.damecasol.com, headless 390×844 / 1280×800) **[측정·추정]**
- 첫 화면에 **영문 "Cookie Settings" 다이얼로그**(Arial)가 지도 위에 떠 있고 뒤 UI는 블러 처리됨 → ko 사이트에서 영문 모달이 첫인상이 됨.
- 헤더: 짙은 남색 사각 로고(`bg-[#0F284E]`, `src/widgets/header/ui/Header.tsx:342`), 회색 검색창; 칩은 파랑/초록 채움; '서울 지금' 카드; 목록 카드 제목에 보라/파랑 텍스트가 섞임 → 강조색이 남색·파랑·초록·보라 4종으로 분산.
- 코드: `app/globals.css`는 shadcn 기본 HSL 중립 팔레트 그대로, `--font-geist-sans: Arial, Helvetica` (한국어 웹폰트 없음), 포커스 링 `#2563eb` 하드코딩. 카테고리 색은 `src/shared/lib/icons/facility.tsx:122-142`에 Tailwind 기본 hex(blue-500/purple-500/red-500/green-500/emerald-600/indigo-500/lime-500/cyan-500/pink-500/violet-500) 하드코딩. 혼잡도/따릉이 배지도 `#10B981/#F59E0B/#EF4444` 하드코딩(`marker-factory.ts:96-102`, `congestion.ts:27-35`). 현재 위치 마커는 `linear-gradient(135deg,#3b82f6,#1d4ed8)` (`marker-factory.ts:39`).
- 카테고리 상수는 `lib/types/facility.ts:11-20`에 **10개**(SPORTS, CULTURE, RESTAURANT, LIBRARY, PARK, SUBWAY, BIKE, COOLING_SHELTER, CULTURAL_EVENT, CULTURAL_RESERVATION). 요청의 9개 외에 `cultural_reservation`이 코드에 존재한다.

### Gaps
- Kakao Map 모바일 웹, AllTrails, Apple Maps, Mobbin, Toss 앱 내부 화면은 보지 못했다(차단·로그인·앱 전용).
- Google Maps 모바일 바텀시트의 detent 동작은 interstitial 때문에 관찰하지 못했다.
- 어느 레퍼런스도 사용성 수치(전환·과업 성공)를 공개하지 않으므로 아래 비교는 구조·위계 관찰이지 성과 근거가 아니다.

---

## 2) 추천 방향과 이유 + 대안의 제약

### Takeaway
**추천: "한강 블루 유틸리티" — A(Google/Naver/Kakao 유틸리티 골격) 위에 C(KRDS 한국어 가독 수치)와 B의 극히 일부(검색 pill, 플래너 타임라인 카드)만 얹고, 서울 정체성은 색 2개(한강 블루 primary, 2024 서울색 '스카이코랄' 계열의 live 액센트)와 Pretendard 타이포로만 표현한다.** 지도는 라이트 타일 고정, UI 표면은 solid 흰색/다크 카드, 글라스는 헤더·칩 행에만 쓴다.

### 이유 (관찰·공식 근거에 결속)
1. 과업 적합성: 서울핏의 핵심은 "현재 상황(서울 지금) → 프리셋 → 점수화된 추천 목록 → 마커 선택 → 상세/즐겨찾기"다. Kakao Map 웹이 검색창 바로 아래에 날씨·미세먼지 한 줄을 두고, Naver/Kakao 모두 지도 위 상단 칩과 좌측 패널을 쓰는 구조를 실제로 확인했다(1절). 이 골격은 사용자에게 이미 익숙하므로 학습 비용이 없다.
2. 데이터 신뢰감: Apple HIG Maps는 "정보가 많은 콘텐츠를 지도 위에 돋보이게 하려면 muted 강조 스타일"을, 커스텀 컨트롤에는 "얇은 stroke나 약한 drop shadow로 지도와 대비"를 권한다 — [Apple HIG Maps](https://developer.apple.com/design/human-interface-guidelines/maps). Google Maps 데스크톱의 원형 색 배경+흰 글리프 POI도 같은 원리다 **[추정]**. Airbnb의 3D 아이콘·사진 의존은 "서울 지금"의 수치·상태 레이블과 충돌한다.
3. 한국어 가독성: KRDS는 본문 17px(최소 16px), 행간 150% 이상, 굵기 400/500/700을 명시한다 — [KRDS 타이포그래피](https://www.krds.go.kr/html/site/style/style_03.html). 현재 Arial 기본값은 한글 글리프가 없어 OS 폴백으로 렌더링된다(현 `globals.css` **[측정]**).
4. "서울" 정체성: 서울시가 2008년 대표 10색에 '서울하늘색(SC7909)'을, 2024년부터 매년 서울색(2024 스카이코랄 sRGB 248,73,108 / 2025 그린오로라 0,180,147 / 2026 모닝옐로우 254,156,0)을 공식 발표한다 — [서울시 올해의 서울색·서울빛](https://www.seoul.go.kr/seoul/color.do) **[공식]**. 하늘색 계열 primary + 스카이코랄 계열 live 액센트는 서울의 공식 색 체계를 **참조**하되 로고·상징 자체를 복제하지 않는다. Toss Blue(`#0064FF`)·Naver 초록·Kakao 노랑·Google 파랑과도 색상각이 다르다(4절).
5. 구현 비용: shadcn HSL 변수와 Tailwind 3.4 `theme.extend`만으로 끝나며 새 의존성은 폰트 패키지 1개다(5절).

### 대안을 택하지 않은 이유·제약
- **B. Airbnb 소프트/플레이풀**: 큰 사진·3D 아이콘·스프링 모션이 핵심인데 서울핏은 사진 자산이 없고(공공 데이터), 스프링 모션은 라이브러리가 필요하다(8절). 포트폴리오에서 "유틸리티 신뢰감"보다 "장식"으로 읽힐 위험. 검색 pill과 플래너 타임라인 카드만 가져온다.
- **C. 단일 강한 브랜드색(Citymapper식)**: 큰 면적의 브랜드색은 9개 카테고리 마커·상태색과 충돌하고 데이터 레이블 대비를 떨어뜨린다(실제 Citymapper 화면에서 초록 패널이 지도와 경쟁하는 것을 확인 **[추정]**).
- **다크 지도**: Kakao Maps SDK는 다크 베이스맵을 지원하지 않는다는 2026-09-21 공식 답변이 있다(7절). 따라서 "다크 UI + 라이트 지도"를 기본으로 설계해야 하며, 반전 필터는 실험 플래그로만 둔다.

### Inferences
- 데스크톱은 "좌측 패널 400px + 지도 전면", 모바일은 "검색 pill + 칩 행 + 바텀시트(3 detent)"가 관찰된 세 지도 서비스와 가장 일관된다. 바텀시트 detent는 Apple HIG의 medium/large + grabber 지침을 따른다(7절).

---

## 3) 결정 기록 초안 (design-reference 스킬 형식)

> 배치 위치: 프로젝트의 기존 디자인 문서(예: `docs/design/…` 또는 대응 문서)의 한 절로 넣는다. 이 세션은 저장소를 수정하지 않았으므로 아래는 초안이다.

| 항목 | 기록 내용 |
|---|---|
| 대상·목표 | 서울핏 전체 UI(지도 화면·서울 지금 카드·프리셋 칩·추천 목록·바텀시트·활동 플래너·즐겨찾기·알림·공개 `/places` SEO 페이지). 과업: 현재 상황에 맞는 공공시설을 빠르게 고르고 이동한다. 기기: 모바일 390px 우선, 데스크톱 1280px. 정보량: 9(+1) 카테고리, 수천 POI, 실시간 날씨·대기·혼잡도. 제약: Tailwind 3.4 + shadcn HSL 변수 유지, Kakao Maps(다크 타일 없음), 새 의존성은 폰트 패키지만. |
| 선택 주체·상태 | **위임 선택 완료** — 소유자가 "그럴듯하고 멋지게"로 위임. 같은 선택에 재승인을 요구하지 않는다. |
| 후보와 근거 | 1절 표. 실제 확인: Kakao Map 데스크톱, Naver Map 데스크톱·모바일 웹, Google Maps 데스크톱(+모바일 interstitial), Airbnb 2025 공식 이미지 4장, 현재 서울핏 모바일·데스크톱(모두 2026-10-11 headless). 미확인: Kakao 모바일 웹(403), AllTrails(차단), Apple Maps 앱, Mobbin, Toss 앱 내부. |
| 비교 | A 유틸리티형: 과업·밀도 적합, 익숙함, 비용 낮음 / 개성 약함 → 색·타이포로 보완. B Airbnb: 플래너 타임라인·검색 pill만 유효 / 사진·3D·스프링 의존은 부적합. C 단일 브랜드색: 마커·상태색과 충돌. |
| 결정 | **"한강 블루 유틸리티"**: A 골격 + KRDS 가독 수치 + Pretendard + primary `hsl(207 92% 38%)` + live 액센트(스카이코랄 계열) + 카테고리 9색(CVD 검토) + solid 표면(글라스는 헤더·칩만) + 라이트 지도/다크 UI. 선택 이유는 2절. |
| 구현 입력 | 4절 토큰(`globals.css`/`tailwind.config.js`), 5절 폰트 로딩, 6절 카테고리·마커, 7절 표면·헤더·다크맵, 8절 모션, 9절 한국어 타이포 체크리스트. 조정: 영문 쿠키 모달의 한국어화·톤 통일, 하드코딩 hex 제거(`facility.tsx`, `marker-factory.ts`, `congestion.ts`, `Header.tsx:342`, `globals.css` 포커스 링). |
| 결과 | (구현 후 기록) 실제 390/1280 렌더링, 긴 시설명·주소·숫자 상태, 다크 모드, reduced-motion, 키보드 포커스 확인 결과와 남은 문제. |

---

## 4) 토큰 제안 (paste-ready)

### Takeaway
shadcn의 `배경/전경` 쌍 관례를 유지하고(현재 `tailwind.config.js`가 `hsl(var(--x))` 래핑이므로 값은 **괄호 없는 HSL 삼중값**), `success/warning/info/live`와 `surface-*`, 카테고리 변수를 추가한다. 모든 텍스트 쌍은 WCAG 2.x 대비를 계산해 AA(4.5:1)를 만족시켰고, UI 경계(입력 테두리·링)는 3:1을 만족시켰다 **[측정]**.

### Cited Findings
- shadcn 현행 문서는 OKLCH + Tailwind v4(`@theme inline`)이며 Tailwind v3 프로젝트는 그대로 동작한다("Your existing apps with Tailwind v3 and React 18 will still work") — [shadcn Tailwind v4 가이드](https://ui.shadcn.com/docs/tailwind-v4), [shadcn Theming](https://ui.shadcn.com/docs/theming). 변수 이름 목록(background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1..5, sidebar-*, radius)은 Theming 문서 기준.
- 현재 저장소 `app/globals.css`는 HSL 삼중값(예: `--primary: 222.2 47.4% 11.2%`)을 쓰고 `tailwind.config.js`가 `hsl(var(--primary))`로 감싼다 **[측정]** → 아래 값은 그 관례를 그대로 따른다.
- Tailwind 3.4 `tabular-nums` = `font-variant-numeric: tabular-nums` (다른 numeric 유틸과 조합 가능) — [Tailwind v3 font-variant-numeric](https://v3.tailwindcss.com/docs/font-variant-numeric).
- 서울색 공식 sRGB: 2024 스카이코랄 248,73,108(=`#F8496C`, hsl 348 93% 63%), 2025 그린오로라 0,180,147, 2026 모닝옐로우 254,156,0 — [서울시](https://www.seoul.go.kr/seoul/color.do). 2008 대표 10색 이름·코드(SC0908 단청빨간색, SCN902 한강은백색, SC1956 꽃담황토색, **SC7909 서울하늘색**, SC4907 남산초록색, SC0916 고궁갈색, SC2940 기와진회색, SC2920 돌담회색, SC1944 은행노란색, SC1941 삼베연미색)만 공개되고 **RGB 값은 공개 페이지에 없음**(미확인).
- Toss 공식 브랜드색 `#0064FF`(Toss Blue), `#202632`(Toss Gray), "브랜드 컬러는 절대 변형할 수 없습니다" — [Toss 브랜드 사이트](https://brand.toss.im/). → 본 제안의 primary(hsl 207)는 Toss Blue(hsl 217 100% 50%)와 색상각·명도·채도가 모두 다르다 **[측정]**.

### 왜 hsl(207 92% 38%)이 "서울"로 읽히는가 (추론)
- 서울시 공식 대표색에 '서울하늘색'이 있고, 2024~2026 서울색이 한강 노을(스카이코랄)·가로수(그린오로라)·아침해(모닝옐로우)처럼 **하늘·강·빛**에서 추출된다는 점을 참조했다 **[공식 출처: 위 서울시 페이지]**. 맑은 날 한강 위 하늘을 연상시키는 채도 높은 청색을 primary로, 스카이코랄 계열을 "지금 일어나는 일(live)" 액센트로 쓰면 서울시 자료를 인용해 설명할 수 있다. 서울시 로고·슬로건·서체·정확한 상징색 값은 사용하지 않는다(상표·공공누리 조건 회피).
- 경쟁·유사 서비스와 구분: Google 파랑(`#1A73E8`≈hsl 214 80% 51%, 일반 지식 — **미검증**), Toss `#0064FF`(hsl 217), Naver 초록, Kakao 노랑과 색상각이 다르다.

### 4-1. `app/globals.css` — `:root` / `.dark` (HSL, 괄호 없음)

```css
:root {
  /* 반경·폰트 */
  --radius: 0.75rem;                       /* 12px: 카드·시트 기본 */
  --font-sans: 'Pretendard Variable', 'Pretendard Fallback', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; /* 숫자는 Pretendard tnum 사용, 모노는 ID·좌표 등 극소수 */

  /* 기본 표면/텍스트 */
  --background: 210 25% 98%;              /* #F9FAFB  앱 셸(패널) 배경 */
  --foreground: 218 28% 12%;              /* #161C27  본문 잉크 — bg 대비 16.34:1 */
  --card: 0 0% 100%;                      /* #FFFFFF  카드·시트 */
  --card-foreground: 218 28% 12%;         /* 17.08:1 */
  --popover: 0 0% 100%;
  --popover-foreground: 218 28% 12%;
  --surface-elevated: 0 0% 100%;          /* 지도 위 떠 있는 표면(pill·칩·마커 라벨) */
  --surface-elevated-foreground: 218 28% 12%;
  --surface-glass: 0 0% 100%;             /* 헤더·칩 행 글라스: hsl(var(--surface-glass) / 0.84) + backdrop-blur */
  --scrim: 220 30% 8%;                    /* 시트 뒤 dim: hsl(var(--scrim) / 0.4) */

  /* 브랜드 */
  --primary: 207 92% 38%;                 /* #086ABA  한강 블루 — 흰 글자 5.55:1, bg 위 5.31:1 */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 24% 94%;               /* #ECF0F3  보조 버튼·칩 비활성 */
  --secondary-foreground: 218 25% 20%;    /* #263040  11.60:1 */
  --muted: 210 20% 95%;                   /* #F0F2F5 */
  --muted-foreground: 216 14% 42%;        /* #5C687A  muted 위 5.04:1, 흰 카드 위 5.65:1 */
  --accent: 207 100% 95%;                 /* #E5F4FF  선택 칩·hover 틴트 */
  --accent-foreground: 207 90% 30%;       /* #085391  7.05:1 */
  --destructive: 355 78% 46%;             /* #D11A29  흰 글자 5.40:1 */
  --destructive-foreground: 0 0% 100%;
  --border: 214 20% 88%;                  /* #DAE0E7  구분선(장식) */
  --input: 215 14% 56%;                   /* #7F8C9F  입력 테두리 — 흰 카드 3.41:1, bg 3.27:1 (WCAG 1.4.11 3:1) */
  --ring: 207 92% 45%;                    /* #097DDC  포커스 링 — bg 위 4.04:1 */

  /* 상태 (solid = 채움 배지/버튼, soft = 틴트 배경 + 진한 글자) */
  --success: 152 70% 30%;                 /* #178250  흰 글자 4.83:1 */
  --success-foreground: 0 0% 100%;
  --success-soft: 150 60% 94%;            /* #E7F9F0 */
  --success-soft-foreground: 152 80% 20%; /* #0A5C36  7.40:1 */
  --warning: 30 95% 36%;                  /* #B35C05  흰 글자 4.72:1 */
  --warning-foreground: 0 0% 100%;
  --warning-soft: 40 100% 93%;            /* #FFF3DB */
  --warning-soft-foreground: 28 90% 26%;  /* #7E3E07  7.40:1 */
  --info: 207 92% 38%;                    /* primary와 동일 hue, 정보 배지 */
  --info-foreground: 0 0% 100%;
  --info-soft: 207 100% 95%;
  --info-soft-foreground: 207 90% 30%;
  --live: 347 88% 46%;                    /* #DD0E3B  '서울 지금'·진행 중 행사 — 흰 글자 5.00:1 */
  --live-foreground: 0 0% 100%;
  --live-soft: 347 100% 95%;              /* #FFE5EB */
  --live-soft-foreground: 347 80% 34%;    /* #9C112F  6.97:1 */
  --live-brand: 348 93% 63%;              /* #F8496C  2024 서울색 스카이코랄 sRGB(248,73,108) — 장식 전용(흰 글자 3.41:1, 텍스트 배경 금지; 점·그라디언트·대형 숫자에만) */

  /* 차트(서울 지금 수치) */
  --chart-1: 207 92% 38%;
  --chart-2: 347 88% 46%;
  --chart-3: 152 70% 30%;
  --chart-4: 36 95% 42%;
  --chart-5: 252 62% 56%;

  /* 카테고리 마커 채움 (지도는 라이트 타일 고정이므로 light/dark 동일) */
  --cat-park: 152 62% 33%;                /* #208858 */
  --cat-library: 252 62% 56%;             /* #6549D4 */
  --cat-culture: 292 60% 44%;             /* #A22DB4 */
  --cat-event: 345 88% 50%;               /* #F00F47 */
  --cat-cooling: 196 90% 40%;             /* #0A91C2 */
  --cat-restaurant: 22 92% 48%;           /* #EB5C0A */
  --cat-sports: 43 100% 48%;              /* #F5AF00  전경은 잉크 */
  --cat-bike: 84 72% 38%;                 /* #6FA71B  전경은 잉크 */
  --cat-subway: 222 22% 36%;              /* #485470 */
  --marker-ink: 220 30% 10%;              /* #0F1623  밝은 마커의 글리프색 */
  /* 카테고리 텍스트(칩·목록 레이블): 흰 바탕 위 */
  --cat-park-text: 152 72% 24%;     --cat-library-text: 252 72% 24%;  --cat-culture-text: 292 70% 24%;
  --cat-event-text: 345 98% 24%;    --cat-cooling-text: 196 100% 24%; --cat-restaurant-text: 22 100% 24%;
  --cat-sports-text: 43 100% 30%;   --cat-bike-text: 84 82% 24%;      --cat-subway-text: 222 32% 24%;

  /* 엘리베이션(지도 위 부유 표면) */
  --shadow-float-sm: 0 1px 2px hsl(220 30% 10% / 0.06), 0 2px 8px hsl(220 30% 10% / 0.08);
  --shadow-float-md: 0 1px 3px hsl(220 30% 10% / 0.06), 0 4px 12px hsl(220 30% 10% / 0.10);
  --shadow-float-lg: 0 2px 6px hsl(220 30% 10% / 0.08), 0 12px 32px hsl(220 30% 10% / 0.16);
  --shadow-marker: 0 1px 2px hsl(220 30% 10% / 0.25), 0 3px 8px hsl(220 30% 10% / 0.20);

  /* 모션 */
  --dur-fast: 120ms; --dur-base: 200ms; --dur-sheet: 300ms; --dur-exit: 160ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-exit: cubic-bezier(0.3, 0, 0.8, 0.15);
}

.dark {
  --background: 220 24% 8%;               /* #101319 */
  --foreground: 210 20% 95%;              /* #F0F2F5  16.58:1 */
  --card: 220 20% 12%;                    /* #181D25  15.08:1 */
  --card-foreground: 210 20% 95%;
  --popover: 220 20% 14%;                 /* #1D212B */
  --popover-foreground: 210 20% 95%;
  --surface-elevated: 220 18% 16%;        /* #212630  13.52:1 */
  --surface-elevated-foreground: 210 20% 95%;
  --surface-glass: 220 20% 12%;
  --scrim: 220 30% 4%;

  --primary: 207 90% 62%;                 /* #47A7F5  잉크 글자 7.24:1, bg 위 7.19:1 */
  --primary-foreground: 220 30% 8%;       /* #0E121B */
  --secondary: 220 15% 18%;               /* #272C35 */
  --secondary-foreground: 210 15% 88%;    /* 10.57:1 */
  --muted: 220 15% 16%;                   /* #23272F */
  --muted-foreground: 215 12% 68%;        /* #A4ACB7  muted 위 6.53:1, 카드 위 7.38:1 */
  --accent: 207 50% 20%;                  /* #19364D */
  --accent-foreground: 207 90% 78%;       /* #94CCF9  7.32:1 */
  --destructive: 355 80% 64%;             /* #ED5A66  잉크 글자 5.58:1 */
  --destructive-foreground: 220 30% 8%;
  --border: 220 14% 20%;                  /* #2C313A */
  --input: 220 12% 46%;                   /* #677183  카드 3.44:1, bg 3.78:1 */
  --ring: 207 90% 62%;

  --success: 152 60% 50%;                 /* #33CC85  잉크 9.02:1 */
  --success-foreground: 220 30% 8%;
  --success-soft: 152 40% 16%;            /* #18392A */
  --success-soft-foreground: 150 60% 75%; /* #99E6BF  8.70:1 */
  --warning: 40 95% 58%;                  /* #FAB62E  잉크 10.52:1 */
  --warning-foreground: 220 30% 8%;
  --warning-soft: 36 50% 16%;             /* #3D2D14 */
  --warning-soft-foreground: 40 95% 72%;  /* #FBCE74  8.95:1 */
  --info: 207 90% 62%;
  --info-foreground: 220 30% 8%;
  --info-soft: 207 50% 20%;
  --info-soft-foreground: 207 90% 78%;
  --live: 347 90% 66%;                    /* #F65A7C  잉크 5.95:1 */
  --live-foreground: 220 30% 8%;
  --live-soft: 347 45% 18%;               /* #431922 */
  --live-soft-foreground: 347 95% 80%;    /* #FC9CB1  7.52:1 */
  --live-brand: 348 93% 63%;

  --chart-1: 207 90% 62%; --chart-2: 347 90% 66%; --chart-3: 152 60% 50%; --chart-4: 40 95% 58%; --chart-5: 252 47% 68%;

  /* 카테고리 마커 채움은 light와 동일(라이트 지도 위). 텍스트만 밝은 틴트로 */
  --cat-park-text: 152 47% 68%;     --cat-library-text: 252 47% 68%;  --cat-culture-text: 292 45% 68%;
  --cat-event-text: 345 73% 68%;    --cat-cooling-text: 196 75% 68%;  --cat-restaurant-text: 22 77% 68%;
  --cat-sports-text: 43 85% 68%;    --cat-bike-text: 84 57% 68%;      --cat-subway-text: 222 40% 68%;

  /* 다크에서는 그림자가 사라지므로 1px 테두리를 함께 쓴다 */
  --shadow-float-sm: 0 1px 2px hsl(220 40% 2% / 0.5), 0 2px 8px hsl(220 40% 2% / 0.5);
  --shadow-float-md: 0 1px 3px hsl(220 40% 2% / 0.5), 0 4px 14px hsl(220 40% 2% / 0.55);
  --shadow-float-lg: 0 2px 6px hsl(220 40% 2% / 0.55), 0 14px 36px hsl(220 40% 2% / 0.65);
}

@layer base {
  * { @apply border-border; }
  html { font-family: var(--font-sans); -webkit-text-size-adjust: 100%; }
  body { @apply bg-background text-foreground; word-break: keep-all; overflow-wrap: anywhere; }
  :focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; } /* 기존 #2563eb 하드코딩 대체 */
}
```

대비 검산 요약 **[측정, WCAG 2.x 상대휘도 식]**: 라이트 — background/foreground 16.34, card/card-fg 17.08, primary/primary-fg 5.55, secondary 11.60, muted 5.04, accent 7.05, destructive 5.40, success 4.83, success-soft 7.40, warning 4.72, warning-soft 7.40, info 5.55, info-soft 7.05, live 5.00, live-soft 6.97, input 테두리 vs card 3.41, ring vs bg 4.04. 다크 — background/foreground 16.58, card 15.08, popover 14.35, primary 7.24, secondary 10.57, muted 6.53, accent 7.32, destructive 5.58, success 9.02, success-soft 8.70, warning 10.52, warning-soft 8.95, live 5.95, live-soft 7.52, input vs card 3.44, ring vs bg 7.19. `--border`(장식 구분선)는 1.27~1.42로 의도적으로 낮다 — 컴포넌트 경계로 쓰면 안 되고 입력 경계는 `--input`을 쓴다.

### 4-2. `tailwind.config.js` — `theme.extend` 추가분

```js
// theme.extend 에 병합 (기존 colors/borderRadius/animation 은 유지)
colors: {
  // 기존 항목 유지…
  'surface-elevated': { DEFAULT: 'hsl(var(--surface-elevated))', foreground: 'hsl(var(--surface-elevated-foreground))' },
  'surface-glass': 'hsl(var(--surface-glass) / <alpha-value>)',
  scrim: 'hsl(var(--scrim) / <alpha-value>)',
  success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))', soft: 'hsl(var(--success-soft))', 'soft-foreground': 'hsl(var(--success-soft-foreground))' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))', soft: 'hsl(var(--warning-soft))', 'soft-foreground': 'hsl(var(--warning-soft-foreground))' },
  info:    { DEFAULT: 'hsl(var(--info))',    foreground: 'hsl(var(--info-foreground))',    soft: 'hsl(var(--info-soft))',    'soft-foreground': 'hsl(var(--info-soft-foreground))' },
  live:    { DEFAULT: 'hsl(var(--live))',    foreground: 'hsl(var(--live-foreground))',    soft: 'hsl(var(--live-soft))',    'soft-foreground': 'hsl(var(--live-soft-foreground))', brand: 'hsl(var(--live-brand))' },
  chart: { 1: 'hsl(var(--chart-1))', 2: 'hsl(var(--chart-2))', 3: 'hsl(var(--chart-3))', 4: 'hsl(var(--chart-4))', 5: 'hsl(var(--chart-5))' },
  cat: {
    park: 'hsl(var(--cat-park))', library: 'hsl(var(--cat-library))', culture: 'hsl(var(--cat-culture))',
    event: 'hsl(var(--cat-event))', cooling: 'hsl(var(--cat-cooling))', restaurant: 'hsl(var(--cat-restaurant))',
    sports: 'hsl(var(--cat-sports))', bike: 'hsl(var(--cat-bike))', subway: 'hsl(var(--cat-subway))',
    'park-text': 'hsl(var(--cat-park-text))', 'library-text': 'hsl(var(--cat-library-text))', 'culture-text': 'hsl(var(--cat-culture-text))',
    'event-text': 'hsl(var(--cat-event-text))', 'cooling-text': 'hsl(var(--cat-cooling-text))', 'restaurant-text': 'hsl(var(--cat-restaurant-text))',
    'sports-text': 'hsl(var(--cat-sports-text))', 'bike-text': 'hsl(var(--cat-bike-text))', 'subway-text': 'hsl(var(--cat-subway-text))',
  },
  'marker-ink': 'hsl(var(--marker-ink))',
},
borderRadius: {
  lg: 'var(--radius)',                    // 12px 카드
  md: 'calc(var(--radius) - 2px)',        // 10px 버튼·입력
  sm: 'calc(var(--radius) - 4px)',        // 8px 칩·배지
  xl: 'calc(var(--radius) + 4px)',        // 16px 바텀시트 상단·다이얼로그
  '2xl': 'calc(var(--radius) + 12px)',    // 24px 검색 pill(높이 48px 기준 full과 동일하게 보임)
},
boxShadow: {
  'float-sm': 'var(--shadow-float-sm)', 'float-md': 'var(--shadow-float-md)', 'float-lg': 'var(--shadow-float-lg)', marker: 'var(--shadow-marker)',
},
fontFamily: { sans: ['var(--font-sans)'], mono: ['var(--font-mono)'] },
fontSize: {  // 9절 스케일. [size, {lineHeight, letterSpacing, fontWeight}]
  'display': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: '700' }], // 28/36 (md: 32/40)
  'title':   ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],                            // 20/28 장소명·시트 제목
  'section': ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],                          // 17/24
  'body':    ['0.9375rem', { lineHeight: '1.375rem' }],                                           // 15/22
  'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],                                             // 14/20 목록 보조
  'label':   ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '500' }],                        // 13/18 칩·배지
  'caption': ['0.75rem', { lineHeight: '1rem' }],                                                 // 12/16 메타(최소)
},
transitionDuration: { fast: 'var(--dur-fast)', base: 'var(--dur-base)', sheet: 'var(--dur-sheet)', exit: 'var(--dur-exit)' },
transitionTimingFunction: { standard: 'var(--ease-standard)', enter: 'var(--ease-enter)', exit: 'var(--ease-exit)' },
keyframes: {
  'sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
  'fade-up':  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'loc-pulse': { '0%': { transform: 'scale(1)', opacity: '0.35' }, '100%': { transform: 'scale(2.6)', opacity: '0' } },
},
animation: {
  // 기존 spin/pulse/bounce 유지
  'sheet-in': 'sheet-in var(--dur-sheet) var(--ease-enter) both',
  'fade-up': 'fade-up 180ms var(--ease-enter) both',
  'loc-pulse': 'loc-pulse 2s ease-out infinite',
},
```

### Gaps
- 2008 서울 대표 10색의 RGB 값은 공개 페이지에 없어 primary를 서울하늘색의 **정확한 값에 맞추지 못했다**. 서울시 표준색상집(인쇄물) 확인 시 보정 가능하나, 상징색 그대로 복제하지 않는 쪽이 상표·공공누리(색 페이지 하단 제4유형 표시) 측면에서 안전하다.
- OKLCH가 아닌 HSL이므로 같은 L% 값이 색상별로 지각 밝기가 다르다. 위 값은 전부 개별 대비 계산으로 보정했으므로 임의로 L%만 바꾸면 검산이 깨진다.

---

## 5) 타이포그래피 — 서체 선택·로딩·스케일

### Takeaway
**Pretendard Variable(`pretendard@1.3.9`, OFL-1.1)**를 추천한다. 11,172자 한글 전체·Inter 기반 라틴·`tnum`(표 숫자) 지원을 실측으로 확인했고, npm 패키지에 **dynamic subset CSS + 92개 woff2 조각**이 들어 있어 CDN 없이 셀프호스팅할 수 있다. 서울핏 UI 문구는 92조각 중 **18조각(약 482 kB)**만 필요했다 **[측정]**. 숫자용 별도 모노 폰트는 불필요(`tabular-nums`로 해결).

### 후보 비교 (실측 포함)

| 서체 | 패키지·버전·갱신 **[npm registry 측정]** | 라이선스 | 가변 woff2 크기 **[측정]** | 한글 음절 수·글리프 **[fontTools 측정]** | wght 축 | OpenType(UI 관련) | dynamic subset | 비고 |
|---|---|---|---|---|---|---|---|---|
| **Pretendard** | `pretendard` 1.3.9 (registry 수정 2023-11-05; GitHub 최신 릴리스 v1.3.9) | OFL-1.1 | `PretendardVariable.woff2` 2,057,688 B(≈2.06 MB); dynamic subset 92조각 합계 ≈2,958 kB, 조각당 12~18 kB | **11,172** / 14,757 glyphs | 45–930 | `tnum`, `pnum`, `calt`, `case`, `ss01~ss16`, `zero`, `frac` | **있음** — `dist/web/variable/pretendardvariable-dynamic-subset.css` (92 `@font-face`, 전부 `font-display: swap`, `font-weight: 45 920`, `url(./woff2-dynamic-subset/…)` 상대 경로) | Inter + Source Han Sans(본고딕) 기반, JP/Std/GOV 변형 존재 — [GitHub README](https://github.com/orioncactus/pretendard), [Releases](https://github.com/orioncactus/pretendard/releases) |
| Wanted Sans | `wanted-sans` 1.0.3 (2024-03-05) | OFL-1.1 | `WantedSansVariable.woff2` 1,289,292 B | **11,172** / 12,663 | **400–1000(Regular 이하 없음)** | `tnum`, `calt`, `case`, `cv01~22`, `ss01~16` | 있음(`variable/split/WantedSansVariable.min.css`, 웹폰트 가이드는 jsDelivr 기준) — [웹폰트 가이드](https://github.com/wanteddev/wanted-sans/blob/main/packages/wanted-sans/documentation/webfonts/README.md) | 기하학적 인상, 7 굵기. Light 이하 굵기 없음 → 캡션용 가벼운 굵기 불가 |
| SUIT | `@sun-typeface/suit` 2.0.5 (2024-07-24) | OFL-1.1 | `SUIT-Variable.woff2` 624,536 B | **2,668**(KS X 1001 부분집합 수준) / 2,956 | 100–900 | `tnum`, `pnum`, `ss01`, `ss17~18` | 없음(정적/가변 CSS만) — [GitHub](https://github.com/sun-typeface/SUIT) | 가볍지만 **희귀 음절 미지원** → 공공 장소명(동적 데이터)에서 폴백 섞임 위험 |
| Noto Sans KR | `@fontsource-variable/noto-sans-kr` 5.3.0 (2026-07-19) | OFL-1.1 | 패키지 3.8 MB(unicode-range 분할) | 미측정(본고딕 계열, 전체 한글 지원으로 알려짐 — **미검증**) | 100–900 | 미측정 | fontsource 분할 제공 | 가장 무난하지만 라틴 폭이 넓고 UI에서 '기본값'처럼 보임. Pretendard가 같은 한글 뼈대에 Inter 라틴을 얹은 것이라 UI 쪽은 Pretendard가 우세 |

판단 근거: Pretendard와 Wanted Sans만 11,172자 전체를 담는다. Wanted Sans는 wght 하한이 400이라 캡션에 300 굵기를 쓸 수 없다. SUIT는 2,668자라 동적 장소명·주소에서 글리프 폴백이 섞인다. 따라서 **Pretendard**.

### 서울서체(서울한강체·남산체)는 쓰지 않는다
- 서울시 공식 다운로드 페이지: "서울서체는 누구나 무료로 다운로드 받아 자유롭게 사용 가능합니다", 판매·유상양도·무단배포 금지, **공공누리 제1유형(출처표시)** 표시, 웹폰트 임베딩·변형 여부는 언급 없음 — [서울시 서울서체](https://www.seoul.go.kr/seoul/font.do). 반면 문화분야 안내 페이지는 **제4유형(출처표시·상업적 이용금지·변경금지)**으로 표기 — [서울시 문화 페이지](https://news.seoul.go.kr/culture/archives/529602). **두 공식 페이지가 상충**하므로, 웹폰트 서브셋(=변형)·임베딩의 허용 여부가 불명확하다. 또한 한강체·남산체는 상징형(한옥·기와 곡선) 디스플레이 서체로 UI 본문 가독성 목적이 아니다(같은 페이지의 설명). → 로고타입·히어로 한 줄 정도의 **장식 실험**은 가능하나 본 제안에서는 제외하고 Pretendard 단일 패밀리로 간다.

### 로딩 전략 (Next.js 16, Docker standalone)

**권장 A — npm 패키지의 dynamic-subset CSS를 번들러로 셀프호스팅** (CDN 없음, 필요한 조각만 로드)

```ts
// app/layout.tsx
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'; // 92개 @font-face, swap, 45–920
import './globals.css';
```

```css
/* app/globals.css — CLS 완화용 폴백(측정 메트릭: hhea ascent 1950 / descent 494 / UPM 2048 → 95.2% / 24.1%) */
@font-face {
  font-family: 'Pretendard Fallback';
  src: local('Apple SD Gothic Neo'), local('Malgun Gothic'), local('Noto Sans CJK KR'), local('Noto Sans KR');
  ascent-override: 95.2%; descent-override: 24.1%; line-gap-override: 0%;
}
```

- 근거·주의: CSS 안의 `url(./woff2-dynamic-subset/…)`가 상대 경로이므로 번들러가 자산으로 내보낸다(Next 전역 CSS는 `app/layout.tsx`에서 import 가능). 이 리포에서 빌드해 `.next/static/media`에 조각이 생성되는지는 **아직 검증하지 않았다**(구현 시 1회 확인). Docker standalone은 `public`과 `.next/static`을 `standalone/`에 **직접 복사**해야 한다 — [Next.js output 문서](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) ("`cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`").
- 효과 **[측정]**: 서울핏 소스의 한국어 UI 문구(`src/shared/i18n/messages.ts` + 소스 내 한글 문자열, 고유 음절 443자)는 92조각 중 18조각 ≈ 482 kB만 요구. 장소명 등 동적 텍스트는 등장 시 추가 조각(12~18 kB)만 더 받는다.
- 단점: `next/font`의 자동 preload·폴백 메트릭 생성이 적용되지 않는다 → 위 수동 폴백 `@font-face`로 보완. (next/font/local의 `declarations`는 패밀리 전체에 적용되므로 92개 unicode-range 조각을 next/font로 표현할 수 없다 — [next/font 문서](https://nextjs.org/docs/app/api-reference/components/font) `declarations`/`src` 정의로부터의 추론.)

**대안 B — `next/font/local` + 가변 파일 1개** (가장 단순, Next가 preload·폴백 처리; 첫 로드 2.06 MB)

```ts
// src/shared/styles/fonts.ts
import localFont from 'next/font/local';
export const pretendard = localFont({
  src: '../../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2', // 또는 public 외부에 vendoring
  weight: '45 920',
  display: 'swap',
  variable: '--font-pretendard',
  fallback: ['Apple SD Gothic Neo', 'Malgun Gothic', 'system-ui'],
  adjustFontFallback: false, // 자동 폴백은 'Arial' 기준이라 한글에 의미 없음 → 위 수동 폴백 사용
});
// app/layout.tsx: <html lang="ko" className={pretendard.variable}> ; globals.css: --font-sans: var(--font-pretendard), 'Pretendard Fallback', …
```
- 근거: `next/font/local`은 `src`·`weight: '100 900'` 형태의 가변 범위·`variable`·`display`(기본 `swap`)·`preload`(기본 true)·`adjustFontFallback`('Arial'|'Times New Roman'|false)를 지원하고 Tailwind v3는 `fontFamily: { sans: ['var(--font-…)'] }`로 연결 — [Next.js Font 문서(v16.4.0, 2026-09-24)](https://nextjs.org/docs/app/api-reference/components/font). Pretendard README의 Next 예시도 `weight: '45 920'`을 쓴다 — [Pretendard README](https://github.com/orioncactus/pretendard).
- 트레이드오프 **[측정]**: 전체 한글 유지 서브셋(라틴+기호+11,172자)은 1,801,876 B로 원본 대비 12%만 줄어 의미가 적고, UI 문자만 서브셋하면 183,196 B지만 동적 장소명에서 폴백이 섞이므로 **기각**.

선택: **A 권장**, 빌드 검증에서 자산 내보내기가 실패하면 B.

### 숫자·모노
- Pretendard GSUB에 `tnum`이 있으므로 시간·거리·개수는 `tabular-nums`(Tailwind)만으로 정렬된다 **[측정]**. 별도 모노 폰트는 ID·좌표·디버그 외 불필요 → 시스템 `ui-monospace` 스택만 변수로 둔다(패키지 추가 없음).

### 스케일 (4-2 `fontSize` 참조)
display 28/36(데스크톱 32/40, -0.01em, 700) · title 20/28(700) · section 17/24(600) · body 15/22(400) · body-sm 14/20 · label 13/18(500) · caption 12/16. 굵기는 400/500/600/700 네 단계로 제한(KRDS는 약 4단계 권장 — [KRDS](https://www.krds.go.kr/html/site/style/style_03.html)). Pretendard x-height는 1086/2048≈0.53em, cap-height 1448/2048≈0.71em **[측정]**로 Inter와 같아 15px 본문이 KRDS 17px(Pretendard GOV가 작아 보여 17px 채택)보다 작아도 되지만, 본문 하한은 15px, 데이터 레이블 13px, 캡션 12px(메타 전용)로 둔다.

### Gaps
- 폰트 로딩 A안의 번들 결과(.next/static/media 생성)는 이 리포에서 빌드하지 않아 미검증.
- Noto Sans KR 글리프 수는 측정하지 않았다(fontsource 분할 파일 구조). Noto CJK 저장소 랜딩/Sans README에도 수치가 없었다 — [noto-cjk](https://github.com/notofonts/noto-cjk).

---

## 6) 카테고리 색·아이콘·마커 해부도

### Takeaway
9개 카테고리를 색상각·명도 계층으로 나누고, **아이콘 글리프를 항상 동반**한다. 9개 색상은 어떤 조합으로도 색각이상(CVD)에서 완전히 분리되지 않는다 — 216개 조합을 maximin으로 탐색해도 최약 쌍 ΔE76≈10.7이 상한이었다 **[측정, Machado 2009 severity 1.0 시뮬레이션]**. 따라서 색은 보조 신호이고 아이콘·라벨·클러스터 숫자가 1차 신호다.

### Cited Findings
- Apple HIG Maps: 기본 마커는 "red tint + white pin icon"이며 틴트·아이콘(문자 2~3자 또는 이미지)을 앱 색 체계에 맞춰 바꾸고, 겹치는 POI는 **클러스터링**하며, 선택 요소는 "outline and color variation"으로 분명히 표시 — [Apple HIG Maps](https://developer.apple.com/design/human-interface-guidelines/maps).
- WCAG 2.2 SC 2.5.8(AA): 포인터 타깃 최소 **24×24 CSS px**, 예외는 Spacing(24px 원이 다른 타깃과 겹치지 않음)/Equivalent/Inline/User agent/Essential — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Kakao `CustomOverlay`: `xAnchor`/`yAnchor`(0~1, 기본 0.5), `clickable: true`면 콘텐츠 클릭 시 지도 이벤트 차단; `MarkerClusterer`: `gridSize`(기본 60px), `averageCenter`, `minLevel`, `styles` 배열(calculator 구간별 스타일), `clickable`; `MapTypeId`: ROADMAP·SKYVIEW·HYBRID·ROADVIEW·OVERLAY·TRAFFIC·TERRAIN·BICYCLE·BICYCLE_HYBRID("스카이뷰를 위한 자전거(어두운 지도에서 활용)")·USE_DISTRICT — [Kakao Maps JS API 문서](https://apis.map.kakao.com/web/documentation/) **[로컬 curl 후 텍스트 추출로 확인]**.
- 현재 코드의 마커/배지 색은 Tailwind 기본 hex 하드코딩(`facility.tsx:122-142`, `marker-factory.ts:39,96-102`) **[측정]**.
- lucide-react 0.525.0에 다음 아이콘이 선언돼 있음 **[측정, d.ts grep]**: `Trees`, `TreePine`, `Library`, `BookOpen`, `Palette`, `Theater`, `Drama`, `Ticket`, `CalendarDays`, `PartyPopper`, `Snowflake`, `ThermometerSnowflake`, `Fan`, `UtensilsCrossed`, `Utensils`, `Dumbbell`, `Bike`, `TrainFront`, `Landmark`, `LocateFixed`, `Navigation2`, `Umbrella`, `Building2`, `Sparkles`. `Train`은 `declare const`로는 없고(alias 가능성) `TrainFront`를 쓴다.

### 카테고리 표 (채움은 라이트/다크 공통 — 지도 타일이 라이트이므로)

| 카테고리(코드) | 채움 HSL → hex | 글리프색 (대비 **[측정]**) | 채움 vs 라이트 타일(#F2F2EE 근사) | 텍스트(흰 바탕) hex/대비 | 텍스트(다크 카드 #181D25) hex/대비 | lucide | 비고 |
|---|---|---|---|---|---|---|---|
| 공원 `park` | 152 62% 33% → `#208858` | 흰색 4.45 | 3.96 | `#116940` 6.73 | `#87D4B0` 9.73 | `Trees` | 남산초록 계열 |
| 도서관 `library` | 252 62% 56% → `#6549D4` | 흰색 6.07 | 5.41 | `#231169` 15.49 | `#9687D4` 5.41 | `Library` | primary(207)와 색상각 분리 |
| 문화공간 `culture` | 292 60% 44% → `#A22DB4` | 흰색 5.88 | 5.24 | `#5D1268` 11.99 | `#C889D2` 6.42 | `Theater` | |
| 문화행사 `cultural_event` | 345 88% 50% → `#F00F47` | 흰색 4.32 | 3.85 | `#79011F` 11.43 | `#E97290` 5.86 | `CalendarDays` | 스카이코랄 계열(라이브) |
| (코드상 10번째) 문화예약 `cultural_reservation` | 문화행사와 동일 채움 | — | — | — | — | `Ticket` | 색은 공유, 아이콘으로 구분 |
| 무더위쉼터 `cooling_shelter` | 196 90% 40% → `#0A91C2` | 흰색 3.59 | 3.20 | `#005A7A` 7.65 | `#70CAEB` 9.13 | `Snowflake` | primary보다 초록 쪽·밝음 |
| 음식점 `restaurant` | 22 92% 48% → `#EB5C0A` | 흰색 3.46 | 3.08 | `#7A2D00` 9.53 | `#EC9D6F` 7.75 | `UtensilsCrossed` | |
| 체육시설 `sports` | 43 100% 48% → `#F5AF00` | **잉크 `#0F1623`** 9.50 | 1.70(→ 흰 링+헤어라인+그림자로 경계 확보) | `#996E00` 4.58 | `#F3CB68` 10.92 | `Dumbbell` | 명도 계층 '밝음' |
| 따릉이 `bike` | 84 72% 38% → `#6FA71B` | **잉크** 6.23 | 2.59(동일 보완) | `#476F0B` 5.92 | `#B7DC7F` 10.92 | `Bike` | |
| 지하철 `subway` | 222 22% 36% → `#485470` | 흰색 7.56 | 6.74 | `#2A3551` 12.16 | `#8DA0CE` 6.49 | `TrainFront` | 노선 배지는 기존 `subway-colors.ts` 노선색 유지 |

글리프 대비 3.46~3.59(무더위쉼터·음식점)는 아이콘(비텍스트 UI)에 적용되는 3:1 기준(WCAG 1.4.11)은 넘지만 텍스트 4.5:1은 아니므로 마커 안에 **글자를 넣지 않는다**(라벨은 마커 밖 흰 칩에).

### CVD 검산 결과 **[측정]** (최약 쌍, ΔE76 CIELAB; 낮을수록 혼동)
- 정상: 도서관/문화공간 27 · 무더위쉼터/지하철 32
- Protan: 체육/따릉이 12 · 도서관/문화공간 14
- Deutan: 음식점/따릉이 11 · 무더위쉼터/지하철 19
- Tritan: 공원/무더위쉼터 13 · 문화행사/음식점 ~10
→ 대응: (1) 모든 마커에 글리프 필수, (2) 체육·따릉이는 잉크 글리프(다른 7개는 흰 글리프)로 전경 극성이 다름, (3) 목록·칩에는 항상 텍스트 라벨, (4) 사용자 설정에 "마커 색 대신 글리프만(단색 마커)" 토글을 두면 CVD 사용자에게 가장 확실하다(추론).

### 마커 해부도 (CustomOverlay DOM, 사이즈는 CSS px)

| 상태 | 형태·크기 | 레이어(안→밖) | 비고 |
|---|---|---|---|
| 기본(default) | 원형 28×28, 글리프 14 | 채움(카테고리) → 2px 흰 링 → 1px 헤어라인 `hsl(var(--marker-ink)/0.18)` → `shadow-marker` | 터치 타깃은 래퍼 44×44(투명 패딩, `clickable: true`), 앵커 `xAnchor .5 / yAnchor .5`(원형이므로 중심 고정) |
| hover(데스크톱, `@media (hover:hover)`) | scale 1.08, `shadow-float-md`, z-index 상승 | | 120ms `--ease-standard`. 터치 기기에는 hover 없음 |
| 선택(selected) | 원형 36×36, 글리프 18 | 채움 → 3px 흰 링 → 2px `--primary` 외곽 링 → `shadow-float-lg` | 150ms `--ease-enter`로 확대; 아래쪽에 **이름 라벨 칩**(surface-elevated, 12px 500, radius sm, `shadow-float-sm`, 최대 160px, 1줄 말줄임) |
| 비활성(필터 제외·낮은 점수) | 기본 크기, 채움 `--muted`, 글리프 `--muted-foreground`, 링 유지 | | 색만으로 구분하지 않도록 목록에도 '제외' 라벨 |
| 클러스터(cluster) | 원형 36/44/52 (건수 <10 / <100 / ≥100) | 채움 `--surface-elevated` → 2px `--primary` 링 → 6px `--primary/0.15` 헤일로 → `shadow-float-md`; 숫자 13/14/15px 600 `tabular-nums` 잉크 | 같은 카테고리만 담겼으면 링을 그 카테고리 색으로. Kakao `MarkerClusterer({ gridSize: 60, averageCenter: true, minLevel: 5, styles: [...] })`의 `styles` 배열(width/height/background/border/borderRadius/color/textAlign/lineHeight)로 3단계 지정 |
| 현재 위치(current location) | 점 16×16 `--primary` + 3px 흰 링 + `shadow-marker`; 헤일로 40×40 `--primary/0.25` `animate-loc-pulse` | | reduced-motion에서는 헤일로 정지(고정 1.4배, 0.2 불투명). 방향 콘은 선택 |
| 혼잡도 오버레이(기존 `marker-crowd-*`) | 링 색을 `--success/--warning/--destructive`로 교체, 애니메이션 `pulse-warning`은 제거하고 배지 텍스트로 전달 | | 현재 `#10b981/#f59e0b/#ef4444` 하드코딩 대체 |

### Gaps
- 따릉이 공식 브랜드색은 확인하지 않았다(미확인). 위 lime은 '자전거=연두'라는 통념 기반 **[추정]**.
- CVD 시뮬레이션은 Machado et al. 2009 행렬(severity 1.0)을 로컬 스크립트에 옮겨 계산한 근사치다. 실제 사용자 검증은 아니다.

---

## 7) 표면·엘리베이션·헤더·다크맵 규칙

### Takeaway
텍스트가 있는 표면(카드·시트·목록)은 **solid**, 지도 위 컨트롤 층(헤더 띠·칩 행·pill)만 **글라스(backdrop-blur 12px + 84% 불투명)**. 모든 부유 표면은 1px 테두리 + 그림자 2단을 함께 쓴다(라이트 타일 위에서 그림자만으로는 경계가 약하고, 다크에서는 그림자가 사라지기 때문). 다크 모드는 **라이트 지도 + 다크 UI**가 기본이다.

### Cited Findings
- Apple HIG Materials: "Thicker materials, which are more opaque, can provide better contrast for text and other elements with fine features."; "Use the regular variant when background content might create legibility issues, or when components have a significant amount of text…"; "Use Liquid Glass effects sparingly … Limit these effects to the most important functional elements"; Liquid Glass는 "controls and navigation elements — like tab bars and sidebars — that floats above the content layer"; 밝은 배경 위 clear 변형에는 "dark dimming layer of 35% opacity" 고려 — [Apple HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials).
- Apple HIG Sheets: iOS 시트는 modal/nonmodal, "Sheets resize according to their detents… large … medium is about half", "Include a grabber in a resizable sheet", grabber는 VoiceOver로도 크기 조절, "Support swiping to dismiss", macOS 시트는 "cardlike view with rounded corners"(값 없음) — [Apple HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets).
- Apple HIG Maps: "Make sure there's enough contrast between custom controls and the map… thin stroke or light drop shadow"; 로고·법적 링크를 "temporarily" 가리는 것은 괜찮지만 항상 가리지 말 것; "Keep the location on your map visible when displaying a place card" — [Apple HIG Maps](https://developer.apple.com/design/human-interface-guidelines/maps).
- Kakao 공식 답변(2026-09-21, 지도팀 'Map' 계정): "현재 SDK 내 다크모드 지원은 하고 있지 않으며" 권장 우회안도 제시 불가 — [devtalk 151789](https://devtalk.kakao.com/t/sdk-v2-mapstyle/151789) (모바일 SDK v2 질문이지만 웹 JS SDK 문서에도 스타일/테마 옵션이 없음 **[문서 전문 grep 측정]**). 같은 포럼에 "CSS invert로 다크모드를 만들면 카카오 로고가 흰색이 되는데 문제가 되나"(2026-05-19)·"밝기 90%는 괜찮나" 질문이 **미답변** — [devtalk 149793](https://devtalk.kakao.com/t/api-css-invert/149793). 2021·2023년 같은 질문도 미지원 — [devtalk 검색](https://devtalk.kakao.com/search.json?q=%EC%A7%80%EB%8F%84%20%EB%8B%A4%ED%81%AC%EB%AA%A8%EB%93%9C).
- Kakao JS 문서: `kakao.maps.Tileset(width, height, urlFunc, copyright, dark, minZoom, maxZoom)`의 `dark: 어두운 타일인지 여부` 옵션은 **사용자 정의 타일셋**용이며, `MapTypeId.BICYCLE_HYBRID`는 "스카이뷰를 위한 자전거(어두운 지도에서 활용)"로 설명됨; `map.setCopyrightPosition(kakao.maps.CopyrightPosition.BOTTOMRIGHT, true)`로 저작권 표기·로고 위치를 바꿀 수 있음 — [Kakao Maps 문서](https://apis.map.kakao.com/web/documentation/).
- CSS 필터 다크맵 일반 기법: `invert(1) hue-rotate(180deg)`를 지도에 적용한 사례와, 컨테이너 전체에 걸면 마커·오버레이까지 반전되는 문제 — [Stamen 블로그](https://stamen.com/more-ways-to-make-your-maps-go-dark-mode/), [OpenLayers 필터 노트](https://notepad.onghu.com/2024/open-layers-greyscale-maps-more-with-css-filters/).

### 규칙
1. **반경 스케일**: sm 8(칩·배지) · md 10(버튼·입력) · lg 12(카드·목록 행) · xl 16(바텀시트 상단·다이얼로그) · 2xl 24/full(검색 pill 48px 높이) — Airbnb 검색 pill·Google 다이얼로그(~20px) 관찰 **[추정]**에 맞춘 범위.
2. **그림자 스케일**: `float-sm`(칩·pill) / `float-md`(카드·클러스터·hover) / `float-lg`(바텀시트·선택 마커·다이얼로그). 라이트는 잉크 6~16%, 다크는 50~65%(4-1 값). 다크에서는 항상 `border-border` 동반.
3. **글라스 vs solid**: 글라스는 `bg-surface-glass/85 backdrop-blur-md border-b border-border`로 헤더 띠·칩 행에만. 지원 안 되는 환경은 `@supports not (backdrop-filter: blur(1px))`에서 `bg-surface-glass/96`. 카드·시트·목록·토스트·다이얼로그·마커 라벨은 solid `bg-card`/`bg-surface-elevated`.
4. **헤더**: 모바일 = 지도 위 글라스 띠(높이 56) 안에 흰 solid 검색 pill(48, `shadow-float-md`, 좌 로고 아이콘, 우 알림/메뉴) + 바로 아래 가로 스크롤 칩 행(프리셋 6개, 선택은 `bg-accent text-accent-foreground border-primary/40`, 비선택은 `bg-surface-elevated border-border`). 데스크톱 = 좌측 solid 패널 400px(`bg-background`, 우측 `border-r`)에 검색·서울 지금·칩·목록을 세로로 두고 지도는 전면; 헤더는 패널 상단으로 흡수(Naver/Kakao/Google 데스크톱 관찰).
5. **바텀시트(모바일)**: detent 3단 — peek 112px(그래버 + '서울 지금' 한 줄 + 칩), half 50vh, full 92vh. 그래버 36×4 `bg-muted-foreground/40`, 상단 radius xl, `bg-card shadow-float-lg border-t`. 시트 뒤 scrim은 full일 때만 `bg-scrim/40`. 그래버는 버튼(`aria-label="시트 크기 조절"`)으로 키보드·스크린리더 조작 가능하게. 선택 마커가 시트에 가리지 않도록 지도 `panTo`에 시트 높이 오프셋 적용(HIG "keep the location visible").
6. **Kakao 저작권·로고**: 시트가 하단을 덮으므로 `setCopyrightPosition(BOTTOMRIGHT, true)`로 우하단 이동 + 시트 peek 높이만큼 지도 컨테이너 하단 패딩. 로고를 영구히 가리거나 필터로 변색시키지 않는다.
7. **다크 모드 지도**: 기본 = **라이트 타일 유지 + 다크 UI**(공식 미지원 근거). 선택 실험 플래그 `data-map-dim="1"`에서만 **타일 레이어 한정** `filter: brightness(0.78) contrast(1.05) saturate(0.7)`(반전 금지, 라벨 가독성 유지)을 적용하되, Kakao DOM 구조가 문서화되지 않아 selector가 깨질 수 있고 로고 변색 정책이 미답변이므로 **운영 기본값으로 쓰지 않는다**. 커스텀 다크 타일셋(`Tileset(dark=true)`)은 카카오 베이스맵을 대체하는 것이라 라이선스·표기 문제로 **비권장**.
8. **지도 위 상태 레이블**(서울 지금): 수치는 `tabular-nums`, 상태 단어(좋음/보통/나쁨)는 색 + 텍스트 + 아이콘 3중, soft 배지(`bg-success-soft text-success-soft-foreground`).

### Gaps
- Kakao 지도 컨테이너 내부 타일 레이어의 DOM/클래스는 문서에 없어 필터 selector는 **미확인**(구현 시 DOM 검사 필요).
- Kakao의 로고·출처 표기 삭제 금지 조항 원문은 공식 정책 페이지에서 찾지 못했다(포럼 Q&A만 존재) — **미확인**. 보수적으로 "가리지·변색하지 않음"으로 설계.

---

## 8) 모션 규칙

### Takeaway
CSS transition/animation만으로 구현하고(새 라이브러리 없음), 길이·곡선은 Material 3 모션 토큰을, 원칙은 Apple HIG(짧고 정확, 빈번한 상호작용엔 모션 금지, 취소 가능, Reduce Motion 시 이동→페이드)를 따른다. Airbnb/M3 Expressive식 스프링 오버슈트는 라이브러리가 필요하므로 채택하지 않는다.

### Cited Findings
- M3 모션 토큰(material-web `tokens/versions/v0_192/_md-sys-motion.scss`): duration short1~4 = 50/100/150/200ms, medium1~4 = 250/300/350/400ms, long1~4 = 450/500/550/600ms, extra-long1~4 = 700/800/900/1000ms; easing standard `cubic-bezier(0.2,0,0,1)`, standard-accelerate `(0.3,0,1,1)`, standard-decelerate `(0,0,0,1)`, emphasized-decelerate `(0.05,0.7,0.1,1)`, emphasized-accelerate `(0.3,0,0.8,0.15)`, linear, legacy `(0.4,0,0.2,1)` — [material-web 토큰 파일](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-motion.scss).
- Apple HIG Motion: "Add motion purposefully… Don't add motion for the sake of adding motion"; "Aim for brevity and precision in feedback animations"; "In apps, generally avoid adding motion to UI interactions that occur frequently"; "Let people cancel motion… don't make people wait for an animation to complete" — [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion).
- Apple HIG Accessibility(Reduce Motion 시): "Tightening animation springs to reduce bounce effects / Tracking animations directly with people's gestures / Avoiding animating depth changes in z-axis layers / Replacing transitions in x-, y-, and z-axes with fades / Avoiding animating into and out of blurs" — [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Airbnb 2025 redesign: "softer, rounder shapes, smooth animated interface… 'Fun, alive, and simple'", 사내 팀이 3D·일러스트 제작(VP Design Teo Connor) — [It's Nice That](https://www.itsnicethat.com/articles/airbnb-app-redesign-140525). M3 Expressive의 스프링 수치(stiffness/damping)는 서드파티 자료만 발견돼 **미검증**.
- 현재 `globals.css`는 `prefers-reduced-motion: reduce`에서 모든 animation/transition을 0.01ms로 강제하고, `styles/marker-animations.css`에 bounce/pulse/shake/pulse-warning 키프레임이 있다 **[측정]**.

### 규칙 (CSS 변수 4-1 참조)

| 대상 | 길이 | 곡선 | 속성 | reduced-motion |
|---|---|---|---|---|
| 바텀시트 열기 | 300ms (`--dur-sheet`, M3 medium2) | `--ease-enter` (emphasized-decelerate) | `transform: translateY` | 페이드 180ms로 대체 |
| 바텀시트 닫기 | 200ms (short4) | `--ease-exit` (emphasized-accelerate) | translateY | 페이드 120ms |
| 시트 드래그 중 | 0 (손가락 추적, transition 없음) | — | translateY | 동일 |
| 시트 detent 스냅(release) | 220ms | `--ease-standard` | translateY | 즉시 스냅 |
| 마커 선택/해제 | 150ms / 120ms | enter / exit | `transform: scale`, 링 `opacity` | scale 없이 링·그림자만 즉시 |
| 마커 hover | 120ms (`--dur-fast`) | standard | scale 1.08, box-shadow | 변화 없음 |
| 칩 토글 | 120ms | standard | background-color, color, border-color (scale 금지 — 빈번한 상호작용) | 동일(색 전환은 허용) |
| 목록 항목 진입(첫 렌더·프리셋 전환 시에만) | 180ms, stagger 30ms × 최대 8개 | enter | opacity + translateY(6px) (`animate-fade-up`) | opacity만 |
| 다이얼로그/팝오버 | 200ms / 150ms | enter / exit | opacity + scale(0.98→1) (Radix `data-state` + tw-animate-css) | opacity만 |
| 현재 위치 헤일로 | 2s 무한 | ease-out | scale 1→2.6, opacity .35→0 | 정지(고정 헤일로) |
| 토스트 | 200ms / 150ms | enter / exit | translateY(8px)+opacity | opacity만 |
| 지도 panTo(선택 시) | Kakao 기본 애니메이션(`panTo`) | — | — | `setCenter`로 즉시 이동 |

- 제거: `marker-bounce`, `marker-shake`, `pulse-warning`(혼잡 경고 무한 펄스) — 데이터 상태를 흔들림으로 전달하지 않고 배지 텍스트로 전달(HIG "frequent interactions"·"gratuitous" 원칙).
- 구현: Tailwind `motion-safe:`/`motion-reduce:` 변형 + 4-2 `keyframes/animation`. 현재 전역 0.01ms 강제는 유지하되, 페이드 대체가 필요한 곳은 `motion-reduce:animate-none motion-reduce:transition-opacity`로 개별 지정(전역 규칙이 opacity 전환까지 죽이므로 `.motion-keep-fade { transition-duration: 150ms !important }` 예외 클래스를 둔다).
- 라이브러리: 스프링·제스처 물리(오버슈트, rubber-band)가 필요해지면 `framer-motion` 같은 추가 의존성이 필요하다 → 현 범위에서는 **불필요**.

---

## 9) 한국어 타이포그래피 체크리스트

근거: `word-break: keep-all` = "Word breaks should not be used for Chinese/Japanese/Korean (CJK) text. Non-CJK text behavior is the same as for `normal`" — [MDN word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break). KRDS: 본문 최소 16px(Pretendard GOV는 17px), 행간 150% 이상(상대 단위), 자간 본문 0px·대형 제목 1px, 굵기 약 4단계(400/500/700), 13px 이하는 가독성 저하 경고, 다크 본문 15:1 권고(KRDS 자체 기준) — [KRDS 타이포그래피](https://www.krds.go.kr/html/site/style/style_03.html). Pretendard 메트릭·기능은 5절 측정값.

- [ ] `body { word-break: keep-all; overflow-wrap: anywhere; }` — 한글 어절 단위 줄바꿈 + 긴 URL/영문 토큰은 강제 분리. 장소명·주소 카드에서 어절 중간 분리가 없는지 390px에서 확인.
- [ ] 행간: 본문 1.47~1.5(15/22, 16/24), 목록 보조 1.43(14/20), 캡션 1.33(12/16), 제목 1.3~1.4. KRDS 150%를 본문 기준으로 두되 UI 밀도가 필요한 곳은 1.4 이상 유지.
- [ ] 자간: 본문·레이블 0. 24px 이상 제목만 -0.01em(라틴 기반 Pretendard 디스플레이 보정). 숫자 라벨에 음수 자간 금지.
- [ ] 숫자: 시간·거리·대수·점수는 `tabular-nums`(Pretendard `tnum` 실측 확인). 단위는 숫자와 띄어쓰기 없이 한국어 관례(`1.2km`, `3분`, `17°`), 범위는 `~`.
- [ ] 최소 크기(모바일): 본문 15px, 터치 가능한 레이블 13px, 메타 12px(색은 `muted-foreground` 5:1 이상 확인). 12px 미만 금지.
- [ ] 굵기: 400/500/600/700만 사용. 가변 폰트라도 5단계 이상 섞지 않음. 이탤릭 금지(Pretendard에 이탤릭 없음 → 합성 기울임 방지, `font-style: normal` 강제).
- [ ] 혼합 ko/en: 같은 패밀리(Pretendard 라틴 포함)로 처리. `<html lang>`은 현재 로케일(ko/en)에 맞춰 바꾸고 `/places` 공개 페이지도 동일. 영문 UI에서 `text-transform: uppercase`는 라벨에만.
- [ ] 폴백: `'Pretendard Fallback'`(ascent 95.2% / descent 24.1% override) → Apple SD Gothic Neo / Malgun Gothic / Noto Sans KR 순. 희귀 음절·한자는 Pretendard 11,172자로 대부분 커버, 한자는 시스템 폴백 허용.
- [ ] 말줄임: 장소명 2줄 `line-clamp-2`, 주소 1줄; 긴 영문 시설명(예: "Seoul Metropolitan Library")은 `overflow-wrap: anywhere`로 넘침 0.
- [ ] 문장부호·구분자: 메타는 ` · ` 가운뎃점, 괄호는 반각, 날짜는 `10.11 (토) 14:00`.
- [ ] 제목 균형: `text-wrap: balance`를 제목에 점진적 적용(미지원 브라우저는 무시됨; 지원 범위는 이번에 확인하지 않음).
- [ ] 다크 모드: 본문 `foreground` 16.58:1, `muted-foreground` 7.38:1(카드) — KRDS 15:1 권고를 본문만 충족, 보조 텍스트는 WCAG AA 기준으로 운용.
- [ ] 검증 데이터: 실제 긴 이름("서울특별시교육청 어린이도서관"), 긴 주소, 숫자 밀집("따릉이 12대 · 350m · 4분"), 영문 모드 동일 화면을 390/1280에서 캡처.

---

## 10) 출처 목록 (실제로 본 것·방식)

### 로컬 파일(읽기만)
- `/home/lsh/.claude/skills/design-reference/SKILL.md`, `references/catalog.md`, `references/decision-record.md` — 형식·절차.
- `/home/lsh/dev/devkit/dev-standard/knowledge/product-experience-patterns.md` — 설명 과잉 대신 비교 구조 우선 원칙.
- `/home/lsh/dev/side/seoul-fit-fe/app/globals.css`, `tailwind.config.js`, `components.json`, `app/layout.tsx`, `package.json`, `lib/types/facility.ts`, `styles/marker-animations.css`, `src/shared/lib/icons/facility.tsx`, `src/features/map-markers/lib/marker-factory.ts`, `src/shared/api/congestion.ts`, `src/shared/lib/icons/subway-colors.ts`, `src/shared/lib/hooks/useKakaoMap.ts`, `src/widgets/header/ui/Header.tsx`, `src/shared/i18n/messages.ts`, `node_modules/lucide-react/dist/lucide-react.d.ts`.

### 웹 — 텍스트로 확인(WebFetch)
- Pretendard: [README](https://github.com/orioncactus/pretendard), [Releases](https://github.com/orioncactus/pretendard/releases) (v1.3.9; CDN·dynamic subset 경로; Next 예시 `weight: '45 920'`).
- Wanted Sans: [README](https://github.com/wanteddev/wanted-sans), [웹폰트 가이드](https://github.com/wanteddev/wanted-sans/blob/main/packages/wanted-sans/documentation/webfonts/README.md).
- SUIT: [README](https://github.com/sun-typeface/SUIT) (`@sun-typeface/suit`, OFL-1.1).
- Noto Sans KR: [fontsource](https://fontsource.org/fonts/noto-sans-kr), [noto-cjk](https://github.com/notofonts/noto-cjk), [Sans README](https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/README.md) (수치 없음).
- Next.js: [Font 모듈(v16.4.0, 2026-09-24)](https://nextjs.org/docs/app/api-reference/components/font), [output: standalone(2026-09-18)](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
- shadcn/ui: [Theming](https://ui.shadcn.com/docs/theming), [Tailwind v4 가이드](https://ui.shadcn.com/docs/tailwind-v4), [v3.shadcn.com Theming](https://v3.shadcn.com/docs/theming) (현재 OKLCH 내용으로 표시됨).
- Tailwind v3: [font-variant-numeric](https://v3.tailwindcss.com/docs/font-variant-numeric).
- Apple HIG(JSON 데이터 엔드포인트로 본문 확보): [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Maps](https://developer.apple.com/design/human-interface-guidelines/maps), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Material 3: [material-web 모션 토큰 scss](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-motion.scss) (m3.material.io 페이지는 JS 렌더링으로 본문 미확보; Expressive 스프링 수치는 서드파티만 → 미검증).
- Seoul: [서울서체 다운로드(공공누리 1유형, 2026-02-23 수정)](https://www.seoul.go.kr/seoul/font.do), [문화분야 서울서체(공공누리 4유형 표기)](https://news.seoul.go.kr/culture/archives/529602), [올해의 서울색·서울빛(sRGB 값, 2008 10색 코드)](https://www.seoul.go.kr/seoul/color.do), [2024 스카이코랄 보도](https://mediahub.seoul.go.kr/archives/2009683).
- Toss: [브랜드 사이트(Toss Blue #0064FF, Toss Gray #202632)](https://brand.toss.im/). TDS 토큰은 서드파티 갤러리만 존재 → 미검증.
- Airbnb: [Newsroom 2025 Summer Release](https://news.airbnb.com/product-releases/airbnb-2025-summer-release/), [It's Nice That 인터뷰](https://www.itsnicethat.com/articles/airbnb-app-redesign-140525).
- Kakao: [JS API 문서(curl 후 텍스트 추출)](https://apis.map.kakao.com/web/documentation/), [가이드](https://apis.map.kakao.com/web/guide/), [devtalk 151789 공식 답변 JSON](https://devtalk.kakao.com/t/151789.json), [devtalk 검색 JSON](https://devtalk.kakao.com/search.json?q=%EC%A7%80%EB%8F%84%20%EB%8B%A4%ED%81%AC%EB%AA%A8%EB%93%9C), [devtalk 149793](https://devtalk.kakao.com/t/api-css-invert/149793).
- W3C: [WCAG 2.2 Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). MDN: [word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break). KRDS: [타이포그래피](https://www.krds.go.kr/html/site/style/style_03.html).
- 다크맵 CSS 필터 일반 기법: [Stamen](https://stamen.com/more-ways-to-make-your-maps-go-dark-mode/), [OpenLayers 노트](https://notepad.onghu.com/2024/open-layers-greyscale-maps-more-with-css-filters/).

### 웹 — 화면으로 확인(headless Chromium 153 CLI 스크린샷, 2026-10-11; 파일: 스크래치패드 `shots/`)
- `seoulfit_m390.png`, `seoulfit_d1280.png` — https://seoulfit.damecasol.com (로그인 없음).
- `kakaomap_d1280.png` — https://map.kakao.com ; `kakaomap_m390.png` — https://m.map.kakao.com **403 차단**.
- `navermap_d1280.png` — https://map.naver.com/p ; `navermap_m390.png` — https://m.map.naver.com.
- `gmaps_d1280.png` — https://www.google.com/maps/@37.5665,126.978,14z?hl=ko ; `gmaps_m390.png` — 동일 URL(앱 유도 interstitial만).
- `citymapper_d1280.png` — https://citymapper.com/seoul ; `komoot_d1280.png` — https://www.komoot.com/discover (쿠키 오버레이로 부분) ; `alltrails_d1280.png`/`alltrails_m390.png` — https://www.alltrails.com/explore **차단**.
- `shots/airbnb_dl/*.jpg` — Airbnb Newsroom 본문 이미지 4장 다운로드 후 열람.

### 로컬 측정(스크립트: 스크래치패드 `scripts/`)
- `npm view`/`npm pack --dry-run`: 패키지 버전·갱신일·파일 크기. `fontinfo.py`(fontTools 4.61.1): 글리프·한글 음절 수·wght 축·메트릭·GSUB 기능. `chunks.py`: dynamic-subset 조각 필요량. `fontTools.subset`: 서브셋 크기. `palette.py/palette2.py/palette3.py`: HSL→hex, WCAG 대비, Machado 2009 CVD 시뮬레이션·maximin 탐색.

### 미확인·접근 불가 요약
Kakao Map 모바일 웹(403), AllTrails(차단), Apple Maps 앱 화면, Mobbin·Refero 등 갤러리 화면(로그인), Toss 앱 내부·TDS 토큰, Material 3 Expressive 스프링 수치, 2008 서울 10색의 RGB, 따릉이 브랜드색, Kakao 로고 변색 정책 원문, Kakao 타일 레이어 DOM selector, Pretendard CSS import 시 이 리포의 `.next/static/media` 생성 여부(빌드 미실행).
