/**
 * Parks Nearby API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/park에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyParks, validateLocationWithRadius } from '@/entities/park';

/**
 * GET 위치 기반 공원 조회 (반경 설정 가능)
 * Query Parameters: latitude(위도), longitude(경도), radius(반경km, 기본값 2)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius');

    // 파라미터 검증
    const params = validateLocationWithRadius(latitude, longitude, radius);
    if (!params) {
      return NextResponse.json({ error: '올바른 위도와 경도가 필요합니다.' }, { status: 400 });
    }

    // 위치 기반 공원 조회
    const parks = await fetchNearbyParks(params.lat, params.lng, params.radius);
    return NextResponse.json(parks);
  } catch (error) {
    console.error('[Parks Nearby API] 조회 중 오류:', error);
    return NextResponse.json({ error: '공원 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
