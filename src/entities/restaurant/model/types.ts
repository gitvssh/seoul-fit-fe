/**
 * @fileoverview Restaurant Entity Types
 * @description 레스토랑 도메인 타입 정의
 */

// 백엔드 원본 타입 (API 응답)
export interface RestaurantRaw {
  id: number;
  postSn: string;
  langCodeId: string;
  name: string;
  postUrl: string;
  address: string;
  newAddress: string;
  phone: string;
  website: string;
  operatingHours: string;
  subwayInfo: string;
  homepageLang: string;
  representativeMenu: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

// 프론트엔드 도메인 타입
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  newAddress: string;
  phone: string;
  website: string;
  operatingHours: string;
  subwayInfo: string;
  representativeMenu: string;
  latitude: number;
  longitude: number;
  postUrl: string;
}

// 레스토랑 검색 파라미터
export interface RestaurantSearchParams {
  lat?: number;
  lng?: number;
  all?: boolean;
}

// 위치 기반 레스토랑 (거리 정보 포함)
export interface RestaurantWithDistance extends Restaurant {
  distance?: number;
}
