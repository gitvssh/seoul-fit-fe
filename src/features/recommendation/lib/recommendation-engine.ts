import type { CongestionData, Facility, WeatherData } from '@/lib/types';
import { getFacilityProvenance } from '@/entities/facility/lib/provenance';
import {
  calculateDistanceKm,
  getFacilityOpenState,
  isFacilityIndoor,
  isFacilityReservable,
} from '@/features/place-filter/lib/place-filter';
import type {
  FacilityRecommendation,
  RecommendationContext,
  RecommendationFactorScores,
  RecommendationPresetDefinition,
  RecommendationReasonCode,
  RecommendationWarningCode,
} from '../model/types';

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

const REASON_LABELS: Record<RecommendationReasonCode, string> = {
  interest_match: '관심 시설과 일치해요',
  nearby: '현재 위치에서 가까워요',
  open_now: '현재 운영 중이에요',
  reservable: '예약 또는 예매가 가능해요',
  fresh_data: '최근 갱신 정보가 있어요',
  preset_match: '선택한 상황에 잘 맞아요',
  indoor: '실내에서 이용할 수 있어요',
  quiet_context: '주변 혼잡 위험이 낮아요',
  weather_safe: '현재 날씨 위험을 피하기 좋아요',
};

const WARNING_LABELS: Record<RecommendationWarningCode, string> = {
  closed_now: '현재 운영이 종료된 것으로 보여요',
  hours_unknown: '운영시간을 확인할 수 없어요',
  stale_data: '데이터 갱신이 지연됐어요',
  freshness_unknown: '데이터 기준 시각을 확인할 수 없어요',
  rain_risk: '비가 올 때 야외 이용이 불편할 수 있어요',
  heat_risk: '더운 날씨에 야외 이용 주의가 필요해요',
  air_quality_risk: '대기질이 좋지 않아 야외 활동에 주의가 필요해요',
  crowded_context: '주변 주요 지역이 붐비고 있어요',
};

function normalize(value: string | undefined): string {
  return value?.toLocaleLowerCase('ko-KR').replace(/\s+/g, '') || '';
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

function freshnessScore(facility: Facility, now: Date): {
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

function presetScore(
  facility: Facility,
  context: RecommendationContext,
  openState: ReturnType<typeof getFacilityOpenState>
): { score: number; reasons: RecommendationReasonCode[] } {
  const reasons: RecommendationReasonCode[] = [];
  let score = 0;

  switch (context.preset) {
    case 'available_now':
      if (openState === 'open') score = 20;
      else if (openState === 'unknown') score = 8;
      break;
    case 'quiet':
      if (['library', 'park', 'cooling_shelter', 'culture'].includes(facility.category)) score += 12;
      if (!isCrowded(context.congestion)) {
        score += context.congestion ? 8 : 4;
        if (context.congestion) reasons.push('quiet_context');
      }
      break;
    case 'rainy_day':
      if (isFacilityIndoor(facility)) {
        score = 20;
        reasons.push('indoor', 'weather_safe');
      }
      break;
    case 'today_event':
      if (isEventActiveToday(facility, context.now)) score = 20;
      break;
    case 'bike_trip':
      if (facility.category === 'bike') score = 20;
      else if (facility.category === 'park') score = 16;
      break;
    case 'cool_down':
      if (facility.category === 'cooling_shelter') score = 20;
      else if (isFacilityIndoor(facility)) {
        score = 14;
        reasons.push('indoor', 'weather_safe');
      }
      break;
  }
  if (score >= 14) reasons.unshift('preset_match');
  return { score: Math.min(20, score), reasons };
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

  return { score: -Math.min(30, penalty), warnings };
}

export function scoreFacility(
  facility: Facility,
  context: RecommendationContext
): FacilityRecommendation {
  const distance = calculateDistanceKm(context.origin, facility.position);
  const openState = getFacilityOpenState(facility.operatingHours, context.now);
  const reasonCodes: RecommendationReasonCode[] = [];
  const warningCodes: RecommendationWarningCode[] = [];
  const preferred = context.preferredCategories || [];
  const interest =
    preferred.length === 0 ? 12 : preferred.includes(facility.category) ? 25 : 0;
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
    Math.min(100, Object.values(factors).reduce((sum, value) => sum + value, 0))
  );
  // 사용자가 고른 상황과 직접 관련된 근거를 먼저 보여줍니다.
  const uniqueReasons = [...new Set([...preset.reasons, ...reasonCodes])].slice(0, 3);
  const uniqueWarnings = [...new Set(warningCodes)].slice(0, 3);

  return {
    facility: { ...facility, distance },
    score,
    factors,
    reasonCodes: uniqueReasons,
    reasons: uniqueReasons.map(code => REASON_LABELS[code]),
    warningCodes: uniqueWarnings,
    warnings: uniqueWarnings.map(code => WARNING_LABELS[code]),
  };
}

export function recommendFacilities(
  facilities: Facility[],
  context: RecommendationContext,
  limit = 10
): FacilityRecommendation[] {
  return facilities
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
  context: Omit<RecommendationContext, 'origin'>,
  limit = 3
): FacilityRecommendation[] {
  return recommendFacilities(
    facilities.filter(
      facility =>
        !(facility.id === selected.id && facility.category === selected.category)
    ),
    { ...context, origin: selected.position },
    Math.max(limit * 4, limit)
  )
    .filter(recommendation => (recommendation.facility.distance || 0) <= 5)
    .slice(0, limit);
}
