/**
 * Congestion API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/congestion에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  findNearestAreaMatches,
  getUpstreamResult,
  isAreaNotFoundResult,
  isAreaUnavailable,
  markAreaUnavailable,
} from '@/entities/weather';
import {
  getCongestionFromCache,
  saveCongestionToCache,
  fetchSeoulCongestionData,
  transformCongestionData,
  validateApiResponse,
} from '@/entities/congestion';
import type { CongestionData } from '@/entities/congestion';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';

const MAX_LIVE_AREA_DISTANCE_KM = 3;
const MAX_AREA_CANDIDATES = 3;

// 위치 데이터는 weather 엔티티에서 재사용

/** UI와 호환되는 원시 API 형식 */
function toResponsePayload(data: CongestionData, cached: boolean) {
  return {
    AREA_CD: data.areaCode,
    AREA_NM: data.areaName,
    AREA_CONGEST_LVL: data.congestionLevel,
    AREA_CONGEST_MSG: data.congestionMessage,
    timestamp: data.timestamp,
    cached,
  };
}

/**
 * GET 서울시 실시간 인구데이터 API 호출
 * Query Parameters: lat(위도), lng(경도)
 *
 * 가장 가까운 지역부터 최대 세 곳을 시도한다. 서울시 지역 목록이 바뀌어 사라진
 * 코드가 있어도 다음 후보로 넘어간다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    // 필수 파라미터 검증
    if (!latParam || !lngParam) {
      return NextResponse.json(
        {
          error: '위도(lat)와 경도(lng) 파라미터가 없습니다.',
          code: 'MISSING_PARAMETERS',
        },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    // 좌표 유효성 검증
    if (!isValidSeoulCoordinate(lat, lng)) {
      return NextResponse.json(
        {
          error: '올바른 좌표 형식이 아닙니다.',
          code: 'INVALID_COORDINATES',
        },
        { status: 400 }
      );
    }

    // 실시간 도시데이터 지원 범위 안의 후보 지역 (가까운 순)
    const candidates = findNearestAreaMatches(lat, lng, MAX_AREA_CANDIDATES).filter(
      candidate => candidate.distanceKm <= MAX_LIVE_AREA_DISTANCE_KM
    );
    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '현재 위치는 서울 실시간 도시데이터 지원 지점과 거리가 있습니다.',
          code: 'OUTSIDE_LIVE_AREA',
          data: null,
        },
        { status: 404 }
      );
    }

    // 캐시 확인 (가까운 후보부터)
    for (const candidate of candidates) {
      const cachedData = getCongestionFromCache(candidate.location.code);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: toResponsePayload(cachedData, true),
        });
      }
    }

    // 캐시가 없거나 만료된 경우 API 호출
    const fetchTime = new Date().toISOString();
    let lastUpstreamCode: string | null = null;

    for (const candidate of candidates) {
      const areaCode = candidate.location.code;
      if (isAreaUnavailable(areaCode)) {
        continue;
      }

      const apiResponse = await fetchSeoulCongestionData(areaCode);

      // API 응답 검증
      if (!validateApiResponse(apiResponse)) {
        const upstream = getUpstreamResult(apiResponse);
        lastUpstreamCode = upstream.code;
        console.error(
          `서울시 실시간 인구데이터 응답 오류 (${areaCode}): ${upstream.code} ${upstream.message}`
        );
        if (isAreaNotFoundResult(upstream.code)) {
          markAreaUnavailable(areaCode);
        }
        continue;
      }

      // 데이터 변환
      const congestionData = transformCongestionData(areaCode, apiResponse, fetchTime);
      if (!congestionData) {
        markAreaUnavailable(areaCode);
        continue;
      }

      // 캐시 저장
      saveCongestionToCache(areaCode, congestionData);

      return NextResponse.json({
        success: true,
        data: toResponsePayload(congestionData, false),
      });
    }

    if (lastUpstreamCode) {
      // 502/504는 Cloudflare가 본문을 자체 오류 페이지로 바꾸므로 503으로 내려 원인 코드를 보존한다.
      return NextResponse.json(
        {
          success: false,
          error: '서울시 실시간 인구데이터를 불러오지 못했습니다.',
          code: 'UPSTREAM_ERROR',
          upstreamCode: lastUpstreamCode,
          data: null,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '주변 지역의 혼잡도 데이터가 없습니다.',
        code: 'NO_DATA',
        data: null,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('서울시 실시간 인구데이터 API 처리 중 오류: ', error);
    return NextResponse.json(
      {
        error: '서버 내부 오류가 발생했습니다.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
