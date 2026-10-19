/**
 * 시설 데이터 변환 유틸리티
 */

import { isValidSeoulCoordinate } from './coordinate-validator';
import type { Facility, Position } from '@/lib/types';

const SEOUL_LAT_RANGE: readonly [number, number] = [33, 39];
const SEOUL_LNG_RANGE: readonly [number, number] = [124, 132];

const inRange = (value: number, [min, max]: readonly [number, number]) =>
  value >= min && value <= max;

/**
 * 두 좌표 값의 축을 값의 범위로 판별한다.
 * 서울 열린데이터는 데이터셋마다 XCNTS/YDNTS가 위도·경도 어느 쪽인지 다르다
 * (도서관 API는 xcnts=위도, ydnts=경도). 숫자 범위로 판별하면 어느 순서로 와도 안전하다.
 */
export function resolveSeoulLatLng(first: unknown, second: unknown): Position | null {
  const a = Number(first);
  const b = Number(second);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (inRange(a, SEOUL_LAT_RANGE) && inRange(b, SEOUL_LNG_RANGE)) return { lat: a, lng: b };
  if (inRange(b, SEOUL_LAT_RANGE) && inRange(a, SEOUL_LNG_RANGE)) return { lat: b, lng: a };
  return null;
}

/**
 * 공원 데이터를 Facility로 변환
 */
export function convertParkToFacility(park: any, index: number): Facility | null {
  // 좌표 확인
  let position;
  if (park.latitude !== undefined && park.longitude !== undefined) {
    position = {
      lat: Number.parseFloat(String(park.latitude)) || 0,
      lng: Number.parseFloat(String(park.longitude)) || 0,
    };
  } else if (park.lat !== undefined && park.lng !== undefined) {
    position = {
      lat: Number.parseFloat(String(park.lat)) || 0,
      lng: Number.parseFloat(String(park.lng)) || 0,
    };
  } else if (park.position) {
    position = park.position;
  } else {
    console.warn('[convertParkToFacility] 좌표 없음:', park.name);
    return null;
  }

  // 좌표 유효성 검사
  if (!isValidSeoulCoordinate(position.lat, position.lng)) {
    return null;
  }

  return {
    ...park,
    id: park.id || `park_${index}`,
    name: park.name || '이름 없음',
    address: park.address || '',
    position,
    category: 'park' as const,
    congestionLevel: 'low' as const,
  };
}

/**
 * 도서관 데이터를 Facility로 변환
 */
export function convertLibraryToFacility(library: any, index: number): Facility | null {
  // 좌표 확인
  // 좌표 확인: 백엔드 도서관 응답은 xcnts=위도, ydnts=경도이므로 축을 값으로 판별한다.
  let position: Position | null = null;
  if (library.xcnts !== undefined && library.ydnts !== undefined) {
    position = resolveSeoulLatLng(library.xcnts, library.ydnts);
  } else if (library.latitude !== undefined && library.longitude !== undefined) {
    position = resolveSeoulLatLng(library.latitude, library.longitude);
  } else if (library.lat !== undefined && library.lng !== undefined) {
    position = resolveSeoulLatLng(library.lat, library.lng);
  } else if (library.position) {
    position = resolveSeoulLatLng(library.position.lat, library.position.lng);
  }

  if (!position || !isValidSeoulCoordinate(position.lat, position.lng)) {
    return null;
  }

  return {
    ...library,
    id: library.id || `library_${library.lbrrySeqNo || index}`,
    name: library.lbrryName || library.name || '이름 없음',
    address: library.adres || library.address || '',
    position,
    category: 'library' as const,
    congestionLevel: 'low' as const,
  };
}

/**
 * 문화공간 데이터를 Facility로 변환
 */
export function convertCulturalSpaceToFacility(cs: any, index: number): Facility | null {
  const position = { lat: cs.lat, lng: cs.lng };

  // 좌표 유효성 검사
  if (!isValidSeoulCoordinate(position.lat, position.lng)) {
    return null;
  }

  return {
    ...cs,
    id: cs.id || `culture_${index}`,
    name: cs.name || '이름 없음',
    position,
    category: 'culture' as const,
    congestionLevel: 'low' as const,
  };
}

/**
 * 문화행사 데이터를 Facility로 변환
 */
export function convertCulturalEventToFacility(ce: any, index: number): Facility | null {
  // 좌표 확인
  let position;
  if (ce.latitude !== undefined && ce.longitude !== undefined) {
    position = { lat: ce.latitude, lng: ce.longitude };
  } else if (ce.lat !== undefined && ce.lng !== undefined) {
    position = { lat: ce.lat, lng: ce.lng };
  } else if (ce.position) {
    position = ce.position;
  } else {
    return null; // 좌표가 없으면 제외
  }

  // 좌표 유효성 검사
  if (!isValidSeoulCoordinate(position.lat, position.lng)) {
    return null;
  }

  return {
    ...ce,
    id: ce.id || `cultural_event_${index}`,
    name: ce.title || ce.name || '이름 없음',
    position,
    category: 'cultural_event' as const,
    congestionLevel: 'low' as const,
  };
}

/**
 * 문화예약 데이터를 Facility로 변환
 */
export function convertCulturalReservationToFacility(cr: any, index: number): Facility | null {
  // 좌표 확인
  let position;
  if (cr.latitude !== undefined && cr.longitude !== undefined) {
    position = { lat: cr.latitude, lng: cr.longitude };
  } else if (cr.lat !== undefined && cr.lng !== undefined) {
    position = { lat: cr.lat, lng: cr.lng };
  } else if (cr.position) {
    position = cr.position;
  } else {
    return null; // 좌표가 없으면 제외
  }

  // 좌표 유효성 검사
  if (!isValidSeoulCoordinate(position.lat, position.lng)) {
    return null;
  }

  return {
    ...cr,
    id: cr.id || `cultural_reservation_${index}`,
    name: cr.facilityName || cr.name || '이름 없음',
    position,
    category: 'cultural_reservation' as const,
    congestionLevel: 'low' as const,
  };
}
