import { NextRequest, NextResponse } from 'next/server';
import {
  PublicPlaceUnavailableError,
  getPublicPlace,
  isPublicPlaceCategory,
} from '@/shared/lib/seo/public-places';

export const dynamic = 'force-dynamic';

/**
 * `/?place=<category>:<id>` 딥링크가 쓰는 공개 장소 조회.
 * 게이트웨이는 `/api/public`을 backend로 보내지 않으므로 서버 안에서 내부 주소로 대신 조회한다.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ category: string; id: string }> }
) {
  const { category, id: rawId } = await context.params;
  const id = Number(rawId);
  if (!isPublicPlaceCategory(category) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, code: 'INVALID_PLACE' }, { status: 400 });
  }
  try {
    const place = await getPublicPlace(category, id);
    if (!place) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(place, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    if (error instanceof PublicPlaceUnavailableError) {
      return NextResponse.json({ success: false, code: 'UPSTREAM_ERROR' }, { status: 503 });
    }
    throw error;
  }
}
