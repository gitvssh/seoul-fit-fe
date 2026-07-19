/**
 * @fileoverview 체육시설 API
 * @description 백엔드 체육시설 관련 API 호출 함수
 */

import { env } from '@/config/environment';
import type { Facility, SportsFacilityInfo } from '@/entities/facility/model/types';

const BASE_URL = env.publicBackendUrl;

// 백엔드 응답 타입 정의
interface SportsApiResponse {
  id: number;
  facilityName: string;
  facilityType: string;
  address: string;
  latitude: number;
  longitude: number;
  tel?: string;
  operatingHours?: string;
  fee?: string;
  homepage?: string;
  description?: string;
}

/**
 * 백엔드 응답을 프론트엔드 Facility 타입으로 변환
 */
function convertToFacility(sports: SportsApiResponse): Facility {
  const sportsFacilityInfo: SportsFacilityInfo = {
    facilityType: sports.facilityType || '체육시설',
    reservationUrl: sports.homepage,
    availableSlots: [],
    equipment: [],
    fee: sports.fee ? {
      adult: parseInt(sports.fee) || 0,
      child: parseInt(sports.fee) || 0,
      senior: parseInt(sports.fee) || 0,
    } : undefined,
    isIndoor: false, // API에서 제공하지 않으므로 기본값
  };

  return {
    id: `sports_${sports.id}`,
    name: sports.facilityName,
    category: 'sports',
    position: {
      lat: sports.latitude,
      lng: sports.longitude,
    },
    address: sports.address,
    phone: sports.tel,
    website: sports.homepage,
    operatingHours: sports.operatingHours,
    congestionLevel: 'low',
    description: sports.description,
    isReservable: !!sports.homepage,
    sportsFacility: sportsFacilityInfo,
  };
}

/**
 * 모든 체육시설 조회
 */
export async function getAllSports(accessToken?: string): Promise<Facility[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/sports`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`체육시설 조회 실패: ${response.status}`);
      return [];
    }

    const data: SportsApiResponse[] = await response.json();
    return data.map(convertToFacility);
  } catch (error) {
    console.error('체육시설 API 호출 오류:', error);
    return [];
  }
}

/**
 * 위치 기반 체육시설 조회
 */
export async function getSportsNearby(
  latitude: number,
  longitude: number,
  radius: number = 2,
  accessToken?: string
): Promise<Facility[]> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(`${BASE_URL}/api/sports/nearby?${params}`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`체육시설 위치 기반 조회 실패: ${response.status}`);
      return [];
    }

    const data: SportsApiResponse[] = await response.json();
    return data.map(convertToFacility);
  } catch (error) {
    console.error('체육시설 위치 기반 API 호출 오류:', error);
    return [];
  }
}

/**
 * 체육시설 검색
 */
export async function searchSports(
  keyword: string,
  accessToken?: string
): Promise<Facility[]> {
  try {
    const params = new URLSearchParams({ keyword });

    const response = await fetch(`${BASE_URL}/api/sports/search?${params}`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`체육시설 검색 실패: ${response.status}`);
      return [];
    }

    const data: SportsApiResponse[] = await response.json();
    return data.map(convertToFacility);
  } catch (error) {
    console.error('체육시설 검색 API 호출 오류:', error);
    return [];
  }
}

/**
 * 체육시설 상세 정보 조회
 */
export async function getSportsDetail(
  id: number,
  accessToken?: string
): Promise<Facility | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/sports/${id}`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`체육시설 상세 조회 실패: ${response.status}`);
      return null;
    }

    const data: SportsApiResponse = await response.json();
    return convertToFacility(data);
  } catch (error) {
    console.error('체육시설 상세 API 호출 오류:', error);
    return null;
  }
}
