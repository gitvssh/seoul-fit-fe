/**
 * Weather API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/weather에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  findNearestAreaMatch,
  fetchSeoulWeatherData,
  transformWeatherData,
  getWeatherFromCache,
  saveWeatherToCache,
  validateApiResponse,
} from '@/entities/weather';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';

const MAX_LIVE_AREA_DISTANCE_KM = 3;

/**
 * GET 서울시 실시간 도시데이터 API 호출
 * Query Parameters: lat(위도), lng(경도)
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

    // 가장 가까운 장소 코드 찾기
    const nearestArea = findNearestAreaMatch(lat, lng);
    if (nearestArea.distanceKm > MAX_LIVE_AREA_DISTANCE_KM) {
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
    const nearestAreaCode = nearestArea.location.code;

    // 캐시 확인
    const cachedData = getWeatherFromCache(nearestAreaCode);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    // 캐시가 없거나 만료된 경우 API 호출
    // console.log(`날씨 데이터 API 호출: ${nearestAreaCode}`);
    const fetchTime = new Date().toISOString();
    
    const apiResponse = await fetchSeoulWeatherData(nearestAreaCode);

    // API 응답 검증
    if (!validateApiResponse(apiResponse)) {
      console.error(`API 응답 에러: ${apiResponse.RESULT?.['RESULT.MESSAGE']}`);
      return NextResponse.json(
        {
          error: `서울시 실시간 도시데이터 API 응답 에러: ${apiResponse.RESULT?.['RESULT.MESSAGE']}`,
          code: 'API_ERROR',
        },
        { status: 502 }
      );
    }

    // 데이터 변환
    const weatherData = transformWeatherData(nearestAreaCode, apiResponse, fetchTime);
    
    if (!weatherData) {
      return NextResponse.json(
        {
          success: false,
          error: `${nearestAreaCode}에 대한 날씨 데이터가 없습니다.`,
          code: 'NO_WEATHER_DATA',
          data: null,
        },
        { status: 404 }
      );
    }

    // 캐시 저장
    saveWeatherToCache(nearestAreaCode, weatherData);

    return NextResponse.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error('서울시 실시간 도시데이터 API 처리 중 오류: ', error);
    return NextResponse.json(
      {
        error: '서버 내부 오류가 발생했습니다.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
