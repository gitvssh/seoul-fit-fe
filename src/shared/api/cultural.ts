// services/cultural.ts - Cultural facilities service implementation
import { CulturalSpace, CulturalEvent, CulturalReservation } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

// ===== Cultural Spaces =====

/**
 * 문화 공간 전체 조회
 */
export async function getAllCulturalSpaces(accessToken?: string): Promise<CulturalSpace[]> {
  const response = await fetch(`${BASE_URL}/api/v1/cultural-spaces/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`문화 공간 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 문화 공간 조회
 */
export async function getNearbyCulturalSpaces(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<CulturalSpace[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/v1/cultural-spaces/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 문화 공간 조회 실패: ${response.status}`);
  }

  return response.json();
}

// ===== Cultural Events =====

/**
 * 문화 행사 전체 조회
 */
export async function getAllCulturalEvents(accessToken?: string): Promise<CulturalEvent[]> {
  const response = await fetch(`${BASE_URL}/api/v1/cultural-events/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`문화 행사 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 문화 행사 조회
 */
export async function getNearbyCulturalEvents(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<CulturalEvent[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/v1/cultural-events/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 문화 행사 조회 실패: ${response.status}`);
  }

  return response.json();
}

// ===== Cultural Reservations =====

/**
 * 문화 예약 전체 조회
 */
export async function getAllCulturalReservations(
  accessToken?: string
): Promise<CulturalReservation[]> {
  const response = await fetch(`${BASE_URL}/api/v1/cultural-reservations/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`문화 예약 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 문화 예약 조회
 */
export async function getNearbyCulturalReservations(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<CulturalReservation[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/v1/cultural-reservations/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 문화 예약 조회 실패: ${response.status}`);
  }

  return response.json();
}
