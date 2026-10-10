/**
 * @fileoverview Bike Station Entity Public API
 * @description 따릉이 대여소 엔티티 공개 인터페이스
 */

// Types
export type {
  BikeStationRaw,
  BikeStation,
  BikeStationSearchParams,
  BikeStationSearchResult,
} from './model/types';

// API Functions
export {
  searchNearbyBikeStations,
  validateSearchParams,
  transformBikeStation,
  ensureBikeStationCache,
  getBikeStationsFromCache,
  getCacheInfo,
} from './api';
