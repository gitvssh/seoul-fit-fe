import type { Restaurant } from '@/lib/types';

/**
 * 현재 위치 기준 반경 내 맛집 조회
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 반경 내 맛집 목록
 */
export async function getNearbyRestaurants(lat: number, lng: number): Promise<Restaurant[]> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다:', { lat, lng });
      return [];
    }

    // Next.js API Route 호출
    const apiUrl = `/api/restaurants?lat=${lat}&lng=${lng}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`맛집 API 호출 실패: ${response.status}`, errorData);
      return [];
    }

    const restaurants = await response.json();

    // 데이터가 없는 경우
    if (!Array.isArray(restaurants)) {
      console.error('맛집 데이터가 배열 형태가 아닙니다.');
      return [];
    }

    return restaurants;
  } catch (error) {
    console.error('맛집 조회 실패:', error);
    return [];
  }
}

/**
 * 맛집 데이터를 Facility 형태로 변환
 */
export function convertRestaurantToFacility(restaurant: Restaurant): any {
  return {
    id: restaurant.id,
    name: restaurant.name,
    category: 'restaurant',
    position: { lat: restaurant.latitude, lng: restaurant.longitude },
    address: restaurant.newAddress || restaurant.address,
    phone: restaurant.phone,
    website: restaurant.website,
    operatingHours: restaurant.operatingHours,
    congestionLevel: 'low', // 맛집은 기본적으로 low로 설정
    description: `${restaurant.representativeMenu}\n\n${restaurant.subwayInfo}`,
    isReservable: false,
    // 맛집 전용 정보
    restaurant: {
      representativeMenu: restaurant.representativeMenu,
      subwayInfo: restaurant.subwayInfo,
      postUrl: restaurant.postUrl,
      oldAddress: restaurant.address,
      newAddress: restaurant.newAddress,
    },
  };
}
