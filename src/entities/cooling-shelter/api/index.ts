/**
 * @fileoverview Cooling Shelter API Service Layer
 * @description 무더위 쉼터 관련 비즈니스 로직 및 API 호출
 */

import { getBackendInternalUrl } from '@/config/environment';
import { CoolingShelter, CoolingShelterSearchParams } from '../model/types';

/**
 * 위치 기반 무더위 쉼터 조회
 */
export async function fetchNearbyCoolingShelters(
  params: CoolingShelterSearchParams
): Promise<CoolingShelter[]> {
  try {
    const { lat, lng, radius = 1 } = params;
    const backendUrl = getBackendInternalUrl();
    
    const response = await fetch(
      `${backendUrl}/api/v1/cooling-shelters/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[CoolingShelter] API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[CoolingShelter] 백엔드 서버 연결 실패:', error);
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
