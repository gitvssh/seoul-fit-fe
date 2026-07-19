import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/config/environment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: '위도와 경도가 필요합니다.' }, { status: 400 });
    }

    const response = await fetch(
      `${getBackendInternalUrl()}/api/v1/cultural-reservations/nearby?latitude=${lat}&longitude=${lng}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '문화예약 데이터를 가져올 수 없습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('문화예약 API 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
