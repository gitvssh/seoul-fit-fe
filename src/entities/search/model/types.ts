/**
 * @fileoverview Search Entity Types
 * @description 검색 관련 도메인 타입 정의
 */

// POI 검색 인덱스 아이템
export interface POISearchItem {
  id: number;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  ref_table: string;
  ref_id: number;
  created_at: string;
  updated_at: string;
}

// 검색 파라미터
export interface SearchParams {
  page?: number;
  size?: number;
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  size: number;
  offset: number;
}

// API 응답 타입들
export interface PaginatedResponse {
  content?: POISearchItem[];
  data?: POISearchItem[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

// 검색 결과
export interface SearchResult {
  items: POISearchItem[];
  pagination?: {
    page: number;
    size: number;
    total?: number;
  };
}
