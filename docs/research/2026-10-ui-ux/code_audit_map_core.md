# 서울핏(seoul-fit-fe) map-core 코드 감사 — UI/UX 결함·스타일 불일치·리디자인 제약

- 기준 리비전: `HEAD da98ea5` (commit 2026-09-28, 2026-10-11 체크아웃 상태에서
  읽기 전용 감사). 모든 인용은 저장소 루트 기준 `경로:라인`이며, 라인 번호는
  해당 리비전의 `cat -n` 기준이다.
- 검증 실행 결과(정직 보고): `npm run type-check` 통과(exit 0).
  `npx eslint <scope>` → **138 warnings / 0 errors**(상세는 §4). `npx jest`
  (useMapMarkers·marker·useFocusTrap·place-filter·recommendation·useLocation·entities/facility·shared/ui/layout)
  → **11 suites / 37 tests 모두 통과**, snapshot 0개.
- 브라우저 실행 검증은 하지 않았다(앱 실행·Kakao SDK 키·백엔드 필요). "재현
  추론"으로 표시한 항목은 코드 읽기 기반 추론이며, 실제 동작 확인이 필요한 곳은
  각 항목의 Gaps에 적었다.

---

## 1. 우선순위 결함 표 (P0–P3)

심각도 기준: **P0** 핵심 흐름 파손·데이터 무결성·보안 / **P1** 눈에 띄게 고장난
기능 또는 큰 UX·접근성 공백 / **P2** 체감되는 결함·불일치 / **P3** 폴리시·코드
위생.

