/**
 * Subway Arrival API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/subway에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSubwayArrivalData,
  formatArrivalData,
  getUpstreamErrorCode,
  validateApiResponse,
} from '@/entities/subway';

/**
 * GET 지하철 실시간 도착 정보 API
 * Query Parameters: stationName(역명)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationName = searchParams.get('stationName');

    // 필수 파라미터 검증
    if (!stationName) {
      return NextResponse.json(
        { error: '지하철역명(stationName) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 호출
    const apiResponse = await fetchSubwayArrivalData(stationName);

    // 응답 검증
    if (!validateApiResponse(apiResponse)) {
      return NextResponse.json(
        {
          success: false,
          code: 'UPSTREAM_ERROR',
          upstreamCode: getUpstreamErrorCode(apiResponse),
        },
        { status: 503 }
      );
    }

    // 데이터 포맷팅
    const arrivals = apiResponse.realtimeArrivalList || [];
    const formattedArrivals = formatArrivalData(arrivals);

    return NextResponse.json({
      success: true,
      data: {
        stationName,
        arrivals: formattedArrivals,
      },
    });
  } catch (error) {
    console.error('지하철 도착 정보 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
