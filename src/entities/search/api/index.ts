/**
 * @fileoverview Search API Service Layer
 * @description 검색 관련 비즈니스 로직 및 API 호출
 */

import { getBackendInternalUrl } from '@/config/environment';
import { 
  POISearchItem, 
  SearchParams, 
  PaginationInfo, 
  PaginatedResponse,
  SearchResult 
} from '../model/types';

const MAX_PAGE_SIZE = 20000;
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

/**
 * 검색 파라미터 검증 및 파싱
 */
export function validateSearchParams(params: SearchParams): PaginationInfo | null {
  const page = params.page ?? DEFAULT_PAGE;
  const size = params.size ?? DEFAULT_SIZE;
  
  if (page < 0 || size <= 0) {
    return null;
  }
  
  if (size > MAX_PAGE_SIZE) {
    return null;
  }
  
  return {
    page,
    size,
    offset: page * size
  };
}

/**
 * POI 검색 인덱스 조회
 */
export async function fetchPOISearchIndex(
  pagination: PaginationInfo
): Promise<SearchResult> {
  try {
    const backendUrl = getBackendInternalUrl();
    const response = await fetch(
      `${backendUrl}/api/search/index?page=${pagination.page}&size=${pagination.size}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`POI 검색 인덱스 API 호출 실패: ${response.status} ${response.statusText}`);
      
      // 백엔드 연결 실패 시 빈 결과 반환
      if (response.status >= 500) {
        console.warn('POI 검색 인덱스 백엔드 서버 연결 실패');
        return { items: [], pagination };
      }
      
      throw new Error(`POI 검색 인덱스 데이터를 가져올 수 없습니다. (${response.status})`);
    }

    const data = await response.json();
    return parseSearchResponse(data, pagination);
  } catch (error) {
    console.error('POI 검색 인덱스 조회 중 오류:', error);
    // 에러 발생 시 빈 결과 반환
    return { items: [], pagination };
  }
}

/**
 * API 응답 파싱
 */
export function parseSearchResponse(
  data: unknown, 
  pagination: PaginationInfo
): SearchResult {
  // 직접 배열로 응답하는 경우
  if (Array.isArray(data)) {
    return {
      items: data as POISearchItem[],
      pagination
    };
  }
  
  // Spring Boot Pageable 응답 형태인 경우
  const paginatedData = data as PaginatedResponse;
  
  if (paginatedData.content && Array.isArray(paginatedData.content)) {
    return {
      items: paginatedData.content,
      pagination: {
        ...pagination,
        total: paginatedData.totalElements
      }
    };
  }
  
  // 일반적인 API 응답 형태인 경우
  if (paginatedData.data && Array.isArray(paginatedData.data)) {
    return {
      items: paginatedData.data,
      pagination
    };
  }
  
  // 예상하지 못한 응답 형태
  console.warn('예상하지 못한 POI 검색 인덱스 응답 형태:', data);
  return { items: [], pagination };
}

/**
 * 에러 메시지 생성
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '서버 내부 오류가 발생했습니다.';
}
