/**
 * @fileoverview Weather Entity Public API
 * @description 날씨 엔티티 공개 인터페이스
 */

// API exports
export {
  fetchSeoulWeatherData,
  transformWeatherData,
  getWeatherFromCache,
  saveWeatherToCache,
  validateApiResponse,
} from './api';

// Location utilities
export {
  findNearestAreaCode,
  findNearestAreaMatch,
  getLocationByCode,
} from './lib/location-finder';

// Data exports
export { SEOUL_LOCATIONS } from './model/locations';

// Type exports
export type {
  SeoulWeatherApiResponse,
  WeatherData,
  Location,
  WeatherCacheData,
} from './model/types';
