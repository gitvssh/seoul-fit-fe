import {
  POIData,
  NearbyPOIsResponse,
  FacilityCategory,
  FACILITY_CATEGORIES,
  Facility,
} from '@/lib/types';

/**
 * POI 이름을 기반으로 시설 카테고리 매핑
 */
function mapPOIToCategory(poiName: string): FacilityCategory {
  const name = poiName.toLowerCase();

  // 따릉이는 최우선 처리
  if (name.includes('따릉이') || name.includes('sbike') || name.includes('자전거')) {
    return FACILITY_CATEGORIES.BIKE;
  }

  // 체육 시설 (우선순위 높음)
  if (
    name.includes('체육') ||
    name.includes('운동') ||
    name.includes('경기') ||
    name.includes('올림픽') ||
    name.includes('돔') ||
    name.includes('스타디움') ||
    name.includes('종합운동장')
  ) {
    return FACILITY_CATEGORIES.SPORTS;
  }

  // 도서관 (우선순위 높음)
  if (name.includes('도서관') || name.includes('도서') || name.includes('라이브러리')) {
    return FACILITY_CATEGORIES.LIBRARY;
  }

  // 공원/자연 (우선순위 높음)
  if (
    name.includes('공원') ||
    name.includes('산') ||
    name.includes('한강공원') ||
    name.includes('숲') ||
    name.includes('폭포') ||
    name.includes('섬') ||
    name.includes('천') ||
    name.includes('녹지') ||
    name.includes('대공원') ||
    name.includes('꿈의숲') ||
    name.includes('어린이대공원')
  ) {
    return FACILITY_CATEGORIES.PARK;
  }

  // 음식/상업 지역
  if (
    name.includes('맛집') ||
    name.includes('시장') ||
    name.includes('거리') ||
    name.includes('명동') ||
    name.includes('가로수') ||
    name.includes('로데오') ||
    name.includes('압구정') ||
    name.includes('청담') ||
    name.includes('연남') ||
    name.includes('성수') ||
    name.includes('경리단') ||
    name.includes('용리단') ||
    name.includes('송리단') ||
    name.includes('익선동') ||
    name.includes('북창동') ||
    name.includes('타임스케어') ||
    name.includes('앱틱가구') ||
    name.includes('명품') ||
    name.includes('카페') ||
    name.includes('전통시장')
  ) {
    return FACILITY_CATEGORIES.RESTAURANT;
  }

  // 문화 시설 (기본값)
  if (
    name.includes('문화') ||
    name.includes('박물관') ||
    name.includes('미술관') ||
    name.includes('공연') ||
    name.includes('극장') ||
    name.includes('궁') ||
    name.includes('전시') ||
    name.includes('갤러리') ||
    name.includes('예술') ||
    name.includes('디자인플라자') ||
    name.includes('한옥마을') ||
    name.includes('서촌') ||
    name.includes('인사동') ||
    name.includes('청와대') ||
    name.includes('관광특구') ||
    name.includes('역사') ||
    name.includes('유적')
  ) {
    return FACILITY_CATEGORIES.CULTURE;
  }

  // 지하철역은 문화시설로 분류 (기본값)
  return FACILITY_CATEGORIES.CULTURE;
}

/**
 * 현재 위치 기준 반경 내 POI 조회
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @param radius 반경 (km, 기본값 1.5)
 * @return 반경 내 POI 목록
 */
export async function getNearbyPOIs(
  lat: number,
  lng: number,
  radius: number = 1.5
): Promise<POIData[]> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다.');
      return [];
    }

    // Next.js API Route 호출
    const apiUrl = `/api/nearby-pois?lat=${lat}&lng=${lng}&radius=${radius}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`POI API 호출 실패: ${response.status}`, errorData);
      return [];
    }

    const result: NearbyPOIsResponse = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('POI API 에러:', result);
      return [];
    }

    // 데이터가 없는 경우
    if (!result.data || !result.data.pois) {
      console.error('POI 데이터가 없습니다.');
      return [];
    }

    return result.data.pois;
  } catch (error) {
    console.error('POI 데이터 조회 실패:', error);
    return [];
  }
}

/**
 * POI 데이터를 Facility 형태로 변환 (지하철역 제외)
 */
export function convertPOIToFacility(poi: POIData): Facility | null {
  // 지하철역은 제외 (별도로 처리)
  if (
    poi.name.includes('역') &&
    (poi.name.includes('지하철') ||
      poi.name.includes('전철') ||
      poi.name.includes('호선') ||
      poi.name.includes('선') ||
      poi.name.endsWith('역'))
  ) {
    return null;
  }

  const category = mapPOIToCategory(poi.name);

  // 카테고리별 상세 정보 생성
  const getDetailedInfo = (name: string, category: FacilityCategory) => {
    const lowerName = name.toLowerCase();

    switch (category) {
      case FACILITY_CATEGORIES.SPORTS:
        return {
          description: '체육 및 운동 시설입니다.',
          operatingHours: '06:00-22:00 (시설별 상이)',
          phone: '문의 필요',
        };

      case FACILITY_CATEGORIES.BIKE:
        return {
          description: '서울시 공용 자전거 따릉이 대여소입니다. 스마트폰 앱으로 대여 가능합니다.',
          operatingHours: '24시간 이용 가능',
          phone: '1599-0120 (따릉이 고객센터)',
        };

      case FACILITY_CATEGORIES.CULTURE:
        if (lowerName.includes('궁')) {
          return {
            description: '조선시대 궁궐로 역사와 전통문화를 경험할 수 있습니다.',
            operatingHours: '09:00-18:00 (월요일 휴관)',
            phone: '문의 필요',
          };
        }
        if (lowerName.includes('역')) {
          return {
            description: '서울 지하철 역사로 교통의 중심지입니다.',
            operatingHours: '05:30-24:00 (운행시간)',
            phone: '1577-1234',
          };
        }
        return {
          description: '문화 및 예술 시설입니다.',
          operatingHours: '09:00-18:00',
          phone: '문의 필요',
        };

      case FACILITY_CATEGORIES.RESTAURANT:
        return {
          description: '다양한 맛집과 카페가 모여 있는 음식 문화 지역입니다.',
          operatingHours: '10:00-22:00 (매장별 상이)',
          phone: '각 매장 문의',
        };

      case FACILITY_CATEGORIES.LIBRARY:
        return {
          description: '도서 대출, 열람실, 학습 공간을 제공하는 공공도서관입니다.',
          operatingHours: '09:00-18:00 (월요일 휴관)',
          phone: '문의 필요',
        };

      case FACILITY_CATEGORIES.PARK:
        return {
          description: '산책, 운동, 휴식을 위한 도심 속 녹지 공간입니다.',
          operatingHours: '24시간 개방',
          phone: '관리사무소 문의',
        };

      default:
        return {
          description: '서울시 주요 지역 중 하나입니다.',
          operatingHours: '운영시간 문의 필요',
          phone: '문의 필요',
        };
    }
  };

  const detailInfo = getDetailedInfo(poi.name, category);

  return {
    id: poi.code || poi.id,
    name: poi.name,
    category,
    position: { lat: poi.lat || poi.position.lat, lng: poi.lng || poi.position.lng },
    address: `서울시 주요 지역 - ${poi.name}`,
    congestionLevel: 'medium',
    distance: poi.distance || 0,
    description: detailInfo.description,
    operatingHours: detailInfo.operatingHours,
    phone: detailInfo.phone,
    isReservable: category === FACILITY_CATEGORIES.SPORTS || category === FACILITY_CATEGORIES.BIKE,
  };
}
