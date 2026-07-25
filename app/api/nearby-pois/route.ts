/**
 * Nearby POIs API Route - Backend Integration
 * 백엔드 POI 검색 인덱스와 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/config/environment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    // 필수 파라미터 검증
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) : 1.5; // km 단위
    const backendUrl = getBackendInternalUrl();

    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: '올바른 좌표 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[POI API] 백엔드 조회: radius=${radius}`);
    }

    // 백엔드 API 호출 - 전체 POI 인덱스 가져오기 (페이징 처리)
    const pageSize = 1000; // 한 번에 가져올 개수
    let allPOIs: unknown[] = [];
    let page = 0;
    let hasMore = true;

    // 첫 페이지만 가져오기 (성능을 위해)
    while (hasMore && page < 5) { // 최대 5페이지(5000개)만 조회
      const backendResponse = await fetch(
        `${backendUrl}/api/search/index?page=${page}&size=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!backendResponse.ok) {
        console.error(`백엔드 POI 조회 실패: ${backendResponse.status}`);
        break;
      }

      const data = await backendResponse.json();
      
      if (data.content && data.content.length > 0) {
        allPOIs = allPOIs.concat(data.content);
        hasMore = data.hasNext;
        page++;
      } else {
        hasMore = false;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[POI API] 백엔드에서 ${allPOIs.length}개 POI 조회 완료`);
    }

    // 거리 계산 및 필터링
    const radiusInMeters = radius * 1000;
    const nearbyPOIs = allPOIs
      .map(poi => {
        const poiData = poi as any; // 타입 단언
        // 주소에서 좌표 추출 시도 (실제 좌표가 없는 경우)
        // 백엔드에서 좌표 데이터가 제공되면 이 부분 수정 필요
        const distance = calculateDistance(lat, lng, poiData.latitude || lat, poiData.longitude || lng);
        return {
          ...poiData,
          distance,
          distanceText: formatDistance(distance),
        };
      })
      .filter(poi => poi.distance <= radiusInMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50); // 최대 50개

    return NextResponse.json({
      success: true,
      data: {
        center: { lat, lng },
        radius,
        count: nearbyPOIs.length,
        pois: nearbyPOIs.map(poi => ({
          code: `poi_${poi.id}`,
          name: poi.name,
          lat: poi.latitude || lat,
          lng: poi.longitude || lng,
          distance: poi.distance,
          distanceText: poi.distanceText,
          address: poi.address,
          remark: poi.remark,
          refTable: poi.refTable,
          refId: poi.refId,
        })),
      },
    });
  } catch (error) {
    console.error('반경 내 POI 조회 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

/**
 * 두 지점 간 거리 계산 (Haversine 공식)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}

/**
 * 거리 포맷팅
 */
function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
}
