// services/restaurants.ts - Tourist Restaurants service implementation (Updated with v1 URLs)
import { TouristRestaurant, RestaurantDataStatistics } from '@/lib/types';
import { env } from '@/config/environment';
import type { Facility, RestaurantInfo } from '@/entities/facility/model/types';

const BASE_URL = env.publicBackendUrl;

/**
 * 최신 음식점 정보 조회
 */
export async function getLatestRestaurants(accessToken: string): Promise<TouristRestaurant[]> {
  const response = await fetch(`${BASE_URL}/api/v1/restaurants/latest`, {
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
  const response = await fetch(`${BASE_URL}/api/v1/restaurants/date/${dataDate}`, {
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
    `${BASE_URL}/api/v1/restaurants/language/${langCodeId}?${params}`,
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

  const response = await fetch(`${BASE_URL}/api/v1/restaurants/search/name?${params}`, {
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

  const response = await fetch(`${BASE_URL}/api/v1/restaurants/search/address?${params}`, {
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
  const response = await fetch(`${BASE_URL}/api/v1/restaurants/${id}`, {
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
  const response = await fetch(`${BASE_URL}/api/v1/restaurants/available-dates`, {
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

  const response = await fetch(`${BASE_URL}/api/v1/restaurants/statistics?${params}`, {
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

  const response = await fetch(`${BASE_URL}/api/v1/restaurants/batch/manual?${params}`, {
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

/**
 * 백엔드 응답을 프론트엔드 Facility 타입으로 변환
 */
function convertToFacility(restaurant: any): Facility {
  const restaurantInfo: RestaurantInfo = {
    cuisineType: restaurant.cuisineType || '한식',
    priceRange: 'medium',
    businessHours: {},
    menu: [],
    deliveryAvailable: false,
    reservationAvailable: false,
  };

  return {
    id: `restaurant_${restaurant.id || restaurant.restaurantId}`,
    name: restaurant.name || restaurant.restaurantName,
    category: 'restaurant',
    position: {
      lat: parseFloat(restaurant.latitude) || 0,
      lng: parseFloat(restaurant.longitude) || 0,
    },
    address: restaurant.address || '',
    phone: restaurant.tel || restaurant.phone,
    website: restaurant.homepage,
    operatingHours: restaurant.operatingHours,
    congestionLevel: 'low',
    description: restaurant.description,
    isReservable: false,
    restaurantInfo,
  };
}

/**
 * 근처 음식점 조회 (위치 기반)
 */
export async function getRestaurantsNearby(
  latitude: number | string,
  longitude: number | string,
  accessToken?: string
): Promise<Facility[]> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });

    const response = await fetch(`${BASE_URL}/api/v1/restaurants/nearby?${params}`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`음식점 위치 기반 조회 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // 배열인지 확인하고 변환
    if (Array.isArray(data)) {
      return data.map(convertToFacility);
    } else if (data.restaurants && Array.isArray(data.restaurants)) {
      return data.restaurants.map(convertToFacility);
    } else {
      console.warn('음식점 데이터 형식이 예상과 다릅니다:', data);
      return [];
    }
  } catch (error) {
    console.error('음식점 위치 기반 API 호출 오류:', error);
    return [];
  }
}

/**
 * 모든 음식점 조회
 */
export async function getAllRestaurants(accessToken?: string): Promise<Facility[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/restaurants/all`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`음식점 전체 조회 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(convertToFacility);
    } else if (data.restaurants && Array.isArray(data.restaurants)) {
      return data.restaurants.map(convertToFacility);
    } else {
      console.warn('음식점 데이터 형식이 예상과 다릅니다:', data);
      return [];
    }
  } catch (error) {
    console.error('음식점 전체 조회 API 호출 오류:', error);
    return [];
  }
}
