import type { FacilityCategory } from '@/lib/types';
import type { RecommendationPreset } from '../model/types';

/**
 * 프리셋이 추천을 만들기 위해 지도에 로드·활성화돼야 하는 카테고리.
 * 엔진의 프리셋 가점(`presetScore`)과 짝을 이룬다. 프리셋을 고르면 탐색 패널이
 * 이 카테고리를 활성화하고 데이터를 로드해야 "시청역만 반복"되는 결과를 피할 수 있다.
 */
export const PRESET_REQUIRED_CATEGORIES: Record<RecommendationPreset, FacilityCategory[]> = {
  none: [],
  available_now: ['park', 'library', 'culture'],
  quiet: ['park', 'library'],
  rainy_day: ['library', 'culture', 'cooling_shelter'],
  today_event: ['cultural_event', 'cultural_reservation', 'culture'],
  bike_trip: ['bike', 'park'],
  cool_down: ['cooling_shelter', 'library', 'culture'],
};

/** 이동 수단이지 목적지가 아닌 카테고리. 프리셋 추천에서는 기본적으로 제외한다. */
export const TRANSIT_CATEGORIES: readonly FacilityCategory[] = ['subway', 'bike'];

/**
 * 프리셋별로 추천에 포함해도 되는 교통 카테고리.
 * `bike_trip`은 대여소가 곧 목적지이고, `none`(프리셋 없음)은 전체를 보여 준다.
 * 지하철역은 어떤 상황 프리셋에서도 목적지로 추천하지 않는다.
 */
export const PRESET_ALLOWED_TRANSIT: Record<RecommendationPreset, readonly FacilityCategory[]> = {
  none: TRANSIT_CATEGORIES,
  available_now: [],
  quiet: [],
  rainy_day: [],
  today_event: [],
  bike_trip: ['bike'],
  cool_down: [],
};

export function getPresetRequiredCategories(preset: RecommendationPreset): FacilityCategory[] {
  return [...PRESET_REQUIRED_CATEGORIES[preset]];
}

export function isTransitCategory(category: FacilityCategory): boolean {
  return TRANSIT_CATEGORIES.includes(category);
}

export function isCategoryAllowedForPreset(
  category: FacilityCategory,
  preset: RecommendationPreset
): boolean {
  return !isTransitCategory(category) || PRESET_ALLOWED_TRANSIT[preset].includes(category);
}
