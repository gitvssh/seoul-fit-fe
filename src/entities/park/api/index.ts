/**
 * @fileoverview Park API Service Layer
 * @description 공원 관련 비즈니스 로직 및 API 호출
 */

import axios from 'axios';
import { getBackendInternalUrl } from '@/config/environment';
import { loadAllParks } from '@/lib/seoulApi';
import { Park, ParkSearchParams, ParkApiResponse } from '../model/types';
import { convertParks, paginateParks } from '../lib/converter';

/**
 * 백엔드에서 전체 공원 데이터 조회
 */
async function fetchParksFromBackend(
  page: number,
  size: number
): Promise<Park[] | null> {
  try {
    const response = await axios.get<ParkApiResponse>(
      `${getBackendInternalUrl()}/api/parks/all`,
      {
        params: { page, size },
        timeout: 5000, // 타임아웃 5초
      }
    );

    console.log('[Park] 백엔드에서 데이터 로드 성공');
    
    // 다양한 응답 형태 처리
    if (Array.isArray(response.data)) {
      return response.data as Park[];
    } else if (response.data?.content) {
      return response.data.content;
    } else if (response.data?.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.warn('[Park] 백엔드 서버 연결 실패:', error);
    return null;
  }
}

/**
 * 서울 공공데이터 API에서 공원 데이터 조회
 */
async function fetchParksFromSeoulApi(
  page: number,
  size: number
): Promise<Park[]> {
  try {
    const parkRows = await loadAllParks();
    const formattedParks = convertParks(parkRows);
    const paginatedParks = paginateParks(formattedParks, page, size);
    
    console.log(
      `[Park] 공공데이터에서 직접 로드 성공: ${formattedParks.length}개 (페이지: ${paginatedParks.length}개)`
    );
    
    return paginatedParks;
  } catch (error) {
    console.error('[Park] 공공데이터 호출 실패:', error);
    return [];
  }
}

/**
 * 전체 공원 데이터 조회 (백엔드 우선, 실패시 공공데이터)
 */
export async function fetchAllParks(
  params: ParkSearchParams
): Promise<Park[]> {
  const page = params.page ?? 0;
  const size = params.size ?? 100;

  // 1. 백엔드 시도
  const backendData = await fetchParksFromBackend(page, size);
  if (backendData) {
    return backendData;
  }

  // 2. 백엔드 실패시 서울 공공데이터 직접 호출
  console.log('[Park] 백엔드 실패, 공공데이터 직접 호출로 전환');
  return fetchParksFromSeoulApi(page, size);
}

/**
 * 파라미터 검증
 */
export function validateParkParams(
  pageParam: string | null,
  sizeParam: string | null
): ParkSearchParams {
  const page = pageParam ? parseInt(pageParam) : 0;
  const size = sizeParam ? parseInt(sizeParam) : 100;
  
  return {
    page: isNaN(page) || page < 0 ? 0 : page,
    size: isNaN(size) || size <= 0 ? 100 : size,
  };
}

/**
 * 위치 기반 공원 데이터 조회
 */
export async function fetchNearbyParks(
  lat: number,
  lng: number,
  radius: number = 2
): Promise<Park[]> {
  try {
    const response = await fetch(
      `${getBackendInternalUrl()}/api/parks/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`
    );

    if (!response.ok) {
      console.warn(`[공원 API] 호출 실패: ${response.status}`);
      return [];
    }

    const parks = await response.json();
    return parks;
  } catch (error) {
    console.warn('[공원] 백엔드 서버 연결 실패:', error);
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
