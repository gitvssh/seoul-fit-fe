/**
 * @fileoverview Subway Entity Type Definitions
 * @description 지하철 엔티티 타입 정의
 */

/**
 * 서울시 지하철 실시간 도착 정보 API 원본 응답
 */
export interface SubwayArrivalRow {
  subwayId: string; // 지하철 호선 ID
  updnLine: string; // 상하행선 구분
  trainLineNm: string; // 도착지 방면
  statnNm: string; // 지하철역명
  barvlDt: string; // 열차도착예정시간(초)
  btrainNo: string; // 열차번호
  bstatnNm: string; // 종착역명
  recptnDt: string; // 열차도착정보 생성시각
  arvlMsg2: string; // 도착메시지
  arvlMsg3: string; // 상세 도착메시지
  arvlCd: string; // 도착코드
}

/**
 * API 응답 타입
 */
export interface SubwayArrivalApiResponse {
  errorMessage?: {
    status: number;
    code: string;
    message: string;
    link: string;
    developerMessage: string;
    total: number;
  };
  realtimeArrivalList?: SubwayArrivalRow[];
}

/**
 * 포맷된 도착 정보 타입
 */
export interface FormattedSubwayArrival {
  subwayId: string; // 지하철 호선 ID
  updnLine: string; // 상하행선 구분
  trainLineNm: string; // 도착지 방면
  statnNm: string; // 지하철역명
  barvlDt: string; // 포맷된 도착시간
  btrainNo: string; // 열차번호
  bstatnNm: string; // 종착역명
  arvlMsg2: string; // 포맷된 도착메시지
  arvlMsg3: string; // 상세 도착메시지
  arvlCd: string; // 도착코드
}

/**
 * 서울시 지하철 역 정보 (이미 정의됨)
 */
import { SubwayStationRow } from '@/lib/seoulApi';

/**
 * 프론트엔드용 지하철 역 데이터
 */
export interface SubwayStation {
  code: string; // 역 코드
  name: string; // 역명
  lat: number; // 위도
  lng: number; // 경도
  stationId: string; // 역 ID
  route: string; // 노선
}

/**
 * 지하철 역 목록 조회 결과
 */
export interface SubwayStationListResult {
  count: number;
  stations: SubwayStation[];
  cached: boolean;
  fetchTime: string;
}
