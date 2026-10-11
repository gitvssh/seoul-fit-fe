import { SITE_REPOSITORY_URL } from '@/shared/lib/seo/site';

export const DOCS_BASE_URL = `${SITE_REPOSITORY_URL}/blob/master`;

/** README screenshots are committed under docs/assets/screenshots and served from the repository. */
export const SCREENSHOT_BASE_URL =
  'https://raw.githubusercontent.com/gitvssh/seoul-fit-fe/master/docs/assets/screenshots';

export interface Screenshot {
  file: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
}

export const SCREENSHOTS: Screenshot[] = [
  {
    file: 'home-desktop.png',
    alt: '데스크톱 지도 화면. 왼쪽 패널에 서울 지금 카드와 상황별 추천, 오른쪽에 카테고리 마커가 찍힌 카카오 지도',
    width: 1440,
    height: 900,
    caption: '지도 첫 화면 · 데스크톱 1440×900',
  },
  {
    file: 'home-mobile.png',
    alt: '모바일 지도 화면. 지도 위에 검색창과 필터 칩, 아래에 접힌 탐색 시트',
    width: 390,
    height: 844,
    caption: '지도 첫 화면 · 모바일 390×844',
  },
  {
    file: 'detail-mobile.png',
    alt: '모바일 장소 상세 시트. 장소 이름, 지금 이용 판단과 근거, 길찾기와 저장 버튼',
    width: 390,
    height: 844,
    caption: '장소 상세와 추천 근거 · 모바일',
  },
];

export interface DeepLink {
  href: string;
  label: string;
  hint: string;
}

export const DEEP_LINKS: DeepLink[] = [
  { href: '/?preset=rainy_day', label: '비 오는 날 실내', hint: '실내 장소를 강수 위험과 함께' },
  { href: '/?preset=quiet', label: '지금 한산한 곳', hint: '혼잡도가 낮은 지역부터' },
  { href: '/?preset=today_event', label: '오늘 열리는 행사', hint: '오늘 날짜의 문화행사·예약' },
];

export const PROBLEMS: { problem: string; approach: string }[] = [
  {
    problem: '시설 정보는 흩어져 있고, "지금" 갈 수 있는지는 알려주지 않는다.',
    approach:
      '공원·도서관·문화행사·무더위쉼터·따릉이·지하철을 한 지도에 모으고, 운영 여부와 갱신 시각을 장소마다 붙인다.',
  },
  {
    problem: '날씨와 혼잡도는 별도 앱에서 따로 봐야 한다.',
    approach:
      '서울 실시간 도시데이터의 날씨·혼잡도를 "서울 지금" 카드로 묶고, 추천 점수의 감점 요인으로 쓴다.',
  },
  {
    problem: '"추천"이 왜 나왔는지 알 수 없으면 믿기 어렵다.',
    approach:
      '규칙 기반 점수(0~100)와 함께 근거 최대 3개와 경고를 그대로 보여 준다. 데이터가 없으면 "정보 없음"으로 표시한다.',
  },
];

export const SCORING: { factor: string; range: string }[] = [
  { factor: '관심사 일치', range: '+0 ~ 25' },
  { factor: '거리', range: '+0 ~ 20' },
  { factor: '현재 운영', range: '+0 ~ 15' },
  { factor: '예약·이용 가능', range: '+0 ~ 10' },
  { factor: '데이터 신선도', range: '+0 ~ 10' },
  { factor: '상황 프리셋 적합', range: '+0 ~ 20' },
  { factor: '혼잡·날씨 위험', range: '−0 ~ 30' },
];

export interface Decision {
  id: string;
  title: string;
  summary: string;
  tradeoff: string;
  path: string;
}

