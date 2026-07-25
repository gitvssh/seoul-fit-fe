import type { CongestionData, Facility, FacilityCategory, Position, WeatherData } from '@/lib/types';

export type RecommendationPreset =
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

export interface RecommendationContext {
  origin: Position;
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

export interface FacilityRecommendation {
  facility: Facility;
  score: number;
  factors: RecommendationFactorScores;
  reasonCodes: RecommendationReasonCode[];
  reasons: string[];
  warningCodes: RecommendationWarningCode[];
  warnings: string[];
}

export interface RecommendationPresetDefinition {
  id: RecommendationPreset;
  label: string;
  description: string;
}
