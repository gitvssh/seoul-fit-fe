/**
 * @fileoverview Park Entity Types
 * @description 공원 도메인 타입 정의
 */

// 서울 공공데이터 원본 타입 (이미 정의되어 있음)
import { ParkRow } from '@/lib/seoulApi';

// 프론트엔드용 공원 데이터 타입
export interface Park {
  id: string;
  name: string;
  content: string;
  area: string;
  address: string;
  adminTel: string;
  longitude: number;
  latitude: number;
  useReference: string;
  imageUrl: string;
}

// 공원 검색 파라미터
export interface ParkSearchParams {
  page?: number;
  size?: number;
}

// 페이지네이션 결과
export interface PaginatedParks {
  parks: Park[];
  page: number;
  size: number;
  total: number;
}

// API 응답 타입
export interface ParkApiResponse {
  data?: Park[];
  content?: Park[];
  totalElements?: number;
  totalPages?: number;
}
