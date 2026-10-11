/**
 * 규칙 기반 추천 기능의 공개 API.
 * 점수 계약(0~100, 요소별 점수·이유·경고)은 docs/PRODUCT_IMPLEMENTATION_PLAN.md §4.3을 따른다.
 */
export {
  DUPLICATE_MERGE_RADIUS_METERS,
  RECOMMENDATION_PRESETS,
  filterPresetCandidates,
  getNearbyAlternatives,
  isCrowded,
  isHotWeather,
  isPoorAirQuality,
  isRainyWeather,
  mergeDuplicatePlaces,
  normalizePlaceName,
  recommendFacilities,
  scoreFacility,
} from './lib/recommendation-engine';
export {
  PRESET_ALLOWED_TRANSIT,
  PRESET_REQUIRED_CATEGORIES,
  TRANSIT_CATEGORIES,
  getPresetRequiredCategories,
  isCategoryAllowedForPreset,
  isTransitCategory,
} from './lib/presets';
export { getCombinedLiveDataStatus, getLiveDataStatus } from './lib/live-data';
export type { LiveDataFreshness, LiveDataLabelKey, LiveDataStatus } from './lib/live-data';
export type {
  FacilityRecommendation,
  RecommendationContext,
  RecommendationFacility,
  RecommendationFactorScores,
  RecommendationOriginKind,
  RecommendationPreset,
  RecommendationPresetDefinition,
  RecommendationReasonCode,
  RecommendationWarningCode,
} from './model/types';
