/**
 * @fileoverview Restaurant Search Feature API
 * @description 레스토랑 검색 기능 API 레이어 (React Query 없이 기본 fetch 사용)
 */

import { useState, useCallback } from 'react';
import { transformRestaurantData } from '@/entities/restaurant';
import type { Restaurant, RestaurantRaw, RestaurantSearchParams } from '@/entities/restaurant';

/**
 * 레스토랑 데이터 fetch 함수
 */
const fetchRestaurantsData = async (params: RestaurantSearchParams = {}): Promise<Restaurant[]> => {
  const { lat, lng, all } = params;
  const searchParams = new URLSearchParams();

  if (all) {
    searchParams.set('all', 'true');
  } else if (lat && lng) {
    searchParams.set('lat', lat.toString());
    searchParams.set('lng', lng.toString());
  }

  const response = await fetch(`/api/restaurants?${searchParams}`);

  if (!response.ok) {
    throw new Error('레스토랑 데이터 조회 실패');
  }

  const rawData: RestaurantRaw[] = await response.json();
  return transformRestaurantData(rawData);
};

/**
 * 레스토랑 목록 조회 훅 (기본 useState 사용)
 */
export const useRestaurants = (params: RestaurantSearchParams = {}) => {
  const [data, setData] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const restaurants = await fetchRestaurantsData(params);
      setData(restaurants);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [params.lat, params.lng, params.all]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * 전체 레스토랑 조회 (간편 함수)
 */
export const getAllRestaurants = () => {
  return fetchRestaurantsData({ all: true });
};

/**
 * 위치 기반 레스토랑 조회 (간편 함수)
 */
export const getNearbyRestaurants = (lat: number, lng: number) => {
  return fetchRestaurantsData({ lat, lng });
};

/**
 * 전체 레스토랑 조회 훅
 */
export const useAllRestaurants = () => {
  return useRestaurants({ all: true });
};

/**
 * 위치 기반 레스토랑 조회 훅
 */
export const useNearbyRestaurants = (lat: number, lng: number) => {
  return useRestaurants({ lat, lng });
};
