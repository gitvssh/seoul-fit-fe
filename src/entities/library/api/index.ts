/**
 * @fileoverview Library API Service Layer
 * @description 도서관 관련 비즈니스 로직 및 API 호출
 */

import axios from 'axios';
import { getBackendInternalUrl } from '@/config/environment';
import { loadAllLibraries } from '@/lib/seoulApi';
import { Library, LibrarySearchParams, LibraryApiResponse } from '../model/types';
import { convertLibraries, paginateLibraries } from '../lib/converter';

/**
 * 백엔드에서 전체 도서관 데이터 조회
 */
async function fetchLibrariesFromBackend(
  page: number,
  size: number
): Promise<Library[] | null> {
  try {
    const response = await axios.get<LibraryApiResponse>(
      `${getBackendInternalUrl()}/api/v1/libraries/all`,
      {
        params: { page, size },
        timeout: 5000, // 타임아웃 5초
      }
    );

    console.log('[Library] 백엔드에서 데이터 로드 성공');
    
    // 다양한 응답 형태 처리
    if (Array.isArray(response.data)) {
      return response.data as Library[];
    } else if (response.data?.content) {
      return response.data.content;
    } else if (response.data?.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.warn('[Library] 백엔드 서버 연결 실패:', error);
    return null;
  }
}

/**
 * 서울 공공데이터 API에서 도서관 데이터 조회
 */
async function fetchLibrariesFromSeoulApi(
  page: number,
  size: number
): Promise<Library[]> {
  try {
    const libraryRows = await loadAllLibraries();
    const formattedLibraries = convertLibraries(libraryRows);
    const paginatedLibraries = paginateLibraries(formattedLibraries, page, size);
    
    console.log(
      `[Library] 공공데이터에서 직접 로드 성공: ${formattedLibraries.length}개 (페이지: ${paginatedLibraries.length}개)`
    );
    
    return paginatedLibraries;
  } catch (error) {
    console.error('[Library] 공공데이터 호출 실패:', error);
    return [];
  }
}

/**
 * 전체 도서관 데이터 조회 (백엔드 우선, 실패시 공공데이터)
 */
export async function fetchAllLibraries(
  params: LibrarySearchParams
): Promise<Library[]> {
  const page = params.page ?? 0;
  const size = params.size ?? 100;

  // 1. 백엔드 시도
  const backendData = await fetchLibrariesFromBackend(page, size);
  if (backendData) {
    return backendData;
  }

  // 2. 백엔드 실패시 서울 공공데이터 직접 호출
  console.log('[Library] 백엔드 실패, 공공데이터 직접 호출로 전환');
  return fetchLibrariesFromSeoulApi(page, size);
}

/**
 * 파라미터 검증
 */
export function validateSearchParams(
  pageParam: string | null,
  sizeParam: string | null
): LibrarySearchParams {
  const page = pageParam ? parseInt(pageParam) : 0;
  const size = sizeParam ? parseInt(sizeParam) : 100;
  
  return {
    page: isNaN(page) || page < 0 ? 0 : page,
    size: isNaN(size) || size <= 0 ? 100 : size,
  };
}

/**
 * 위치 기반 도서관 데이터 조회
 */
export async function fetchNearbyLibraries(
  lat: number,
  lng: number,
  radius: number = 2
): Promise<Library[]> {
  try {
    const response = await axios.get<Library[]>(
      `${getBackendInternalUrl()}/api/v1/libraries/nearby`,
      {
        params: {
          latitude: lat,
          longitude: lng,
          radius,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('[Library] 위치 기반 도서관 데이터 조회 실패:', error);
    return [];
  }
}

/**
 * 위치 및 반경 파라미터 검증
 */
export function validateLocationWithRadius(
  lat: string | null,
  lng: string | null,
  radius: string | null
): { lat: number; lng: number; radius: number } | null {
  if (!lat || !lng) {
    return null;
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return null;
  }

  const parsedRadius = radius ? parseFloat(radius) : 2;
  
  return {
    lat: parsedLat,
    lng: parsedLng,
    radius: isNaN(parsedRadius) || parsedRadius <= 0 ? 2 : parsedRadius,
  };
}
