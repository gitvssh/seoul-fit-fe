/**
 * @fileoverview POI Search Type Definitions
 * @description POI 검색 관련 타입 정의
 */

import type { Location } from '@/entities/weather';

/**
 * POI 카테고리 타입
 */
export type POICategory = 'tourist' | 'heritage' | 'subway' | 'market' | 'landmark' | 'park';

/**
 * 거리 정보를 포함한 POI 타입
 */
export interface POIWithDistance extends Location {
  distance: number;
  category?: POICategory;
}

/**
 * POI 검색 옵션
 */
export interface POISearchOptions {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
  categories?: POICategory[];
}

/**
 * POI 검색 결과
 */
export interface POISearchResult {
  pois: POIWithDistance[];
  center: {
    lat: number;
    lng: number;
  };
  searchRadius?: number;
}
