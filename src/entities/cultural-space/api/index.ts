/**
 * @fileoverview Cultural Space API Service Layer
 * @description 문화공간 관련 비즈니스 로직 및 API 호출
 */

import { getBackendInternalUrl } from '@/config/environment';
import { CulturalSpace, CulturalSpaceSearchParams } from '../model/types';

/**
 * 위치 기반 문화공간 조회
 */
export async function fetchNearbyCulturalSpaces(
  params: CulturalSpaceSearchParams
): Promise<CulturalSpace[]> {
  try {
    const { lat, lng, radius = 2 } = params;
    const backendUrl = getBackendInternalUrl();
    
    const response = await fetch(
      `${backendUrl}/api/v1/cultural-spaces/nearby?latitude=${lat}&longitude=${lng}${radius ? `&radius=${radius}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[CulturalSpace] API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[CulturalSpace] 백엔드 서버 연결 실패:', error);
    return [];
  }
}

/**
 * 위치 파라미터 검증
 */
export function validateLocationParams(
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

/**
 * 위치 및 반경 파라미터 검증
 */
export function validateLocationWithRadius(
  lat: string | null,
  lng: string | null,
  radius: string | null
): { lat: number; lng: number; radius: number } | null {
  const coords = validateLocationParams(lat, lng);
  if (!coords) {
    return null;
  }

  const parsedRadius = radius ? parseFloat(radius) : 2;
  
  return {
    ...coords,
    radius: isNaN(parsedRadius) || parsedRadius <= 0 ? 2 : parsedRadius,
  };
}
