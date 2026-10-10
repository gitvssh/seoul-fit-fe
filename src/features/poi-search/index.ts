/**
 * @fileoverview POI Search Feature Public API
 * @description POI 검색 기능 공개 인터페이스
 */

// API exports
export { searchNearbyPOIs, getPOIsInRadius } from './api';

// Utility exports
export {
  calculateDistance,
  addDistanceToPOIs,
  sortPOIsByDistance,
  filterPOIsByRadius,
  formatDistance,
} from './lib/distance-calculator';

// Type exports
export type {
  POICategory,
  POIWithDistance,
  POISearchOptions,
  POISearchResult,
} from './model/types';
