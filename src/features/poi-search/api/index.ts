/**
 * @fileoverview POI Search API Service
 * @description POI 검색 서비스 계층
 */

import { SEOUL_LOCATIONS } from '@/entities/weather';
import {
  addDistanceToPOIs,
  sortPOIsByDistance,
  filterPOIsByRadius,
} from '../lib/distance-calculator';
import type { POISearchOptions, POISearchResult } from '../model/types';

/**
 * 주변 POI 검색
 * @param options 검색 옵션
 * @returns POI 검색 결과
 */
export function searchNearbyPOIs(options: POISearchOptions): POISearchResult {
  const { lat, lng, radius, limit = 10 } = options;

  // 거리 정보 추가
  const poisWithDistance = addDistanceToPOIs(SEOUL_LOCATIONS, lat, lng);

  // 거리순 정렬
  const sortedPOIs = sortPOIsByDistance(poisWithDistance);

  // 반경 필터링 (선택적)
  const filteredPOIs = radius ? filterPOIsByRadius(sortedPOIs, radius) : sortedPOIs;

  // 개수 제한
  const limitedPOIs = filteredPOIs.slice(0, limit);

  return {
    pois: limitedPOIs,
    center: { lat, lng },
    searchRadius: radius,
  };
}

/**
 * 특정 반경 내의 모든 POI 가져오기
 * @param lat 중심점 위도
 * @param lng 중심점 경도
 * @param radius 반경 (미터 단위)
 * @returns 반경 내의 모든 POI
 */
export function getPOIsInRadius(lat: number, lng: number, radius: number) {
  const poisWithDistance = addDistanceToPOIs(SEOUL_LOCATIONS, lat, lng);
  const filteredPOIs = filterPOIsByRadius(poisWithDistance, radius);
  return sortPOIsByDistance(filteredPOIs);
}
