/**
 * @fileoverview Congestion Entity Type Definitions
 * @description 혼잡도 엔티티 타입 정의
 */

/**
 * 서울시 실시간 도시데이터 API 응답 타입
 */
export interface SeoulCongestionApiResponse {
  // 정상 응답은 RESULT['RESULT.CODE'], 오류 응답은 RESULT.CODE 형태로 온다.
  RESULT?: {
    'RESULT.CODE'?: string;
    'RESULT.MESSAGE'?: string;
    CODE?: string;
    MESSAGE?: string;
  };
  CITYDATA?: {
    AREA_NM: string;
    LIVE_PPLTN_STTS?: Array<{
      AREA_CONGEST_LVL: string;
      AREA_CONGEST_MSG: string;
      AREA_PPLTN_MIN: string;
      AREA_PPLTN_MAX: string;
      FCST_YN: string;
      FCST_PPLTN?: Array<{
        FCST_TIME: string;
        FCST_CONGEST_LVL: string;
        FCST_PPLTN_MIN: string;
        FCST_PPLTN_MAX: string;
      }>;
    }>;
  };
}

/**
 * 혼잡도 레벨 타입
 */
export type CongestionLevel = '여유' | '보통' | '약간 붐빔' | '붐빔';

/**
 * 혼잡도 색상 타입
 */
export type CongestionColor = 'green' | 'yellow' | 'orange' | 'red';

/**
 * 프론트엔드용 혼잡도 데이터 타입
 */
export interface CongestionData {
  areaCode: string;
  areaName: string;
  congestionLevel: CongestionLevel;
  congestionMessage: string;
  populationMin: number;
  populationMax: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  cached: boolean;
}

/**
 * 캐시 데이터 타입
 */
export interface CongestionCacheData {
  data: CongestionData;
  timestamp: number;
}