| ID   | 심각도 | 파일:라인                                                                                                                                                                                                                                                                                                                                                                   | 증상 / 사용자 영향                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 원인                                                                                                                                                                                                                                                                                                                                                                                                                              | 수정 제안                                                                                                                                                                                                                                                                                                                                          | 관련 테스트                                                                                                                                       |
| ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | P1     | `src/widgets/map-container/ui/MapContainer.tsx:319`, `MapView.tsx:666`, `MapControls.tsx:183-196`                                                                                                                                                                                                                                                                           | 우하단 "현재 위치로 이동" 버튼을 눌러도 아무 일도 없음                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `MapContainerInner`가 `<MapView />`를 props 없이 렌더(319) → `onMoveToCurrentLocation`이 undefined → `MapView.tsx:666`의 폴백 `() => {}`가 버튼에 연결. `MapProvider.tsx:144-146`의 `moveToCurrentLocation`은 어떤 컴포넌트도 소비하지 않음(grep: 정의부 외 0건)                                                                                                                                                                  | MapView에서 `useMapContext().moveToCurrentLocation`을 직접 연결하거나, FacilityProvider의 `updateLocation`과 묶어 "내 위치로 이동 + 주변 데이터 재조회"로 정의. 로딩·거부 피드백 추가                                                                                                                                                              | 없음(신규 테스트 필요)                                                                                                                            |
| D-02 | P1     | `MapView.tsx:707` vs `:686`, `src/shared/lib/hooks/useWeather.ts:69-76`                                                                                                                                                                                                                                                                                                     | 날씨 패널의 새로고침 버튼이 동작하지 않음                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `WeatherPanel`에 `onRefresh={refreshWeatherData}`를 인자 없이 전달(707). `refreshWeatherData(currentLocation?)`는 위치가 없으면 즉시 return(useWeather.ts:71-73). 혼잡도 쪽(686)은 `() => refreshCongestionData(currentLocation)`로 올바르게 전달                                                                                                                                                                                 | `onRefresh={() => refreshWeatherData(currentLocation)}`                                                                                                                                                                                                                                                                                            | 없음                                                                                                                                              |
| D-03 | P1     | `FacilityBottomSheetWrapper.tsx:53-65`, `FacilityBottomSheet.tsx:763-791, 802-833`                                                                                                                                                                                                                                                                                          | 시트를 확장하면 항상 "혼잡도 정보를 불러올 수 없습니다 / 날씨 정보를 불러올 수 없습니다"가 표시됨(실제로는 로드 성공해도)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Wrapper가 `weatherData`·`congestionData` prop을 전달하지 않음(53-65). 시트는 `propCongestionData`/`propWeatherData`(68-69)만 읽음. 날씨·혼잡도 상태는 `MapView` 내부 훅(`MapView.tsx:142-162`)에만 존재                                                                                                                                                                                                                           | 날씨·혼잡도 훅을 Provider(또는 별도 LiveDataContext)로 올려 Wrapper에서 전달하거나, 확장 영역의 두 섹션을 제거하고 explorer의 "서울 지금" 카드와 단일화                                                                                                                                                                                            | 없음                                                                                                                                              |
| D-04 | P1     | `src/widgets/map-container/ui/providers/FacilityProvider.tsx:523-550, 765`, `MapView.tsx:89-99, 629-636`, `src/shared/lib/hooks/useFacilities.ts:20-32`                                                                                                                                                                                                                     | 지도가 뜬 뒤 수 초간 "0개 시설"·빈 지도만 보이고 로딩/실패 안내가 전혀 없음. 일부 데이터 소스 실패도 사용자에게 보이지 않음                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Provider의 통합 `loading`(523-550)과 `error`(765)를 MapView가 구독하지 않음(89-99 구조분해에 없음). MapView의 로딩 오버레이는 전달되지 않는 `loading` prop과 SDK 로딩만 본다(629). `error`의 원천인 `useFacilities`는 빈 배열을 반환하는 stub(24-26)이라 항상 null. 소스별 fetch 실패는 `console.error`로 삼켜짐(FacilityProvider.tsx:218-286)                                                                                    | Provider가 `{ loading, failedSources: string[] }`를 노출 → 지도 위 비차단 상태 칩("주변 시설 불러오는 중…", "따릉이·문화행사 불러오기 실패 · 다시 시도") + 뷰포트 결과 0건 empty state                                                                                                                                                             | `PlaceExplorerPanel.accessibility.test.tsx:51`이 빈 목록 문구 `현재 지도와 필터에 맞는 장소가 없습니다.`를 고정                                   |
| D-05 | P1     | `FacilityProvider.tsx:181-205, 714-738, 742-753`, `MapView.tsx:453-473, 553-609`, `MapContainer.tsx:133-151`, `src/shared/lib/hooks/useSubwayStations.ts:52-59`                                                                                                                                                                                                             | 지역 바로가기·검색으로 다른 지역으로 이동하면 공원·도서관(전역 로드)만 보이고 따릉이·POI·체육·맛집·쉼터·문화 데이터가 없음(사용자에겐 "이 동네엔 시설이 없다"로 보임)                                                                                                                                                                                                                                                                                                                                                                                                                         | 위치 기반 로드(`loadLocationBasedData`, 반경 기본 2km: 184-205)는 최초 geolocation 성공 시 `updateLocation` 1회만 호출됨(MapView.tsx:581). `handleRegionSelect`(453-473)·`revealFacility`(133-151)는 panTo/setLevel만 하고 재조회하지 않음. 이후 `updateLocation`은 0.3km 이내면 스킵(725-730). 지하철역은 좌표가 시청으로 하드코딩된 요청(`useSubwayStations.ts:59` `/api/subway?lat=37.5665&lng=126.9780`)                      | idle 시 "현재 지역 재검색" 버튼(또는 중심 이동 거리 ≥ 반경의 50%일 때 자동 재조회 + 디바운스), 지역 바로가기/검색 이동 시 `updateLocation(lat,lng,true)` 호출, 지하철 요청에 실제 좌표 전달                                                                                                                                                        | 없음                                                                                                                                              |
| D-06 | P1     | `src/shared/lib/hooks/useLocation.ts:161-189, 248-256`, `MapView.tsx:553-610`                                                                                                                                                                                                                                                                                               | (모바일) 지도를 손으로 옮겨도 GPS 갱신 때마다 중심이 내 위치로 되돌아감. 시설 선택 시 `panTo`와 충돌                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `useLocation(mapInstance)`가 맵 생성 100ms 후 `watchPosition`을 자동 시작(248-256)하고, 콜백마다 `mapInstance.setCenter`(167). 동시에 MapView도 `getCurrentPosition`(571)을 별도로 호출 → 지오로케이션 세션 2개                                                                                                                                                                                                                   | watch 콜백에서는 마커 위치만 갱신하고 지도 중심은 "따라가기" 토글이 켜졌을 때만 이동. geolocation 호출 경로를 하나로 통합(MapProvider 또는 FacilityProvider 한 곳)                                                                                                                                                                                 | `useLocation.test.ts`는 simple 모드(옵션 객체 인자)만 고정 — Kakao 모드 변경은 자유                                                               |
| D-07 | P1     | `ClusterBottomSheet.tsx:99-299` (107-112, 129-134), `FacilityBottomSheet.tsx:93, 346-350, 255-271` 과 대비                                                                                                                                                                                                                                                                  | 클러스터 시트는 `role=dialog`·`aria-modal`·포커스 트랩·Escape·아이콘 버튼 라벨이 전부 없음. 키보드·스크린리더 사용자는 닫지 못하거나 배경 포커스가 새어나감. 라벨도 비국제화                                                                                                                                                                                                                                                                                                                                                                                                                  | 시설 시트(`useFocusTrap`, role/aria, Escape)와 달리 클러스터 시트는 수작업 div. 뒤로가기(107)·닫기(129) 버튼 `aria-label` 없음. 렌더 경로에 `console.log` 6곳(60-96)                                                                                                                                                                                                                                                              | 두 시트가 공통 "BottomSheet shell"(overlay·dialog 속성·focus trap·Escape·drag)을 공유. 클러스터 내 시설 클릭은 자체 detail 뷰 대신 `selectFacility(f, 'cluster')`로 위임(Provider가 cluster 선택을 자동 해제: FacilityProvider.tsx:574) — 단 `facility_detail_viewed` 이벤트가 이중 발화하지 않도록 ClusterBottomSheet.tsx:40-43의 trackEvent 제거 | `useFocusTrap.test.tsx`가 trap 계약 고정, `SideBar.test.tsx:31-32`가 dialog 패턴 선례                                                             |
| D-08 | P2     | `FacilityProvider.tsx:623-644, 601-620`, `src/shared/lib/hooks/useMapMarkers.ts:157-164, 265-271`                                                                                                                                                                                                                                                                           | 카테고리 칩을 꺼서 마커가 사라져도 그 시설의 바텀시트는 열린 채 남음. 클러스터 시트는 지도 이동/필터 변경 후에도 이전 스냅샷 시설 목록을 보여줌(stale)                                                                                                                                                                                                                                                                                                                                                                                                                                        | `toggleCategory`는 `activeCategories`만 바꿈. `selectedCluster`는 마커 reconcile 시 새로 만들어지는 cluster 객체와 무관한 스냅샷                                                                                                                                                                                                                                                                                                  | `toggleCategory`에서 선택 시설/클러스터 카테고리가 비활성화되면 `selectFacility(null)`/`selectCluster(null)`. 클러스터 시트는 id로 현재 `clusteredData`에서 다시 조회해 렌더                                                                                                                                                                       | 없음                                                                                                                                              |
| D-09 | P2     | `FacilityBottomSheet.tsx:111-133`                                                                                                                                                                                                                                                                                                                                           | 지하철역 A→B를 빠르게 바꾸면 B 시트에 A의 도착 정보가 잠깐(또는 B 실패 시 계속) 표시됨. HTTP 실패(`response.ok` 미확인)는 "도착 정보가 없습니다"로만 보임                                                                                                                                                                                                                                                                                                                                                                                                                                     | fetch에 AbortController·요청 식별 가드 없음(재현 추론: A 응답이 B 리셋 effect(96-109) 이후 도착하면 `setSubwayArrival(A)`)                                                                                                                                                                                                                                                                                                        | effect cleanup에서 abort, 응답 시 `facility.id` 일치 확인, `response.ok` 미달 시 에러 상태 분리 표시                                                                                                                                                                                                                                               | 없음                                                                                                                                              |
| D-10 | P2     | `FacilityBottomSheet.tsx:159-193, 223-229, 352-363`                                                                                                                                                                                                                                                                                                                         | (데스크톱 마우스) 확장된 시트를 핸들을 잡고 아래로 끌어도 다시 펼쳐짐(접히지 않음)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 재현 추론: mousedown→드래그→mouseup 시 `handleDragEnd`가 `setIsExpanded(false)`를 호출하는데, 시트가 포인터를 따라 내려가므로 mouseup 타깃이 같은 핸들 버튼 → 브라우저가 `click`을 발화 → `onClick={() => setIsExpanded(c => !c)}`(360)가 다시 true로 토글. 위로 끌 때는 시트가 안 움직여 포인터가 핸들을 벗어나므로 정상                                                                                                         | 드래그 거리가 임계값을 넘었으면 다음 click을 무시(ref 플래그) 또는 Pointer Events로 통합하고 click 핸들러를 제거                                                                                                                                                                                                                                   | 없음                                                                                                                                              |
| D-11 | P2     | `FacilityBottomSheet.tsx:196-220`, `:338-345`                                                                                                                                                                                                                                                                                                                               | 터치 드래그 중 콘솔에 "Unable to preventDefault inside passive event listener" 오류. 열림/닫힘 전환 클래스가 효과 없음                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | React 17+는 `touchstart/touchmove`를 passive로 등록 → `e.preventDefault()`(198, 207, 216) 무효. 인라인 `style.transform`(342)이 `translate-y-0/translate-y-full` 클래스(339-340)를 항상 덮어씀. Wrapper가 선택 없으면 null을 반환(Wrapper 51)하므로 `isOpen`은 항상 true → 등장/퇴장 애니메이션 자체가 없음                                                                                                                       | 핸들에 `touch-action: none` + Pointer Events. 등장 애니메이션은 mount 시 `data-state`+`tw-animate-css`(이미 import됨: `app/globals.css:1`)로                                                                                                                                                                                                       | 없음                                                                                                                                              |
| D-12 | P2     | `useMapMarkers.ts:219-226, 350-368`, `MapView.tsx:540-550`, `styles/marker-animations.css:8-12, 108-113`                                                                                                                                                                                                                                                                    | 호버/선택된 마커가 이웃 마커 아래에 깔림. 선택된 시설 마커에 시각적 선택 상태가 없음                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `element.style.zIndex`만 바꾸는데, Kakao `CustomOverlay`는 콘텐츠를 자체 absolute 래퍼에 넣으므로 오버레이 간 순서는 `overlay.setZIndex()`로만 바뀜(재현 추론, 브라우저 확인 필요). `highlightMarker`는 MapView가 호출하지 않음(grep: 훅 정의부 외 0건). `.marker-selected`는 어디서도 적용되지 않음                                                                                                                              | `selectedFacility` 변경 시 해당 entry의 `overlay.setZIndex(1002)` + `element.dataset.selected='true'`로 CSS 상태 제어. hover도 동일                                                                                                                                                                                                                | `useMapMarkers.test.ts`는 mock overlay에 `setZIndex`가 없음 → 호출 추가 시 mock 보강 필요                                                         |
| D-13 | P2     | `MapView.tsx:619-623`, `src/shared/lib/hooks/useCurrentLocationMarker.ts:34-157, 160-164`                                                                                                                                                                                                                                                                                   | 내 위치 파란 점이 렌더마다 재생성되어 펄스 애니메이션이 깜빡이며 리셋됨. 위치 허용 전/거부 시에도 시청 좌표에 파란 점이 찍힘. 점을 드래그하면 지도 중심만 바뀌고 아무 데이터도 안 바뀜                                                                                                                                                                                                                                                                                                                                                                                                        | `currentLocation={{ coords: {...} }}` 객체 리터럴(619)이 매 렌더 새 참조 → effect(160-164) 재실행 → overlay+투명 draggable Marker 재생성. 기본 위치는 `FacilityProvider.tsx:172-176`의 시청 좌표. `onLocationChange`는 console.log(620-623). 마커 HTML에 전역 `@keyframes pulse` `<style>` 블록(80-95)이 매번 주입되며 Tailwind `pulse`(tailwind.config.js:54)와 이름 충돌                                                        | 좌표 primitive를 deps로 쓰고 overlay는 `setPosition`으로 갱신. geolocation 성공 전엔 마커 미표시. 드래그 기능 제거(또는 "여기서 검색"으로 의미 부여). keyframes는 `marker-animations.css`로 이동                                                                                                                                                   | 없음                                                                                                                                              |
| D-14 | P2     | `MapView.tsx:714`, `MapControls.tsx:115`, `src/features/place-filter/ui/PlaceExplorerPanel.tsx:123`, `MapControls.tsx:150`, `FacilityBottomSheet.tsx:328`, `src/widgets/main-app/ui/MainApp.tsx:84`, `ClusterBottomSheet.tsx:99`                                                                                                                                            | 레이아웃 충돌: ① 모바일에서 카테고리 칩 행(`left-3 right-3 top-3 z-30`)이 우상단 혼잡도 버튼(`top-4 right-4 z-30`, DOM상 먼저)을 덮음 ② explorer 패널(`top-14`, `max-h-[calc(100%-7rem)]`, z-30, MapControls보다 뒤에 렌더)이 길어지면 좌하단 날씨 버튼(`bottom-24 md:bottom-20 left-4`)을 덮음 ③ 시설 시트 overlay `z-40`이 sticky 헤더 `z-50`(MainApp.tsx:84) 아래라 aria-modal 다이얼로그가 열린 채 헤더는 밝고 클릭 가능 — 반면 클러스터 시트는 `fixed inset-0 z-50` 컨테이너라 헤더까지 덮음(불일치). 날씨/혼잡도 팝오버 백드롭(`MapView.tsx:671, 693` `fixed inset-0 z-40`)도 헤더 아래 | 같은 z-30 계층에 절대 배치 요소 6개가 서로의 영역을 가정하지 않음. 전역 z-index 스케일 부재                                                                                                                                                                                                                                                                                                                                       | 지도 오버레이 레이어 규약(§3.3) 정의: 상단 바(칩+컨트롤)를 하나의 flex 행으로 묶어 겹침 제거, 좌하단 컨트롤은 explorer 패널 영역 밖(우측 하단 열)으로, modal overlay는 헤더보다 위(`z-[60]`대)                                                                                                                                                     | `PlaceExplorerPanel.accessibility.test.tsx:40-50`이 region 이름·버튼 이름 고정(배치는 자유)                                                       |
| D-15 | P2     | `MapStatusIndicator.tsx:59-64`, `MapView.tsx:792, 717`, `PlaceExplorerPanel.tsx:130`, `useMapMarkers.ts:328-329`                                                                                                                                                                                                                                                            | 같은 화면에 서로 다른 "개수" 3종: 우하단 "N개 시설"(마커 오버레이 수, 클러스터=1), explorer "현 지도 N곳"(뷰포트 시설 수), 칩의 숫자(전역 로드 수, 뷰포트 무관)                                                                                                                                                                                                                                                                                                                                                                                                                               | 집계 기준이 각각 다름                                                                                                                                                                                                                                                                                                                                                                                                             | 뷰포트 시설 수 하나로 통일(칩은 뷰포트 카운트 또는 숫자 제거), MapStatusIndicator의 카운트 필 제거                                                                                                                                                                                                                                                 | `messages.ts:28, 39` 키 유지                                                                                                                      |
| D-16 | P2     | `MapView.tsx:589-596`, `src/shared/lib/hooks/useKakaoMap.ts:120-132, 91-112`                                                                                                                                                                                                                                                                                                | 위치 권한 거부 시 아무 안내 없이 시청 중심에 머묾. SDK 스크립트가 로드됐지만 `kakao.maps`가 없거나 응답이 지연되면 스켈레톤이 영원히 유지됨                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 거부 처리는 console+analytics만(589-596). 신규 script 경로(116-139)에는 타임아웃이 없고(`onload` 후 `kakao.maps` 부재 시 console.error만, 130), 기존 script 경로(95-110)만 5초 타임아웃                                                                                                                                                                                                                                           | 거부/불가 시 토스트 또는 상태 칩("위치를 알 수 없어 서울시청 기준으로 보여드려요 · 내 위치 허용"). SDK 로드에 단일 타임아웃(예: 10s) → 에러 카드                                                                                                                                                                                                   | 없음                                                                                                                                              |
| D-17 | P2     | `src/shared/lib/icons/facility.tsx:50 vs :128`, `:57 vs :130`, `:36/:64/:92 vs :122`, `:151-156`, `FacilityBottomSheet.tsx:370-371`, `src/shared/api/congestion.ts:29`, `MapControls.tsx:66-67`                                                                                                                                                                             | 카테고리 색이 마커(hex)와 칩/시트(Tailwind 클래스) 사이에서 어긋나고, 구분이 어려운 색이 몰려 있음                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 도서관: 마커 `#10B981`(실제 emerald-500, 주석은 "green-500")·칩 `bg-green-500`(#22c55e) 불일치. 공원 emerald-600 vs 도서관 emerald-500 거의 동일. 문화 purple-500 / 문화예약 violet-500 / 지하철 indigo-500 / 체육 blue-500 4색이 근접. 지하철 마커는 호선색(151-156)인데 시트 헤더 아이콘은 `route={undefined}`로 항상 indigo(370-371). 혼잡도 '보통'은 `#f59e0b`(amber-500, 주석 "yellow-500") vs 버튼 `bg-yellow-500`(#eab308) | 카테고리 색을 **단일 토큰 소스**(CSS 변수 `--cat-park` 등)로 정의하고 hex·클래스 양쪽이 같은 값을 참조. 팔레트는 10개 범주 간 지각 거리 확보(§3.1 제안)                                                                                                                                                                                            | `useMapMarkers.test.ts`는 색을 검사하지 않음                                                                                                      |
| D-18 | P2     | `ClusterBottomSheet.tsx:8-19`, `facility.tsx:79`, `src/shared/i18n/messages.ts:133`, `FacilityBottomSheet.tsx:732-747, 761-762, 766-767, 788-789, 800-831, 840-860, 869-915, 941`, `MapView.tsx:730`, `CongestionPanel.tsx`, `WeatherPanel.tsx`, `src/features/recommendation/lib/live-data.ts:11-16`, `src/entities/facility/lib/provenance.ts:24-32`, `messages.ts:80-83` | 한국어 카피 불일치·비국제화: "무더위쉼터"(ClusterBottomSheet:16) vs "무더위 쉼터"(facility.tsx:79, messages.ts:133); 시설 시트는 `t()`와 하드코딩 한국어가 섞임(en 로케일에서 한국어 잔존); 칩 aria-label(730)·혼잡도/날씨 패널 전체 하드코딩. 신선도 라벨 3벌: `freshness.live`='실시간'(messages), live-data `live`='정상 갱신', provenance `live`='실시간'; 신선도 판정 임계값도 다름(live-data 60분=recent 상한, provenance 24시간)                                                                                                                                                       | 카테고리 라벨·신선도 라벨을 `messages.ts` 단일 소스로, 임계값 상수를 공유                                                                                                                                                                                                                                                                                                                                                         | `PlaceExplorerPanel.accessibility.test.tsx`는 `t()` 결과 문자열 고정 → messages.ts 값 변경 시 테스트 동반 수정                                                                                                                                                                                                                                     |
| D-19 | P2     | `MapControls.tsx:140, 121`                                                                                                                                                                                                                                                                                                                                                  | 혼잡도 버튼 배지가 "약간 붐빔"을 "약간"으로 잘라 보여줌. 로딩 중엔 토글 버튼이 `disabled`라 패널을 버튼으로 닫을 수 없음                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `AREA_CONGEST_LVL.slice(0, 2)`; `disabled={congestionLoading}`                                                                                                                                                                                                                                                                                                                                                                    | 레벨→짧은 라벨 매핑(여유/보통/혼잡/매우혼잡) 또는 색 점만; 로딩 중에도 닫기 허용                                                                                                                                                                                                                                                                   | 없음                                                                                                                                              |
| D-20 | P3     | 아래 §3.5 표                                                                                                                                                                                                                                                                                                                                                                | 사용되지 않는 중복 구현 다수(마커 파이프라인 2벌, 시트 외 FacilityList·FacilityFilter·SideBar 중복 등)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | FSD 마이그레이션 잔재                                                                                                                                                                                                                                                                                                                                                                                                             | 삭제 목록 §3.5                                                                                                                                                                                                                                                                                                                                     | `marker.test.ts`가 `marker.ts`의 레거시 함수(createPOIMarkerContent·formatInfoWindowContent·getCrowdLevelClass)를 고정 → 삭제 시 테스트 동반 정리 |
| D-21 | P3     | `MapView.tsx:257-260, 280-282, 318-321`, `FacilityProvider.tsx`(console 다수), `ClusterBottomSheet.tsx:60-96`, `next.config`                                                                                                                                                                                                                                                | 프로덕션 콘솔 노이즈(idle마다 3줄, 렌더마다 로그). ESLint `no-console` 경고 68건                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `removeConsole` 미설정(next.config.\*에 없음), `reactStrictMode: false`                                                                                                                                                                                                                                                                                                                                                           | 로거 유틸 + `process.env.NODE_ENV` 가드, 또는 `compiler.removeConsole`                                                                                                                                                                                                                                                                             | —                                                                                                                                                 |
| D-22 | P3     | `src/shared/lib/hooks/useZoomLevel.ts:125-127`, `useKakaoMap.ts:96-110, 149-157`                                                                                                                                                                                                                                                                                            | 리스너/인터벌 누수 가능                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Kakao `event.addListener`는 반환값이 없는데 그 값을 `removeListener(handle)`에 넘김(시그니처는 `(target, type, handler)`) → 제거 안 됨. 폴링 interval은 unmount 시 clear 없음. 맵 인스턴스는 cleanup에서 파괴/컨테이너 정리 없음                                                                                                                                                                                                  | `(mapInstance, 'zoom_changed', handler)`로 제거; interval ref로 clear                                                                                                                                                                                                                                                                              | 없음                                                                                                                                              |
| D-23 | P3     | `MapView.tsx:494-507`, `FacilityBottomSheet.tsx:255-271`, `ClusterBottomSheet.tsx:165`                                                                                                                                                                                                                                                                                      | 지도 클릭 시 숨긴 카테고리의 지하철역도 열림(전체 facilities 참조). 시트 열림 중 문서 전체 ArrowUp/Down이 확장 토글(셀렉트·스크롤 중에도). 클러스터 목록 key가 `facility.id`만 사용(카테고리 간 id 충돌 가능; 마커 key는 `category:id`)                                                                                                                                                                                                                                                                                                                                                       | —                                                                                                                                                                                                                                                                                                                                                                                                                                 | 필터된 목록 사용, 키 핸들러에 `event.target` 가드, key에 category 포함                                                                                                                                                                                                                                                                             | 없음                                                                                                                                              |

---

## 2. 현재 구조

### 2.1 카테고리 → 색/아이콘/라벨 매핑 (정의 위치 전수)

#### Takeaway

카테고리 색은 **hex(마커)와 Tailwind 클래스(칩·시트·사이드바)로 두 벌** 정의되어
수작업 동기화에 의존하고, 라벨은 i18n·FACILITY_CONFIGS·ClusterBottomSheet 세
벌이다. 지하철만 호선색 예외를 가진다.

#### Cited Findings

- `FACILITY_CONFIGS` (`src/shared/lib/icons/facility.tsx:26-97`):
  `{ icon: ReactNode(lucide), color: Tailwind 클래스, label, description, svgIcon: 문자열 SVG 16px }`.
  색 클래스: sports `bg-blue-500`(29), culture `bg-purple-500`(36), restaurant
  `bg-red-500`(43), library `bg-green-500`(50), park `bg-emerald-600`(57),
  subway `bg-indigo-500`(64), bike `bg-lime-500`(71), cooling_shelter
  `bg-cyan-500`(78), cultural_event `bg-pink-500`(85), cultural_reservation
  `bg-violet-500`(92).
- `getCategoryColor` hex (`facility.tsx:119-144`):
  `#3B82F6, #A855F7, #EF4444, #10B981, #059669, #6366F1, #84CC16, #06B6D4, #EC4899, #8B5CF6`,
  default `#6B7280`.
- `getFacilityIcon(category, facility?)` (`facility.tsx:147-162`) →
  `{ svg, color(hex) }`; subway + `facility.subwayStation.route`가 있으면
  `getSubwayIconSVG`/`getSubwayLineColor`로 대체(151-156). 호선 색표
  `SUBWAY_LINE_COLORS` (`src/shared/lib/icons/subway-colors.ts:4-52`, default
  `#6366F1`), 부분 일치·숫자 추출 매칭(55-80), 지하철 SVG는 24px(83-94; 다른
  범주는 16px).
- 혼잡도 색: `getCrowdColor` (`facility.tsx:105-116`),
  `getCongestionClass`/`getCongestionColor`
  (`src/shared/api/congestion.ts:6-37`), `MapControls.tsx:53-92` (버튼/배지
  클래스 2벌), `MapStatusIndicator.tsx:25-40`, `FacilityBottomSheet.tsx:769-776`
  (인라인 삼항), 따릉이 배지 hex (`src/shared/lib/utils/marker.ts:107-114`), CSS
  `.marker-crowd-*` (`styles/marker-animations.css:15-26`) — 동일 의미 색 정의
  **7곳**.
- 라벨: i18n `category.*` (`src/shared/i18n/messages.ts:126-135`),
  `FACILITY_CONFIGS.label`, `ClusterBottomSheet.tsx:8-19 FACILITY_LABELS`,
  출처명 `CATEGORY_SOURCES` (`src/entities/facility/lib/provenance.ts:11-22`).
- `FACILITY_CONFIGS.color`(클래스) 소비처: `MapView.tsx:742`(칩),
  `FacilityBottomSheet.tsx:377`(헤더 아이콘), `FacilityFilter.tsx:109`,
  `FacilityList.tsx:74`, `src/shared/ui/layout/SideBar.tsx:186`,
  `src/widgets/sidebar/ui/SideBar.tsx`, `src/features/auth/ui/SignupForm.tsx`.
  hex 소비처: 마커(`marker.ts:95-96`), 클러스터(`useMapMarkers.ts:42-48`),
  `ClusterBottomSheet.tsx:150`(inline style), `SubwayStationIcon.tsx:36`(inline
  style).

#### Inferences

- 토큰 마이그레이션의 최소 단위는 "카테고리 색 10개 + 혼잡도 4단계 + 신선도
  4단계"를 CSS 변수로 올리고 `FACILITY_CONFIGS`가 변수명만 들고 있게 하는
  것이다. 마커 HTML은 `background: var(--cat-park)`처럼 CSS 변수를 그대로 쓸 수
  있다(Kakao overlay DOM은 문서 안에 있으므로 `:root` 변수 상속).
- D-17의 도서관 불일치는 주석("green-500")이 실제 값(emerald-500)과 다른 데서
  생긴 전형적 이중 정의 버그다.

#### Gaps

- 실제 화면에서 공원/도서관, 문화/문화예약/지하철 마커의 식별 가능성은 렌더 확인
  전이다(색 거리 계산으로 추론).

### 2.2 마커 렌더링 파이프라인 (데이터 → DOM)

#### Takeaway

활성 경로는
`MapView → useMapMarkers(shared) → kakao.maps.CustomOverlay(HTMLElement content)`
하나이며, 마커는 **HTML 문자열 → `<template>`로 DOM화 → 요소에 직접 이벤트
바인딩**이다. 클러스터링은 **동일 좌표(소수 6자리) 그룹화**일 뿐 거리/줌 기반이
아니다. key 기반 reconcile로 오버레이를 재사용한다.

#### Cited Findings

- 가시 집합 계산: `getFilteredFacilities()`(카테고리,
  `FacilityProvider.tsx:664-692`) → `applyPlaceFilters`(거리·운영·예약·실내·혼잡
  필터, 거리 계산해 **새 객체로 복제**, 거리순 정렬;
  `src/features/place-filter/lib/place-filter.ts:83-117`) → 뷰포트 bounds + 줌별
  margin 필터(`MapView.tsx:206-296`) → `idle`마다 `zoomUpdateTrigger`
  증가(516-519) → 50ms 디바운스 후 `debouncedFacilities`(307-331).
- `useMapMarkers` (`src/shared/lib/hooks/useMapMarkers.ts`): 좌표 유효성
  필터(123-131) → `lat.toFixed(6),lng.toFixed(6)` 키로 그룹(133) → 2개 이상이면
  cluster(`id: cluster-${locationKey}`, `primaryCategory` 최빈값, `radius 0.01`;
  157-164) → descriptor
  `{ key: facility:${category}:${id} | cluster:${id}, content(HTML string), positionSignature, zIndex 1000/1001 }`(170-198)
  → reconcile: 사라진 key `cleanupEvents()+setMap(null)`(265-271), 남은 key는
  `setPosition`/`setContent` 조건부 갱신(277-298), 새 key는
  `new kakaoMaps.CustomOverlay({ position, content: element, xAnchor: 0.5, yAnchor: 1, zIndex })`(300-326).
- DOM화: `createMarkerElement` =
  `document.createElement('template').innerHTML = content` 후
  `firstElementChild`(84-94). 이벤트: click / keydown(Enter·Space) / mouseenter
  / mouseleave, `role=button`, `tabIndex=0`, `aria-label`(시설명 또는
  `N개 시설 모음`)(200-241, 96-97). 클릭은 ref로 최신 콜백 호출(205-213) →
  `MapView.handleFacilitySelect`(384-400): `selectFacility(f,'map_marker')` +
  `panTo` + 레벨 > 4면 `setLevel(4)`.
- 마커 HTML(`marker.ts:88-180`): 36×36 원, `border: 3px solid white`,
  `background-color: {hex}`, `box-shadow 0 2px 8px rgba(0,0,0,.3)`, 내부 svg
  16px, **꼬리는 `bottom:-8px`**(165-176) — `yAnchor: 1`이라 요소 하단이 좌표에
  맞고 꼬리 끝은 좌표보다 8px 아래에 찍힘. 따릉이 가용 대수 배지 12px(102-130).
  `id="marker-${escapeHtml(id)}"`, `data-facility-id`, `data-category`,
  `data-crowd-level`(134-138).
- 클러스터 HTML(`useMapMarkers.ts:38-82`): 40×40 원 + 우상단 `#ff4444` 20px
  카운트 배지, `id="marker-${cluster.id}"`(45, 이스케이프 없음 — id는 숫자
  조합이라 안전).
- 현재 위치 마커: `useCurrentLocationMarker.ts:49-105` CustomOverlay(zIndex 999,
  20px 점 + 40px 펄스) + 투명 draggable `Marker`(zIndex 998, 110-115).
- 보안/이스케이프: `escapeHtml`(`marker.ts:5-16`, **module-private, export 안
  됨**)은 id에만 적용. svg는 신뢰 상수. `data-category`/`data-crowd-level`은
  enum. `marker.test.ts:16-30`이 POI 이름/코드 이스케이프와 info window의
  `javascript:` 거부를 고정. `useMapMarkers.test.ts:79-95`는 숫자 id
  정규화(`String(facility.id)`, `useMapMarkers.ts:173`)를 고정.
- CSS 개입: `.custom-marker { transition }`,
  `:hover { transform: scale(1.1) !important; z-index: 1001 !important; filter: drop-shadow }`(`marker-animations.css:4-12`),
  모바일 크기 강제 `!important`(183-205) — 인라인 스타일(hover JS, highlight)과
  충돌한다.
- 레거시 파이프라인(미사용):
  `src/features/map-markers/model/use-markers.ts`(전량 재생성 방식,
  `document.getElementById`로 이벤트 바인딩), `use-clustering.ts`,
  `src/shared/lib/hooks/useClusteredMarkers.ts`,
  `src/shared/lib/clustering/index.ts`(grid/DBSCAN/merge 알고리즘).

#### Inferences

- 리디자인 마커(필 형태 + 아이콘 + 이름 라벨 + 선택/호버 + 카운트 버블)는 현
  파이프라인에서 **descriptor.content 생성 함수만 교체**하면 되며,
  reconcile·이벤트·접근성 계약은 유지된다. 단 (a) 시설명 등 외부 데이터 문자열을
  넣으려면 `escapeHtml`을 export 하거나 `textContent`로 DOM을 직접 조립해야
  하고(현재는 id만 이스케이프), (b) `yAnchor: 1` 기준이므로 라벨이 아래로 뻗는
  레이아웃은 좌표 위치를 흐리게 하므로 핀 하단=좌표 규칙을 유지하고 라벨은
  옆/위로, (c) 가로폭이 가변인 필은 `xAnchor` 계산을 핀 중심 기준으로 바꿔야
  한다(현재 0.5 고정), (d) 호버/선택 z-order는 `overlay.setZIndex`를 사용(D-12),
  (e) 콘텐츠가 바뀌면 요소를 통째로 교체(287-296)하므로 선택 상태를 content
  문자열에 넣으면 선택 시 DOM이 재생성된다 → 선택/호버는 `dataset`+CSS로,
  content에는 넣지 않는 편이 안전.
- 클러스터는 "같은 건물의 여러 시설"만 묶으므로 줌아웃 시 수백 개의 마커가
  그대로 그려진다(뷰포트 필터만 있음). 거리 기반 클러스터링이 필요하면 미사용
  `gridBasedClustering`/`dynamicClustering`(`clustering/index.ts:124-161, 273-285`)을
  되살리는 선택지가 있다.

#### Gaps

- Kakao `CustomOverlay` 래퍼 DOM이 별도 stacking context를 만드는지(즉
  `#kakaoMap` 내부 z-index 1000대가 MapView의 z-30 컨트롤 위로 새지 않는지)는
  실행 확인이 필요하다. 현재 UI가 동작하는 것으로 보아 Kakao 컨테이너가
  context를 만드는 것으로 추정.

### 2.3 바텀시트 마운트·높이·드래그·스크롤·접근성

#### Takeaway

두 시트는 `MapContainerInner`의 지도 div 안에 fixed로 떠 있고, 시설 시트는
inline style로 높이(auto/80vh)·translateY를 제어하는 2단 스냅(접힘 ≤50vh / 확장
80vh)이며, 접근성은 시설 시트만 갖췄다. 헤더(sticky z-50)와의 z-order는 두
시트가 서로 다르다.

#### Cited Findings

- 마운트: `MapContainer.tsx:317-325` — `<div className={className}>` 안에
  `<Suspense><MapView/></Suspense>`, `<ClusterBottomSheetWrapper/>`,
  `<FacilityBottomSheetWrapper/>`, sr-only `role=status`(검색 선택 메시지).
  Wrapper는 `useFacilityContext()`의 `selectedFacility`/`selectedCluster`가
  없으면 null(`FacilityBottomSheetWrapper.tsx:51`,
  `ClusterBottomSheetWrapper.tsx:8-10`). 전체는 `MainApp.tsx:76-113`의
  `h-screen flex-col` → sticky 헤더(84) → `main.relative.flex-1`(108-113) 안.
- 시설 시트(`FacilityBottomSheet.tsx`): overlay
  `fixed inset-0 bg-black/40 backdrop-blur-sm z-40`(327-333), 패널
  `fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50`(338) +
  inline `transform: translateY(px)`, `height: auto | 80vh`,
  `maxHeight: 50vh | 80vh`(318-345). 콘텐츠 스크롤
  `overflow-y-auto overscroll-contain max-h-[calc(50vh-120px)] / [calc(80vh-120px)]` +
  inline `WebkitOverflowScrolling`, `scrollbarWidth`(421-430). 드래그: 핸들
  `<button>`에 touch/mouse 시작(352-363), 전역 mousemove/up(232-253), 종료
  임계값 80px(빠른 스와이프 velocity > 0.5px/ms면 30px)(159-193). 아래로 끌면
  확장→접힘→닫힘, 위로 끌면 확장. 키보드: Escape 닫기, ArrowUp/Down
  확장/축소(255-271). 접근성:
  `role=dialog aria-modal aria-labelledby=facility-title tabIndex=-1`(346-350) +
  `useFocusTrap(sheetRef, isOpen)`(93; onEscape 미전달, 포커스 복귀 포함
  `useFocusTrap.ts:25-64`). 아이콘 버튼 모두 `aria-label`(360, 400, 413).
- 클러스터 시트(`ClusterBottomSheet.tsx`):
  `fixed inset-0 z-50 flex items-end`(99) + `bg-black/20` 백드롭(100), 패널
  `rounded-t-2xl max-h-[80vh]`(102), 스크롤 `max-h-[calc(80vh-120px)]`(138),
  드래그·스냅·dialog 속성·focus trap·Escape 없음. 이미지 모달 코드(276-298)는
  `setImageModalOpen(true)` 호출처가 없어 도달 불가.
- 충돌: §1 D-14 참조. explorer 패널(`PlaceExplorerPanel.tsx:123`)은 absolute
  z-30이라 시트 overlay(z-40) 아래로 들어가 정상 차폐되지만, `main`·지도 div가
  stacking context를 만들지 않으므로 시트는 루트 컨텍스트에서 헤더(z-50, DOM
  선행)와 경쟁한다.

#### Inferences

- 리디자인 시 공통 "Sheet shell"로 묶으면 D-07·D-10·D-11·D-14③이 한 번에
  정리된다. Radix Dialog(`@radix-ui/react-dialog` 이미 의존성에 있음,
  `package.json`)로 overlay/portal/focus/Escape를 위임하고 스냅만 자체 구현하는
  경로가 가장 저렴하다.
- `useFocusTrap`은 첫 포커스 가능 요소(= 드래그 핸들 버튼)에 포커스를 둔다.
  핸들을 버튼이 아닌 요소로 바꾸면 `initialFocusRef`로 닫기 버튼을 지정해야
  한다(`useFocusTrap.ts:18, 33`).

#### Gaps

- 포커스 복귀 대상이 마커(role=button) 요소인데, 시트가 열린 사이 reconcile로
  마커 DOM이 교체되면 복귀 포커스가 유실될 수 있다(실행 확인 필요).

### 2.4 z-index 인벤토리 (전수, 파일:라인)

| 값                             | 위치                                                                                                                                                                                                                          | 역할                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `z-10`                         | `MapView.tsx:630`                                                                                                                                                                                                             | SDK 로딩 스켈레톤 오버레이                              |
| `z-10`                         | `ClusterBottomSheet.tsx:292`, `EngagementPanel.tsx:204`                                                                                                                                                                       | 모달 내부 닫기 버튼 / sticky 헤더                       |
| `z-20`                         | `MapView.tsx:643`                                                                                                                                                                                                             | 지도 오류 카드                                          |
| `z-30`                         | `MapView.tsx:714`(카테고리 칩), `MapControls.tsx:115, 150, 182`(혼잡도·날씨·내위치 버튼), `MapStatusIndicator.tsx:59, 67`(카운트·미니상태), `PlaceExplorerPanel.tsx:123`(탐색 패널)                                           | 지도 위 컨트롤 계층(동일 값 7개)                        |
| `z-40`                         | `MapView.tsx:671, 693`(팝오버 백드롭), `FacilityBottomSheet.tsx:328`(시트 overlay), `EngagementPanel.tsx:192`                                                                                                                 | 반투명 백드롭                                           |
| `z-50`                         | `MapView.tsx:676, 697`(혼잡도·날씨 팝오버), `FacilityBottomSheet.tsx:338`, `ClusterBottomSheet.tsx:99`, `EngagementPanel.tsx:202`, `MainApp.tsx:84`(sticky 헤더), `Header.tsx:431`(검색 드롭다운), `app/profile/page.tsx:309` | 모달/패널/헤더가 같은 값                                |
| `z-[59]`/`z-[60]`              | `src/shared/ui/layout/SideBar.tsx:93, 101`, `src/widgets/sidebar/ui/SideBar.tsx:120, 132`, `ClusterBottomSheet.tsx:278`(이미지 모달)                                                                                          | 사이드바·이미지 모달                                    |
| `z-[100]`                      | `MainApp.tsx:79`                                                                                                                                                                                                              | skip link                                               |
| 998 / 999 / 1000 / 1001 / 1002 | `useCurrentLocationMarker.ts:114, 104`, `useMapMarkers.ts:185, 194, 221, 225, 355, 364`, `marker.ts:56, 127, 152, 262`, `marker-animations.css:10, 110, 130`, `use-markers.ts`·`marker-factory.ts`(레거시)                    | Kakao 오버레이 내부 계층(매직 넘버 하드코딩, 토큰 없음) |
| `z-index: 2`                   | `useCurrentLocationMarker.ts:67`                                                                                                                                                                                              | 현재위치 점 내부                                        |

### 2.5 상태 전이: 지도 로딩 / SDK 실패 / 데이터 로딩 / 빈 결과 / 신선도

#### Takeaway

SDK 상태(로딩·성공·오류)만 UI가 있고, **시설 데이터 로딩·소스별 실패·위치 권한
거부·뷰포트 빈 결과(지도 자체)·지역 이동 후 미갱신 데이터**는 UI가 없다.
"실시간/신선도" 문구는 4개 서피스에 서로 다른 라벨·임계값으로 흩어져 있다.

#### Cited Findings

- SDK: `useKakaoMap.ts:18-23` 초기 `{loading:true}` → 100ms 대기(77) → 이미
  로드/기존 script 폴링(≤5s, 95-110)/신규 script(116-139) → `createMap`(25-67) →
  `{success}` 또는
  `{error: '지도 컨테이너를 찾을 수 없습니다' | '카카오맵 API를 찾을 수 없습니다' | '카카오맵 로드 타임아웃' | '카카오맵 로드 실패' | message}`.
  UI: 스켈레톤(`MapView.tsx:629-636`), 오류 카드 + 새로고침(642-654, en은
  `map.loadError`, ko는 원문 메시지), `map_ready` 이벤트(173-178). MainApp도
  `mapStatus.error`를 Alert로 한 번 더 표시(`MainApp.tsx:100-105`) → 오류 시
  메시지 2중 노출 가능.
- 데이터: `FacilityProvider.tsx:307-345` 마운트 시 공원·도서관 전역 로드(각
  1000건) → MapView geolocation 성공 시 `updateLocation`(581) →
  `loadLocationBasedData`(181-305) 8개 소스 병렬, 실패는 `.catch` 로그.
  `loading` 통합(523-550)·`error`(765)는 미소비(D-04). 위치 거부 시 데이터 로드
  없음(589-596 주석 "실패 시에도 데이터는 로드하지 않음").
- 빈 결과: explorer 목록 열림 상태에서만 "현재 지도와 필터에 맞는 장소가
  없습니다"(`PlaceExplorerPanel.tsx:394-398`, `messages.ts:71`), 추천 0건
  문구(371-375). 지도 자체·칩·카운트 필에는 empty state
  없음(`MapStatusIndicator.tsx:59-64`는 "0개 시설"만).
- 신선도/실시간 문구 출현: `CongestionPanel.tsx:32` "실시간 근처 주요 장소
  혼잡도"(제목), `CongestionPanel.tsx:93`·`WeatherPanel.tsx:94`
  `getLiveDataStatus().label`('정상 갱신'/'최근 조회'/'갱신 지연'/'기준 시각
  미확인', `live-data.ts:11-16`, 임계 15분/60분), explorer "서울 지금" 배지
  `freshness.*`('실시간'/'최근 갱신'/'갱신 지연'/'기준 시각 미확인',
  `messages.ts:80-83`; `PlaceExplorerPanel.tsx:247-259`), 시설 시트 출처 행
  `facility.lastUpdated` +
  `facility.staleWarning`(`FacilityBottomSheet.tsx:644-660`; provenance 임계
  15분/24시간, `provenance.ts:44-47`), 지하철 "실시간" 필(732) 및
  `facility.realtimeArrival`(124), 미사용 `FacilityFilter.tsx:138` "실시간으로
  지도가 업데이트".
- 날씨/혼잡도 패널 상태 머신(`useCongestion.ts`/`useWeather.ts:14-51`): idle →
  loading → data | error('…찾을 수 없습니다' / '…실패했습니다'). 패널은
  loading/data/error/empty 4분기(`CongestionPanel.tsx:49-57`,
  `WeatherPanel.tsx:48-56`)이지만 ErrorState는 `congestionError` 문자열을 쓰지
  않고 고정 문구 "연결 실패"(119-127).

#### Inferences

- 포트폴리오 품질을 위해 가장 체감이 큰 공백은 "첫 3-5초의 빈 지도"(D-04)와
  "이동 후 빈 동네"(D-05)다. 상태 칩 하나(로딩/부분 실패/권한 거부/재검색)를
  지도 상단 중앙에 두면 네 가지를 한 컴포넌트로 해결할 수 있다.
- 신선도 라벨은 explorer 배지 기준(`freshness.*`)으로 통일하고, live-data와
  provenance의 임계값을 하나의 상수로 합치는 것이 맞다(라이브 도시데이터
  15분/60분, 정적 시설 데이터 24시간은 의도적 차이일 수 있으니 주석으로 명시).

#### Gaps

- 각 API 라우트의 서버측 반경(문화·쉼터 등 `fetchX(lat,lng)`에 반경 미전달)은
  확인하지 않았다. D-05의 "데이터 없음" 범위는 라우트 구현에 따라 다를 수 있다.

### 2.6 경쟁 조건·stale 상태 (재현 추론 포함)

#### Takeaway

치명적 레이스는 없으나, 지하철 도착 fetch(D-09)·드래그/클릭 이중 발화(D-10)·GPS
watch 재중심(D-06)·현재위치 마커 재생성(D-13)·선택 상태 미해제(D-08)가 체감
가능한 결함이다. 마커 reconcile 자체는 key 재사용으로 안정적이다(테스트로 고정).

#### Cited Findings

- 마커 재생성 여부: `debouncedFacilities`는 idle마다 새
  배열(`MapView.tsx:310-311`)이고 `applyPlaceFilters`가 객체를 복제하지만,
  `useMapMarkers`는 `content` 문자열 비교로 DOM 교체를 결정(287-296)하므로
  **불필요한 재생성은 없음**(`useMapMarkers.test.ts:47-77`가 보장). 단 content
  문자열은 매 idle마다 전 시설 분량을 재생성(170-198).
- bounds 조회 빈도: `idle`에서만 `getBounds` 호출(206-296) + 50ms 디바운스(322)
  — 과도하지 않음. 그러나 `getVisibleFacilities` deps에
  `facilities.length`·`activeCategories`가 불필요하게 들어가 있고(ESLint
  exhaustive-deps 경고, 289-296) 호출 때마다 console.log 3줄.
- stale closure: `MapView.tsx:477-478` 렌더 중 ref 대입(`react-hooks/refs`
  경고)으로 지도 클릭 핸들러가 전체 facilities를 참조(D-23).
  `useMapMarkers.ts:116-117`도 같은 패턴(콜백 최신화 목적, 동작은 정상).
- 리스너 정리: MapView의 click/idle은 `(target,type,handler)`로 올바르게
  제거(524-535). `useZoomLevel`은 잘못된 인자(D-22).
- Strict/StrictMode: `next.config`에 `reactStrictMode: false`(주석: "개발
  환경에서 중복 렌더링 방지") — effect 이중 실행 결함(맵 2회 생성 등)을 가려둔
  상태.
- 선택 상태: `selectFacility`가 cluster를 해제(`FacilityProvider.tsx:574`),
  `selectCluster`가 facility를 해제(615-616) → 두 시트 동시 열림은 없음.

#### Inferences

- `toggleCongestionDisplay`/`toggleWeatherDisplay`는 `setState` updater 안에서
  fetch를 호출(`useCongestion.ts:55-64`) → StrictMode를 켜면 이중 fetch가
  드러난다. 리디자인과 함께 StrictMode를 켜려면 이 둘과 `useKakaoMap`
  정리(D-22)를 먼저 고쳐야 한다.

#### Gaps

- D-10·D-12는 브라우저 이벤트 순서·Kakao DOM 구조에 의존하는 추론이다. 수정 전
  headless Playwright로 재현을 권장한다.

---

## 3. 리디자인 제약과 기회

### 3.1 반드시 유지해야 하는 것 (데이터 흐름·계약)

- **마커 식별 key** `facility:${category}:${String(id)}` /
  `cluster:cluster-${lat},${lng}`(`useMapMarkers.ts:173-195`) — 숫자 id 정규화
  테스트(79-95)와 reconcile 테스트(47-77)가 고정. CustomOverlay mock은
  `setMap/setPosition/setContent/setVisible`만 제공하므로 `setZIndex` 등 새
  메서드를 쓰면 mock 보강 필요(`useMapMarkers.test.ts:26-35`).
- **이스케이프 규칙**: 외부 데이터 문자열을 HTML 문자열에 넣을 때 반드시
  `escapeHtml`(현재 private, `marker.ts:5-16`)을 거친다.
  `marker.test.ts:16-30`의 XSS 케이스(`"><img …`, `javascript:`)가 통과해야
  한다. DOM을 `createElement`+`textContent`로 조립하면 이스케이프가 불필요해 더
  안전하다.
- **이벤트 계약**: 요소 `role=button`, `tabIndex=0`, `aria-label`, Enter/Space
  활성(`useMapMarkers.ts:214-233`). 클릭 →
  `onFacilitySelect(facility)`/`onClusterSelect(cluster)` 콜백(ref 경유).
- **앵커**: `xAnchor 0.5 / yAnchor 1`(304-310) — 핀 하단이 좌표. 형태를 바꾸면
  anchor를 같이 조정.
- **선택 소스 분석 이벤트**: `selectFacility(f, source)`의 `selection_source`
  값(`FacilityProvider.tsx:76-85`),
  `facility_detail_viewed`·`discovery_started`·`filter_applied`·`recommendation_*`·`facility_action_clicked`·`favorite_changed`·`alternative_selected`·`place_list_viewed`·`map_ready`·`geolocation_result`
  트래킹 호출 위치(`MapView.tsx`, `FacilityBottomSheet.tsx`,
  `FacilityBottomSheetWrapper.tsx`)를 UI 재배치 시 보존.
- **i18n 키**: `map.*`, `facility.*`, `explorer.*`, `category.*`,
  `freshness.*`(`messages.ts:21-135`) —
  `PlaceExplorerPanel.accessibility.test.tsx:40-51`과
  `SideBar.test.tsx:31-32`('지도 마커 설정', '메뉴 닫기')가 렌더 문자열을 고정.
- **딥링크**:
  `?lat&lng`(`MapView.tsx:180-195`)·`?place=slug:id`(`MapContainer.tsx:243-313`)·`handleSearchSelect`
  URL 갱신(206-241)·`getFacilityShareUrl`(`actions.ts:28-37`).
- **시설 시트 액션**:
  길찾기(`getKakaoDirectionsUrl`)·공유(`navigator.share`/clipboard + sr-only
  상태
  메시지)·저장(`useLocalFacilityFavorite`)·예약/웹사이트(`getSafeExternalUrl`)·출처/신선도(`getFacilityProvenance`)·주변
  대안(`getNearbyAlternatives`)·판단 요약(`scoreFacility`) — 데이터 소스는
  그대로 두고 레이아웃만 변경 가능.
- 전역 CSS: `:focus-visible` 아웃라인(`globals.css:61-64`),
  reduced-motion(67-76), `tw-animate-css` import(1).

### 3.2 자유롭게 바꿀 수 있는 것

- 마커 HTML/CSS 전부(`marker.ts:132-179`, `useMapMarkers.ts:44-81`),
  `marker-animations.css` 전부(활성 사용은 `.custom-marker`+hover뿐; 나머지
  클래스는 미적용 — §3.5), 크기·색·꼬리·배지.
- 두 바텀시트의 마크업·높이·스냅·애니메이션(테스트 없음). 클러스터 시트는 전면
  교체 가능.
- `MapControls`·`MapStatusIndicator`·`CongestionPanel`·`WeatherPanel`
  마크업(테스트 없음). 혼잡도 팝오버 "말풍선 꼬리" div(`MapView.tsx:679, 700`)
  등 장식.
- `FACILITY_CONFIGS`의 `color`/`svgIcon` 값과 `getCategoryColor` — 단일 소스로
  재정의 가능(소비처 7곳은 §2.1).
- MapView 상단 칩 바(`MapView.tsx:714-743`) — aria-label·aria-pressed만 유지
  권장.

### 3.3 제안 규약 (구현자가 바로 쓸 수 있게)

- z-index 스케일(지도 오버레이 전용 토큰): `--z-map-status: 10`,
  `--z-map-controls: 30`, `--z-map-popover: 40`, `--z-sheet-overlay: 60`,
  `--z-sheet: 61`, `--z-sidebar: 70`, 헤더 `50`은 유지 → 모달이 헤더를 덮도록.
  Kakao 내부(998-1002)는 `useMapMarkers` 상수 객체
  `MARKER_Z = { base: 1000, cluster: 1001, hover: 1002, selected: 1003 }`로
  캡슐화.
- 카테고리 팔레트 토큰: `:root { --cat-sports, --cat-culture, … }` 10개를 지각
  거리 기준으로 재배치(현재 blue/indigo/violet/purple 4색, emerald-500/600 2색
  근접 — D-17). 마커·칩·시트·사이드바는 `bg-[var(--cat-park)]` 또는
  `style={{ '--cat': … }}` 1개 경로로.
- 상태 칩(로딩/부분 실패/권한 거부/재검색) 1개 컴포넌트, 지도 상단 중앙,
  `role=status aria-live=polite`.

### 3.4 테스트가 고정하는 것 요약 (restyle 시 영향)

| 테스트                                                                                                                | 고정 내용                                                                                                                                    | restyle 영향                                            |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/shared/lib/hooks/__tests__/useMapMarkers.test.ts`                                                                | overlay 재사용·제거 호출 횟수, 숫자 id 정규화, `window.kakao.maps` mock(`LatLng`, `CustomOverlay{setMap,setPosition,setContent,setVisible}`) | 새 overlay 메서드 사용 시 mock 추가. 클래스명·색 비검사 |
| `src/shared/lib/utils/__tests__/marker.test.ts`                                                                       | `createPOIMarkerContent` id/data 속성, 이스케이프, `formatInfoWindowContent`, `getCrowdLevelClass` → `marker-crowd-*`                        | 레거시 함수 삭제 시 테스트 동반 삭제/이전               |
| `src/shared/lib/hooks/__tests__/useFocusTrap.test.tsx`                                                                | Tab 순환·Escape·포커스 복귀                                                                                                                  | 시트가 이 훅을 계속 쓰면 무영향                         |
| `src/features/place-filter/ui/__tests__/PlaceExplorerPanel.accessibility.test.tsx`                                    | region 이름, combobox 이름 2개, 버튼 '내 생활'·'목록 닫기'(aria-expanded), 빈 목록 문구                                                      | 문구는 i18n 키 경유 → 키 값 바꾸면 테스트 수정          |
| `src/shared/ui/layout/__tests__/SideBar.test.tsx`                                                                     | dialog 이름 '지도 마커 설정', 닫기 버튼 '메뉴 닫기' 초기 포커스, Escape                                                                      | 사이드바 restyle 시 유지                                |
| `place-filter.test.ts`, `recommendation-engine.test.ts`, `live-data.test.ts`, `provenance.test.ts`, `actions.test.ts` | 순수 로직(운영시간 판정·필터·점수·신선도·URL)                                                                                                | UI 무관                                                 |
| snapshot 테스트                                                                                                       | **없음**(Snapshots: 0)                                                                                                                       | 자유                                                    |

### 3.5 중복·죽은 코드 (import grep으로 확인)

| 대상                                                                                                                                                                                                                   | 증거                                                                                                                                        | 비고                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/map-markers/**` (index.ts, lib/marker-factory.ts 256줄, model/use-markers.ts 407줄, model/use-clustering.ts 154줄)                                                                                       | 유일한 참조 `src/app/compatibility/index.ts:14`; `compatibility`를 import 하는 파일은 0건(grep: 테스트 주석 1건만)                          | 전량 삭제 가능. `marker-factory.ts`는 `marker.ts:1-267`과 사실상 동일(diff: 포맷 차이)                                                            |
| `src/shared/lib/hooks/useClusteredMarkers.ts`                                                                                                                                                                          | import 0건; `use-clustering.ts`와 `radius 0.01 vs 0.1` 외 동일                                                                              | 삭제                                                                                                                                              |
| `src/shared/lib/hooks/useSearchMarker.ts`                                                                                                                                                                              | import 0건                                                                                                                                  | 삭제                                                                                                                                              |
| `src/shared/lib/clustering/index.ts` (367줄)                                                                                                                                                                           | import 0건                                                                                                                                  | 거리 기반 클러스터링 도입 시 재활용 후보, 아니면 삭제                                                                                             |
| `src/widgets/map-container/ui/FacilityFilter.tsx`                                                                                                                                                                      | import 0건                                                                                                                                  | 삭제                                                                                                                                              |
| `src/widgets/map-container/ui/FacilityList.tsx` = `src/widgets/facility-list/ui/FacilityList.tsx`                                                                                                                      | 둘 다 import 0건, diff는 공백 1줄                                                                                                           | 둘 다 삭제(explorer 패널이 대체)                                                                                                                  |
| `src/widgets/sidebar/ui/SideBar.tsx` vs `src/shared/ui/layout/SideBar.tsx`                                                                                                                                             | 활성은 shared(`MapContainer.tsx:17, 329-340`); widgets 버전은 `pages/home/index.tsx:11`·`MainApp.tsx:8`(미사용 import)·compatibility만 참조 | `pages/home/index.tsx`는 Pages Router `/home` 라우트로 **실제 서빙되는 레거시 중복 화면**(`pages/_app.tsx` 존재) — 제거 또는 리다이렉트 결정 필요 |
| `marker.ts:201-267, 278-340, 342-394` (`applyMarkerAnimation`, `toggleMarkerTooltip`, `createMarkerElement`(이모지), `getMarkerImage`, `formatInfoWindowContent`)                                                      | 비테스트 import 0건                                                                                                                         | `marker.test.ts`가 일부 고정                                                                                                                      |
| `marker-animations.css`의 `.marker-crowd-*`, `.marker-bounce/pulse/shake`, `.marker-selected`, `.marker-tooltip`, `.marker-cluster`                                                                                    | 적용 코드가 레거시 함수에만 존재                                                                                                            | 활성 규칙은 4-12행과 183-205행뿐                                                                                                                  |
| `MapProvider` 보조 훅 `useMapInstance/useMapLocation/useMapZoom/useMapBounds`(210-259), `FacilityProvider` 보조 훅 `useFacilityData/useFacilitySelection/useFacilityFilter`(844-878)                                   | import 0건                                                                                                                                  | 삭제                                                                                                                                              |
| `MapProvider` `onMapClick/onMapIdle`(123-130)·`MapContainer` 핸들러 4개(365-386, console.log만)·`MapView` props 인터페이스(54-68)·`MapContainer` props `preferences/onPreferenceToggle/onLocationReset`(ESLint unused) | Kakao 이벤트에 바인딩되지 않음                                                                                                              | 정리                                                                                                                                              |
| `FacilityProvider.clusteredFacilities`(517-521, 항상 `[]`), `searchFacilities`(651-661, TODO)                                                                                                                          | 소비처 MapView 없음                                                                                                                         | 정리                                                                                                                                              |
| `ClusterBottomSheet` 이미지 모달(276-298)                                                                                                                                                                              | `setImageModalOpen(true)` 호출 0건                                                                                                          | 도달 불가                                                                                                                                         |

---

## 4. 토큰/스타일 현황 (정량)

#### Takeaway

지도 코어 UI는 shadcn CSS 변수 토큰을 **1곳**에서만 쓰고, 하드코딩 Tailwind
팔레트 클래스 **384개**, hex/rgba 리터럴 **82개**, 인라인 `style={{}}` **5곳**,
템플릿 문자열 `style="…"` 블록 **33개**로 구성된다. 다크모드 토큰은 정의돼
있으나(`globals.css:32-52`) 지도 UI는 `bg-white` 24회로 고정되어 다크모드가
불가능하다.

#### Cited Findings (스코프: `src/widgets/map-container/**`, `src/features/map-markers/**`, `marker.ts`, `useMapMarkers.ts`, `useCurrentLocationMarker.ts`, `useClusteredMarkers.ts`, `src/shared/lib/icons/**`, `marker-animations.css`)

- 하드코딩 팔레트
  유틸(`bg|text|border|from|to|via|ring|shadow|fill|stroke|decoration-<색>-<단계>`):
  총 **384**. 파일별: `FacilityBottomSheet.tsx` 141, `MapControls.tsx` 52,
  `WeatherPanel.tsx` 48, `CongestionPanel.tsx` 38, `ClusterBottomSheet.tsx` 37,
  `FacilityFilter.tsx` 17, `MapStatusIndicator.tsx` 16, `FacilityList.tsx` 16,
  `icons/facility.tsx` 10, `MapView.tsx` 8, `SubwayStationIcon.tsx` 1. 그중
  `text-gray-500` 38, `text-gray-900` 32, `text-gray-600` 29, `text-gray-700`
  14, `text-gray-400` 6, `text-gray-800` 2; `bg-white` 16 + `bg-white/90` 7 +
  `bg-white/70` 1.
- 시맨틱 토큰 클래스 사용: **1건** `MapView.tsx:630` `bg-background/80`. (shadcn
  `Button`/`Badge` 내부 variant는 토큰을 쓰지만 —
  `src/shared/ui/button.tsx:12-19`, `badge.tsx:12-17` — `default` variant의
  `bg-primary`는 `--primary: 222.2 47.4% 11.2%`(남색, `globals.css:17`)이라
  시트의 "길찾기" 주 버튼(`FacilityBottomSheet.tsx:472`)만 남색이고 나머지
  강조는 `blue-500/600`·`violet-*`로 어긋남.)
- hex/rgba 리터럴(.ts/.tsx): **82** (`facility.tsx` 카테고리/혼잡 hex,
  `subway-colors.ts` 호선 hex 26개,
  `marker.ts`·`useMapMarkers.ts`·`useCurrentLocationMarker.ts`의
  그림자/배경/`#ff4444`/`#4285F4`).
- 인라인 `style={{}}`: `ClusterBottomSheet.tsx:150`(backgroundColor),
  `FacilityBottomSheet.tsx:341-345`(transform/height/maxHeight),
  `:426-429`(WebkitOverflowScrolling/scrollbarWidth),
  `SubwayStationIcon.tsx:36`, `CongestionPanel.tsx:155`.
- 템플릿 HTML `style="`: `marker.ts` 13, `marker-factory.ts` 6,
  `use-clustering.ts` 3, `useClusteredMarkers.ts` 3, `useMapMarkers.ts` 3,
  `useCurrentLocationMarker.ts` 3, `use-markers.ts` 2 (= 33).
- 반경: `rounded-full` 35, `rounded-lg` 19, `rounded-xl` 17, `rounded-2xl` 6,
  `rounded-t-lg` 2, `rounded-r-lg` 2, `rounded-t-3xl` 1(시설 시트),
  `rounded-t-2xl` 1(클러스터 시트), `rounded-md` 1, `rounded` 1 —
  `--radius: 0.625rem` 토큰(`globals.css:10`, `tailwind.config.js:47-51`)을 지도
  UI가 쓰지 않음.
- 그림자: `shadow-sm` 11, `shadow-lg` 8, `shadow-xl` 3, `shadow-md` 1, 색 그림자
  `shadow-blue-200` 3·`shadow-green/yellow/orange/red-200` 각
  1(`MapControls.tsx:60-73`), 임의값 `shadow-[0_-10px_40px_rgba(0,0,0,0.1)]`
  1(`FacilityBottomSheet.tsx:338`).
- 간격/크기 매직값: `top-16`(혼잡도 팝오버, `MapView.tsx:676`),
  `bottom-24 md:bottom-20`(`MapControls.tsx:150, 182`, `MapView.tsx:697`),
  `left-16`(697), `max-h-[calc(100%-7rem)]`(`PlaceExplorerPanel.tsx:123`),
  `md:max-w-[calc(100%-7rem)]`(`MapView.tsx:714`),
  `max-h-[calc(50vh-120px)]`/`[calc(80vh-120px)]`(시트 2종), `min-w-[20px]`
  배지, `w-80` 패널 2종.
- 아이콘 불일치: 날씨 아이콘 lucide(`MapControls.tsx:94-110`,
  `WeatherPanel.tsx:71-80`) vs 이모지(`MapStatusIndicator.tsx:42-54`),
  `💡`(FacilityFilter), `🚲`(FacilityBottomSheet:566),
  `💬`(CongestionPanel:112).
- ESLint(스코프, 138 warnings/0 errors): `no-console` 68, `no-explicit-any` 19,
  `no-unused-vars` 15, `max-lines-per-function` 9(MapView
  589줄·FacilityBottomSheet 823줄·FacilityProvider 560줄 등),
  `react-hooks/exhaustive-deps` 8, `react-hooks/refs` 7, `set-state-in-effect`
  5, `complexity` 3(FacilityBottomSheet 59, FacilityProvider 47, MapView 37),
  `max-lines` 3, `use-memo` 1. 파일별 상위: FacilityProvider 34, MapView 25,
  useKakaoMap 14, use-markers 10, useLocation 10, MapContainer 9.

#### Inferences — 토큰 마이그레이션이 건드릴 범위

1. **색**: 384개 팔레트 클래스 중 다수는 `text-gray-*` →
   `text-foreground/text-muted-foreground`, `bg-white` →
   `bg-background/bg-card`, `border-gray-*` → `border-border`로 기계적 치환
   가능(약 60%). 나머지(카테고리 10색·혼잡 4색·신선도 4색·날씨 카드
   그라데이션)는 **의미 토큰 신설**이 필요하다(`--cat-*`, `--crowd-*`,
   `--fresh-*`).
2. **라운드/그림자**: `--radius` 기반 `rounded-lg/md/sm` 3단계 + 시트 전용
   `rounded-t-[var(--radius-sheet)]`로 축소, 색 그림자 제거.
3. **인라인/템플릿 스타일**: 마커 HTML은 클래스 기반(`.sf-marker`,
   `data-category`, `data-state`)으로 바꾸고 색만 CSS 변수로 주입하면 33개
   `style="` 블록이 CSS 파일 1개로 수렴한다.
4. **다크모드**: `darkMode: ['class']`(`tailwind.config.js:2`)와 `.dark` 토큰이
   이미 있으므로 1-3을 마치면 지도 UI 다크 지원은 추가 비용이 거의 없다(Kakao
   타일 자체는 밝음 — 오버레이만 대응).

#### Gaps

- 카운트는 정규식 기반(변형 접두사 `hover:`·`md:` 포함, 템플릿 문자열 내부
  클래스 포함)이라 ±5% 오차가 있을 수 있다. 정확한 치환 목록은 마이그레이션 시
  codemod로 재산출 권장.
