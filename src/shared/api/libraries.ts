import axios, { AxiosError } from 'axios';
import { Library } from '@/lib/types';

const API_BASE_URL = '/api/libraries';

// API 응답 타입 정의
interface ApiResponse<T> {
  libraries?: T[];
  data?: T[];
  totalCount?: number;
  success?: boolean;
  message?: string;
}

export interface LibrariesResponse {
  libraries: Library[];
  totalCount: number;
  page?: number;
  size?: number;
}

// 에러 처리 유틸리티
function handleApiError(error: unknown, context: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNABORTED') {
      throw new Error(`${context}: 요청 시간이 초과되었습니다.`);
    }
    if (axiosError.response?.status === 404) {
      throw new Error(`${context}: 데이터를 찾을 수 없습니다.`);
    }
    if (axiosError.response && axiosError.response.status >= 500) {
      throw new Error(`${context}: 서버 오류가 발생했습니다.`);
    }
  }
  console.error(`${context} 실패:`, error);
  throw new Error(`${context}: 데이터를 가져오는데 실패했습니다.`);
}

export async function fetchNearbyLibraries(
  latitude: number,
  longitude: number,
  radius: number = 2
): Promise<Library[]> {
  try {
    const response = await axios.get<ApiResponse<Library>>(API_BASE_URL, {
      params: { lat: latitude, lng: longitude, radius },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const libraries = response.data.libraries || response.data.data || [];
    return libraries;
  } catch (error) {
    handleApiError(error, '근처 도서관 데이터 조회');
  }
}

export async function fetchAllLibraries(
  page: number = 0,
  size: number = 100
): Promise<LibrariesResponse> {
  try {
    const response = await axios.get<Library[]>(API_BASE_URL, {
      params: { all: true, page, size },
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // API가 배열을 직접 반환하는 경우와 객체로 래핑된 경우 모두 처리
    const libraries = Array.isArray(response.data) 
      ? response.data 
      : (response.data as any).libraries || (response.data as any).data || [];
      
    console.log('[fetchAllLibraries] 도서관 데이터 수신:', libraries.length, '개');
    if (libraries.length > 0) {
      console.log('[fetchAllLibraries] 첫 번째 도서관 데이터:', libraries[0]);
    }
    
    return {
      libraries,
      totalCount: libraries.length,
      page,
      size,
    };
  } catch (error) {
    handleApiError(error, '전체 도서관 데이터 조회');
  }
}
