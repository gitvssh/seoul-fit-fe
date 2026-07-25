/**
 * @fileoverview 시설 관련 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { Position, TimeSlot, CongestionLevel, BaseFilter } from './common';

// 시설 카테고리 상수 (기존 호환성 유지)
export const FACILITY_CATEGORIES = {
  SPORTS: 'sports',
  CULTURE: 'culture',
  RESTAURANT: 'restaurant',
  LIBRARY: 'library',
  PARK: 'park',
  SUBWAY: 'subway',
  BIKE: 'bike',
  COOLING_SHELTER: 'cooling_shelter',
  CULTURAL_EVENT: 'cultural_event',
  CULTURAL_RESERVATION: 'cultural_reservation',
} as const;

// 시설 카테고리 타입
export type FacilityCategory = typeof FACILITY_CATEGORIES[keyof typeof FACILITY_CATEGORIES];

// 기본 시설 정보
export interface BaseFacility {
  /** 시설 고유 ID */
  id: string;
  /** 시설명 */
  name: string;
  /** 시설 카테고리 */
  category: FacilityCategory;
  /** 시설 위치 */
  position: Position;
  /** 주소 */
  address: string;
  /** 전화번호 */
  phone?: string;
  /** 웹사이트 URL */
  website?: string;
  /** 예약 또는 예매 페이지 URL */
  reservationUrl?: string;
  /** 운영시간 */
  operatingHours?: string;
  /** 혼잡도 */
  congestionLevel: CongestionLevel;
  /** 현재 이용자 수 */
  currentUsers?: number;
  /** 최대 수용 인원 */
  maxCapacity?: number;
  /** 사용자 위치로부터의 거리 (km) */
  distance?: number;
  /** 평점 */
  rating?: number;
  /** 시설 설명 */
  description?: string;
  /** 예약 가능 여부 */
  isReservable?: boolean;
  /** 실내 시설 여부. 알 수 없으면 값을 생략합니다. */
  isIndoor?: boolean;
  /** 시설 이미지 URL */
  imageUrl?: string;
  /** 태그 */
  tags?: string[];
  /** 원천 데이터 제공 기관 또는 시스템 */
  dataSource?: string;
  /** 원천 데이터 안내 페이지 */
  dataSourceUrl?: string;
  /** 원천 데이터의 마지막 갱신 시각(ISO 8601) */
  sourceUpdatedAt?: string;
  /** 수집기가 판정한 데이터 신선도 */
  freshnessStatus?: 'live' | 'recent' | 'stale' | 'unknown';
}

// 체육시설 특화 정보
export interface SportsFacilityInfo {
  /** 시설 유형 (농구장, 축구장, 헬스장 등) */
  facilityType: string;
  /** 예약 URL */
  reservationUrl?: string;
  /** 예약 가능한 시간대 */
  availableSlots?: TimeSlot[];
  /** 보유 장비 */
  equipment?: string[];
  /** 이용료 */
  fee?: {
    adult: number;
    child: number;
    senior: number;
  };
  /** 실내/실외 구분 */
  isIndoor: boolean;
}

// 문화시설 특화 정보
export interface CulturalFacilityInfo {
  /** 현재 진행 중인 이벤트 */
  currentEvents?: CulturalEvent[];
  /** 시설 유형 */
  facilityType: 'museum' | 'gallery' | 'theater' | 'library' | 'cultural_center';
  /** 입장료 */
  admissionFee?: {
    adult: number;
    child: number;
    senior: number;
  };
  /** 전시/공연 정보 */
  exhibitions?: Exhibition[];
}

// 문화 이벤트
export interface CulturalEvent {
  /** 이벤트 ID */
  id: string;
  /** 이벤트명 */
  title: string;
  /** 이벤트 설명 */
  description: string;
  /** 시작일 */
  startDate: string;
  /** 종료일 */
  endDate: string;
  /** 이벤트 유형 */
  type: 'exhibition' | 'performance' | 'workshop' | 'lecture';
  /** 예약 필요 여부 */
  requiresReservation: boolean;
  /** 예약 URL */
  reservationUrl?: string;
  
