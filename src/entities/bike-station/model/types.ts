/**
 * @fileoverview Bike Station Entity Types
 * @description 따릉이 대여소 도메인 타입 정의
 */

// 서울 공공데이터 원본 타입
export interface BikeStationRaw {
  stationId: string;
  stationName: string;
  stationLatitude: string;
  stationLongitude: string;
  rackTotCnt: string;
  parkingBikeTotCnt: string;
  shared: string;
}

// 프론트엔드 따릉이 대여소 타입
export interface BikeStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  stationId: string;
  rackTotCnt: string;
  parkingBikeTotCnt: string;
  shared: string;
}

// 따릉이 검색 파라미터
export interface BikeStationSearchParams {
  lat: number;
  lng: number;
  radius?: number;
}

// 따릉이 검색 응답
export interface BikeStationSearchResult {
  center: { lat: number; lng: number };
  radius: number;
  count: number;
  stations: BikeStation[];
  cached: boolean;
  fetchTime: string;
}
