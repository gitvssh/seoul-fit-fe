import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/config/environment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const all = searchParams.get('all');

    if (all !== 'true' && (!lat || !lng)) {
      return NextResponse.json({ error: '위도와 경도가 필요합니다.' }, { status: 400 });
    }

    const endpoint = all === 'true'
      ? '/api/v1/libraries/all'
      : `/api/v1/libraries/nearby?latitude=${lat}&longitude=${lng}`;
    const response = await fetch(
      `${getBackendInternalUrl()}${endpoint}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '도서관 데이터를 가져올 수 없습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('도서관 API 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
