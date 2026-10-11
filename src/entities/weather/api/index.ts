/**
 * @fileoverview Weather API Service
 * @description 날씨 API 서비스 계층
 */

import type { SeoulWeatherApiResponse, WeatherData, WeatherCacheData } from '../model/types';

import { getSeoulApiKey } from '@/config/environment';

const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 캐시 설정
const CACHE_DURATION = 60 * 1000; // 1분
const weatherCache = new Map<string, WeatherCacheData>();

/**
 * 서울시 날씨 데이터 가져오기
 */
export async function fetchSeoulWeatherData(areaCode: string): Promise<SeoulWeatherApiResponse> {
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
export function transformWeatherData(
  areaCode: string,
  apiResponse: SeoulWeatherApiResponse,
  timestamp: string,
  cached: boolean = false
): WeatherData | null {
  const cityData = apiResponse.CITYDATA;
  if (!cityData) {
    return null;
  }

  const weatherArray = cityData.WEATHER_STTS;
  if (!weatherArray || weatherArray.length === 0) {
    return null;
  }

  const weatherData = weatherArray[0];

  return {
    AREA_CD: areaCode,
    AREA_NM: cityData.AREA_NM,
    WEATHER_STTS: weatherData.WEATHER_STTS,
    TEMP: weatherData.TEMP,
    SENSIBLE_TEMP: weatherData.SENSIBLE_TEMP,
    MAX_TEMP: weatherData.MAX_TEMP,
    MIN_TEMP: weatherData.MIN_TEMP,
    HUMIDITY: weatherData.HUMIDITY,
    PRECIPITATION: weatherData.PRECIPITATION,
    PCP_MSG: weatherData.PCP_MSG,
    UV_INDEX_LVL: weatherData.UV_INDEX_LVL,
    UV_MSG: weatherData.UV_MSG,
    PM25_INDEX: weatherData.PM25_INDEX,
    PM10_INDEX: weatherData.PM10_INDEX,
    timestamp,
    cached,
  };
}

/**
 * 캐시에서 날씨 데이터 가져오기
 */
export function getWeatherFromCache(areaCode: string): WeatherData | null {
  const now = Date.now();
  const cachedData = weatherCache.get(areaCode);

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return {
      ...cachedData.data,
      cached: true,
    };
  }

  return null;
}

/**
 * 캐시에 날씨 데이터 저장
 */
export function saveWeatherToCache(areaCode: string, data: WeatherData): void {
  weatherCache.set(areaCode, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * API 응답 검증
 */
export function validateApiResponse(response: SeoulWeatherApiResponse): boolean {
  return response.RESULT?.['RESULT.CODE'] === 'INFO-000';
}