  // 추가 속성 (서울시 API 호환)
  /** 무료 여부 */
  isFree?: boolean | string;
  /** 대상 */
  useTarget?: string;
  /** 이용료 */
  useFee?: string;
  /** 티켓 정보 */
  ticket?: string;
  /** 메인 이미지 */
  mainImg?: string;
  /** 지역구 */
  district?: string;
  /** 장르명 */
  codeName?: string;
  /** 장소 */
  place?: string;
  /** 주최기관 */
  orgName?: string;
  /** 행사일시 */
  eventDate?: string;
  /** 테마코드 */
  themeCode?: string;
  /** 프로그램 */
  program?: string;
  /** 기타 설명 */
  etcDesc?: string;
}

// 전시 정보
export interface Exhibition {
  /** 전시 ID */
  id: string;
  /** 전시명 */
  title: string;
  /** 전시 설명 */
  description: string;
  /** 전시 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 전시 이미지 */
  imageUrl?: string;
}

// 맛집 특화 정보
export interface RestaurantInfo {
  /** 음식 카테고리 */
  cuisineType: string;
  /** 가격대 */
  priceRange: 'low' | 'medium' | 'high' | 'premium';
  /** 영업시간 */
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  /** 메뉴 정보 */
  menu?: MenuItem[];
  /** 배달 가능 여부 */
  deliveryAvailable: boolean;
  /** 예약 가능 여부 */
  reservationAvailable: boolean;
}

// 메뉴 아이템
export interface MenuItem {
  /** 메뉴명 */
  name: string;
  /** 가격 */
  price: number;
  /** 메뉴 설명 */
  description?: string;
  /** 메뉴 이미지 */
  imageUrl?: string;
  /** 추천 메뉴 여부 */
  isRecommended?: boolean;
}

// 통합 시설 정보 (기존 Facility 타입과 호환)
export interface Facility extends BaseFacility {
  /** 체육시설 정보 */
  sportsFacility?: SportsFacilityInfo;
  /** 문화시설 정보 */
  culturalFacility?: CulturalFacilityInfo;
  /** 맛집 정보 */
  restaurantInfo?: RestaurantInfo;
  
  // 추가 속성들 (기존 코드 호환성)
  /** 문화 이벤트 정보 */
  culturalEvent?: CulturalEvent;
  /** 지하철역 정보 */
  subwayStation?: {
    route?: string;
    line?: string;
    stationName?: string;
  };
  /** 따릉이 시설 정보 */
  bikeFacility?: {
    stationId?: string;
    rackTotCnt?: number;
    parkingBikeTotCnt?: number;
    shared?: number;
  };
}

// 클러스터된 시설 정보
export interface ClusteredFacility {
  /** 클러스터 ID */
  id: string;
  /** 클러스터 중심 위치 */
  position: Position;
  /** 클러스터에 포함된 시설 수 */
  count: number;
  /** 클러스터에 포함된 시설들 */
  facilities: Facility[];
  /** 클러스터 반경 */
  radius: number;
  /** 대표 카테고리 */
  primaryCategory: FacilityCategory;
}

// 시설 검색 필터
export interface FacilityFilter extends BaseFilter {
  /** 시설 카테고리 */
  categories?: FacilityCategory[];
  /** 혼잡도 필터 */
  congestionLevels?: CongestionLevel[];
  /** 예약 가능 시설만 */
  reservableOnly?: boolean;
  /** 평점 최소값 */
  minRating?: number;
  /** 가격대 필터 */
  priceRange?: string[];
  /** 운영 중인 시설만 */
  openOnly?: boolean;
}

// 시설 검색 결과
export interface FacilitySearchResult {
  /** 검색된 시설 목록 */
  facilities: Facility[];
  /** 클러스터된 시설 목록 */
  clusters: ClusteredFacility[];
  /** 전체 개수 */
  totalCount: number;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
  /** 검색 소요 시간 (ms) */
  searchTime: number;
}

// 시설 상세 정보 요청
export interface FacilityDetailRequest {
  /** 시설 ID */
  facilityId: string;
  /** 사용자 위치 (거리 계산용) */
  userLocation?: Position;
}

// 시설 즐겨찾기
export interface FacilityBookmark {
  /** 즐겨찾기 ID */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 시설 ID */
  facilityId: string;
  /** 즐겨찾기 추가 시간 */
  createdAt: string;
  /** 사용자 메모 */
  memo?: string;
}
