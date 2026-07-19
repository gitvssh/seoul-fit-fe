/**
 * @fileoverview Bike Station API Service Layer
 * @description 따릉이 대여소 관련 비즈니스 로직 및 API 호출
 */

import { BikeStationRaw, BikeStation, BikeStationSearchParams, BikeStationSearchResult } from '../model/types';
import { serverCache } from '@/lib/serverCache';
import { dataScheduler } from '@/shared/lib/scheduler';
import { calculateDistance } from '@/entities/restaurant/api';

/**
 * 캐시 초기화 확인 및 대기
 */
export async function ensureBikeStationCache(): Promise<void> {
  if (!serverCache.has('bike_stations')) {
    console.log('[BikeStation] 캐시 없음, 초기화 대기...');
    // instrumentation 초기화 완료 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 여전히 캐시가 없으면 초기화 실행
    if (!serverCache.has('bike_stations')) {
      await dataScheduler.initialize();
    }
  }
}

/**
 * 캐시에서 따릉이 데이터 조회
 */
export function getBikeStationsFromCache(): BikeStationRaw[] | null {
  return serverCache.get<BikeStationRaw[]>('bike_stations') || null;
}

/**
 * 캐시 정보 조회
 */
export function getCacheInfo() {
  return serverCache.getInfo('bike_stations');
}

/**
 * Raw 데이터를 BikeStation 타입으로 변환
 */
export function transformBikeStation(
  station: BikeStationRaw, 
  userLat: number, 
  userLng: number
): BikeStation {
  const lat = parseFloat(station.stationLatitude);
  const lng = parseFloat(station.stationLongitude);
  
  return {
    code: station.stationId,
    name: station.stationName,
    lat,
    lng,
    distance: calculateDistance(userLat, userLng, lat, lng),
    stationId: station.stationId,
    rackTotCnt: station.rackTotCnt,
    parkingBikeTotCnt: station.parkingBikeTotCnt,
    shared: station.shared,
  };
}

/**
 * 반경 내 따릉이 대여소 검색
 */
export async function searchNearbyBikeStations(
  params: BikeStationSearchParams
): Promise<BikeStationSearchResult> {
  const { lat, lng, radius = 1.5 } = params;

  // 캐시 초기화 확인
  await ensureBikeStationCache();

  // 캐시에서 데이터 조회
  const stations = getBikeStationsFromCache();
  const cacheInfo = getCacheInfo();

  if (!stations) {
    throw new Error('따릉이 데이터를 불러올 수 없습니다.');
  }

  console.log(`[BikeStation] 캐시에서 조회: ${stations.length}개 대여소`);

  // 반경 내 대여소 필터링 및 변환
  const nearbyStations = stations
    .filter(station => {
      const stationLat = parseFloat(station.stationLatitude);
      const stationLng = parseFloat(station.stationLongitude);

      if (isNaN(stationLat) || isNaN(stationLng)) return false;

      const distance = calculateDistance(lat, lng, stationLat, stationLng);
      return distance <= radius;
    })
    .map(station => transformBikeStation(station, lat, lng))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return {
    center: { lat, lng },
    radius,
    count: nearbyStations.length,
    stations: nearbyStations,
    cached: true,
    fetchTime: new Date(cacheInfo?.timestamp || 0).toISOString(),
  };
}

/**
 * 파라미터 검증
 */
export function validateSearchParams(
  lat: string | null,
  lng: string | null
): { lat: number; lng: number } | null {
  if (!lat || !lng) {
    return null;
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return null;
  }

  return { lat: parsedLat, lng: parsedLng };
}
