import axios, { AxiosError } from 'axios';
import { Park } from '@/lib/types';

const API_BASE_URL = '/api/parks';

// API 응답 타입 정의
interface ApiResponse<T> {
  parks?: T[];
  data?: T[];
  totalCount?: number;
  success?: boolean;
  message?: string;
}

export interface ParksResponse {
  parks: Park[];
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

export async function fetchNearbyParks(
  latitude: number,
  longitude: number,
  radius: number = 2
): Promise<Park[]> {
  try {
    const response = await axios.get<ApiResponse<Park>>(`${API_BASE_URL}/nearby`, {
      params: { latitude, longitude, radius },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const parks = response.data.parks || response.data.data || [];
    return parks;
  } catch (error) {
    handleApiError(error, '근처 공원 데이터 조회');
  }
}

export async function fetchAllParks(page: number = 0, size: number = 100): Promise<ParksResponse> {
  try {
    const response = await axios.get<Park[]>(`${API_BASE_URL}/all`, {
      params: { page, size },
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // API가 배열을 직접 반환하는 경우와 객체로 래핑된 경우 모두 처리
    const parks = Array.isArray(response.data)
      ? response.data
      : (response.data as any).parks || (response.data as any).data || [];

    return {
      parks,
      totalCount: parks.length,
      page,
      size,
    };
  } catch (error) {
    handleApiError(error, '전체 공원 데이터 조회');
  }
}
