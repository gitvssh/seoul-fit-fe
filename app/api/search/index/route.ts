/**
 * Search Index API Route (단순 프록시)
 *
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/search에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSearchParams, fetchPOISearchIndex } from '@/entities/search';

/**
 * GET POI 검색 인덱스 조회
 * Query Parameters: page(페이지, 기본값 0), size(페이지 크기, 기본값 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');

    // 파라미터 검증
    const pagination = validateSearchParams({
      page: pageParam ? parseInt(pageParam) : undefined,
      size: sizeParam ? parseInt(sizeParam) : undefined,
    });

    if (!pagination) {
      return NextResponse.json(
        { error: '올바른 페이지 파라미터가 아닙니다. (최대 size: 20000)' },
        { status: 400 }
      );
    }

    // POI 검색 인덱스 조회
    const result = await fetchPOISearchIndex(pagination);

    // 항상 items 배열만 반환 (기존 API와 호환성 유지)
    return NextResponse.json(result.items);
  } catch (error) {
    console.error('[Search API] 조회 중 오류:', error);
    // 에러 발생 시에도 빈 배열 반환 (프론트엔드 동작 유지)
    return NextResponse.json([]);
  }
}
