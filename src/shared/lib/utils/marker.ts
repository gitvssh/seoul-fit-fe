/**
 * 지도 오버레이 DOM 빌더.
 *
 * 외부 데이터(시설명 등)는 `textContent`로만 넣는다. innerHTML에는 우리 상수 SVG만 들어간다.
 * 색은 CSS 변수(`FACILITY_CONFIGS[c].fill`, 상태 토큰)만 쓰고 모양·상태는
 * `styles/marker-animations.css`의 `.sf-marker*`, `.sf-cluster`, `.sf-me*` 규칙이 맡는다.
 */
import type { CongestionLevel, Facility, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS, MARKER_GLYPH_COLOR, getCrowdColor } from '@/shared/lib/icons/facility';
import { getSubwayLineColor } from '@/shared/lib/icons/subway-colors';

export interface MarkerLabels {
  /** 시설 마커 접근성 이름. `category`는 카테고리 코드(`park` 등)다. */
  facility: (name: string, category: string) => string;
  /** 클러스터 버튼 접근성 이름 */
  cluster: (count: number) => string;
  /** 현재 위치 점 접근성 이름 */
  currentLocation: string;
}

export const DEFAULT_MARKER_LABELS: MarkerLabels = {
  facility: (name, category) => {
    const label = FACILITY_CONFIGS[category as FacilityCategory]?.label;
    return label ? `${name}, ${label}` : name;
  },
  cluster: count => `장소 ${count}곳 모음`,
  currentLocation: '현재 위치',
};

export const resolveMarkerLabels = (labels?: Partial<MarkerLabels>): MarkerLabels => ({
  facility: labels?.facility ?? DEFAULT_MARKER_LABELS.facility,
  cluster: labels?.cluster ?? DEFAULT_MARKER_LABELS.cluster,
  currentLocation: labels?.currentLocation ?? DEFAULT_MARKER_LABELS.currentLocation,
});

/** 오버레이 래퍼 z-order. `overlay.setZIndex()`로만 적용한다(콘텐츠 내부 z-index는 무효). */
export const MARKER_Z = {
  cluster: 0,
  marker: 1,
  hover: 10,
  selected: 20,
  me: 30,
} as const;

export const MARKER_SIZE = {
  /** 기본 원 지름 */
  default: 28,
  /** 선택 원 지름 */
  selected: 36,
  /** 투명 터치 타깃 */
  hit: 44,
  /** 현재 위치 헤일로 */
  halo: 40,
} as const;

export interface ClusterTier {
  name: 'sm' | 'md' | 'lg';
  size: number;
  fontSize: number;
}

/** 건수 <10 / <100 / ≥100 → 36 / 44 / 52px (디자인 시스템 §6) */
export const CLUSTER_TIERS: readonly ClusterTier[] = [
  { name: 'sm', size: 36, fontSize: 13 },
  { name: 'md', size: 44, fontSize: 14 },
  { name: 'lg', size: 52, fontSize: 15 },
];
export const CLUSTER_TIER_THRESHOLDS: readonly number[] = [10, 100];
export const CLUSTER_COUNT_CAP = 99;

export const getClusterTierIndex = (count: number): number =>
  Math.min(
    CLUSTER_TIER_THRESHOLDS.filter(threshold => count >= threshold).length,
    CLUSTER_TIERS.length - 1
  );

export const getClusterTier = (count: number): ClusterTier =>
  CLUSTER_TIERS[getClusterTierIndex(count)];

export const formatClusterCount = (count: number): string => {
  const safe = Math.max(0, Math.trunc(Number.isFinite(count) ? count : 0));
  return safe > CLUSTER_COUNT_CAP ? `${CLUSTER_COUNT_CAP}+` : String(safe);
};

/** `selectedFacilityId`·`revealFacility()`가 쓰는 시설 식별자: `${category}:${id}` */
export const getFacilityMarkerId = (facility: Pick<Facility, 'category' | 'id'>): string =>
  `${facility.category}:${String(facility.id)}`;

