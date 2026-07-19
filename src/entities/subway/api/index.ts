/**
 * @fileoverview Subway API Service
 * @description 지하철 API 서비스 계층
 */

import type {
  SubwayArrivalApiResponse,
  SubwayArrivalRow,
  FormattedSubwayArrival,
  SubwayStation,
  SubwayStationListResult,
} from '../model/types';
import type { SubwayStationRow } from '@/lib/seoulApi';
import { serverCache } from '@/lib/serverCache';
import { dataScheduler } from '@/shared/lib/scheduler';
import {
  formatArrivalMessage,
  formatTime,
  cleanStationName,
} from '../lib/formatter';

const API_KEY = process.env.SEOUL_API_KEY || '';
const BASE_URL = 'http://swopenapi.seoul.go.kr/api/subway';

/**
 * 지하철 실시간 도착 정보 조회
 * @param stationName 역명
 * @returns API 응답
 */
export async function fetchSubwayArrivalData(
  stationName: string
): Promise<SubwayArrivalApiResponse> {
  const cleanedName = cleanStationName(stationName);
  const apiUrl = `${BASE_URL}/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(cleanedName)}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`지하철 도착 정보 API 호출 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 도착 정보 포맷팅
 * @param arrivals 원본 도착 정보 배열
 * @returns 포맷된 도착 정보 배열
 */
export function formatArrivalData(
  arrivals: SubwayArrivalRow[]
): FormattedSubwayArrival[] {
  return arrivals.map(arrival => ({
    subwayId: arrival.subwayId,
    updnLine: arrival.updnLine,
    trainLineNm: arrival.trainLineNm,
    statnNm: arrival.statnNm,
    barvlDt: formatTime(arrival.barvlDt),
    btrainNo: arrival.btrainNo,
    bstatnNm: arrival.bstatnNm,
    arvlMsg2: formatArrivalMessage(arrival.arvlMsg2),
    arvlMsg3: arrival.arvlMsg3,
    arvlCd: arrival.arvlCd,
  }));
}

/**
 * API 응답 검증
 * @param response API 응답
 * @returns 응답이 유효한지 여부
 */
export function validateApiResponse(response: SubwayArrivalApiResponse): boolean {
  if (response.errorMessage) {
    return response.errorMessage.code === 'INFO-000';
  }
  return true;
}

/**
 * 캐시 초기화 확인 및 대기
 */
export async function ensureSubwayStationCache(): Promise<void> {
  if (!serverCache.has('subway_stations')) {
    console.log('[Subway] 캐시 없음, 초기화 대기...');
    // instrumentation 초기화 완료 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 여전히 캐시가 없으면 초기화 실행
    if (!serverCache.has('subway_stations')) {
      await dataScheduler.initialize();
    }
  }
}

/**
 * 지하철 역 데이터 변환
 */
export function transformSubwayStation(station: SubwayStationRow): SubwayStation {
  return {
    code: `SUBWAY_${station.BLDN_ID}`,
    name: `${station.BLDN_NM}역`,
    lat: parseFloat(station.LAT),
    lng: parseFloat(station.LOT),
    stationId: station.BLDN_ID,
    route: station.ROUTE,
  };
}

/**
 * 전체 지하철 역 목록 조회
 */
export async function fetchAllSubwayStations(): Promise<SubwayStationListResult> {
  // 캐시 초기화 확인
  await ensureSubwayStationCache();

  // 캐시에서 지하철 데이터 조회
  const stations = serverCache.get<SubwayStationRow[]>('subway_stations');
  const cacheInfo = serverCache.getInfo('subway_stations');

  if (!stations) {
    throw new Error('지하철 데이터를 불러올 수 없습니다.');
  }

  // 데이터 변환
  const allStations = stations.map(transformSubwayStation);

  return {
    count: allStations.length,
    stations: allStations,
    cached: true,
    fetchTime: new Date(cacheInfo?.timestamp || 0).toISOString(),
  };
}
