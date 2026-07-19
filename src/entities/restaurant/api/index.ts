/**
 * @fileoverview Restaurant Entity API
 * @description 레스토랑 데이터 변환 및 처리 로직
 */

import type { Restaurant, RestaurantRaw } from '../model/types';
import { getBackendInternalUrl } from '@/config/environment';

/**
 * 백엔드 원본 데이터를 프론트엔드 형식으로 변환
 * 비즈니스 규칙: 한국어 데이터만 필터링
 */
export const transformRestaurantData = (raw: RestaurantRaw[]): Restaurant[] => {
  return raw
    .filter(item => item.langCodeId === 'ko')  // 한국어 데이터만
    .map(item => ({
      id: `restaurant_${item.id}`,
      name: item.name,
      address: item.address,
      newAddress: item.newAddress,
      phone: item.phone,
      website: item.website,
      operatingHours: item.operatingHours,
      subwayInfo: item.subwayInfo,
      representativeMenu: item.representativeMenu,
      latitude: item.latitude,
      longitude: item.longitude,
      postUrl: item.postUrl,
    }));
};

/**
 * 레스토랑 ID 유효성 검증
 */
export const validateRestaurantId = (id: string): boolean => {
  return id.startsWith('restaurant_') && !isNaN(Number(id.replace('restaurant_', '')));
};

/**
 * 레스토랑 위치 기반 거리 계산 (Haversine 공식)
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 전체 레스토랑 데이터 조회
 */
export const fetchAllRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const response = await fetch(`${getBackendInternalUrl()}/api/v1/restaurants/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`전체 맛집 API 호출 실패: ${response.status}`);
      return [];
    }

    const rawData: RestaurantRaw[] = await response.json();
    return transformRestaurantData(rawData);
  } catch (error) {
    console.warn('전체 맛집 백엔드 서버 연결 실패:', error);
    return [];
  }
};

/**
 * 위치 기반 레스토랑 데이터 조회
 */
export const fetchNearbyRestaurants = async (
  lat: number,
  lng: number
): Promise<Restaurant[]> => {
  try {
    const response = await fetch(
      `${getBackendInternalUrl()}/api/v1/restaurants/nearby?latitude=${lat}&longitude=${lng}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`맛집 API 호출 실패: ${response.status}`);
      return [];
    }

    const rawData: RestaurantRaw[] = await response.json();
    return transformRestaurantData(rawData);
  } catch (error) {
    console.warn('맛집 백엔드 서버 연결 실패:', error);
    return [];
  }
};

/**
 * 파라미터 검증
 */
export const validateLocationParams = (
  lat: string | null,
  lng: string | null
): { lat: number; lng: number } | null => {
  if (!lat || !lng) {
    return null;
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return null;
  }

  return { lat: parsedLat, lng: parsedLng };
};
