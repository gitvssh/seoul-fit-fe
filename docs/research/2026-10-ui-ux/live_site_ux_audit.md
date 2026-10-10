# 서울핏(Seoul Fit) 라이브 사이트 UX·시각 결함 감사 노트

- 대상: https://seoulfit.damecasol.com (운영 배포, 단일 replica) — 관찰 일자 **2026-10-11**
- 방법: Python Playwright(Chromium headless, `is_mobile/has_touch` 에뮬레이션, locale ko-KR, timezone Asia/Seoul)로 6단계 스크립트 실행. 스크립트: `scratchpad/r1-scripts/audit1_first_impression.py` ~ `audit6_targeted.py`, 원시 측정값 JSON: `scratchpad/r1-scripts/out/phase{1..6}.json`, 이벤트 로그 `*-events.json`.
- 스크린샷 기준 경로: `/tmp/claude-1000/-home-lsh-dev-side-seoul-fit-fe/69479a0d-f406-429f-831b-de8fc4cf23fe/scratchpad/research_notes/서울핏 포트폴리오 디자인 개선/screenshots/` (아래에서는 `screenshots/파일명`으로 표기, 총 135장).
- 뷰포트: mobile 390×844, tablet 768×1024, desktop 1440×900 (DPR 1). 로그인·쓰기 작업은 하지 않음. 쿠키 동의 모달은 "모두 거부"로 닫은 뒤 관찰(클라이언트 측 동의 저장만 발생).
- headless 한계(명시): Kakao 지도 타일·마커는 정상 렌더됨(타일 15~73장, 마커 DOM 확인). 위치 권한은 기본 **거부** 상태(거부 시나리오 그대로 관찰). 모바일 핀치 줌은 에뮬레이션되지 않아 휠 줌이 동작하지 않음 → 모바일 줌아웃·클러스터 상태는 **미확인**. 첫 방문마다 Cloudflare Zaraz 쿠키 모달이 뜸(실사용자는 1회).
- 표기: "관찰"은 스크린샷·DOM 측정으로 확인한 사실, "추정"은 소스(`/home/lsh/dev/side/seoul-fit-fe`, 읽기 전용)로 유추한 원인, "미확인"은 도달하지 못한 항목.

---

## 1. 우선순위 결함 표 (P0 치명 → P3 사소)