/**
 * 링 색으로 표시할 혼잡도. 공공데이터 변환기는 값이 없을 때 'low'를 기본값으로 넣으므로
 * 실제 신호가 있는 따릉이(대여 가능 대수 기반)만 링을 그린다.
 */
export const getMarkerCrowdLevel = (facility: Facility): CongestionLevel | null =>
  facility.category === 'bike' && facility.bikeFacility ? (facility.congestionLevel ?? null) : null;

export const getFacilityMarkerFill = (facility: Facility): string => {
  const route = facility.category === 'subway' ? facility.subwayStation?.route : undefined;
  if (route) return getSubwayLineColor(route);
  return FACILITY_CONFIGS[facility.category]?.fill ?? 'hsl(var(--muted-foreground))';
};

const glyphTemplates = new Map<FacilityCategory, SVGElement | null>();

const createGlyph = (category: FacilityCategory): SVGElement | null => {
  if (!glyphTemplates.has(category)) {
    const template = document.createElement('template');
    // 신뢰 상수(FACILITY_CONFIGS.svgIcon)만 넣는다. 외부 문자열은 절대 여기로 오지 않는다.
    template.innerHTML = FACILITY_CONFIGS[category]?.svgIcon ?? '';
    const svg = template.content.firstElementChild;
    glyphTemplates.set(category, svg instanceof SVGElement ? svg : null);
  }
  const svg = glyphTemplates.get(category);
  return svg ? (svg.cloneNode(true) as SVGElement) : null;
};

export interface FacilityMarkerOptions {
  selected?: boolean;
  labels?: MarkerLabels;
}

export const setFacilityMarkerSelected = (root: HTMLElement, selected: boolean): void => {
  if (selected) {
    root.dataset.selected = '';
    root.setAttribute('aria-current', 'true');
    root.tabIndex = 0;
  } else {
    delete root.dataset.selected;
    root.removeAttribute('aria-current');
    root.tabIndex = -1;
  }
};

export const setFacilityMarkerHover = (root: HTMLElement, hover: boolean): void => {
  if (hover) root.dataset.hover = '';
  else delete root.dataset.hover;
};

/** 선택 시설은 포커스 계층 오버레이가 대신 그리므로 벌크 계층의 원본은 숨긴다. */
export const setFacilityMarkerHidden = (root: HTMLElement, hidden: boolean): void => {
  if (hidden) root.dataset.hidden = '';
  else delete root.dataset.hidden;
};

/** 시설 데이터가 바뀌었을 때 요소를 다시 만들지 않고 속성만 갱신한다. */
export const updateFacilityMarkerElement = (
  root: HTMLElement,
  facility: Facility,
  { selected, labels = DEFAULT_MARKER_LABELS }: FacilityMarkerOptions = {}
): void => {
  const config = FACILITY_CONFIGS[facility.category];
  root.dataset.category = facility.category;
  root.dataset.facilityId = String(facility.id);
  root.dataset.markerId = getFacilityMarkerId(facility);
  root.setAttribute('aria-label', labels.facility(facility.name, facility.category));
  root.style.setProperty('--sf-marker-fill', getFacilityMarkerFill(facility));
  root.style.setProperty('--sf-marker-glyph', MARKER_GLYPH_COLOR[config?.glyph ?? 'white']);

  const crowd = getMarkerCrowdLevel(facility);
  if (crowd) {
    root.dataset.crowd = crowd;
    root.style.setProperty('--sf-marker-crowd', getCrowdColor(crowd));
  } else {
    delete root.dataset.crowd;
    root.style.removeProperty('--sf-marker-crowd');
  }

  const glyph = root.querySelector('.sf-marker__glyph');
  if (glyph && glyph.getAttribute('data-category') !== facility.category) {
    glyph.replaceChildren();
    const svg = createGlyph(facility.category);
    if (svg) glyph.appendChild(svg);
    glyph.setAttribute('data-category', facility.category);
  }

  const label = root.querySelector('.sf-marker__label');
  if (label) label.textContent = facility.name;

  if (selected !== undefined) setFacilityMarkerSelected(root, selected);
};

