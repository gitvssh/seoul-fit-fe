/**
 * @fileoverview Park Data Converter
 * @description 공원 데이터 변환 유틸리티
 */

import { ParkRow } from '@/lib/seoulApi';
import { Park } from '../model/types';

/**
 * 서울 공공데이터를 프론트엔드 형식으로 변환
 */
export function convertParkRowToAppFormat(park: ParkRow): Park {
  return {
    id: park.P_IDX,
    name: park.P_PARK,
    content: park.P_LIST_CONTENT,
    area: park.AREA,
    address: park.P_ADDR,
    adminTel: park.P_ADMINTEL,
    longitude: parseFloat(park.LONGITUDE) || 0,
    latitude: parseFloat(park.LATITUDE) || 0,
    useReference: park.USE_REFER,
    imageUrl: park.P_IMG,
  };
}

/**
 * 여러 공원 데이터 변환
 */
export function convertParks(parks: ParkRow[]): Park[] {
  return parks.map(convertParkRowToAppFormat);
}

/**
 * 페이지네이션 적용
 */
export function paginateParks(parks: Park[], page: number, size: number): Park[] {
  const startIndex = page * size;
  const endIndex = startIndex + size;
  return parks.slice(startIndex, endIndex);
}
