import type { CongestionData, Facility, WeatherData } from '@/lib/types';
import { getFacilityProvenance } from '@/entities/facility/lib/provenance';
import {
  calculateDistanceKm,
  getFacilityOpenState,
  isFacilityIndoor,
  isFacilityReservable,
} from '@/features/place-filter/lib/place-filter';
import { ko as recommendationMessages } from '@/shared/i18n/messages/recommendation';
import { isCategoryAllowedForPreset } from './presets';
import type {
  FacilityRecommendation,
  RecommendationContext,
  RecommendationFacility,
  RecommendationFactorScores,
  RecommendationPresetDefinition,
  RecommendationReasonCode,
  RecommendationWarningCode,
} from '../model/types';

/** 화면 칩에 노출하는 프리셋. 라벨은 i18n `preset.*` 키를 우선한다. */
export const RECOMMENDATION_PRESETS: RecommendationPresetDefinition[] = [
  {
    id: 'available_now',
    label: '지금 갈 곳',
    description: '현재 운영 중이고 가까운 장소',
  },
  { id: 'quiet', label: '한산한 곳', description: '혼잡 위험이 낮은 휴식·문화 공간' },
  { id: 'rainy_day', label: '비 오는 날', description: '비를 피할 수 있는 실내 장소' },
  { id: 'today_event', label: '오늘 행사', description: '오늘 이용할 수 있는 문화행사' },
  { id: 'bike_trip', label: '따릉이로', description: '자전거와 함께 가기 좋은 가까운 장소' },
  { id: 'cool_down', label: '더위 피하기', description: '무더위를 피할 수 있는 실내 공간' },
];

/** 같은 이름의 레코드를 하나로 합치는 반경. 환승역의 호선별 출구 좌표 차이를 덮는다. */
export const DUPLICATE_MERGE_RADIUS_METERS = 150;

const reasonLabel = (code: RecommendationReasonCode): string =>
  recommendationMessages[`reason.${code}`];
const warningLabel = (code: RecommendationWarningCode): string =>
  recommendationMessages[`warning.${code}`];

function normalize(value: string | undefined): string {
  return value?.toLocaleLowerCase('ko-KR').replace(/\s+/g, '') || '';
}

/** "시청 (2호선)" → "시청" 처럼 괄호·공백을 뺀 비교용 이름 */
export function normalizePlaceName(name: string): string {
  // Split once at closing delimiters so an unclosed run of '(' cannot cause
  // repeated scans. Preserve the original first-opening/first-closing behavior.
  const parts = name.split(')');
  return normalize(parts.map((part, index) => {
    if (index === parts.length - 1) return part;
    const opening = part.indexOf('(');
    if (opening < 0) return `${part})`;
    return part.slice(0, opening);
  }).join(''));
}

export function isRainyWeather(weather: WeatherData | null | undefined): boolean {
  const condition = normalize(weather?.WEATHER_STTS);
  const precipitation = Number.parseFloat(weather?.PRECIPITATION || '0');
  return condition.includes('비') || condition.includes('rain') || precipitation > 0;
}

export function isHotWeather(weather: WeatherData | null | undefined): boolean {
  const temperature = Number.parseFloat(weather?.SENSIBLE_TEMP || weather?.TEMP || '');
  return Number.isFinite(temperature) && temperature >= 33;
}

export function isPoorAirQuality(weather: WeatherData | null | undefined): boolean {
  const airLabel = `${weather?.PM10_INDEX || ''} ${weather?.PM25_INDEX || ''}`;
  return /나쁨|매우\s*나쁨|bad|poor/i.test(airLabel);
}

export function isCrowded(congestion: CongestionData | null | undefined): boolean {
  return /붐빔|혼잡/.test(congestion?.AREA_CONGEST_LVL || '');
}

function routeLabel(facility: Facility): string | undefined {
  return facility.subwayStation?.route || facility.subwayStation?.line || undefined;
}

/**
 * 같은 카테고리·같은 이름이 반경 안에 여러 레코드로 있으면(환승역이 호선별 레코드로
 * 오는 경우) 첫 레코드만 남기고 노선 라벨을 `routes`로 합친다. 입력 순서를 지킨다.
 */
export function mergeDuplicatePlaces(
  facilities: Facility[],
  radiusMeters = DUPLICATE_MERGE_RADIUS_METERS
): RecommendationFacility[] {
  const kept: RecommendationFacility[] = [];
  const buckets = new Map<string, RecommendationFacility[]>();

  for (const facility of facilities) {
    const key = `${facility.category}:${normalizePlaceName(facility.name)}`;
    const bucket = buckets.get(key) ?? [];
    const route = routeLabel(facility);
    const match = bucket.find(
      candidate => calculateDistanceKm(candidate.position, facility.position) * 1000 <= radiusMeters
    );

    if (match) {
      if (route && !match.routes?.includes(route)) match.routes = [...(match.routes ?? []), route];
      match.mergedIds = [...(match.mergedIds ?? []), facility.id];
      continue;
    }

    const record: RecommendationFacility = route
      ? { ...facility, routes: [route] }
      : { ...facility };
    bucket.push(record);
    buckets.set(key, bucket);
    kept.push(record);
  }

  return kept;
}