/**
 * 시설 마커: 44×44 투명 터치 타깃 안에 28px 원(선택 36px) + 글리프, 아래에 이름 라벨 칩.
 * 앵커는 원 중심(xAnchor 0.5 / yAnchor 0.5)이며 라벨은 absolute라 박스 크기에 영향이 없다.
 */
export const createFacilityMarkerElement = (
  facility: Facility,
  options: FacilityMarkerOptions = {}
): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'sf-marker';
  root.setAttribute('role', 'button');

  const pin = document.createElement('span');
  pin.className = 'sf-marker__pin';
  const glyph = document.createElement('span');
  glyph.className = 'sf-marker__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  pin.appendChild(glyph);

  const label = document.createElement('span');
  label.className = 'sf-marker__label';
  label.setAttribute('aria-hidden', 'true');

  root.append(pin, label);
  updateFacilityMarkerElement(root, facility, { selected: options.selected ?? false, ...options });
  return root;
};

export interface ClusterElementOptions {
  labels?: MarkerLabels;
}

/**
 * 클러스터 요소를 꾸민다. 공식 MarkerClusterer가 만든 `div`에도 `clustered` 이벤트에서
 * 그대로 적용한다(줌 후 재생성되는 요소에 매번 다시 적용해야 한다).
 */
export const decorateClusterElement = (
  element: HTMLElement,
  count: number,
  { labels = DEFAULT_MARKER_LABELS }: ClusterElementOptions = {}
): void => {
  const tier = getClusterTier(count);
  element.classList.add('sf-cluster');
  element.setAttribute('role', 'button');
  element.tabIndex = -1;
  element.setAttribute('aria-label', labels.cluster(count));
  element.dataset.size = tier.name;
  element.dataset.count = String(count);
  element.style.width = `${tier.size}px`;
  element.style.height = `${tier.size}px`;
  element.style.lineHeight = `${tier.size}px`;
  element.style.fontSize = `${tier.fontSize}px`;
  element.textContent = formatClusterCount(count);
};

const CLUSTER_STYLE_BASE: Record<string, string> = {
  boxSizing: 'border-box',
  borderRadius: '9999px',
  background: 'hsl(var(--surface-elevated))',
  color: 'hsl(var(--surface-elevated-foreground))',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontWeight: '600',
  boxShadow:
    '0 0 0 2px hsl(var(--primary)), 0 0 0 8px hsl(var(--primary) / 0.15), var(--shadow-float-md)',
  cursor: 'pointer',
  userSelect: 'none',
};

/** MarkerClusterer `styles` 옵션. `calculator`는 `CLUSTER_TIER_THRESHOLDS`를 쓴다. */
export const CLUSTER_OVERLAY_STYLES: Record<string, string>[] = CLUSTER_TIERS.map(tier => ({
  ...CLUSTER_STYLE_BASE,
  width: `${tier.size}px`,
  height: `${tier.size}px`,
  lineHeight: `${tier.size}px`,
  fontSize: `${tier.fontSize}px`,
}));

/** 같은 좌표에 겹친 시설 묶음(스택)·클러스터러 폴백에 쓰는 클러스터 원 */
export const createClusterElement = (
  count: number,
  options: ClusterElementOptions = {}
): HTMLElement => {
  const element = document.createElement('div');
  for (const [property, value] of Object.entries(CLUSTER_STYLE_BASE)) {
    element.style.setProperty(
      property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`),
      value
    );
  }
  decorateClusterElement(element, count, options);
  return element;
};

/** 현재 위치: 16px primary 점 + 흰 링, 40px 헤일로(펄스, 모션 감소 시 정지). 포인터 이벤트 없음. */
export const createCurrentLocationElement = (
  label: string = DEFAULT_MARKER_LABELS.currentLocation
): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'sf-me';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', label);

  const halo = document.createElement('span');
  halo.className = 'sf-me__halo';
  const dot = document.createElement('span');
  dot.className = 'sf-me__dot';
  root.append(halo, dot);
  return root;
};
