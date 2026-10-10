/**
 * @fileoverview Restaurant Entity Public API
 * @description 레스토랑 엔티티 공개 인터페이스
 */

// Types
export type {
  Restaurant,
  RestaurantRaw,
  RestaurantSearchParams,
  RestaurantWithDistance,
} from './model/types';

// API functions
export {
  transformRestaurantData,
  validateRestaurantId,
  calculateDistance,
  fetchAllRestaurants,
  fetchNearbyRestaurants,
  validateLocationParams,
} from './api';
