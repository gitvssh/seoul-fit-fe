/**
 * @fileoverview Location Finder Utility
 * @description 가장 가까운 위치 찾기 유틸리티
 */

import { SEOUL_LOCATIONS } from '../model/locations';
import type { Location } from '../model/types';

export interface NearestAreaMatch {
  location: Location;
  distanceKm: number;
}

function calculateDistanceKm(
  first: Pick<Location, 'lat' | 'lng'>,
  second: Pick<Location, 'lat' | 'lng'>
): number {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(second.lat - first.lat);
  const deltaLongitude = radians(second.lng - first.lng);
  const firstLatitude = radians(first.lat);
  const secondLatitude = radians(second.lat);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function findNearestAreaMatch(lat: number, lng: number): NearestAreaMatch {
  const origin = { lat, lng };
  let nearest = SEOUL_LOCATIONS[0];
  let minimumDistanceKm = calculateDistanceKm(origin, nearest);

  for (const location of SEOUL_LOCATIONS.slice(1)) {
    const distanceKm = calculateDistanceKm(origin, location);
    if (distanceKm < minimumDistanceKm) {
      minimumDistanceKm = distanceKm;
      nearest = location;
    }
  }

  return { location: nearest, distanceKm: minimumDistanceKm };
}

/**
 * 현재 위치에서 가장 가까운 장소 코드 찾기
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소 코드 (POI001~POI128)
 */
export function findNearestAreaCode(lat: number, lng: number): string {
  return findNearestAreaMatch(lat, lng).location.code;
}

/**
 * 위치 코드로 위치 정보 가져오기
 * @param code 위치 코드
 * @return 위치 정보 또는 undefined
 */
export function getLocationByCode(code: string): Location | undefined {
  return SEOUL_LOCATIONS.find(location => location.code === code);
}

/**
 * 가장 가까운 위치 찾기
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @param locations 위치 목록
 * @return 가장 가까운 위치 또는 null
 */
export function findNearestLocation(
  lat: number,
  lng: number,
  locations: Array<{ name: string; lat: number; lng: number }>
): { name: string; lat: number; lng: number } | null {
  if (locations.length === 0) {
    return null;
  }

  let minDistance = Infinity;
  let nearestLocation = locations[0];

  for (const location of locations) {
    const distance = Math.sqrt(
      Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = location;
    }
  }

  return nearestLocation;
}