export const DECISIONS: Decision[] = [
  {
    id: 'ADR-0001',
    title: '단일 replica와 프로세스 내 캐시',
    summary:
      '따릉이·지하철 캐시와 갱신 스케줄러를 Next.js 프로세스 안에 두고 replica를 1로 고정한다.',
    tradeoff: '운영 단순함과 중복 호출 없음을 얻는 대신 수평 확장은 캐시 외부화 전까지 포기한다.',
    path: 'docs/decisions/0001-single-replica-in-process-cache.md',
  },
  {
    id: 'ADR-0002',
    title: '학습 모델 대신 근거를 보여 주는 규칙 기반 추천',
    summary: '관심사·거리·운영·신선도·프리셋·위험을 합산하는 점수와 이유 코드를 함께 반환한다.',
    tradeoff: '개인화 정밀도는 낮지만 설명 가능하고, 데이터 없음이 거짓 확신으로 바뀌지 않는다.',
    path: 'docs/decisions/0002-rule-based-recommendation-with-visible-reasons.md',
  },
  {
    id: 'ADR-0003',
    title: '서버 렌더 공개 페이지 + 클라이언트 카카오 지도',
    summary: '검색엔진용 /places 페이지는 서버에서 그리고, 지도 앱은 브라우저에서만 켠다.',
    tradeoff: '두 가지 표면을 유지해야 하지만 지도 SDK 없이도 색인·공유·no-JS 접근이 된다.',
    path: 'docs/decisions/0003-ssr-public-pages-client-side-kakao-map.md',
  },
  {
    id: 'ADR-0004',
    title: '불변 digest 릴리스와 수동 GitOps 승격',
    summary: '이미지는 태그가 아닌 sha256 digest로 고정하고 dev 검증 후 prod를 별도로 핀한다.',
    tradeoff: '배포 한 번에 손이 더 가지만 "무엇이 떠 있는지"가 항상 커밋과 1:1로 맞는다.',
    path: 'docs/decisions/0004-immutable-digest-releases-manual-gitops-promotion.md',
  },
  {
    id: 'ADR-0005',
    title: 'Tailwind 3.4 유지와 tailwindcss-animate',
    summary:
      'v4 전용 유틸리티를 걷어내고 측정으로 검증된 3.4 토큰 체계 위에 디자인 시스템을 올린다.',
    tradeoff: '최신 문법은 미루지만 애니메이션·그림자가 실제로 생성되는 상태를 지금 확보한다.',
    path: 'docs/decisions/0005-stay-on-tailwind-3-with-tailwindcss-animate.md',
  },
];

export interface DataSource {
  name: string;
  service: string;
  use: string;
  refresh: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    name: '서울 실시간 도시데이터 (날씨·인구 혼잡도)',
    service: 'citydata, citydata_ppltn',
    use: '서울 지금 카드, 추천의 위험 감점',
    refresh: '요청 시 조회, 서버 캐시',
  },
  {
    name: '따릉이 대여소 실시간 현황',
    service: 'bikeList',
    use: '대여소 마커, 따릉이 프리셋',
    refresh: '서버에서 1분마다 갱신',
  },
  {
    name: '지하철역 정보와 실시간 도착',
    service: 'subwayStationMaster, realtimeStationArrival',
    use: '역 마커, 도착 정보',
    refresh: '역 목록은 서버 시작 시, 도착은 요청 시',
  },
  {
    name: '주요 공원 현황',
    service: 'SearchParkInfoService',
    use: '공원 목록·상세·추천',
    refresh: '백엔드 일 1회 배치',
  },
  {
    name: '공공도서관 현황',
    service: 'SeoulPublicLibraryInfo',
    use: '도서관 목록·상세·추천',
    refresh: '백엔드 일 1회 배치',
  },
  {
    name: '문화행사·문화공간 정보',
    service: 'culturalEventInfo, culturalSpaceInfo',
    use: '행사 마커, 오늘 행사 프리셋',
    refresh: '백엔드 일 1회 배치',
  },
  {
    name: '공공서비스예약 (문화·체육)',
    service: 'ListPublicReservationCulture, ListPublicReservationSport',
    use: '예약 가능 프로그램',
    refresh: '백엔드 일 1회 배치',
  },
  {
    name: '무더위쉼터 현황',
    service: 'TbGtnHwcwP',
    use: '더위 피하기 프리셋, 쉼터 목록',
    refresh: '백엔드 일 1회 배치',
  },
  {
    name: '관광 음식점',
    service: 'TbVwRestaurants',
    use: '맛집 목록·상세',
    refresh: '백엔드 일 1회 배치',
  },
];

export interface QualityRow {
  metric: string;
  value: string;
  measuredAt: string;
  conditions: string;
  note: string;
}

