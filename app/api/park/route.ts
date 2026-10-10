/**
 * Park Nearby API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/park에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyParks, validateLocationParams } from '@/entities/park';

/**
 * GET 현재 위치 기준 반경 2km 이내 공원 정보 조회
 * Query Parameters: lat(위도), lng(경도)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    // 파라미터 검증
    const coords = validateLocationParams(latParam, lngParam);
    if (!coords) {
      return NextResponse.json(
        { error: '올바른 위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 위치 기반 공원 조회
    const parks = await fetchNearbyParks(coords.lat, coords.lng);
    return NextResponse.json(parks);
  } catch (error) {
    console.error('[Park Nearby API] 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}
