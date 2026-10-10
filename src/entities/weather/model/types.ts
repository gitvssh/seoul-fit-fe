/**
 * @fileoverview Weather Entity Type Definitions
 * @description 날씨 엔티티 타입 정의
 */

/**
 * 서울 열린데이터 광장 API 원본 응답 타입
 */
export interface SeoulWeatherApiResponse {
  // 정상 응답은 RESULT['RESULT.CODE'], 오류 응답은 RESULT.CODE 형태로 온다.
  RESULT?: {
    'RESULT.CODE'?: string;
    'RESULT.MESSAGE'?: string;
    CODE?: string;
    MESSAGE?: string;
  };
  CITYDATA?: {
    AREA_NM: string;
    WEATHER_STTS?: Array<{
      WEATHER_STTS: string;
      TEMP: string;
      SENSIBLE_TEMP: string;
      MAX_TEMP: string;
      MIN_TEMP: string;
      HUMIDITY: string;
      PRECIPITATION: string;
      PCP_MSG: string;
      UV_INDEX_LVL: string;
      UV_MSG: string;
      PM25_INDEX: string;
      PM10_INDEX: string;
    }>;
  };
}

/**
 * 프론트엔드용 날씨 데이터 타입
 */
export interface WeatherData {
  AREA_CD: string;
  AREA_NM: string;
  WEATHER_STTS: string;
  TEMP: string;
  SENSIBLE_TEMP: string;
  MAX_TEMP: string;
  MIN_TEMP: string;
  HUMIDITY: string;
  PRECIPITATION: string;
  PCP_MSG: string;
  UV_INDEX_LVL: string;
  UV_MSG: string;
  PM25_INDEX: string;
  PM10_INDEX: string;
  timestamp: string;
  cached: boolean;
}

/**
 * 위치 정보 타입
 */
export interface Location {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * 서울 위치 정보 타입 (SeoulLocation은 Location의 alias)
 */
export type SeoulLocation = Location;

/**
 * 캐시 데이터 타입
 */
export interface WeatherCacheData {
  data: WeatherData;
  timestamp: number;
}
