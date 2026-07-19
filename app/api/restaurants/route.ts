import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/config/environment';

/**
 * GET 레스토랑 API 프록시
 * Query Parameters: lat(위도), lng(경도), all(전체 데이터 조회)
 * 
 * 역할: 단순한 백엔드 API 프록시 (비즈니스 로직 없음)
 * 데이터 변환은 src/entities/restaurant에서 처리
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const all = searchParams.get('all');
    const backendUrlBase = getBackendInternalUrl();

    // 백엔드 URL 결정
    let backendUrl: string;
    
    if (all === 'true') {
      backendUrl = `${backendUrlBase}/api/v1/restaurants/all`;
    } else if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: '올바른 좌표 형식이 아닙니다.' }, 
          { status: 400 }
        );
      }
      
      backendUrl = `${backendUrlBase}/api/v1/restaurants/nearby?latitude=${lat}&longitude=${lng}`;
    } else {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터 또는 all=true가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API 호출 (단순 프록시)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`레스토랑 API 호출 실패: ${response.status}`);
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data);  // 원본 데이터 그대로 전달

  } catch (error) {
    console.error('레스토랑 API 프록시 오류:', error);
    return NextResponse.json([]);  // 빈 배열로 폴백
  }
}
