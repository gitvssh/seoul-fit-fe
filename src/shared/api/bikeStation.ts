import { BikeStationData, Facility, FACILITY_CATEGORIES } from '@/lib/types';

/**
 * 현재 위치 기준 반경 내 따릉이 대여소 조회
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @param radius 반경 (km, 기본값 1.5)
 * @return 반경 내 따릉이 대여소 목록
 */
export async function getNearbyBikeStations(
  lat: number,
  lng: number,
  radius: number = 1.5
): Promise<BikeStationData[]> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다.');
      return [];
    }

    // Next.js API Route 호출
    const apiUrl = `/api/bike-stations?lat=${lat}&lng=${lng}&radius=${radius}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`따릉이 API 호출 실패: ${response.status}`, errorData);
      return [];
    }

    const result = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('따릉이 API 에러:', result);
      return [];
    }

    // 데이터가 없는 경우
    if (!result.data || !result.data.stations) {
      console.error('따릉이 대여소 데이터가 없습니다.');
      return [];
    }

    return result.data.stations;
  } catch (error) {
    console.error('따릉이 대여소 조회 실패:', error);
    return [];
  }
}

/**
 * 따릉이 대여소 데이터를 Facility 형태로 변환
 */
export function convertBikeStationToFacility(station: BikeStationData): Facility {
  const availableBikes = parseInt(station.parkingBikeTotCnt) || 0;
  const totalRacks = parseInt(station.rackTotCnt) || 0;
  const availableRacks = totalRacks - availableBikes;

  return {
    id: station.code,
    name: station.name,
    category: FACILITY_CATEGORIES.BIKE,
    position: { lat: station.lat, lng: station.lng },
    address: `서울시 따릉이 대여소 - ${station.name}`,
    congestionLevel: availableBikes > 5 ? 'low' : availableBikes > 2 ? 'medium' : 'high',
    distance: station.distance,
    description: `실시간 따릉이 대여소 정보입니다. 현재 ${availableBikes}대 이용 가능, ${availableRacks}개 거치대 여유 있음.`,
    operatingHours: '24시간 이용 가능',
    phone: '1599-0120 (따릉이 고객센터)',
    isReservable: true,
    // 따릉이 전용 정보
    bikeFacility: {
      stationId: station.stationId,
      rackTotCnt: availableBikes,
      parkingBikeTotCnt: totalRacks,
      shared: parseInt(station.shared) || 0,
    },
  };
}
