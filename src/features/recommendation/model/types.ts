import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';

/**
 * 상황 프리셋. `none`은 프리셋을 고르지 않은 상태(칩 재탭으로 해제)이며
 * 프리셋 가점·교통 제외 없이 일반 점수만 쓴다.
 */
export type RecommendationPreset =
  | 'none'
  | 'available_now'
  | 'quiet'
  | 'rainy_day'
  | 'today_event'
  | 'bike_trip'
  | 'cool_down';

export type RecommendationReasonCode =
  | 'interest_match'
  | 'nearby'
  | 'open_now'
  | 'reservable'
  | 'fresh_data'
  | 'preset_match'
  | 'indoor'
  | 'quiet_context'
  | 'weather_safe';

export type RecommendationWarningCode =
  | 'closed_now'
  | 'hours_unknown'
  | 'stale_data'
  | 'freshness_unknown'
  | 'rain_risk'
  | 'heat_risk'
  | 'air_quality_risk'
  | 'crowded_context';

/** 거리 기준점의 출처. 문구·분석에만 쓰이고 점수에는 영향이 없다. */
export type RecommendationOriginKind = 'map_center' | 'user_location' | 'place';

export interface RecommendationContext {
  /**
   * 거리 점수의 기준점. 탐색 패널은 지도 중심을, 현재 위치 모드는 사용자 위치를,
   * 주변 대안은 선택한 장소를 넘긴다. 서울시청 기본값을 그대로 쓰지 않는다.
   */
  origin: Position;
  originKind?: RecommendationOriginKind;
  now: Date;
  preset: RecommendationPreset;
  preferredCategories?: FacilityCategory[];
  weather?: WeatherData | null;
  congestion?: CongestionData | null;
}

export interface RecommendationFactorScores {
  interest: number;
  distance: number;
  open: number;
  availability: number;
  freshness: number;
  preset: number;
  risk: number;
}

/**
 * 추천 결과의 장소. 같은 이름·150m 안의 레코드(환승역의 호선별 레코드)를 하나로
 * 합친 경우 `routes`에 노선 라벨을, `mergedIds`에 숨긴 레코드 ID를 둔다.
 */
export interface RecommendationFacility extends Facility {
  routes?: string[];
  mergedIds?: string[];
}

export interface FacilityRecommendation {
  facility: RecommendationFacility;
  score: number;
  factors: RecommendationFactorScores;
  reasonCodes: RecommendationReasonCode[];
  reasons: string[];
  warningCodes: RecommendationWarningCode[];
  warnings: string[];
}

export interface RecommendationPresetDefinition {
  id: Exclude<RecommendationPreset, 'none'>;
  label: string;
  description: string;
}
