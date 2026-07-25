import type { FacilityCategory } from '@/lib/types';
import type { PlaceFilterState } from '@/features/place-filter/model/types';
import type { RecommendationPreset } from '@/features/recommendation/model/types';

export interface NaturalLanguageSearchRule {
  matched: boolean;
  categories: FacilityCategory[];
  filters: Pick<
    PlaceFilterState,
    'maxDistanceKm' | 'openOnly' | 'reservableOnly' | 'indoorOnly' | 'lowCongestionOnly'
  >;
  preset: RecommendationPreset | null;
  summary: string;
  summaryEn: string;
  matchedRuleCodes: string[];
}
