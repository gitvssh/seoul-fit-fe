/**
 * @fileoverview 기존 코드 호환성을 위한 레거시 타입 정의
 * @description 기존 코드에서 사용하던 타입들을 임시로 유지합니다.
 * @deprecated 새로운 코드에서는 사용하지 마세요. 점진적으로 새로운 타입으로 마이그레이션하세요.
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { 
  Position, 
  CongestionLevel, 
  Facility,
  FacilityCategory,
  UserPreferences as NewUserPreferences,
  ClusteredFacility
} from './index';

// ===== 기존 UserPreferences 구조 (임시 호환성) =====
export interface LegacyUserPreferences extends Record<FacilityCategory, boolean> {
  sports: boolean;
  culture: boolean;
  restaurant: boolean;
  library: boolean;
  park: boolean;
  subway: boolean;
  bike: boolean;
  cooling_shelter: boolean;
  cultural_event: boolean;
  cultural_reservation: boolean;
}

// ===== 누락된 타입들 (기존 코드에서 사용) =====

// 혼잡도 데이터
export interface CongestionData {
  // 서울시 API 형식
  AREA_CD?: string;           // 장소 코드
  AREA_NM?: string;           // 장소명  
  AREA_CONGEST_LVL?: string;  // 혼잡도 레벨 (여유, 보통, 약간 붐빔, 붐빔)
  AREA_CONGEST_MSG?: string;  // 혼잡도 메시지
  
  // 기존 형식 (하위 호환성)
  facilityId?: string;
  level?: CongestionLevel;
  currentUsers?: number;
  maxCapacity?: number;
  timestamp?: string;
  cached?: boolean;
}

// 날씨 데이터 - UI와 호환되는 원시 API 형식 사용
export interface WeatherData {
  AREA_NM: string;         // 장소명
  AREA_CD: string;         // 장소코드  
  WEATHER_STTS: string;    // 날씨 현황
  TEMP: string;            // 기온
  SENSIBLE_TEMP: string;   // 체감온도
  MAX_TEMP: string;        // 일 최고온도
  MIN_TEMP: string;        // 일 최저온도
  HUMIDITY: string;        // 습도
  PRECIPITATION: string;   // 강수량
  PCP_MSG: string;         // 강수 관련 메시지
  UV_INDEX_LVL: string;    // 자외선 지수 단계
  UV_MSG: string;          // 자외선 메시지
  PM25_INDEX: string;      // 초미세먼지 정도
  PM10_INDEX: string;      // 미세먼지 정도
  /** 서울시 데이터 조회 시각 */
  timestamp?: string;
  /** 서버 메모리 캐시 응답 여부 */
  cached?: boolean;
}

// 지하철 도착 정보
export interface SubwayArrivalData {
  stationName: string;
  lineName: string;
  direction: string;
  arrivalTime: number;
  currentStation: string;
}

// POI 데이터
export interface POIData {
  id: string;
  name: string;
  category: string;
  position: Position;
  address: string;
  phone?: string;
  // 추가 속성 (하위 호환성)
  code?: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

// 근처 POI 응답
export interface NearbyPOIsResponse {
  pois: POIData[];
  totalCount: number;
  // API 응답 호환성
  success?: boolean;
  data?: {
    center: { lat: number; lng: number };
    radius: number;
    count: number;
    pois: POIData[];
  };
}

// 도서관 정보
export interface Library {
  id: string;
  name: string;
  position: Position;
  address: string;
  phone?: string;
  operatingHours?: string;
  website?: string;
}

// 공원 정보
export interface Park {
  id: string;
  name: string;
  position: Position;
  address: string;
  area?: number;
  facilities?: string[];
}

// 맛집 정보
export interface Restaurant {
  id: string;
  name: string;
  position: Position;
  address: string;
  cuisineType: string;
  rating?: number;
  priceRange?: string;
  // 서울시 API 호환 속성
  latitude?: number;
  longitude?: number;
  newAddress?: string;
  phone?: string;
  website?: string;
  operatingHours?: string;
  representativeMenu?: string;
  subwayInfo?: string;
  postUrl?: string;
}

// 관광 맛집 정보
export interface TouristRestaurant {
  id: string;
  name: string;
  position: Position;
  address: string;
  cuisineType: string;
  langCodeId: string;
  dataDate: string;
}

// 맛집 데이터 통계
export interface RestaurantDataStatistics {
  totalCount: number;
  byLanguage: Record<string, number>;
  byDate: Record<string, number>;
}

// 무더위 쉼터
export interface CoolingCenter {
  id: string;
  name: string;
  position: Position;
  address: string;
  operatingHours?: string;
  facilities?: string[];
  // 서울시 API 호환 속성
  latitude?: number;
  longitude?: number;
  roadAddress?: string;
  lotAddress?: string;
  facilityType1?: string;
  facilityType2?: string;
}

// 문화 공간
export interface CulturalSpace {
  id: string;
  name: string;
  position: Position;
  address: string;
  type: string;
  operatingHours?: string;
}

// 문화 예약
export interface CulturalReservation {
  id: string;
  facilityId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  reservationUrl?: string;
}

// 대기질 정보
export interface AirQuality {
  pm10: number;
  pm25: number;
  o3: number;
  no2: number;
  co: number;
  so2: number;
  grade: string;
  timestamp: string;
}

// 사용자 결과
export interface UserResult {
  user: import('./user').User;
  success: boolean;
  message?: string;
}

// 알림 정보
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  status?: 'SENT' | 'READ';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  subscriptionId?: number | null;
  reason?: string | null;
  deepLink?: string | null;
  dataObservedAt?: string | null;
  providerStatus?: string;
}