/** Template rows. Values stay "측정 예정" until a dated, reproducible run fills them in. */
export const QUALITY_ROWS: QualityRow[] = [
  {
    metric: 'Lighthouse 데스크톱 (성능·접근성·권장사항·SEO)',
    value: '측정 예정',
    measuredAt: '—',
    conditions: 'Lighthouse CLI, headless Chrome, preset=desktop, n≥5 중앙값과 범위, URL /',
    note: '단일 머신 lab 측정. field(CrUX) 데이터 없음.',
  },
  {
    metric: 'Lighthouse 모바일 성능',
    value: '측정 예정',
    measuredAt: '—',
    conditions: '기본 시뮬레이션 throttling과 --throttling-method=provided를 병기',
    note: '시뮬레이션 LCP는 지도 컨테이너 렌더에 묶이므로 해석을 함께 적는다.',
  },
  {
    metric: 'Jest 단위·통합 테스트',
    value: '측정 예정',
    measuredAt: '—',
    conditions: 'npx jest 요약 줄 (스위트 수·테스트 수·실행 시간)',
    note: '정적 grep 값이 아니라 실제 실행 결과만 적는다.',
  },
  {
    metric: '타입 검사',
    value: '측정 예정',
    measuredAt: '—',
    conditions: 'tsconfig strict: true, npm run type-check',
    note: '통과 여부만 기록한다.',
  },
  {
    metric: '접근성 수동 점검',
    value: '측정 예정',
    measuredAt: '—',
    conditions: '키보드 탐색, VoiceOver 또는 NVDA, 200% 확대, docs/ACCESSIBILITY_CHECKLIST.md',
    note: '자동 검사는 이슈의 일부만 잡는다. 준수(conformance)를 단언하지 않는다.',
  },
  {
    metric: '번들 크기',
    value: '측정 예정',
    measuredAt: '—',
    conditions: 'next build 산출 First Load JS, 지도 SDK 비중',
    note: '날짜와 함께 스냅샷으로 기록한다.',
  },
];

export const LIMITS: string[] = [
  '서버 캐시와 갱신 스케줄러가 프로세스 안에 있어 Deployment는 1 replica로 고정합니다. Redis 외부화 전에는 수평 확장을 하지 않습니다.',
  'GitHub Actions CI는 자체 러너 전용 정책으로 멈춰 있고, 배포는 로컬 불변 이미지 빌드와 수동 GitOps 승격으로만 합니다.',
  '공개 목록은 백엔드 검색 인덱스에 중복 저장된 행을 화면에서 id 기준으로 걸러 보여 줍니다. 전체 수는 중복이 보이는 페이지에서 표시하지 않습니다.',
  '실시간 도시데이터는 서울시가 지정한 지점 주변에서만 제공됩니다. 그 밖의 위치에서는 일반 장소 정보만으로 추천합니다.',
  '실기기 iOS Safari·Android Chrome과 스크린리더 검증은 아직 끝나지 않았고, 카카오 지도 SDK가 만드는 요소의 접근성은 손댈 수 없습니다.',
  '공모전 이후 실사용자와 트래픽은 없습니다. 사용자 수·후기 같은 지표를 제시하지 않습니다.',
];

export const ROADMAP: string[] = [
  '서버 캐시 외부화(Redis, TTL·키 버전·동시 갱신 잠금) 뒤 멀티 replica 전환',
  '품질 현황 표 채우기: Lighthouse n≥5, Jest 요약, 번들 스냅샷을 날짜와 함께 기록',
  '검색 품질: 초성 퍼지 매칭 오탐 줄이기, 자연어 규칙 해제 경로 정리',
  '러너 정책이 열리면 GitHub Actions CI 복원',
];

export interface ExternalDoc {
  label: string;
  path: string;
}

export const DOCS: ExternalDoc[] = [
  { label: '디자인 시스템', path: 'docs/DESIGN_SYSTEM.md' },
  { label: '설계 결정 기록 (ADR)', path: 'docs/decisions/README.md' },
  { label: '접근성 체크리스트', path: 'docs/ACCESSIBILITY_CHECKLIST.md' },
  { label: '불변 릴리스 절차', path: 'docs/IMMUTABLE_RELEASE.md' },
  { label: '관측 계약', path: 'docs/OBSERVABILITY.md' },
  { label: '2026-10 UI/UX 조사 보고서', path: 'docs/research/2026-10-ui-ux/report.md' },
];
