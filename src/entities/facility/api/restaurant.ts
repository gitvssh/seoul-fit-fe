// services/restaurants.ts - Tourist Restaurants service implementation (Updated with v1 URLs)
import { env } from '@/config/environment';
import { TouristRestaurant, RestaurantDataStatistics } from '@/lib/types';

const BASE_URL = env.publicBackendUrl;

/**
 * 최신 음식점 정보 조회
 */
export async function getLatestRestaurants(accessToken: string): Promise<TouristRestaurant[]> {
  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/latest`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`최신 음식점 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 특정 날짜 음식점 정보 조회
 */
export async function getRestaurantsByDate(
  dataDate: string,
  accessToken: string
): Promise<TouristRestaurant[]> {
  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/date/${dataDate}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`특정 날짜 음식점 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 언어별 음식점 정보 조회
 */
export async function getRestaurantsByLanguage(
  langCodeId: string,
  dataDate?: string,
  accessToken?: string
): Promise<TouristRestaurant[]> {
  const params = new URLSearchParams();
  if (dataDate) params.append('dataDate', dataDate);

  const response = await fetch(
    `${BASE_URL}/api/v1/tourist-restaurants/language/${langCodeId}?${params}`,
    {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`언어별 음식점 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 음식점명 검색
 */
export async function searchRestaurantsByName(
  name: string,
  dataDate?: string,
  accessToken?: string
): Promise<TouristRestaurant[]> {
  const params = new URLSearchParams({ name });
  if (dataDate) params.append('dataDate', dataDate);

  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/search/name?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`음식점명 검색 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 주소 검색
 */
export async function searchRestaurantsByAddress(
  address: string,
  dataDate?: string,
  accessToken?: string
): Promise<TouristRestaurant[]> {
  const params = new URLSearchParams({ address });
  if (dataDate) params.append('dataDate', dataDate);

  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/search/address?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`주소 검색 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 음식점 상세 정보 조회
 */
export async function getRestaurantDetail(
  id: number,
  accessToken?: string
): Promise<TouristRestaurant> {
  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/${id}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('음식점을 찾을 수 없습니다.');
    }
    throw new Error(`음식점 상세 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 사용 가능한 데이터 날짜 목록
 */
export async function getAvailableRestaurantDates(accessToken?: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/available-dates`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`사용 가능한 데이터 날짜 목록 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 음식점 데이터 통계
 */
export async function getRestaurantStatistics(
  dataDate?: string,
  accessToken?: string
): Promise<RestaurantDataStatistics> {
  const params = new URLSearchParams();
  if (dataDate) params.append('dataDate', dataDate);

  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/statistics?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`음식점 데이터 통계 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 수동 배치 실행 (관리자용)
 */
export async function executeRestaurantBatch(
  dataDate?: string,
  accessToken?: string
): Promise<any> {
  const params = new URLSearchParams();
  if (dataDate) params.append('dataDate', dataDate);

  const response = await fetch(`${BASE_URL}/api/v1/tourist-restaurants/batch/manual?${params}`, {
    method: 'POST',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`수동 배치 실행 실패: ${response.status}`);
  }

  return response.json();
}
