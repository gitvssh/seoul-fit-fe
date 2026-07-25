import type { FacilityCategory } from '@/lib/types';

export interface PlaceFilterState {
  categories: FacilityCategory[];
  maxDistanceKm: number | null;
  openOnly: boolean;
  reservableOnly: boolean;
  indoorOnly: boolean;
  lowCongestionOnly: boolean;
}

export const DEFAULT_PLACE_FILTERS: PlaceFilterState = {
  categories: [],
  maxDistanceKm: null,
  openOnly: false,
  reservableOnly: false,
  indoorOnly: false,
  lowCongestionOnly: false,
};

export type PlaceFilterKey =
  | 'max_distance'
  | 'category'
  | 'open_now'
  | 'reservable'
  | 'indoor'
  | 'low_congestion';
