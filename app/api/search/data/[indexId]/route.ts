import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/config/environment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indexId: string }> }
) {
  try {
    const { indexId } = await params;

    if (!indexId) {
      return NextResponse.json({ error: 'indexId가 필요합니다.' }, { status: 400 });
    }

    const response = await fetch(`${getBackendInternalUrl()}/api/search/data/${indexId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`상세 검색 API 호출 실패: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: '상세 데이터를 가져오는데 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('상세 검색 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