function isEventActiveToday(facility: Facility, now: Date): boolean {
  if (facility.category !== 'cultural_event') return false;
  const event = facility.culturalEvent;
  if (!event?.startDate && !event?.endDate) return true;
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const currentDate = startOfDay(now);
  const parsedStart = event.startDate ? new Date(event.startDate) : new Date(currentDate);
  const parsedEnd = event.endDate ? new Date(event.endDate) : new Date(currentDate);
  const startsAt = startOfDay(parsedStart);
  const endsAt = startOfDay(parsedEnd);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return false;
  return currentDate >= startsAt && currentDate <= endsAt;
}

function distanceScore(distanceKm: number): number {
  if (distanceKm <= 1) return 20;
  if (distanceKm <= 3) return 15;
  if (distanceKm <= 5) return 10;
  if (distanceKm <= 10) return 5;
  return 0;
}

function freshnessScore(
  facility: Facility,
  now: Date
): {
  score: number;
  reason?: RecommendationReasonCode;
  warning?: RecommendationWarningCode;
} {
  const freshness = getFacilityProvenance(facility, now).freshness;
  if (freshness === 'live') return { score: 10, reason: 'fresh_data' };
  if (freshness === 'recent') return { score: 7, reason: 'fresh_data' };
  if (freshness === 'stale') return { score: 2, warning: 'stale_data' };
  return { score: 5, warning: 'freshness_unknown' };
}

interface PresetPoints {
  score: number;
  reasons: RecommendationReasonCode[];
}

type PresetScorer = (
  facility: Facility,
  context: RecommendationContext,
  openState: ReturnType<typeof getFacilityOpenState>
) => PresetPoints;

const QUIET_CATEGORIES = new Set<Facility['category']>([
  'library',
  'park',
  'cooling_shelter',
  'culture',
]);

const indoorPoints = (facility: Facility, score: number): PresetPoints =>
  // 실내 판정은 카테고리 기반(도서관·문화·쉼터·맛집·체육)이며 지하철역은 포함하지 않는다.
  isFacilityIndoor(facility)
    ? { score, reasons: ['indoor', 'weather_safe'] }
    : { score: 0, reasons: [] };

const PRESET_SCORERS: Record<RecommendationContext['preset'], PresetScorer> = {
  none: () => ({ score: 0, reasons: [] }),
  available_now: (_facility, _context, openState) => ({
    score: openState === 'open' ? 20 : openState === 'unknown' ? 8 : 0,
    reasons: [],
  }),
  quiet: (facility, context) => {
    const reasons: RecommendationReasonCode[] = [];
    let score = QUIET_CATEGORIES.has(facility.category) ? 12 : 0;
    if (!isCrowded(context.congestion)) {
      score += context.congestion ? 8 : 4;
      if (context.congestion) reasons.push('quiet_context');
    }
    return { score, reasons };
  },
  rainy_day: facility => indoorPoints(facility, 20),
  today_event: (facility, context) => ({
    score: isEventActiveToday(facility, context.now)
      ? 20
      : facility.category === 'cultural_reservation'
        ? 10
        : 0,
    reasons: [],
  }),
  bike_trip: facility => ({
    score: facility.category === 'bike' ? 20 : facility.category === 'park' ? 16 : 0,
    reasons: [],
  }),
  cool_down: facility =>
    facility.category === 'cooling_shelter'
      ? { score: 20, reasons: [] }
      : indoorPoints(facility, 14),
};

function presetScore(
  facility: Facility,
  context: RecommendationContext,
  openState: ReturnType<typeof getFacilityOpenState>
): PresetPoints {
  const { score, reasons } = PRESET_SCORERS[context.preset](facility, context, openState);
  return {
    score: Math.min(20, score),
    reasons: score >= 14 ? ['preset_match', ...reasons] : reasons,
  };
}

