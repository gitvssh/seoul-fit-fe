/**
 * 시설 카테고리의 단일 정의: 이름·설명·아이콘·색 토큰.
 * 색은 CSS 변수(`--cat-*`, app/globals.css)만 참조한다. 칩·목록은 Tailwind 클래스,
 * 지도 마커 HTML은 `fill`(hsl(var(--cat-*)))을 쓰므로 한 곳만 바꾸면 전부 바뀐다.
 * 9색은 색각이상에서 완전히 분리되지 않으므로 글리프·라벨이 1차 신호이고 색은 보조 신호다.
 */
import React from 'react';
import {
  Bike,
  CalendarDays,
  Dumbbell,
  Library,
  Snowflake,
  Theater,
  Ticket,
  TrainFront,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { FACILITY_CATEGORIES, type FacilityCategory, type Facility } from '@/lib/types';
import { getSubwayLineColor, getSubwayIconSVG } from '@/shared/lib/icons/subway-colors';

/** 마커 글리프 색: 밝은 채움(체육·따릉이)은 잉크, 나머지는 흰색 */
export type MarkerGlyph = 'white' | 'ink';

export interface FacilityConfig {
  /** 목록·칩용 아이콘 요소 (20px) */
  icon: React.ReactNode;
  /** 크기를 직접 정하고 싶을 때 쓰는 lucide 컴포넌트 */
  Icon: LucideIcon;
  /** 배경 클래스 (예: `bg-cat-park`) */
  color: string;
  /** 흰 바탕 위 텍스트 클래스 (예: `text-cat-park-text`) */
  textColor: string;
  /** inline style·마커 HTML용 채움색 */
  fill: string;
  /** 마커 글리프 극성 */
  glyph: MarkerGlyph;
  /** 기본 한국어 이름 — 화면에서는 i18n `category.*` 키를 우선 사용한다 */
  label: string;
  description: string;
  /** 카카오맵 마커용 SVG 문자열 (currentColor) */
  svgIcon: string;
}

type IconNode = Array<[string, Record<string, string>]>;

const svgFromNodes = (nodes: IconNode): string => {
  const children = nodes
    .map(([tag, attrs]) => {
      const attributes = Object.entries(attrs)
        .map(([name, value]) => `${name}="${value}"`)
        .join(' ');
      return `<${tag} ${attributes}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
};

// lucide-react 0.525 아이콘 경로 (Trees, Library, Theater, CalendarDays, Ticket, Snowflake,
// UtensilsCrossed, Dumbbell, Bike, TrainFront). 마커 HTML 문자열에 React 없이 넣기 위해 복제했다.
const ICON_NODES: Record<FacilityCategory, IconNode> = {
  park: [
    ['path', { d: 'M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z' }],
    ['path', { d: 'M7 16v6' }],
    ['path', { d: 'M13 19v3' }],
    ['path', { d: 'M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5' }],
  ],
  library: [
    ['path', { d: 'm16 6 4 14' }],
    ['path', { d: 'M12 6v14' }],
    ['path', { d: 'M8 8v12' }],
    ['path', { d: 'M4 4v16' }],
  ],
  culture: [
    ['path', { d: 'M2 10s3-3 3-8' }],
    ['path', { d: 'M22 10s-3-3-3-8' }],
    ['path', { d: 'M10 2c0 4.4-3.6 8-8 8' }],
    ['path', { d: 'M14 2c0 4.4 3.6 8 8 8' }],
    ['path', { d: 'M2 10s2 2 2 5' }],
    ['path', { d: 'M22 10s-2 2-2 5' }],
    ['path', { d: 'M8 15h8' }],
    ['path', { d: 'M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1' }],
    ['path', { d: 'M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1' }],
  ],
  cultural_event: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }],
    ['path', { d: 'M3 10h18' }],
    ['path', { d: 'M8 14h.01' }],
    ['path', { d: 'M12 14h.01' }],
    ['path', { d: 'M16 14h.01' }],
    ['path', { d: 'M8 18h.01' }],
    ['path', { d: 'M12 18h.01' }],
    ['path', { d: 'M16 18h.01' }],
  ],
  cultural_reservation: [
    ['path', { d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' }],
    ['path', { d: 'M13 5v2' }],
    ['path', { d: 'M13 17v2' }],
    ['path', { d: 'M13 11v2' }],
  ],
  cooling_shelter: [
    ['path', { d: 'm10 20-1.25-2.5L6 18' }],
    ['path', { d: 'M10 4 8.75 6.5 6 6' }],
    ['path', { d: 'm14 20 1.25-2.5L18 18' }],
    ['path', { d: 'm14 4 1.25 2.5L18 6' }],
    ['path', { d: 'm17 21-3-6h-4' }],
    ['path', { d: 'm17 3-3 6 1.5 3' }],
    ['path', { d: 'M2 12h6.5L10 9' }],
    ['path', { d: 'm20 10-1.5 2 1.5 2' }],
    ['path', { d: 'M22 12h-6.5L14 15' }],
    ['path', { d: 'm4 10 1.5 2L4 14' }],
    ['path', { d: 'm7 21 3-6-1.5-3' }],
    ['path', { d: 'm7 3 3 6h4' }],
  ],
  restaurant: [
    ['path', { d: 'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8' }],
    ['path', { d: 'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7' }],
    ['path', { d: 'm2.1 21.8 6.4-6.3' }],
    ['path', { d: 'm19 5-7 7' }],
  ],
  sports: [
    ['path', { d: 'M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z' }],
    ['path', { d: 'm2.5 21.5 1.4-1.4' }],
    ['path', { d: 'm20.1 3.9 1.4-1.4' }],
    ['path', { d: 'M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z' }],
    ['path', { d: 'm9.6 14.4 4.8-4.8' }],
  ],
  bike: [
    ['circle', { cx: '18.5', cy: '17.5', r: '3.5' }],
    ['circle', { cx: '5.5', cy: '17.5', r: '3.5' }],
    ['circle', { cx: '15', cy: '5', r: '1' }],
    ['path', { d: 'M12 17.5V14l-3-3 4-3 2 3h2' }],
  ],
  subway: [
    ['path', { d: 'M8 3.1V7a4 4 0 0 0 8 0V3.1' }],
    ['path', { d: 'm9 15-1-1' }],
    ['path', { d: 'm15 15 1-1' }],
    ['path', { d: 'M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z' }],
    ['path', { d: 'm8 19-2 3' }],
    ['path', { d: 'm16 19 2 3' }],
  ],
};

interface CategoryStyle {
  token: 'park' | 'library' | 'culture' | 'event' | 'cooling' | 'restaurant' | 'sports' | 'bike' | 'subway';
  glyph: MarkerGlyph;
}

const CATEGORY_STYLE: Record<FacilityCategory, CategoryStyle> = {
  sports: { token: 'sports', glyph: 'ink' },
  culture: { token: 'culture', glyph: 'white' },
  restaurant: { token: 'restaurant', glyph: 'white' },
  library: { token: 'library', glyph: 'white' },
  park: { token: 'park', glyph: 'white' },
  subway: { token: 'subway', glyph: 'white' },
  bike: { token: 'bike', glyph: 'ink' },
  cooling_shelter: { token: 'cooling', glyph: 'white' },
  cultural_event: { token: 'event', glyph: 'white' },
  cultural_reservation: { token: 'event', glyph: 'white' },
};

// Tailwind JIT는 완전한 클래스 문자열만 인식하므로 토큰별 클래스를 표로 둔다.
const CATEGORY_CLASSES: Record<CategoryStyle['token'], { bg: string; text: string }> = {
  park: { bg: 'bg-cat-park', text: 'text-cat-park-text' },
  library: { bg: 'bg-cat-library', text: 'text-cat-library-text' },
  culture: { bg: 'bg-cat-culture', text: 'text-cat-culture-text' },
  event: { bg: 'bg-cat-event', text: 'text-cat-event-text' },
  cooling: { bg: 'bg-cat-cooling', text: 'text-cat-cooling-text' },
  restaurant: { bg: 'bg-cat-restaurant', text: 'text-cat-restaurant-text' },
  sports: { bg: 'bg-cat-sports', text: 'text-cat-sports-text' },
  bike: { bg: 'bg-cat-bike', text: 'text-cat-bike-text' },
  subway: { bg: 'bg-cat-subway', text: 'text-cat-subway-text' },
};

const CATEGORY_ICONS: Record<FacilityCategory, LucideIcon> = {
  sports: Dumbbell,
  culture: Theater,
  restaurant: UtensilsCrossed,
  library: Library,
  park: Trees,
  subway: TrainFront,
  bike: Bike,
  cooling_shelter: Snowflake,
  cultural_event: CalendarDays,
  cultural_reservation: Ticket,
};

const CATEGORY_TEXT: Record<FacilityCategory, { label: string; description: string }> = {
  sports: { label: '체육시설', description: '헬스장, 수영장, 테니스장 등' },
  culture: { label: '문화시설', description: '공연장, 전시관, 미술관 등' },
  restaurant: { label: '맛집', description: '음식점, 카페, 디저트 매장 등' },
  library: { label: '도서관', description: '공공도서관, 학습실 등' },
  park: { label: '공원', description: '도시공원, 산책로, 쉼터 등' },
  subway: { label: '지하철', description: '서울시 지하철역' },
  bike: { label: '따릉이', description: '공용자전거 대여소' },
  cooling_shelter: { label: '무더위 쉼터', description: '서울시 무더위 쉼터' },
  cultural_event: { label: '문화행사', description: '콘서트, 공연, 전시회 등' },
  cultural_reservation: { label: '문화예약', description: '예약 가능한 문화 프로그램' },
};

const buildConfig = (category: FacilityCategory): FacilityConfig => {
  const style = CATEGORY_STYLE[category];
  const classes = CATEGORY_CLASSES[style.token];
  const Icon = CATEGORY_ICONS[category];
  return {
    icon: <Icon className='h-5 w-5' aria-hidden='true' />,
    Icon,
    color: classes.bg,
    textColor: classes.text,
    fill: `hsl(var(--cat-${style.token}))`,
    glyph: style.glyph,
    label: CATEGORY_TEXT[category].label,
    description: CATEGORY_TEXT[category].description,
    svgIcon: svgFromNodes(ICON_NODES[category]),
  };
};

export const FACILITY_CONFIGS: Record<FacilityCategory, FacilityConfig> = Object.fromEntries(
  Object.values(FACILITY_CATEGORIES).map(category => [category, buildConfig(category)])
) as Record<FacilityCategory, FacilityConfig>;

/** 마커 글리프 색 (CSS 변수) */
export const MARKER_GLYPH_COLOR: Record<MarkerGlyph, string> = {
  white: '#ffffff',
  ink: 'hsl(var(--marker-ink))',
};

// 카카오맵 마커용 아이콘 SVG 생성 함수
export const getFacilityIconSVG = (facilityType: FacilityCategory): string => {
  return FACILITY_CONFIGS[facilityType]?.svgIcon || '';
};

// 혼잡도별 색상 (상태 토큰)
export const getCrowdColor = (crowdLevel: 'low' | 'medium' | 'high'): string => {
  switch (crowdLevel) {
    case 'low':
      return 'hsl(var(--success))';
    case 'medium':
      return 'hsl(var(--warning))';
    case 'high':
      return 'hsl(var(--destructive))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

// 카테고리별 채움색 (CSS 변수 참조)
export const getCategoryColor = (category: FacilityCategory): string => {
  return FACILITY_CONFIGS[category]?.fill ?? 'hsl(var(--muted-foreground))';
};

// 시설 아이콘 정보 반환 함수
export const getFacilityIcon = (
  category: FacilityCategory,
  facility?: Facility
): { svg: string; color: string; glyph: MarkerGlyph } => {
  const config = FACILITY_CONFIGS[category];

  // 지하철역인 경우 호선별 색상 적용
  if (category === FACILITY_CATEGORIES.SUBWAY && facility?.subwayStation?.route) {
    return {
      svg: getSubwayIconSVG(facility.subwayStation.route),
      color: getSubwayLineColor(facility.subwayStation.route),
      glyph: 'white',
    };
  }

  return {
    svg: config?.svgIcon || '',
    color: getCategoryColor(category),
    glyph: config?.glyph ?? 'white',
  };
};
