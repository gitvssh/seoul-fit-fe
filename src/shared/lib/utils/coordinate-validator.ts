/**
 * 좌표 유효성 검사 유틸리티
 */

/**
 * 서울시 좌표 범위 내에 있는지 검사
 * @param lat 위도
 * @param lng 경도
 * @returns 유효한 좌표인지 여부
 */
export function isValidSeoulCoordinate(
  lat: number | undefined | null,
  lng: number | undefined | null
): boolean {
  // null, undefined, 0 체크
  if (!lat || !lng || (lat === 0 && lng === 0)) {
    return false;
  }

  // 서울시 좌표 범위 (대략적)
  // 위도: 37.4 ~ 37.7
  // 경도: 126.7 ~ 127.2
  if (lat < 37.3 || lat > 37.8) {
    return false;
  }

  if (lng < 126.6 || lng > 127.3) {
    return false;
  }

  return true;
}

/**
 * 좌표가 유효한지 검사하고 기본값 반환
 * @param lat 위도
 * @param lng 경도
 * @returns 유효한 좌표 또는 null
 */
export function validateCoordinate(
  lat: number | undefined | null,
  lng: number | undefined | null
): { lat: number; lng: number } | null {
  if (isValidSeoulCoordinate(lat, lng)) {
    return { lat: lat as number, lng: lng as number };
  }
  return null;
}
