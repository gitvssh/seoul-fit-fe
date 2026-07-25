import { CongestionData } from '@/lib/types';

/**
 * 혼잡도 레벨에 따른 CSS 클래스 반환
 */
export function getCongestionClass(level: string): string {
  switch (level) {
    case '여유':
      return 'bg-green-100 text-green-800 border-green-200';
    case '보통':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case '약간 붐빔':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case '붐빔':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * 혼잡도 레벨에 따른 색상 반환 (HEX)
 */
export function getCongestionColor(level: string): string {
  switch (level) {
    case '여유':
      return '#10b981'; // green-500
    case '보통':
      return '#f59e0b'; // yellow-500
    case '약간 붐빔':
      return '#f97316'; // orange-500
    case '붐빔':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * 현재 위치에서 가장 가까운 장소의 혼잡도 정보 조회
 * (API Route를 통해 API 호출)
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소의 혼잡도 정보
 */
export async function getNearestCongestionData(
  lat: number,
  lng: number
): Promise<CongestionData | null> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다.');
      return null;
    }

    // Next.js API Route 호출
    const apiUrl = `/api/congestion?lat=${lat}&lng=${lng}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`혼잡도 API 호출 실패: ${response.status}`, errorData);
      return null;
    }

    const result = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('혼잡도 API 에러 : ', result.error);
      return null;
    }

    // 데이터가 없는 경우
    if (!result.data) {
      console.error('혼잡도 데이터가 없습니다.');
      return null;
    }

    // API는 이제 원시 API 형식으로 직접 반환
    const congestionData = {
      AREA_NM: result.data.AREA_NM,
      AREA_CD: result.data.AREA_CD,
      AREA_CONGEST_LVL: result.data.AREA_CONGEST_LVL,
      AREA_CONGEST_MSG: result.data.AREA_CONGEST_MSG,
      timestamp: result.data.timestamp,
      cached: result.data.cached,
    };
    return congestionData;
  } catch (error) {
    console.error('혼잡도 데이터 조회 실패 : ', error);
    return null;
  }
}
