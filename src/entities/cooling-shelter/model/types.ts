/**
 * @fileoverview Cooling Shelter Entity Types
 * @description 무더위 쉼터 도메인 타입 정의
 */

// 무더위 쉼터 데이터 타입
export interface CoolingShelter {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  capacity?: number;
  operatingHours?: string;
  phone?: string;
  facilities?: string[];
  distance?: number;
}

// 무더위 쉼터 검색 파라미터
export interface CoolingShelterSearchParams {
  lat: number;
  lng: number;
  radius?: number;
}

// 무더위 쉼터 검색 결과
export interface CoolingShelterSearchResult {
  shelters: CoolingShelter[];
  center: { lat: number; lng: number };
  radius: number;
  count: number;
}
