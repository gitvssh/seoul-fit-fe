/**
 * @fileoverview Distance Calculation Utilities
 * @description 거리 계산 관련 유틸리티 함수
 */

import type { Location } from '@/entities/weather';
import type { POIWithDistance } from '../model/types';

/**
 * Haversine 공식을 사용한 두 지점 사이의 거리 계산
 * @param lat1 첫 번째 지점의 위도
 * @param lng1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lng2 두 번째 지점의 경도
 * @returns 두 지점 사이의 거리 (미터 단위)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * POI 목록에 거리 정보 추가
 * @param pois POI 목록
 * @param centerLat 중심점 위도
 * @param centerLng 중심점 경도
 * @returns 거리 정보가 추가된 POI 목록
 */
export function addDistanceToPOIs(
  pois: Location[],
  centerLat: number,
  centerLng: number
): POIWithDistance[] {
  return pois.map(poi => ({
    ...poi,
    distance: calculateDistance(centerLat, centerLng, poi.lat, poi.lng),
  }));
}

/**
 * POI 목록을 거리순으로 정렬
 * @param pois 거리 정보가 포함된 POI 목록
 * @returns 거리순으로 정렬된 POI 목록
 */
export function sortPOIsByDistance(pois: POIWithDistance[]): POIWithDistance[] {
  return [...pois].sort((a, b) => a.distance - b.distance);
}

/**
 * 반경 내의 POI 필터링
 * @param pois 거리 정보가 포함된 POI 목록
 * @param radius 반경 (미터 단위)
 * @returns 반경 내의 POI 목록
 */
export function filterPOIsByRadius(pois: POIWithDistance[], radius: number): POIWithDistance[] {
  return pois.filter(poi => poi.distance <= radius);
}

/**
 * 거리를 사람이 읽기 쉬운 형식으로 변환
 * @param distance 거리 (미터 단위)
 * @returns 포맷된 거리 문자열
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}