// 알림 페이지
export interface NotificationPage {
  notifications: Notification[];
  totalCount: number;
  hasMore: boolean;
  content?: Notification[];  // 기존 코드 호환성
}

// 알림 히스토리 결과
export interface NotificationHistoryResult {
  notifications: Notification[];
  pagination: {
    page: number;
    size: number;
    total: number;
    hasMore: boolean;
  };
}

// ===== 확장된 Facility 타입 (기존 코드 호환성) =====
export interface ExtendedFacility extends Facility {
  // subwayStation은 Facility에 이미 정의되어 있으므로 제거
  
  // 자전거 시설 정보 (Facility에 이미 정의되어 있으므로 제거)
  
  // 도서관 정보
  library?: {
    books: number;
    studyRooms: number;
    computerRooms: number;
  };
  
  // 공원 정보
  park?: {
    area: number;
    facilities: string[];
    playgrounds: number;
  };
  
  // 문화 이벤트 정보은 이미 Facility에 정의되어 있으므로 제거
  
  // 무더위 쉼터 정보
  coolingShelter?: {
    capacity: number;
    facilities: string[];
    airConditioned: boolean;
  };
  
  // 맛집 정보
  restaurant?: {
    cuisineType: string;
    priceRange: string;
    menu: string[];
  };
}

// ===== 확장된 ClusteredFacility 타입 =====
export interface ExtendedClusteredFacility extends ClusteredFacility {
  name?: string;
  totalCount?: number;
}

// ===== 관심사 카테고리 매핑 =====
export const INTEREST_CATEGORY_MAP: Record<FacilityCategory, string> = {
  sports: '체육시설',
  culture: '문화시설',
  restaurant: '맛집',
  library: '도서관',
  park: '공원',
  subway: '지하철',
  bike: '자전거',
  cooling_shelter: '무더위쉼터',
  cultural_event: '문화행사',
  cultural_reservation: '문화예약',
};

// ===== 타입 변환 유틸리티 =====

/**
 * 새로운 UserPreferences를 기존 형식으로 변환
 */
export function convertToLegacyPreferences(preferences: NewUserPreferences): LegacyUserPreferences {
  const legacy: LegacyUserPreferences = {
    sports: false,
    culture: false,
    restaurant: false,
    library: false,
    park: false,
    subway: false,
    bike: false,
    cooling_shelter: false,
    cultural_event: false,
    cultural_reservation: false,
  };

  preferences.preferredCategories?.forEach(category => {
    legacy[category] = true;
  });

  return legacy;
}

/**
 * 기존 UserPreferences를 새로운 형식으로 변환
 */
export function convertFromLegacyPreferences(legacy: LegacyUserPreferences): NewUserPreferences {
  const preferredCategories: FacilityCategory[] = [];
  
  Object.entries(legacy).forEach(([category, enabled]) => {
    if (enabled && category in legacy) {
      preferredCategories.push(category as FacilityCategory);
    }
  });

  return {
    preferredCategories,
    defaultRadius: 1,
    notifications: {
      newFacilities: true,
      congestionAlerts: true,
      eventNotifications: true,
      bookmarkUpdates: true,
    },
    mapSettings: {
      defaultZoom: 3,
      enableClustering: true,
      enableLocationTracking: true,
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      keyboardNavigation: false,
      screenReader: false,
    },
    language: 'ko',
    theme: 'system',
  };
}

// 따릉이 대여소 데이터 (서울시 API 형식)
export interface BikeStationData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  stationId: string;
  rackTotCnt: string; // 거치대 총 개수
  parkingBikeTotCnt: string; // 주차 자전거 총 건수
  shared: string; // 거치율
}
