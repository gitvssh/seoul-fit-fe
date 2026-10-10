/**
 * @fileoverview Congestion Entity Public API
 * @description 혼잡도 엔티티 공개 인터페이스
 */

// API exports
export {
  fetchSeoulCongestionData,
  transformCongestionData,
  getCongestionFromCache,
  saveCongestionToCache,
  validateApiResponse,
  fetchMultipleCongestionData,
} from './api';

// Utility exports
export { getCongestionColor, getCongestionScore, parsePopulation } from './lib/congestion-utils';

// Type exports
export type {
  SeoulCongestionApiResponse,
  CongestionData,
  CongestionLevel,
  CongestionColor,
  CongestionCacheData,
} from './model/types';
