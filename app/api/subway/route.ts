/**
 * Subway Stations API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/subway에서 처리
 */

import { NextResponse } from 'next/server';
import { fetchAllSubwayStations } from '@/entities/subway';

/**
 * GET 전체 지하철 역 목록 조회
 * Query Parameters: lat(위도), lng(경도) - 호환성을 위해 유지하지만 사용하지 않음
 */
export async function GET() {
  try {
    // 전체 지하철 역 목록 조회
    const result = await fetchAllSubwayStations();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Subway API] 조회 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
