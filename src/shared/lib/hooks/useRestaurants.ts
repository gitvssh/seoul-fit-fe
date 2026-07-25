/**
 * @deprecated 이 훅은 더 이상 사용되지 않습니다.
 * 대신 @/features/restaurant-search의 useRestaurants를 사용하세요.
 * 
 * 마이그레이션 가이드:
 * - useRestaurants() → useRestaurants({ lat, lng }) 또는 useAllRestaurants()
 * - React Query 기반으로 변경되어 더 나은 캐싱과 에러 처리 제공
 */

export { useRestaurants, useAllRestaurants, useNearbyRestaurants } from '@/features/restaurant-search';
