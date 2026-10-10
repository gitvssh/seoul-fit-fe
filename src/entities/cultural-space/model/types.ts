/**
 * @fileoverview Cultural Space Entity Types
 * @description 문화공간 도메인 타입 정의
 */

// 문화공간 데이터 타입
export interface CulturalSpace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  description?: string;
  operatingHours?: string;
  phone?: string;
  website?: string;
  facilities?: string[];
  programs?: string[];
  distance?: number;
}

// 문화공간 검색 파라미터
export interface CulturalSpaceSearchParams {
  lat: number;
  lng: number;
  radius?: number;
}

// 문화공간 검색 결과
export interface CulturalSpaceSearchResult {
  spaces: CulturalSpace[];
  center: { lat: number; lng: number };
  radius: number;
  count: number;
}
