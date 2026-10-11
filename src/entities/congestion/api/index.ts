/**
 * @fileoverview Congestion API Service
 * @description 혼잡도 API 서비스 계층
 */

import type {
  SeoulCongestionApiResponse,
  CongestionData,
  CongestionCacheData,
  CongestionLevel,
} from '../model/types';
import { parsePopulation } from '../lib/congestion-utils';
import { getLocationByCode } from '@/entities/weather';

import { getSeoulApiKey } from '@/config/environment';

const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 캐시 설정
const CACHE_DURATION = 60 * 1000; // 1분
const congestionCache = new Map<string, CongestionCacheData>();

/**
 * 서울시 혼잡도 데이터 가져오기
 */
export async function fetchSeoulCongestionData(
  areaCode: string
): Promise<SeoulCongestionApiResponse> {
  const apiUrl = `${BASE_URL}/${getSeoulApiKey()}/json/citydata/1/1/${encodeURIComponent(areaCode)}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`서울시 실시간 도시데이터 API 호출 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * API 응답을 프론트엔드용 데이터로 변환
 */
export function transformCongestionData(
  areaCode: string,
  apiResponse: SeoulCongestionApiResponse,
  timestamp: string,
  cached: boolean = false
): CongestionData | null {
  const cityData = apiResponse.CITYDATA;
  if (!cityData) {
    return null;
  }

  const liveData = cityData.LIVE_PPLTN_STTS?.[0];
  if (!liveData) {
    return null;
  }

  // 위치 정보 가져오기
  const location = getLocationByCode(areaCode);
  if (!location) {
    return null;
  }

  return {
    areaCode,
    areaName: cityData.AREA_NM,
    congestionLevel: liveData.AREA_CONGEST_LVL as CongestionLevel,
    congestionMessage: liveData.AREA_CONGEST_MSG,
    populationMin: parsePopulation(liveData.AREA_PPLTN_MIN),
    populationMax: parsePopulation(liveData.AREA_PPLTN_MAX),
    location: {
      lat: location.lat,
      lng: location.lng,
    },
    timestamp,
    cached,
  };
}

/**
 * 캐시에서 혼잡도 데이터 가져오기
 */
export function getCongestionFromCache(areaCode: string): CongestionData | null {
  const now = Date.now();
  const cachedData = congestionCache.get(areaCode);

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return {
      ...cachedData.data,
      cached: true,
    };
  }

  return null;
}

/**
 * 캐시에 혼잡도 데이터 저장
 */
export function saveCongestionToCache(areaCode: string, data: CongestionData): void {
  congestionCache.set(areaCode, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * API 응답 검증
 */
export function validateApiResponse(response: SeoulCongestionApiResponse): boolean {
  return response.RESULT?.['RESULT.CODE'] === 'INFO-000';
}

/**
 * 여러 지역의 혼잡도 데이터 가져오기
 */
export async function fetchMultipleCongestionData(areaCodes: string[]): Promise<CongestionData[]> {
  const results: CongestionData[] = [];
  const timestamp = new Date().toISOString();

  for (const areaCode of areaCodes) {
    try {
      // 캐시 확인
      const cachedData = getCongestionFromCache(areaCode);
      if (cachedData) {
        results.push(cachedData);
        continue;
      }

      // API 호출
      const apiResponse = await fetchSeoulCongestionData(areaCode);

      if (!validateApiResponse(apiResponse)) {
        console.error(`${areaCode}: API 응답 에러`);
        continue;
      }

      const congestionData = transformCongestionData(areaCode, apiResponse, timestamp);
      if (congestionData) {
        saveCongestionToCache(areaCode, congestionData);
        results.push(congestionData);
      }
    } catch (error) {
      console.error(`${areaCode} 혼잡도 데이터 가져오기 실패:`, error);
    }
  }

  return results;
}