| # | 심각도 | 화면/상태 (URL · 뷰포트) | 증상 (관찰) | 증거 스크린샷 | 추정 원인 / 관련 컴포넌트 | 제안 |
|---|---|---|---|---|---|---|
| 1 | **P0** | `/` 날씨·혼잡도 패널, "서울 지금" 카드, 상세 시트 (mobile·desktop) | `/api/weather`, `/api/congestion`이 **HTTP 502**. 날씨 패널 "연결 실패 / 날씨 정보를 불러올 수 없습니다", 혼잡도 패널 "연결 실패 / 혼잡도 정보를 불러올 수 없습니다", 탐색 패널 "이 위치의 실시간 도시데이터를 확인할 수 없어 일반 장소 정보로 추천합니다" + "기준 시각 미확인" 배지, 상세 시트 확장 영역에도 "혼잡도 정보를 불러올 수 없습니다 / 날씨 정보를 불러올 수 없습니다"가 그대로 노출. 콘솔 `날씨 API 호출 실패: 502 null`, `혼잡도 API 호출 실패: 502 null`(desktop 3회, mobile 2회) | `screenshots/desktop-weather-panel.png`, `screenshots/mobile-weather-panel.png`, `screenshots/desktop-congestion-panel.png`, `screenshots/mobile-congestion-panel.png`, `screenshots/desktop-facility-sheet-expanded-bottom.png`, `screenshots/desktop-home-after-consent.png` | 추정: 백엔드/프록시(`app/api/weather/route.ts`, `app/api/congestion/route.ts` → 서울시 도시데이터 API 또는 내부 서비스) 장애. 프런트는 실패 상태를 세 군데(패널·카드·시트)에 각기 다른 문구로 뿌림 | 백엔드 복구가 1순위. 프런트는 실패 시 "서울 지금" 카드를 숨기거나 1개의 일관된 오류·재시도 UI로 통일, 상세 시트에서 실패 섹션은 렌더하지 않기 |
| 2 | **P0** | `/` 헤더 검색 (mobile·desktop) | 검색 제안에 **지하철역·따릉이 대여소만** 등장. "도서관" → NL 옵션 + 따릉이 10건("349. 어린이도서관"…), 정확한 도서관명 "개봉도서관" → 장소 결과 0건(NL 옵션만), "서울도서관" → 따릉이 3건("447. 신영동삼거리"…), "한강공원" → 따릉이 3건, "책읽는 한강공원"(실제 행사명) → 0건. 초성 퍼지 매칭으로 "남산" → 낙성대역·별내역·다산역·구리역(경기도), "여의도" → 오이도역·시청.용인대역 | `screenshots/desktop-search-library-suggestions.png`, `screenshots/mobile-search-library-suggestions.png`, `screenshots/desktop-search-exact-library.png`, `screenshots/desktop-search-yeouido.png`, `screenshots/desktop-search-hangang-suggestions.png`, `screenshots/desktop-search-bike-suggestions.png` | 관찰: 서버 `/api/search/index`(총 30,204건, page0 20,000건 = 비압축 4.9MB; refTable: cooling_centers 8,184 · restaurants 6,432 · cultural_events 5,035 · libraries 216 · park 133)에는 "…도서관" 1,072건이 있음. 추정: `src/shared/lib/hooks/useSearchCache.ts`의 index 병합(`refTable/refId` 매핑, `getCategoryFromRefTable`) 단계에서 항목이 탈락하거나 로드 실패 — 코드상 병합 의도는 있으나 제안에 전혀 나타나지 않음(정확 원인 미확인). 초성 매칭(`getMatchScore` 50/40점)이 무관한 역을 끌어옴 | index 병합 실패 원인 디버깅, 카테고리별 섹션/우선순위(장소명 정확 일치 > 부분 일치 > 초성), 서울 밖 역 제외, 결과에 카테고리 라벨 표기 |
| 3 | **P0** | `/` 모바일 390 기본 상태 | 탐색 패널(366×533, y133~666)이 지도 영역의 **65%**를 덮고 접는 수단이 없음(헤더 버튼은 내 생활·목록 보기뿐). 지도는 위 12px·아래 178px 띠만 노출, 유일한 마커(시청역)도 패널 아래. 목록을 열면 패널 bottom 772~783까지 내려와 하단 띠 61px | `screenshots/mobile-home-after-consent.png`, `screenshots/mobile-explorer-list-open.png`, `screenshots/mobile-search-library-selected.png` | `src/features/place-filter/ui/PlaceExplorerPanel.tsx`: `absolute left-3 right-3 top-14 max-h-[calc(100%-7rem)]` 고정 오버레이, 모바일 분기 없음 | 모바일은 하단 시트(접힘/반/전체 스냅)로 전환하고 기본은 접힌 상태(요약 1줄)로 시작 |
| 4 | **P0** | `/` 지도 컨트롤 3종 (mobile) · 날씨 버튼 (desktop) | 모바일: 혼잡도(326,93)·날씨(16,700)·현재 위치(326,700) 버튼 모두 `elementFromPoint` 기준 **탭 불가** — 혼잡도는 칩 행 컨테이너(`absolute left-3 right-3 top-3 z-30`, 빈 영역이 포인터 가로챔), 날씨·현재 위치는 탐색 패널(추천 카드 버튼)이 덮음. 데스크톱: 패널 bottom 835~844가 날씨 버튼(y772~820)을 덮어 Playwright 클릭이 거부됨(JS 클릭으로만 열림) | `screenshots/mobile-controls-occlusion-check.png`, `screenshots/desktop-controls-occlusion-check.png`, `screenshots/desktop-home-after-consent.png`(좌하단 날씨 버튼 미노출) | `MapView.tsx`의 칩 행 `left-3 right-3`가 전폭, `MapControls.tsx` z-30 = 패널 z-30이면서 DOM 순서상 패널이 뒤 | 칩 행은 `pointer-events-none` + 칩만 `pointer-events-auto`, 컨트롤 z-index를 패널보다 위로, 패널 높이와 컨트롤 영역 충돌 제거 |
| 5 | **P1** | `/` 첫 3초 (mobile·desktop) | 0s: SSR 랜딩(제목·설명·카테고리 카드)이 잠깐 보였다가 ~0.3s 뒤 지도 앱으로 교체(플래시). 1s: 헤더 아래 "데이터 로딩 중..." 필, 전체가 Cloudflare 기본 **쿠키 동의 모달**("쿠키 설정 / analytics — Anonymous page and feature usage analytics." 한·영 혼용, 시스템 폰트, 네모 체크박스)로 블러. 3s: 시청 50m 축척에 마커 1개(mobile)/4개(desktop), "현 지도 1곳/4곳". 히어로·온보딩 없음 | `screenshots/desktop-home-0s.png`, `screenshots/mobile-home-0s-recheck-commit.png`, `screenshots/mobile-home-1s.png`, `screenshots/mobile-home-3s.png`, `screenshots/desktop-home-settled.png`, `screenshots/mobile-home-settled.png` | `app/page.tsx` Suspense fallback=`HomeLanding` → hydration 후 `MainApp` 교체; 기본 중심 서울시청·고배율; Zaraz 자동 주입 동의 UI | 랜딩→지도 전환을 동일 레이아웃(헤더 유지 + 지도 스켈레톤)으로, 기본 줌을 구 단위(1km)로, 동의 UI를 브랜드 스타일로 교체하거나 analytics 쿠키 없는 구성으로 모달 제거 |
| 6 | **P1** | `/` 상황별 추천·프리셋 6종 (mobile·desktop) | 기본 위치에서 6개 프리셋 모두 **같은 3개 지하철역**(시청역·시청역·을지로입구역)만 점수만 바뀌어 노출(57/53/69/49/49/63점). "오늘 행사"·"따릉이로"는 행사·대여소를 하나도 보여주지 않고 "현재 위치에서 가까워요"만 사유로 표시. "비 오는 날"은 지하철역을 "실내에서 이용할 수 있어요 · 현재 날씨 위험을 피하기 좋아요"로 추천. 프리셋 재클릭으로 해제되지 않음 | `screenshots/desktop-preset-1.png`, `screenshots/desktop-preset-3.png`, `screenshots/desktop-preset-4.png`, `screenshots/desktop-preset-5.png`, `screenshots/mobile-preset-5.png` | `src/features/recommendation/lib/recommendation-engine.ts` 133~146행: 프리셋은 **이미 로드된 시설만 재채점**하고 카테고리를 활성화하지 않음(기본 활성은 `usePreferences.ts` park·subway뿐) | 프리셋 선택 시 필요한 카테고리(문화행사·따릉이·무더위쉼터·도서관)를 자동 로드/활성화, 매칭 0건이면 빈 상태 문구와 "카테고리 켜기" CTA |
| 7 | **P1** | `/` 지역 바로가기 → 강남구 (mobile·desktop) | 지도는 강남구로 이동했지만 추천은 **시청역×2·을지로입구역**(desktop) / **동대문역사문화공원역×2·동대입구역**(mobile)으로 지도 밖 장소. "현 지도 375곳" vs 하단 필 "372개 시설"(mobile 125 vs 122) 불일치, 목록은 "가까운 장소 100곳만 표시" | `screenshots/desktop-region-gangnam.png`, `screenshots/mobile-region-gangnam.png` | 추천·목록 기준점이 지도 중심이 아니라 초기 "현재 위치"(시청 기본값)로 고정된 것으로 추정(`MapView.tsx` currentLocation); 카운트 소스가 둘(패널=시설 수, 필=마커 DOM 수) | 추천 기준점을 지도 중심/뷰포트로, 카운트 소스 단일화 |
| 8 | **P1** | `/` 짧은 활동 계획 "만들기" (desktop 강남구 뷰 1.5시간) | 결과 "90분 안에 3곳 · 이동 16분 · 체류 59분: 1 시청역(이동 2분·체류 12분) → 2 시청역(5분) → 3 순화문화공원" — **같은 역을 두 번 방문**. mobile: 동대문역사문화공원역 **3회**(이동 39분/4분/2분). 결과 줄이 패널 하단에서 잘려 스크롤해야 보임 | `screenshots/desktop-activity-plan-result.png` | 호선별 역이 별개 시설로 중복 존재(시청역 1·2호선) + 기준점 불일치(#7) | 동일명·반경 50m 시설 병합, 계획 결과를 패널 상단/별도 시트로 표시 |
| 9 | **P1** | `/` 검색 Enter·지우기 흐름 (mobile·desktop) | "도서관" 입력 후 ↓↓ Enter → NL 규칙 적용 "검색 조건 적용: 도서관", "현 지도 0곳· 필터 1", 마커 0, 목록이 자동으로 열리며 빈 상태만 표시, 지도는 이동하지 않음. 검색창 X로 지워도 규칙이 **그대로 남음**(0곳·필터 1 유지) — "초기화" 아이콘 버튼을 찾아야 해제. 헤더 제목이 "현…"으로 말줄임(scrollWidth 130 vs clientWidth 66/32) | `screenshots/desktop-search-library-selected.png`, `screenshots/mobile-search-library-selected.png`, `screenshots/desktop-after-clear-search.png`, `screenshots/mobile-after-clear-search.png` | `Header.tsx` onKeyDown이 첫 option에만 포커스 이동(두 번째 ↓는 이동 없음), NL 적용이 `onSearchClear`와 분리됨 | ↓키로 옵션 순환, 지우기 시 규칙도 해제(또는 규칙 칩에 X), 결과 0이면 "지도를 축소해 N곳 더 보기" CTA |
| 10 | **P1** | `/places/library`, `/places/park`, `/places/cultural-event`, `/places/cooling-center` (3뷰포트) | 모든 목록이 **항목을 2번씩** 표시(4.19혁명기념도서관×2, 강동구립암사도서관×2…), "총 432곳"(index상 도서관 216건의 2배), "[페관] 송중문화정보도서관"(폐관 오타·폐관 시설 노출), 문화행사 "총 8,000곳"(정확히 8,000), 무더위쉼터 카드에 원시 태그 "특정계층이용시설,회원이용시설" | `screenshots/mobile-places-library-page2.png`, `screenshots/desktop-places-library.png`, `screenshots/desktop-places-park.png`, `screenshots/desktop-places-cultural-event.png`, `screenshots/desktop-places-cooling-center.png` | `src/shared/lib/seo/public-places.ts` `getPublicPlacePage` 결과 중복(백엔드 페이지 응답 또는 병합 로직) — 미확인 | id 기준 dedupe, 폐관 필터, 원시 태그를 사람 언어 라벨로 매핑, totalElements 검증 |
| 11 | **P1** | `/` 사이드 메뉴 "지도 마커 설정" (mobile·desktop) | 배지 "10개 선택"이지만 체크박스는 8개(모두 체크). 지도 칩은 공원·지하철 2개뿐. "도서관" 체크 해제 전후 마커(306+3)·칩 변화 **없음** | `screenshots/desktop-sidemenu-open.png`, `screenshots/mobile-sidemenu-open.png`, `screenshots/desktop-sidemenu-library-on.png`, `screenshots/desktop-after-library-on.png` | 메뉴 체크 상태와 지도 활성 카테고리(`usePreferences` 기본 park·subway)의 소스가 다른 것으로 추정 | 단일 preferences 스토어로 통일, 체크 변경 즉시 해당 카테고리 로드/언로드, 카운트 정합 |
| 12 | **P1** | `/` 상세 바텀 시트 (세종로공원·신촌역·시청역·따릉이 502번) | 정보 대부분이 부정형: "운영 여부 미확인", "확인: 운영시간을 확인할 수 없어요 · 데이터 기준 시각을 확인할 수 없어요", "기준 시각 미확인 · 마지막 갱신 확인되지 않음", 비활성 버튼 "상세 링크 없음"이 액션 슬롯 하나를 차지, 주변 대안 3곳이 전부 57점·같은 사유. 따릉이 대여소인데 실시간 거치 대수 없음 | `screenshots/desktop-facility-sheet.png`, `screenshots/desktop-subway-sheet.png`, `screenshots/desktop-search-hangang-selected.png`, `screenshots/mobile-facility-sheet.png` | `FacilityBottomSheet.tsx` 규칙 점수(`facility.referenceScore`)가 데이터 없음을 사유로 반복 출력 | 알 수 없는 항목은 숨기고 있는 정보만 표시, 점수는 근거가 있을 때만, 링크 없으면 버튼 제거, 따릉이는 실시간 대수 표시 |
| 13 | **P1** | `/` 현재 위치 버튼 (권한 거부) | 클릭해도 토스트·안내·상태 변화 전혀 없음(콘솔에만 로드 시 `GPS 오류: User denied Geolocation` 2건). 거부 상태에서도 추천 사유는 "현재 위치에서 가까워요"(실제로는 시청 기본값) | `screenshots/desktop-geolocation-denied.png`, `screenshots/mobile-geolocation-denied.png` | `MapView.tsx` 589~593행: 에러를 console.error만 하고 UI 피드백 없음 | 거부/불가 시 인라인 안내("위치 권한이 꺼져 있어 시청 기준으로 보여요 · 지역 선택") + 사유 문구 보정 |
| 14 | **P1** | `/` 1km 축척 마커 (desktop 강남구·줌아웃) | 306개 단일 마커 + 클러스터 3개(같은 좌표만 묶음, 모두 "2") → 마커가 서로 겹쳐 183/300만 클릭 가능. 색·아이콘이 호선색·카테고리색으로 뒤섞여 범례 없이는 구분 불가 | `screenshots/desktop-region-gangnam.png`, `screenshots/desktop-zoom-out-4.png`, `screenshots/desktop-zoom-out-2.png` | `src/features/map-markers/model/use-markers.ts`: `locationKey` 동일 좌표 묶음만 수행(거리 기반 클러스터링 없음) | 줌 레벨별 그리드/거리 클러스터링, 범례 또는 칩에 라벨 |
| 15 | **P2** | `/this-page-does-not-exist`, `/places/zzz`, `/profile`, `/auth/callback` | 404는 Next 기본 "404 | This page could not be found."(영문, 내비·링크 없음, 제목은 "Seoul Fit | 서울 공공시설 지도" 또는 "404: This page could not be found."로 들쭉날쭉). `/profile` 비로그인 → 아무 안내 없이 `/`로 즉시 리다이렉트. `/auth/callback` 파라미터 없음 → "❌ 오류 발생 / 인가 코드가 없습니다…/ 잠시 후 메인 페이지로 이동합니다..." (이모지 아이콘) 후 ~3s 내 `/`로 이동 | `screenshots/desktop-404.png`, `screenshots/mobile-404.png`, `screenshots/desktop-places-bad-category.png`, `screenshots/mobile-profile-loggedout-4s.png`, `screenshots/desktop-auth-callback-noparams.png`, `screenshots/desktop-auth-callback-noparams-3s.png` | `app/not-found.tsx` 부재(확인), `app/profile/page.tsx` 미인증 redirect, `LoadingStates.Error` 이모지 | 브랜드 404(헤더·검색·홈 링크), /profile은 로그인 안내 화면, 콜백 오류는 lucide 아이콘·재시도 CTA |
| 16 | **P2** | `/` 바텀 시트 시각 마감 (mobile·desktop) | 드래그 핸들(56×38 버튼)이 **왼쪽 정렬**(가운데 아님), 시트 열릴 때 핸들에 포커스가 가서 좌상단에 파란 포커스 사각형 노출. 데스크톱은 1440px 전폭 시트로 액션 버튼 4개가 342px씩 늘어남. 모달(aria-modal)인데 헤더(z-50)는 오버레이(z-40) 위에 남아 블러 없이 조작 가능 | `screenshots/desktop-subway-sheet.png`, `screenshots/mobile-facility-sheet.png`, `screenshots/desktop-search-hangang-selected.png`, `screenshots/desktop-facility-sheet.png` | `FacilityBottomSheet.tsx` 핸들 `<button className='flex justify-center py-4'>`가 inline 폭(중앙 정렬 안 됨), 포커스를 핸들에 줌; `MainApp.tsx` 헤더 `sticky z-50` vs 시트 오버레이 `z-40` | 핸들 래퍼를 `w-full`로, 초기 포커스는 제목/닫기로, 데스크톱은 우측 사이드 패널(≤480px) 또는 max-w 제한, 오버레이 z를 헤더 위로 |
| 17 | **P2** | `/` 클러스터 시트 (desktop) | 클러스터 "2" 클릭 → "2개 시설 그룹 / 총 2개 시설 / 지하철 (2개) / 신사역 / 신사역"(호선 구분 없이 같은 이름 2개). 항목 클릭 시 시트 안에서 "신사역 / 지하철 / 시설 정보: 카테고리·거리 6.7km·예약 불가" 3줄짜리 별도 상세(점수·액션 없음)로 바뀜 — 시설 시트와 다른 디자인. `role=dialog` 없음, 포커스 이동 없음, 닫기 버튼 접근성 이름 없음 | `screenshots/desktop-cluster-sheet.png`, `screenshots/desktop-cluster-item-detail.png` | `ClusterBottomSheet.tsx` 자체 레이아웃·자체 상세 뷰 | 클러스터 항목 선택 시 동일한 `FacilityBottomSheet`로 연결, 역 이름에 호선 병기, dialog 시맨틱 추가 |
| 18 | **P2** | `/` 상단 카테고리 칩 (mobile·desktop) | 칩이 숫자만("132", "784") — 라벨은 aria-label에만 존재. 공원 아이콘이 경고 삼각형처럼 읽힘. 숫자는 전체 개수(현 지도와 무관): 50m 축척에서 "132"를 눌러도 마커 변화 없음(4→4) | `screenshots/desktop-home-after-consent.png`, `screenshots/desktop-chip-park-hidden.png`, `screenshots/mobile-chip-park-hidden.png` | `MapView.tsx` 714~740행 칩 내용 = 아이콘+count | 칩에 라벨 표기("공원 132"), 현 지도 내 개수로 바꾸거나 전체임을 명시 |
| 19 | **P2** | `/` 탐색 패널 가로 스크롤 행 | 상세 필터 행이 "혼잡…", 프리셋 행이 "따…"로 잘린 채 표시되고 스크롤 힌트(그라데이션/화살표) 없음; 프리셋 클릭 시 행이 스크롤돼 앞 칩("지금 갈 곳")이 "곳"만 남음 | `screenshots/desktop-home-after-consent.png`, `screenshots/desktop-region-gangnam.png`, `screenshots/mobile-preset-5.png` | `overflow-x-auto` 행, 스크롤 affordance 없음 | 2줄 wrap 또는 페이드 힌트, 선택 칩 자동 스크롤-인-뷰 정렬 |
| 20 | **P2** | `/` 모바일 헤더·사이드 메뉴 | 모바일에 언어 토글 없음(`hidden sm:inline-flex`), "장소 둘러보기" 링크도 없음(사이드 메뉴에도 없음) → 모바일 사용자는 영어 전환·공개 페이지 진입 경로가 없음 | `screenshots/mobile-home-after-consent.png`, `screenshots/mobile-sidemenu-open.png` | `Header.tsx` 594~605행 | 사이드 메뉴 하단에 언어·장소 둘러보기 추가 |
| 21 | **P2** | `/` 영어 모드 (desktop) | `html[lang]`·헤더·패널은 번역되지만 날씨 패널 제목 "날씨 정보", "연결 실패", "날씨 정보를 불러올 수 없습니다", 혼잡도 패널·범례, 문서 `<title>`("서울 공공시설 지도")은 한국어 유지 | `screenshots/desktop-lang-en.png`, `screenshots/desktop-lang-en-weather.png` | `WeatherPanel.tsx`/`CongestionPanel.tsx` 하드코딩 문자열, metadata 비국제화 | 두 패널 문자열을 messages.ts로, title 동적화 |
| 22 | **P2** | `/` 내 생활 패널 (비로그인) | 모바일 전폭 흰 화면에 아이콘+2줄만 있고 나머지 공백. 문구 "왼쪽 메뉴에서 로그인해 주세요" — 메뉴는 **오른쪽** 햄버거 | `screenshots/mobile-mylife-panel.png`, `screenshots/desktop-mylife-panel.png` | `EngagementPanel.tsx` 226~228행 | 문구 수정 + 패널 안 로그인 버튼, 로그인 전 가치 설명(저장 장소 미리보기) |
| 23 | **P2** | `/` 줌 컨트롤·축척 | 화면 내 줌 버튼 없음(Kakao ZoomControl 미추가, 앱 버튼도 없음) — 데스크톱은 휠, 모바일은 핀치만 | `screenshots/desktop-home-after-consent.png` | `MapView.tsx` addControl 미호출 | +/- 버튼 추가(컨트롤 묶음으로 정렬) |
| 24 | **P2** | `/`, `/places` prefers-color-scheme: dark | 다크 모드 요청에도 전부 라이트(html class "", body `rgb(255,255,255)`); `.dark` 변수만 정의되고 토글 없음 | `screenshots/desktop-dark-mode-home.png`, `screenshots/mobile-dark-mode-home.png`, `screenshots/desktop-dark-mode-places.png` | `tailwind.config.js` `darkMode: ['class']`, `globals.css` `.dark` 미사용 | 다크 테마를 실제 지원하거나 변수 제거(포트폴리오에선 지원이 가산점) |
| 25 | **P2** | `/places/library/17930` 상세 (3뷰포트) | 카드 1장 뒤로 큰 공백(desktop 900px 중 하단 400px 비어 있음), 이미지·지도 미리보기 없음, 라벨 없는 줄 "공공도서관 · 일요일 및 법정공휴일"(휴관일 값으로 추정), 앱 헤더 없이 "장소 둘러보기 / 도서관" 텍스트 경로만 | `screenshots/desktop-place-detail.png`, `screenshots/mobile-place-detail.png` | `app/places/[category]/[id]/page.tsx` | 정적 지도 썸네일/주변 장소, 라벨("휴관일") 추가, 앱과 공통 헤더 |
| 26 | **P2** | 전 화면 터치 타깃·타이포 | 44px 미만 인터랙티브 요소 mobile 홈 23개/desktop 28개: 칩 h32(63~100px 폭), select h32, 시트 확대·닫기 36×32, 헤더 로고·메뉴 40×40, 공개 페이지 "← 지도 보기" 77×16, 페이지네이션 텍스트 링크, 마커 28px(mobile). 보조 텍스트 11~12px 다수("기준 시각 미확인" 11px) | `screenshots/mobile-home-after-consent.png`, `screenshots/mobile-places.png`, `screenshots/mobile-facility-sheet.png` | Tailwind `h-8`/`text-xs` 일괄 사용 | 모바일 최소 40~44px, 본문 보조 13px 이상 |
| 27 | **P2** | 키보드 탐색 순서 (desktop) | Tab 순서: 건너뛰기 → 로고 → 검색 → English → 장소 둘러보기 → 메뉴 → **지도 내부 마커(DIV, 줌아웃 시 최대 300개)** → Kakao AREA/로고 → 혼잡도 → 날씨 … 탐색 패널은 그 뒤. 건너뛰기 링크 Enter 후 `activeElement`가 버튼, hash 변화 없음(main으로 이동 미확인) | `screenshots/desktop-a11y-tab-trail-end.png`, `screenshots/desktop-a11y-first-tab-skiplink.png` | 마커 CustomOverlay가 포커스 가능 DIV, DOM 순서가 지도 → 컨트롤 → 패널 | 패널을 DOM 앞으로(또는 aria-flowto), 마커는 목록 대체 경로 제공, 건너뛰기 대상 포커스 검증 |
| 28 | **P2** | 성능 (첫 로드) | 첫 로드에 JSON ≈1.06MB(압축): `/api/search/index?page=0&size=20000` 854~870KB(0.8~1.6s), 따릉이 106KB, 지하철 20KB **2회 중복**, 공원 25KB, 도서관 18KB. 마커 첫 표시 3.1~3.3s. JS 283~287KB(first-party, 14~15 chunk) | `screenshots/mobile-home-3s.png` | `useSearchCache.ts` 27~30행 전체 인덱스 선로드, 지하철 중복 호출(검색 캐시+지도) | 인덱스는 서버 검색 API 또는 지연 로드, 중복 요청 제거 |
| 29 | **P3** | `/`, `/places`, 404, `/auth/callback` | sr-only 라이브 영역 "언어가 한국어로 변경되었습니다."가 모든 페이지 본문에 상시 렌더(스크린리더가 로드마다 읽을 수 있음) | (DOM 관찰: phase5 bodyText 말미) | `I18nProvider.tsx` 59~61행 | 변경 이벤트 때만 메시지 주입 |
| 30 | **P3** | `/` 헤더·패널 문구 | "현 지도 0곳· 필터 1"(가운뎃점 앞 띄어쓰기 누락), 로드 중 "데이터 로딩 중..." 필이 검색창 아래에 어색하게 겹침, 공개 목록 "[페관]" 오타 | `screenshots/mobile-home-1s.png`, `screenshots/mobile-places-library-page2.png` | 문자열 조합 | 문구 정리 |
| 31 | **P3** | 글꼴 | 웹폰트 요청 없음(HTML head에 font link 없음) → OS 기본 글꼴 의존(headless Linux에서는 DejaVu Sans로 렌더). 공개 페이지는 `ui-sans-serif, system-ui`, 앱 `:root --font-geist-sans: Arial…` | `screenshots/desktop-place-detail.png`, `screenshots/desktop-home-after-consent.png` | `globals.css`, `layout.tsx` | Pretendard 등 한국어 최적 웹폰트 1종 + 숫자 탭 정렬 |
| 32 | **P3** | 마커 호선 중복 | 시청역(1·2호선), 신사역 등 환승역이 호선별 별도 시설로 추천·목록·계획에 중복 등장 | `screenshots/desktop-explorer-list-open-scrolled.png`, `screenshots/desktop-cluster-sheet.png` | 데이터 모델(역 코드별 레코드) | 역명+좌표 병합, 호선 배지 병기 |

---

## 2. 흐름별 워크스루 노트

### 2.1 첫 인상 (0s / 1s / 3s / 정착)

**핵심 요약**: 랜딩이나 히어로 없이 서울시청 50m 축척 지도로 바로 떨어지며, 첫 3초는 "SSR 랜딩 플래시 → 로딩 필 → 쿠키 모달 블러 → 마커 1~4개"로 이어진다. 포트폴리오 첫 화면으로는 설명도, 볼거리도 없다.

**관찰(증거)**
- desktop 0s(`commit`): 서버 HTML 랜딩 — "Seoul Fit / 서울 공공시설 지도 / 서울의 공원, 도서관… 지도 서비스 / 지도를 준비하고 있습니다. 지도가 열리지 않으면 아래 목록에서 장소를 찾아보세요." + 6개 카테고리 카드 + "모든 장소 둘러보기" — `screenshots/desktop-home-0s.png`. mobile 재검증(`screenshots/mobile-home-0s-recheck-commit.png`)에서는 h1 30px의 정상 모바일 배율로 렌더. 첫 실행의 `screenshots/mobile-home-0s.png`는 데스크톱 배율처럼 작게 찍혔으나 재현되지 않음 → 캡처 타이밍 아티팩트로 판단(미확인).
- 300ms 시점: 랜딩 사라지고 `#kakaoMap` 존재(hydration 교체). 1s: `readyState complete`, 헤더 검색창 아래 "데이터 로딩 중..." 필, `.cf_modal_container`(Cloudflare Zaraz) 쿠키 모달이 포커스를 가져가고 뒤 화면 블러 — `screenshots/mobile-home-1s.png`, `screenshots/desktop-home-settled.png`.
- 3s: 타일 15(mobile)/38(desktop)장 렌더, 마커 1/4개, 축척 "50m", 패널 "현 지도 1곳/4곳" — `screenshots/mobile-home-3s.png`, `screenshots/desktop-home-3s.png`. 마커 첫 등장: 내비게이션 시작 후 3.12s(mobile) / 3.27s(desktop).
- 동의 모달 닫은 정착 상태 — `screenshots/mobile-home-after-consent.png`, `screenshots/desktop-home-after-consent.png`: 네이비 로고 사각형 + 핀 아이콘, 검색창(placeholder '장소 또는 "한산한 실내 도서관" 검색'), desktop만 English·장소 둘러보기, 햄버거. 지도 위 좌상단 칩 "132"(녹색)·"784"(보라), 우상단 혼잡도 버튼, 좌하단 날씨(desktop에선 패널에 가려짐), 우하단 현재 위치, 하단 필 "4개 시설", Kakao 로고·축척.
- 탐색 패널 구성(위→아래): 헤더(현 지도 N곳 / 내 생활 / 목록 보기) → "지역을 선택해 지도로 이동" select → **서울 지금** 카드(주황 경고 문구 + "기준 시각 미확인" 배지) → 거리 select + 필터 칩(지금 열림·예약 가능·실내·혼잡 낮음, 잘림) → 상황별 추천 칩 6개(잘림) → 추천 카드 3장(시청역 57점 ×2, 을지로입구역 57점, 사유 "현재 위치에서 가까워요", 경고 "확인: 운영시간을 확인할 수 없어요") → 짧은 활동 계획(1.5시간 select + 만들기).
- 지도 로딩 스켈레톤: 코드(`MapView.tsx` 629~634행)에는 Skeleton 오버레이가 있으나 1s 캡처가 동의 모달 블러에 가려 **시각적으로 확인 못 함**(미확인).

**추론**
- 기본 중심(시청)·고배율(50m) 때문에 첫 화면에 시설이 1~4개뿐이라 "지도 서비스인데 지도가 비어 있는" 인상. 추천·활동계획 등 기능 밀도는 높은데 데이터가 비어 보여 기능이 과장돼 보임.
- Zaraz 기본 동의 UI(시스템 폰트, "analytics" 영문 설명, 파란 버튼 3개)는 브랜드와 전혀 맞지 않아 "관리 안 된 사이트" 신호를 준다.

**미확인**: 실제 모바일 기기 첫 페인트, 스켈레톤 노출 여부, 동의 모달 1회 이후 재방문 흐름.

### 2.2 헤더 검색

**핵심 요약**: 제안 풀이 지하철·따릉이로 한정돼 있고, 무결과 상태가 없으며, Enter는 빈 지도를 만들고 지우기는 필터를 남긴다.

**관찰(증거)**
- 빈 검색창 포커스: 드롭다운 없음(최근 검색 없음) — `screenshots/desktop-search-focus-empty.png`.
- "도서관": 옵션 11개 = "조건으로 지도 보기 | 도서관"(보라 NL 카드) + 따릉이 10건("349. 어린이도서관", "1985. 구로도서관", "1271. 송파도서관", "432. 마포중앙도서관", "1003. 해공도서관앞"…, 전부 자전거 아이콘). 드롭다운 desktop 1088×240(max-h 240 스크롤), mobile 288×240(검색창 정렬, 전폭 아님) — `screenshots/desktop-search-library-suggestions.png`, `screenshots/mobile-search-library-suggestions.png`.
- 키보드: ↓ 두 번 눌러도 포커스는 첫 옵션(NL)에 머묾(`aria-selected`는 모두 "false", 변화 없음) — `screenshots/desktop-search-library-keyboard.png`. Enter → 규칙 적용 "검색 조건 적용: 도서관", "현 지도 0곳· 필터 1", 마커 0, 지도 이동 없음, 목록 자동 열림 + 빈 상태("현재 지도와 필터에 맞는 장소가 없습니다.", "현재 지도에서 추천할 장소가 없습니다.") — `screenshots/desktop-search-library-selected.png`, `screenshots/mobile-search-library-selected.png`.
- "한강공원": NL "공원" + 따릉이 3건("502. 자양(뚝섬한강공원)역 1번출구 앞", "1002. 해공공원(천호동)", "1113. 서남환경공원 버스정류장"); mobile에서 3건 중 2건 제목 말줄임 — `screenshots/mobile-search-hangang-suggestions.png`. 첫 결과 클릭 → 지도 자양동으로 이동, 따릉이 시트(42점, "일반 장소 정보로 판단했습니다.", 데이터 출처 "서울자전거 따릉이 — 기준 시각 미확인 · 마지막 갱신 확인되지 않음") 열림, 지도 마커 0(따릉이 카테고리 비활성이라 선택 시설만 칩 "1"로 추가) — `screenshots/desktop-search-hangang-selected.png`, `screenshots/mobile-search-hangang-selected.png`.
- "따릉이": NL + "2601. 석촌호수 아뜰리에", "993.은평뉴타운 은뜨락아파트앞" — `screenshots/desktop-search-bike-suggestions.png`.
- "zzzz"·"스타벅스": 드롭다운 자체가 안 뜸(코드의 "검색 결과가 없습니다." 분기 미노출), Enter 무반응 — `screenshots/desktop-search-no-results.png`, `screenshots/mobile-search-no-results-enter.png`.
- "한산한 실내 도서관"(placeholder 예시): NL 옵션만("도서관 · 실내 · 한산함") → 적용 시 실내·혼잡 낮음 필터 + "한산한 곳" 프리셋 자동 선택, 0곳 — `screenshots/desktop-search-nl-applied.png`, `screenshots/mobile-search-nl-applied.png`.
- 정밀 검증(phase 6): "개봉도서관"(index에 존재) → NL만(`screenshots/desktop-search-exact-library.png`); "서울도서관" → 따릉이 3건; "책읽는 한강공원"(index 행사명) → NL "도서관 · 공원"만; "여의도" → 여의도역(5·9호선)+따릉이 5+오이도역·시청.용인대역·화랑대역(`screenshots/desktop-search-yeouido.png`); "남산" → 따릉이 4 + 남성역·낙성대역·녹사평역·별내역·다산역·구리역.
- 지우기(X) 후: 입력은 비지만 "검색 조건 적용: 도서관"·"0곳· 필터 1" 유지, 마커 0 — `screenshots/desktop-after-clear-search.png`, `screenshots/mobile-after-clear-search.png`. "장소 필터 초기화" 클릭 시 복구("현 지도 4곳").
- Escape로 드롭다운 닫힘. 깜빡임(flicker)은 관찰되지 않음.

**추론**
- `useSearchCache.ts`는 `/api/search/index`(서버 응답 확인: 30,204건, refTable 5종)를 병합하도록 되어 있지만 제안 풀에 index 항목이 없음 → 병합/매핑 단계 실패 추정(콘솔 에러는 없음). 초성 매칭(50/40점)이 "남산"→"낙성대"류 오탐을 만들고 서울 밖 역(별내선·안산선·에버라인)까지 포함.
- NL 규칙은 "검색"이 아니라 "필터"인데 검색창 안에서 섞여 있어, 사용자는 검색어를 지웠는데 결과가 비어 있는 이유를 알기 어렵다.

**미확인**: 최근 검색 UI(히스토리가 있을 때), 검색 캐시 로딩 중 상태의 실제 표시 시간.

### 2.3 탐색 패널 · 필터 · 프리셋 · 지역 · 활동 계획 · 내 생활

**관찰(증거)**
- 패널 기하: desktop 16,133 / 400×702(bottom 835, 지도 면적의 24%); mobile 12,133 / 366×533(65%). 패널 자체 스크롤(scrollHeight 700=clientHeight 700, 즉 기본 상태는 스크롤 없음; 목록 열면 960 vs 709). 접기 버튼 없음.
- 목록 보기: 헤더가 "현 지도 N곳 / 내 생활 / 초기화 / 목록 닫기"로 바뀌며 제목이 "현…"으로 말줄임. 목록 항목: "시청역 — 지하철 · 주소 미확인 — 119m — 운영 여부 미확인 · 혼잡 보통" 등 "미확인" 반복 — `screenshots/desktop-explorer-list-open.png`, `screenshots/desktop-explorer-list-open-scrolled.png`, `screenshots/mobile-explorer-list-open.png`, `screenshots/mobile-explorer-list-open-scrolled.png`.
- 카테고리 칩 토글: "공원 132곳 숨기기" 클릭 → aria-pressed false·칩 흐려짐, 마커 4→4(현 뷰에 공원 없음) — `screenshots/desktop-chip-park-hidden.png`, `screenshots/mobile-chip-park-hidden.png`.
- 프리셋 6종 결과(desktop 기본 뷰, 추천 3장 동일 지하철역): 지금 갈 곳 57점 / 한산한 곳 53점 / 비 오는 날 69점("선택한 상황에 잘 맞아요 · 실내에서 이용할 수 있어요 · 현재 날씨 위험을 피하기 좋아요") / 오늘 행사 49점 / 따릉이로 49점 / 더위 피하기 63점. 칩·마커 변화 없음. mobile 동일(추천 1장) — `screenshots/desktop-preset-1.png`, `-3`, `-4`, `-5`, `screenshots/mobile-preset-1.png`, `-3`, `-4`, `-5`. "더위 피하기" 재클릭 후에도 pressed 유지.
- 상세 필터: "지금 열림" → "현 지도 0곳· 필터 1"(운영시간 미확인 시설은 제외), 거리 "1km 이내" → "필터 2", 초기화 버튼 등장 — `screenshots/desktop-filters-open-now-1km.png`, `screenshots/mobile-filters-open-now-1km.png`.
- 지역 바로가기 "강남구": sr-only 상태 "강남구(으)로 지도를 이동했습니다.", 축척 1km, "현 지도 375곳"(mobile 125곳) vs 필 "372개 시설"(122), 마커 306+3(83+3), 목록 "가까운 장소 100곳만 표시합니다. 지도를 확대해 보세요." 추천은 여전히 시청역×2·을지로입구역(desktop) / 동대문역사문화공원역×2·동대입구역(mobile) — `screenshots/desktop-region-gangnam.png`, `screenshots/mobile-region-gangnam.png`, `screenshots/desktop-gangnam-list-open.png`(목록 열림 시도는 스크립트 오류로 미캡처 — 파일 없음, 아래 미확인 참조).
- 활동 계획: 결과 문단이 패널 끝에서 잘림(`screenshots/desktop-activity-plan-result.png` 하단 "90분 안에 3곳 · 이동 16분 · 체류 59분" 줄 절반만 보임). 경로 1 시청역 → 2 시청역 → 3 순화문화공원; mobile 동대문역사문화공원역 ×3. 경고 "이동 시간은 직선거리 기반 보행 추정치이며 실제 길찾기와 다를 수 있습니다."
- 내 생활: 우측 aside(`fixed inset-y-0 right-0 max-w-md`, mobile 전폭) — 제목 "내 생활 / 저장한 장소와 생활권 알림을 관리합니다.", 비로그인 빈 상태 "로그인하면 여러 기기에서 이어집니다. 로그인 전 저장한 장소는 이 기기에 안전하게 남아 있습니다. 왼쪽 메뉴에서 로그인해 주세요." — `screenshots/desktop-mylife-panel.png`, `screenshots/mobile-mylife-panel.png`. Escape로 닫힘. 배경 닫기 버튼(aria-label "내 생활 패널 닫기")은 mobile에서 aside에 완전히 덮여 클릭 불가(Playwright 타임아웃).

**추론**: 패널은 "필터 + 라이브 상태 + 추천 + 목록 + 플래너"를 한 스크롤에 담는 구조라 데스크톱에서도 지도 컨트롤과 충돌하고, 모바일에서는 지도를 삼킨다. 추천·플래너는 모두 같은 3개 지하철역을 재사용하므로 기능이 많아 보일수록 데이터 빈약함이 더 드러난다.

**미확인**: 강남구 뷰에서 "목록 보기"를 연 캡처(`desktop-gangnam-list-open.png`)는 스크립트가 이미 열린 목록 상태에서 버튼을 못 찾아 생성되지 않음. 로그인 후 내 생활(저장 장소·알림 규칙) UI.

### 2.4 마커 · 클러스터 · 바텀 시트

**관찰(증거)**
- 마커: 단일 36px(desktop)/28px(mobile) 원형, 흰 테두리; 지하철은 호선색(1호선 남색, 2호선 녹색, 3호선 주황, 7호선 올리브, 9호선 금색 등), 공원은 녹색 나무 핀; 클러스터 40px + 흰 배지 숫자 — `screenshots/desktop-region-gangnam.png`.
- 줌아웃(desktop 휠 4단): 20곳 → 46곳 → 146곳 → 381곳(필 378), 마지막에 단일 297 + 클러스터 3("2") — `screenshots/desktop-zoom-out-1.png`, `screenshots/desktop-zoom-out-2.png`, `screenshots/desktop-zoom-out-4.png`. 1km 축척에서 마커 300개 중 183개만 중심점 클릭 가능(나머지는 다른 마커·패널에 가림). 모바일 휠 줌은 레벨 변화 없음(미확인).
- 클러스터 클릭: `screenshots/desktop-cluster-sheet.png` — "2개 시설 그룹 / 총 2개 시설 / 지하철 (2개) / 신사역 / 신사역"; 항목 클릭 → 시트 내부 상세(`screenshots/desktop-cluster-item-detail.png`: "신사역 / 지하철" + "시설 정보 카테고리 지하철 · 거리 6.7km · 예약 불가"만). 컨테이너 role 없음, `focusInside=false`, 닫기 버튼 접근성 이름 "".
- 시설 시트(세종로공원): `screenshots/desktop-facility-sheet.png` — 높이 50vh(440px), 좌측 핸들, 제목 + "공원 · 운영 여부 미확인", 보라 "지금 이용 판단" 카드(사유 "현재 위치에서 가까워요", 57점, "확인: 운영시간을 확인할 수 없어요 · 데이터 기준 시각을 확인할 수 없어요", 각주 "거리·운영·예약·데이터 신선도를 규칙으로 계산한 참고 점수입니다."), 액션 4개(길찾기=`map.kakao.com/link/to/…` 링크, 공유, 저장, 비활성 "상세 링크 없음"), 주소, 데이터 출처 "서울 열린데이터광장 / 기준 시각 미확인 · 마지막 갱신 확인되지 않음", 주변 대안 3(모두 57점 "현재 위치에서 가까워요"). 확대(80vh) 시 추가: "혼잡도 정보 — 혼잡도 정보를 불러올 수 없습니다", "날씨 정보 — 날씨 정보를 불러올 수 없습니다", "시설 정보 — 카테고리 공원 / 거리 0.8km / 예약 불가" — `screenshots/desktop-facility-sheet-expanded.png`, `screenshots/desktop-facility-sheet-expanded-bottom.png`. 핸들 클릭으로 50vh↔80vh 토글, Escape 닫힘, 포커스는 시트 안(핸들 버튼) — 좌상단 파란 포커스 사각형(`screenshots/desktop-subway-sheet.png`).
- 지하철 시트(신촌역): 47점 "일반 장소 정보로 판단했습니다.", 데이터 출처 "서울교통공사", "실시간 도착 정보" 섹션은 접힌 상태에서 화면 밖(`screenshots/desktop-subway-sheet.png`, `screenshots/mobile-subway-sheet.png`) — 도착 행 렌더 여부 **미확인**.
- 모바일 시트: 50vh(408px), 액션 2×2(167×40), 확대 80vh — `screenshots/mobile-facility-sheet.png`, `screenshots/mobile-facility-sheet-expanded.png`, `screenshots/mobile-facility-sheet-expanded-bottom.png`.
- z-index: 시트 열림 상태에서 헤더 검색창 `elementFromPoint` = input(헤더 z-50 > 오버레이 z-40) → 모달 뒤 헤더 조작 가능; 패널·컨트롤은 오버레이에 덮임. 닫은 뒤 상태 `screenshots/desktop-after-sheet-close.png`, `screenshots/mobile-after-sheet-close.png`.

**추론**: 시트의 "판단" 카드는 데이터가 없을 때 오히려 가장 길어진다(없음을 세 번 설명). 데스크톱 전폭 시트는 모바일 패턴을 그대로 키운 것이라 정보가 가로로 흩어진다.

**미확인**: 공유·저장 버튼 동작(클릭 안 함 — 쓰기 가능성), 길찾기 새 창, 모바일 드래그 스냅 임계값(터치 드래그 미수행), 실시간 도착 정보 내용, 따릉이 실시간 대수 필드 존재 여부.

### 2.5 사이드 메뉴 · 언어 · 날씨/혼잡도 · 현재 위치 · 줌

**관찰(증거)**
- 사이드 메뉴: 우측 드로어 desktop 384px / mobile 320px(x=70). `role=dialog aria-modal` + 포커스 트랩(Tab 10회 모두 내부: 체크박스 8개 → 카카오 로그인 → 메뉴 닫기), Escape 닫힘. 제목 "지도 마커 설정" + 배지 "10개 선택", 설명 "지도에 표시할 마커를 선택하세요…", 카드형 체크박스 8개(지하철·따릉이·도서관·공원·무더위 쉼터·문화시설·문화행사·문화예약, 모두 checked, 92~110px 높이), 하단 노란 "카카오 로그인" — `screenshots/desktop-sidemenu-open.png`, `screenshots/mobile-sidemenu-open.png`. "도서관" 토글 → 마커·칩 불변 — `screenshots/desktop-sidemenu-library-on.png`, `screenshots/desktop-after-library-on.png`.
- 언어: desktop "English" → `html lang=en`, 건너뛰기 "Skip to map and place results", h1 "Seoul public facility map", placeholder "Search a place or “quiet indoor library”", 패널 "375 places on …/ Gangnam-gu / Seoul now — Live city data is unavailable here, so recommendations use general place data. / Any distance · Open now · Reservable · Indoor / Situation picks / Fits the selected situation · Available indoors · Helps… / Check: Hours are unavailable / Show list / My places" — `screenshots/desktop-lang-en.png`. 날씨 패널은 한국어 그대로 — `screenshots/desktop-lang-en-weather.png`. "한국어" 복귀 OK. mobile: 토글 버튼 폭 0(숨김).
- 날씨 패널: 좌하단 버튼 옆 팝오버(320×211, 흰 카드, 주황 점 + "날씨 정보" + 새로고침 아이콘, 붉은 구름 아이콘 "연결 실패 / 날씨 정보를 불러올 수 없습니다") — `screenshots/desktop-weather-panel.png`, `screenshots/mobile-weather-panel.png`. 배경 클릭 닫힘.
- 혼잡도 패널: 우상단 320×320("실시간 근처 주요 장소 혼잡도", "연결 실패 / 혼잡도 정보를 불러올 수 없습니다", 범례 여유·보통·약간 붐빔·붐빔) — `screenshots/desktop-congestion-panel.png`, `screenshots/mobile-congestion-panel.png`.
- 현재 위치(거부): 변화 없음 — `screenshots/desktop-geolocation-denied.png`, `screenshots/mobile-geolocation-denied.png`.
- 줌: 줌 버튼 없음(`zoomButtons: []`, Kakao ZoomControl 미검출), 좌하단 축척바만.

**추론**: 메뉴의 "마커 설정"이 지도에 반영되지 않으니 설정 화면 전체가 장식처럼 보인다. 날씨/혼잡도 버튼은 패널 뒤에 숨겨져 실패 상태를 발견조차 어렵다.

**미확인**: 영어 모드의 사이드 메뉴·시트 번역 범위, 카카오 로그인 플로우(의도적으로 미실행).

### 2.6 공개 페이지 (/places, 카테고리, 상세, /profile, 404, /auth/callback)

**관찰(증거)**
- `/places`: 회색 배경, "← 지도 보기"(16px 높이 링크), h1 "서울 장소 둘러보기", 카드 6개(2~3열) — 앱 헤더·검색 없음, 시스템 폰트 — `screenshots/mobile-places.png`, `screenshots/tablet-places.png`, `screenshots/desktop-places.png`.
- `/places/library`: 경로 "지도 / 장소 둘러보기", h1 "서울 도서관", "총 432곳", 카드 24개(=12종×2 중복: 4.19혁명기념도서관×2, [페관] 송중문화정보도서관×2, 가락몰도서관×2…), 하단 텍스트 링크 "다음"; page=2 "이전 | 다음" — `screenshots/mobile-places-library.png`, `screenshots/mobile-places-library-page2.png`, `screenshots/desktop-places-library.png`, `screenshots/desktop-places-library-page2.png`, `screenshots/tablet-places-library.png`.
- `/places/park` 총 266곳(중복), `/places/cultural-event` 총 8,000곳(중복, 장소 칸에 "광화문광장 일원"), `/places/cooling-center` 총 8,184곳(원시 태그 줄) — `screenshots/desktop-places-park.png`, `screenshots/desktop-places-cultural-event.png`, `screenshots/desktop-places-cooling-center.png`. `/places/park?page=999` → "표시할 장소 정보가 아직 없습니다." + "이전" — `screenshots/desktop-places-park-page999.png`. `/places/zzz` → Next 기본 404 — `screenshots/desktop-places-bad-category.png`.
- 상세 `/places/library/17930`: 흰 카드(경로 "장소 둘러보기 / 도서관", 파란 라벨 "도서관", h1 "4.19혁명기념도서관", 주소, 운영 정보 "평일 : 08:00~22:00", 지역 종로구, 라벨 없는 "공공도서관 · 일요일 및 법정공휴일", 버튼 "지도에서 보기"(→ `/?lat=37.5675109&lng=126.9655318&place=library:17930`), "전화하기"(tel:), "공식 페이지"(새 창)). 이미지·지도 없음, 카드 아래 공백 — `screenshots/desktop-place-detail.png`, `screenshots/mobile-place-detail.png`, `screenshots/tablet-place-detail.png`.
- `/profile`(비로그인): 즉시 `/`로 리다이렉트, 안내 없음 — `screenshots/mobile-profile-loggedout.png`, `screenshots/mobile-profile-loggedout-4s.png`(지도 홈).
- 404: "404 | This page could not be found." 중앙 영문, 링크·헤더 없음, status 404 — `screenshots/desktop-404.png`, `screenshots/mobile-404.png`, `screenshots/tablet-404.png`.
- `/auth/callback`(파라미터 없음): "❌ / 오류 발생 / 인가 코드가 없습니다. 다시 로그인해 주세요. / 잠시 후 메인 페이지로 이동합니다..." → 3s 내 `/` — `screenshots/desktop-auth-callback-noparams.png`, `screenshots/desktop-auth-callback-noparams-3s.png`, `screenshots/mobile-auth-callback-noparams.png`.
- 공통: 가로 오버플로 없음(3뷰포트 모두 scrollWidth=innerWidth), 깨진 이미지 0(이미지 자체가 0장), 긴 한국어 이름 줄바꿈 정상(longNames 0).

**추론**: 공개 페이지는 "같은 제품" 느낌이 약하다(헤더·검색·로고 없음, 다른 폰트 스택·배경). SEO용으로는 기능하지만 포트폴리오에서 랜딩 역할을 못 한다. 중복 데이터는 SEO·신뢰 양쪽에 치명적.

### 2.7 반응형 (390 / 768 / 1440)

- 390: 위 §2.3·§1 #3·#4·#20 참조. 칩 행(필터·프리셋)은 컨테이너 밖으로 넘치지만(right 441~548) `overflow-x-auto` 내부라 페이지 스크롤은 안 생김.
- 768: `sm` 분기로 헤더에 English·장소 둘러보기 등장, 패널 `md:w-[25rem]`(400px) 좌측 고정, 지도는 우측 368px만 노출(현 지도 2곳) — `screenshots/tablet-profile-loggedout.png`(리다이렉트로 찍힌 768 홈), `screenshots/tablet-places-library.png`(2열 카드).
- 1440: 패널 400px + 지도. 시트는 전폭. 상세 공개 페이지는 최대폭 768 카드 + 빈 하단.
- 고정 요소 가림: 모바일 패널이 마커·컨트롤 가림(#3·#4), 데스크톱 패널이 날씨 버튼 가림(#4). safe-area(`env(safe-area-inset-bottom)`) 사용 흔적 없음 → 노치 기기 **미확인**.

### 2.8 다크 모드

- `prefers-color-scheme: dark` 에뮬레이션(desktop·mobile `/`, desktop `/places`): 변화 없음 — html class "", body `rgb(255,255,255)`, `/places` main `rgb(248,250,252)` — `screenshots/desktop-dark-mode-home.png`, `screenshots/mobile-dark-mode-home.png`, `screenshots/desktop-dark-mode-places.png`. 토글 UI 없음. Kakao 지도 타일도 라이트.

---

## 3. 콘솔 · 네트워크 · 성능 관찰

**콘솔(모든 로드 공통)**: `console.error` 2건 — "[MapView] 위치 가져오기 실패: GeolocationPositionError", "GPS 오류: User denied Geolocation"(권한 거부 시 매 로드). 날씨/혼잡도 토글 시 "Failed to load resource: … 502", "날씨 API 호출 실패: 502 null", "혼잡도 API 호출 실패: 502 null". 404 페이지에서 document 404. **uncaught pageerror 0건, hydration 경고 0건**(React 경고류 미출력). 소스에는 개발 모드 `console.log('지하철 샘플 데이터…')`가 있으나 운영에서는 미출력.

**네트워크 실패**: `/api/weather` 502 ×3, `/api/congestion` 502 ×2(desktop 세션), mobile 각 1회. 줌 변경 시 `mts.kakaocdn.net/.../tile/...png` `net::ERR_ABORTED`(타일 취소, 정상), `/places/*` prefetch ERR_ABORTED(Next Link prefetch 취소, 정상). 그 외 4xx 없음.

**성능(Navigation/Resource Timing, 1회 측정)**
| 항목 | mobile 390 | desktop 1440 |
|---|---|---|
| 문서 responseStart / DCL / load | 472 / 698 / 1388 ms | 239 / 518 / 660 ms |
| HTML transfer / decoded | 6.5 KB / 22.5 KB | 6.5 KB / 22.5 KB |
| first-party JS transfer (chunk 수) | 283 KB (14) | 287 KB (15) |
| CSS transfer | 17 KB (1 파일) | 17 KB |
| `/api/search/index?page=0&size=20000` | 871 KB, 1,597 ms | 854 KB, 834 ms |
| `/api/bike-stations…radius=30` | 106 KB | 105 KB |
| `/api/subway?lat=37.5665&lng=126.9780` | 20 KB **×2(중복)** | 20 KB ×2 |
| `/api/parks/all`, `/api/libraries?all=true` | 25 KB, 18 KB | 25 KB, 18 KB |
| 마커 첫 등장(내비게이션 기준) | 3.12 s | 3.27 s |
- curl 단독: HTML 20.2 KB, TTFB 343 ms, 총 348 ms. Kakao SDK·타일은 cross-origin이라 transferSize 0으로 집계(제외). 웹폰트 요청 없음. Zaraz `/cdn-cgi/zaraz/t` 3회.
- 검색 인덱스는 비압축 4.9 MB(20,000건)이며 전체 30,204건 중 2/3만 로드(두 번째 페이지 미요청).

---

## 4. 접근성 빠른 점검

- **lang**: `html[lang]` ko→en→ko 전환 확인. `<title>`은 미전환.
- **건너뛰기 링크**: 존재("지도와 장소 결과로 건너뛰기", `href="#main-map"`), Tab 첫 순서. Enter 후 `activeElement`가 버튼, `location.hash` 비어 있음 → `main#main-map(tabIndex=-1)`로 포커스 이동 **미확인/의심**(`screenshots/desktop-a11y-first-tab-skiplink.png`에는 링크가 시각적으로 보이지 않음 — 캡처 시점이 body 포커스 상태).
- **포커스 가시성**: 전역 `:focus-visible { outline: 2px solid #2563eb }` 적용, Tab 트레일 14개 모두 outline 있음. 시트 열릴 때 핸들의 포커스 링이 디자인 결함으로 보임(#16).
- **탭 순서**: 헤더 6개 → 지도 마커 DIV(제목=역명, 줌아웃 시 최대 300개) → Kakao `AREA`/로고 `A` → 혼잡도 → 날씨 … 패널은 그 뒤(#27).
- **다이얼로그**: 사이드 메뉴 `role=dialog aria-modal aria-labelledby/describedby` + 트랩 + Escape OK. 시설 시트 `role=dialog aria-modal aria-labelledby=facility-title`, 포커스 내부 이동, Escape OK — 단 헤더가 오버레이 위에 남음. 클러스터 시트 role 없음·포커스 미이동·닫기 버튼 이름 없음. 내 생활 aside `role=dialog` + `useFocusTrap`.
- **아이콘 버튼 이름**: 앱 버튼은 모두 aria-label 보유(혼잡도 보기/날씨 정보 보기/현재 위치로 이동/메뉴 열기/검색어 지우기/드래그하여 크기 조절/확대/닫기 등). 이름 없는 요소: Kakao 로고 링크(img alt는 있음), 클러스터 시트 닫기 버튼.
- **대비(계산값)**: 하단 필 "4개 시설" gray-600(#4b5563) on white/90 ≈ 6:1; 패널 경고 amber-700(#b45309) on white/95 12px ≈ 4.6:1(AA 통과, 크기 작음); 검색 placeholder gray-400 on gray-50(추정 2.5:1, 미계산); "기준 시각 미확인" 11px gray-600 on gray-100 ≈ 5.7:1. 지도 위 흰 반투명 필의 대비는 타일 밝기에 따라 변동(미측정).
- **라이브 영역**: 지역 이동·규칙 적용 상태는 `role=status`로 알림(좋음). 그러나 "언어가 한국어로 변경되었습니다." sr-only status가 상시 렌더(#29).
- **이미지 alt 누락 0**, `prefers-reduced-motion` CSS 존재, `forced-colors` 처리 존재.
- **터치 타깃**: §1 #26.

---

## 5. 포트폴리오 인상 총평

전체적으로 "기능 목록은 길지만 어느 하나도 끝까지 매끄럽지 않은" 인상이다. 심사자가 3분 안에 느낄 미완성 신호 5가지:

1. **핵심 차별점이 죽어 있다** — "서울 지금"(날씨·혼잡도)이 502로 실패하고, 그 실패가 카드·패널·시트·추천 사유 전반에 "미확인/불러올 수 없음"으로 번져 제품 전체가 '데이터 없음' 톤이 된다(#1, #12).
2. **검색이 체험을 배신한다** — placeholder가 "한산한 실내 도서관"을 권하지만 도서관 이름 자체가 검색되지 않고, 가장 기본 쿼리가 빈 지도로 끝나며, 지워도 필터가 남는다(#2, #9).
3. **모바일에서 지도가 보이지 않는다** — 접을 수 없는 패널이 65%를 덮고, 컨트롤 3개가 모두 탭 불가. "지도 서비스"의 1차 과제가 깨져 있다(#3, #4).
4. **추천·프리셋·플래너가 데이터와 따로 논다** — 어디로 가도 시청역이 추천되고, "오늘 행사"가 지하철역을 내놓고, 계획이 같은 역을 세 번 방문한다(#6, #7, #8).
5. **마감 디테일이 기본값 그대로다** — Cloudflare 기본 쿠키 모달, Next 기본 404, 항목이 두 번씩 나오는 목록, 왼쪽에 붙은 시트 핸들과 포커스 사각형, 숫자만 있는 칩, 다크모드 미지원, 모바일 언어 토글 부재(#5, #10, #15, #16, #18, #20, #24).

반대로 **이미 잘 되어 있는 것**(유지할 가치): 서버 랜딩 HTML과 SEO 메타·JSON-LD, 전역 포커스 스타일과 aria-label 커버리지, 사이드 메뉴·시트의 dialog 시맨틱과 Escape 처리, 지역 이동·규칙 적용의 live region, 가로 오버플로 없는 반응형 기본기, Kakao 지도 로딩과 마커 렌더 자체의 안정성(uncaught 에러 0).

---

## 6. 미확인 항목(도달 불가 또는 재현 불안정)

- 모바일 핀치 줌·클러스터 거동(휠 에뮬레이션으로 레벨 변화 없음), 모바일 시트 터치 드래그 스냅.
- 지하철 시트 "실시간 도착 정보" 실제 행 렌더 여부(섹션 제목만 확인), 따릉이 실시간 대수 데이터 유무.
- 공유·저장·길찾기 버튼 클릭 결과(쓰기·외부 이동 가능성으로 미실행), 카카오 로그인 이후 모든 화면(프로필·내 생활·알림).
- 건너뛰기 링크 Enter 후 포커스 목적지, 지도 로딩 스켈레톤의 실제 노출, 첫 실행 `mobile-home-0s.png`의 축소 렌더(재검증에서 미재현).
- 영어 모드의 사이드 메뉴·시트·공개 페이지 번역 범위(공개 페이지는 ko 고정으로 보이나 토글 없음).
- 노치 기기 safe-area, 실제 기기 글꼴 렌더(headless Linux 대체 글꼴로 관찰).
- 강남구 뷰 목록 열림 캡처(`desktop-gangnam-list-open.png` 미생성 — 스크립트 측 문제).
- 검색 인덱스가 제안에 반영되지 않는 정확한 코드 경로(네트워크상 로드는 성공, 콘솔 에러 없음).
