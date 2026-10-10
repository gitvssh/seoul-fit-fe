/**
 * Parks All API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/park에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllParks, validateParkParams } from '@/entities/park';

/**
 * GET 전체 공원 데이터 조회
 * Query Parameters: page(페이지, 기본값 0), size(페이지 크기, 기본값 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');

    // 파라미터 검증
    const params = validateParkParams(pageParam, sizeParam);

    // 공원 데이터 조회 (백엔드 우선, 실패시 공공데이터)
    const parks = await fetchAllParks(params);

    return NextResponse.json(parks);
  } catch (error) {
    console.error('[Parks All API] 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}
