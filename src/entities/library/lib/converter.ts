/**
 * @fileoverview Library Data Converter
 * @description 도서관 데이터 변환 유틸리티
 */

import { LibraryRow } from '@/lib/seoulApi';
import { Library } from '../model/types';

/**
 * 서울 공공데이터를 프론트엔드 형식으로 변환
 */
export function convertLibraryRowToAppFormat(library: LibraryRow): Library {
  return {
    id: Math.random().toString(36).substr(2, 9), // 고유 ID 생성
    lbrryName: library.LBRRY_NAME,
    name: library.LBRRY_NAME,
    adres: library.ADRES,
    address: library.ADRES,
    telNo: library.TEL_NO,
    phoneNumber: library.TEL_NO,
    hmpgUrl: library.HMPG_URL,
    website: library.HMPG_URL,
    xcnts: parseFloat(library.XCNTS) || 0,
    latitude: parseFloat(library.XCNTS) || 0,
    ydnts: parseFloat(library.YDNTS) || 0,
    longitude: parseFloat(library.YDNTS) || 0,
    opTime: library.OP_TIME,
    operatingHours: library.OP_TIME,
    fdrmCloseDate: library.FDRM_CLOSE_DATE,
  };
}

/**
 * 여러 도서관 데이터 변환
 */
export function convertLibraries(libraries: LibraryRow[]): Library[] {
  return libraries.map(convertLibraryRowToAppFormat);
}

/**
 * 페이지네이션 적용
 */
export function paginateLibraries(libraries: Library[], page: number, size: number): Library[] {
  const startIndex = page * size;
  const endIndex = startIndex + size;
  return libraries.slice(startIndex, endIndex);
}