function riskScore(
  facility: Facility,
  context: RecommendationContext
): { score: number; warnings: RecommendationWarningCode[] } {
  const indoor = isFacilityIndoor(facility);
  const warnings: RecommendationWarningCode[] = [];
  let penalty = 0;

  if (isRainyWeather(context.weather) && !indoor) {
    penalty += 15;
    warnings.push('rain_risk');
  }
  if (isHotWeather(context.weather) && !indoor && facility.category !== 'cooling_shelter') {
    penalty += 20;
    warnings.push('heat_risk');
  }
  if (isPoorAirQuality(context.weather) && !indoor) {
    penalty += 10;
    warnings.push('air_quality_risk');
  }
  if (isCrowded(context.congestion)) {
    penalty += 8;
    warnings.push('crowded_context');
  }

  return { score: penalty === 0 ? 0 : -Math.min(30, penalty), warnings };
}

/**
 * 0~100 적합도. 거리는 `context.origin`(지도 중심·사용자 위치·선택 장소)을 기준으로 잰다.
 * 데이터가 없으면 중립 점수와 `*_unknown` 경고를 함께 돌려준다.
 */
export function scoreFacility(
  facility: Facility | RecommendationFacility,
  context: RecommendationContext
): FacilityRecommendation {
  const distance = calculateDistanceKm(context.origin, facility.position);
  const openState = getFacilityOpenState(facility.operatingHours, context.now);
  const reasonCodes: RecommendationReasonCode[] = [];
  const warningCodes: RecommendationWarningCode[] = [];
  const preferred = context.preferredCategories || [];
  const interest = preferred.length === 0 ? 12 : preferred.includes(facility.category) ? 25 : 0;
  if (interest === 25) reasonCodes.push('interest_match');

  const distancePoints = distanceScore(distance);
  if (distancePoints >= 15) reasonCodes.push('nearby');

  const open = openState === 'open' ? 15 : openState === 'unknown' ? 7 : 0;
  if (openState === 'open') reasonCodes.push('open_now');
  if (openState === 'closed') warningCodes.push('closed_now');
  if (openState === 'unknown') warningCodes.push('hours_unknown');

  const reservable = isFacilityReservable(facility);
  const availability = reservable ? 10 : 5;
  if (reservable) reasonCodes.push('reservable');

  const freshness = freshnessScore(facility, context.now);
  if (freshness.reason) reasonCodes.push(freshness.reason);
  if (freshness.warning) warningCodes.push(freshness.warning);

  const preset = presetScore(facility, context, openState);
  const risk = riskScore(facility, context);
  warningCodes.push(...risk.warnings);

  const factors: RecommendationFactorScores = {
    interest,
    distance: distancePoints,
    open,
    availability,
    freshness: freshness.score,
    preset: preset.score,
    risk: risk.score,
  };
  const score = Math.max(
    0,
    Math.min(
      100,
      Object.values(factors).reduce((sum, value) => sum + value, 0)
    )
  );
  // 사용자가 고른 상황과 직접 관련된 근거를 먼저 보여줍니다.
  const uniqueReasons = [...new Set([...preset.reasons, ...reasonCodes])].slice(0, 3);
  const uniqueWarnings = [...new Set(warningCodes)].slice(0, 3);

  return {
    facility: { ...facility, distance },
    score,
    factors,
    reasonCodes: uniqueReasons,
    reasons: uniqueReasons.map(reasonLabel),
    warningCodes: uniqueWarnings,
    warnings: uniqueWarnings.map(warningLabel),
  };
}

/** 프리셋에서 목적지가 될 수 없는 교통 카테고리를 뺀다. */
export function filterPresetCandidates(
  facilities: Facility[],
  preset: RecommendationContext['preset']
): Facility[] {
  return facilities.filter(facility => isCategoryAllowedForPreset(facility.category, preset));
}

export function recommendFacilities(
  facilities: Facility[],
  context: RecommendationContext,
  limit = 10
): FacilityRecommendation[] {
  return mergeDuplicatePlaces(filterPresetCandidates(facilities, context.preset))
    .map(facility => scoreFacility(facility, context))
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      return (first.facility.distance || 0) - (second.facility.distance || 0);
    })
    .slice(0, limit);
}

export function getNearbyAlternatives(
  selected: Facility,
  facilities: Facility[],
  context: Omit<RecommendationContext, 'origin' | 'originKind'>,
  limit = 3
): FacilityRecommendation[] {
  const selectedName = normalizePlaceName(selected.name);
  return recommendFacilities(
    facilities.filter(
      facility =>
        !(facility.id === selected.id && facility.category === selected.category) &&
        !(
          facility.category === selected.category &&
          normalizePlaceName(facility.name) === selectedName &&
          calculateDistanceKm(selected.position, facility.position) * 1000 <=
            DUPLICATE_MERGE_RADIUS_METERS
        )
    ),
    { ...context, origin: selected.position, originKind: 'place' },
    Math.max(limit * 4, limit)
  )
    .filter(recommendation => (recommendation.facility.distance || 0) <= 5)
    .slice(0, limit);
}
