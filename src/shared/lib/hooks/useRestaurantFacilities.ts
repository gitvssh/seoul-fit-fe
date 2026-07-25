/**
 * @fileoverview 음식점 시설 커스텀 훅
 * @description 음식점 데이터 관리를 위한 React Hook
 */

import { useState, useCallback } from 'react';
import { getRestaurantsNearby, getAllRestaurants } from '@/shared/api/restaurants';
import type { Facility } from '@/entities/facility/model/types';

export function useRestaurantFacilities() {
  const [restaurants, setRestaurants] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 위치 기반 음식점 조회
  const fetchRestaurants = useCallback(async (lat: number, lng: number) => {
    console.log('[useRestaurantFacilities] 음식점 데이터 조회 시작');
    setLoading(true);
    setError(null);
    
    try {
      const facilities = await getRestaurantsNearby(lat, lng);
      console.log(`[useRestaurantFacilities] 음식점 ${facilities.length}개 조회 완료`);
      setRestaurants(facilities);
      return facilities;
    } catch (err) {
      const errorMsg = '음식점 조회 실패';
      console.error(errorMsg, err);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 모든 음식점 조회
  const fetchAllRestaurants = useCallback(async () => {
    console.log('[useRestaurantFacilities] 모든 음식점 데이터 조회 시작');
    setLoading(true);
    setError(null);
    
    try {
      const facilities = await getAllRestaurants();
      console.log(`[useRestaurantFacilities] 음식점 ${facilities.length}개 조회 완료`);
      setRestaurants(facilities);
      return facilities;
    } catch (err) {
      const errorMsg = '음식점 전체 조회 실패';
      console.error(errorMsg, err);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 음식점 초기화
  const clearRestaurants = useCallback(() => {
    setRestaurants([]);
    setError(null);
  }, []);

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    fetchAllRestaurants,
    clearRestaurants,
  };
}
