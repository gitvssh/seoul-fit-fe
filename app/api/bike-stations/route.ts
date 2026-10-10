/**
 * Bike Stations API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/bike-station에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyBikeStations, validateSearchParams } from '@/entities/bike-station';

/**
 * GET 반경 내 따릉이 대여소 조회
 * Query Parameters: lat(위도), lng(경도), radius(반경km, 기본값 1.5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    // 파라미터 검증
    const coords = validateSearchParams(latParam, lngParam);
    if (!coords) {
      return NextResponse.json(
        { error: '올바른 위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const radius = radiusParam ? parseFloat(radiusParam) : 1.5;

    // 대여소 검색
    const result = await searchNearbyBikeStations({
      lat: coords.lat,
      lng: coords.lng,
      radius,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[BikeStations API] 조회 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
