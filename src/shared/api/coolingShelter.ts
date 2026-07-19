import { CoolingCenter, Facility, FACILITY_CATEGORIES } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

export interface CoolingShelterResponse {
  status: 'success' | 'fail';
  message: string;
  data: CoolingCenter[];
  count: number;
  error?: string;
}

/**
 * 무더위쉼터 전체 조회 (백엔드 API)
 */
export async function getAllCoolingShelters(accessToken?: string): Promise<CoolingCenter[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/cooling-shelters/all`, {
      method: 'GET',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`무더위 쉼터 API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('무더위 쉼터 조회 실패:', error);
    return [];
  }
}

/**
 * 근처 무더위쉼터 조회 (Next.js API Route)
 */
export async function getNearbyCoolingShelters(
  latitude: number,
  longitude: number
): Promise<CoolingCenter[]> {
  try {
    const response = await fetch(`/api/cooling-shelter?lat=${latitude}&lng=${longitude}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`무더위 쉼터 API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('무더위 쉼터 조회 실패:', error);
    return [];
  }
}

/**
 * 무더위 쉼터 데이터를 Facility 형태로 변환
 */
export function convertCoolingShelterToFacility(shelter: CoolingCenter): Facility {
  return {
    id: shelter.id.toString(),
    name: shelter.name,
    category: FACILITY_CATEGORIES.COOLING_SHELTER,
    position: {
      lat: shelter.latitude || 0,
      lng: shelter.longitude || 0,
    },
    address: shelter.roadAddress || shelter.lotAddress || '',
    congestionLevel: 'low',
    description: `${shelter.facilityType1 || ''} ${shelter.facilityType2 || ''}`.trim(),
    operatingHours: '운영시간 확인 필요',
  };
}
