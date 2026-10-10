/**
 * @fileoverview Library Entity Types
 * @description 도서관 도메인 타입 정의
 */

// 서울 공공데이터 원본 타입 (이미 정의되어 있음)
import { LibraryRow } from '@/lib/seoulApi';

// 프론트엔드용 도서관 데이터 타입
export interface Library {
  id: string;
  lbrryName: string;
  name: string;
  adres: string;
  address: string;
  telNo: string;
  phoneNumber: string;
  hmpgUrl: string;
  website: string;
  xcnts: number;
  latitude: number;
  ydnts: number;
  longitude: number;
  opTime: string;
  operatingHours: string;
  fdrmCloseDate: string;
}

// 도서관 검색 파라미터
export interface LibrarySearchParams {
  page?: number;
  size?: number;
}

// 페이지네이션 결과
export interface PaginatedLibraries {
  libraries: Library[];
  page: number;
  size: number;
  total: number;
}

// API 응답 타입
export interface LibraryApiResponse {
  data?: Library[];
  content?: Library[];
  totalElements?: number;
  totalPages?: number;
}
