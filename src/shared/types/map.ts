/**
 * 지도 관련 공통 타입 정의
 */

export interface MapStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapBounds {
  sw: MapLocation;
  ne: MapLocation;
}
