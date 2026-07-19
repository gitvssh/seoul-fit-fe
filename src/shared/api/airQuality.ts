// services/airQuality.ts - Air Quality service implementation
import { AirQuality } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

/**
 * 대기질 정보 전체 조회
 */
export async function getAllAirQuality(accessToken?: string): Promise<AirQuality[]> {
  const response = await fetch(`${BASE_URL}/api/v1/air-quality/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`대기질 정보 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 대기질 정보 조회
 */
export async function getNearbyAirQuality(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<AirQuality[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/v1/air-quality/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 대기질 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}
