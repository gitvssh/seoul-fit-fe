/**
 * @fileoverview API 관련 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { Pagination } from './common';
import type { User, UserInterest, OAuthProvider } from './user';
import type { Facility, FacilityFilter } from './facility';

// ===== 인증 API =====

// OAuth 인가 코드 검증 요청
export interface OAuthVerifyRequest {
  /** OAuth 제공자 */
  provider: OAuthProvider;
  /** 인가 코드 */
  authorizationCode: string;
  /** 리다이렉트 URI */
  redirectUri: string;
}

// OAuth 인가 코드 검증 응답
export interface OAuthVerifyResponse {
  /** 유효성 여부 */
  isValid: boolean;
  /** OAuth 사용자 ID */
  oauthUserId: string;
  /** 이메일 */
  email?: string;
  /** 닉네임 */
  nickname?: string;
  /** 프로필 이미지 URL */
  profileImageUrl?: string;
}

// OAuth 사용자 확인 요청
export interface OAuthUserCheckRequest {
  /** OAuth 제공자 */
  provider: OAuthProvider;
  /** OAuth 사용자 ID */
  oauthUserId: string;
}

// OAuth 사용자 확인 응답
export interface OAuthUserCheckResponse {
  /** 사용자 존재 여부 */
  exists: boolean;
  /** 사용자 정보 (존재하는 경우) */
  user?: User;
}

// OAuth 로그인 요청
export interface OAuthLoginRequest {
  /** OAuth 제공자 */
  provider: OAuthProvider;
  /** 인가 코드 */
  authorizationCode: string;
  /** 리다이렉트 URI */
  redirectUri: string;
}

// OAuth 회원가입 요청
export interface OAuthSignupRequest {
  /** OAuth 제공자 */
  provider: OAuthProvider;
  /** OAuth 사용자 ID */
  oauthUserId: string;
  /** 닉네임 */
  nickname: string;
  /** 이메일 */
  email: string;
  /** 프로필 이미지 URL */
  profileImageUrl?: string;
  /** 관심사 목록 */
  interests: UserInterest[];
}

// 인증 응답
export interface AuthResponse {
  /** 사용자 정보 */
  user: User;
  /** 액세스 토큰 */
  accessToken: string;
  /** 리프레시 토큰 */
  refreshToken: string;
  /** 토큰 만료 시간 (초) */
  expiresIn: number;
}

// 토큰 갱신 요청
export interface TokenRefreshRequest {
  /** 리프레시 토큰 */
  refreshToken: string;
}

// 토큰 갱신 응답
export interface TokenRefreshResponse {
  /** 새로운 액세스 토큰 */
  accessToken: string;
  /** 새로운 리프레시 토큰 */
  refreshToken: string;
  /** 토큰 만료 시간 (초) */
  expiresIn: number;
}

// ===== 사용자 API =====

// 사용자 정보 수정 요청
export interface UpdateUserRequest {
  /** 닉네임 */
  nickname?: string;
  /** 프로필 이미지 URL */
  profileImageUrl?: string;
}

// 사용자 관심사 수정 요청
export interface UpdateUserInterestsRequest {
  /** 관심사 목록 */
  interests: UserInterest[];
}

// ===== 시설 API =====

// 근처 시설 조회 요청
export interface NearbyFacilitiesRequest {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 검색 반경 (km) */
  radius?: number;
  /** 시설 카테고리 필터 */
  categories?: string[];
  /** 페이지 번호 */
  page?: number;
  /** 페이지 크기 */
  size?: number;
}

// 시설 검색 요청
export interface FacilitySearchRequest extends FacilityFilter {
  /** 페이지 번호 */
  page?: number;
  /** 페이지 크기 */
  size?: number;
  /** 정렬 기준 */
  sortBy?: 'distance' | 'rating' | 'name' | 'congestion';
  /** 정렬 순서 */
  sortOrder?: 'asc' | 'desc';
}

// 시설 목록 응답
export interface FacilityListResponse {
  /** 시설 목록 */
  facilities: Facility[];
  /** 페이지네이션 정보 */
  pagination: Pagination;
  /** 검색 메타데이터 */
  metadata: {
    /** 검색 소요 시간 (ms) */
    searchTime: number;
    /** 총 검색 결과 수 */
    totalResults: number;
    /** 적용된 필터 */
    appliedFilters: FacilityFilter;
  };
}

// ===== 위치 API =====

// 위치 기반 통합 데이터 요청
export interface LocationDataRequest {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 검색 반경 (km) */
  radius?: number;
  /** 포함할 데이터 타입 */
  include?: ('facilities' | 'weather' | 'congestion' | 'subway' | 'bike')[];
}

// 위치 기반 통합 데이터 응답
export interface LocationDataResponse {
  /** 시설 정보 */
  facilities?: Facility[];
  /** 날씨 정보 */
  weather?: WeatherInfo;
  /** 혼잡도 정보 */
  congestion?: CongestionInfo;
  /** 지하철역 정보 */
  subway?: SubwayStationInfo[];
  /** 자전거 대여소 정보 */
  bike?: BikeStationInfo[];
}

// ===== 날씨 API =====

// 날씨 정보
export interface WeatherInfo {
  /** 온도 (°C) */
  temperature: number;
  /** 습도 (%) */
  humidity: number;
  /** 풍속 (m/s) */
  windSpeed: number;
  /** 풍향 */
  windDirection: string;
  /** 날씨 상태 */
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';
  /** 날씨 설명 */
  description: string;
  /** 자외선 지수 */
  uvIndex: number;
  /** 가시거리 (km) */
  visibility: number;
  /** 측정 시간 */
  timestamp: string;
}

// 날씨 예보 요청
export interface WeatherForecastRequest {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 예보 일수 */
  days?: number;
}

// 일별 날씨 예보
export interface DailyWeatherForecast {
  /** 날짜 */
  date: string;
  /** 최고 온도 */
  maxTemp: number;
  /** 최저 온도 */
  minTemp: number;
  /** 날씨 상태 */
  condition: string;
  /** 강수 확률 (%) */
  precipitationChance: number;
  /** 날씨 아이콘 */
  iconUrl?: string;
}

// 시간별 날씨 예보
export interface HourlyWeatherForecast {
  /** 시간 */
  hour: string;
  /** 온도 */
  temperature: number;
  /** 날씨 상태 */
  condition: string;
  /** 강수 확률 (%) */
  precipitationChance: number;
  /** 날씨 아이콘 */
  iconUrl?: string;
}

// 날씨 예보 응답
export interface WeatherForecastResponse {
  /** 일별 예보 */
  daily: DailyWeatherForecast[];
  /** 시간별 예보 */
  hourly: HourlyWeatherForecast[];
}

// ===== 혼잡도 API =====

// 혼잡도 정보
export interface CongestionInfo {
  /** 시설 ID */
  facilityId: string;
  /** 혼잡도 레벨 */
  level: 'low' | 'medium' | 'high';
  /** 현재 이용자 수 */
  currentUsers: number;
  /** 최대 수용 인원 */
  maxCapacity: number;
  /** 이용률 (%) */
  utilizationRate: number;
  /** 측정 시간 */
  timestamp: string;
  /** 예상 대기 시간 (분) */
  estimatedWaitTime?: number;
}

// ===== 교통 API =====

// 지하철역 정보
export interface SubwayStationInfo {
  /** 역 ID */
  id: string;
  /** 역명 */
  name: string;
  /** 호선 */
  line: string;
  /** 위치 */
  position: {
    lat: number;
    lng: number;
  };
  /** 거리 (km) */
  distance: number;
  /** 역 시설 */
  facilities: string[];
  /** 출구 정보 */
  exits?: {
    number: string;
    description: string;
  }[];
}

// 자전거 대여소 정보
export interface BikeStationInfo {
  /** 대여소 ID */
  id: string;
  /** 대여소명 */
  name: string;
  /** 위치 */
  position: {
    lat: number;
    lng: number;
  };
  /** 사용 가능한 자전거 수 */
  availableBikes: number;
  /** 전체 거치대 수 */
  totalSlots: number;
  /** 거리 (km) */
  distance: number;
  /** 운영 상태 */
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  /** 마지막 업데이트 시간 */
  lastUpdated: string;
}

// ===== 에러 응답 =====

// API 에러 코드
export enum ApiErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  INVALID_TOKEN = 'AUTH_003',
  OAUTH_ERROR = 'AUTH_004',

  // 사용자 관련
  USER_NOT_FOUND = 'USER_001',
  DUPLICATE_EMAIL = 'USER_002',
  INVALID_USER_DATA = 'USER_003',

  // 시설 관련
  FACILITY_NOT_FOUND = 'FACILITY_001',
  INVALID_LOCATION = 'FACILITY_002',
  SEARCH_ERROR = 'FACILITY_003',

  // 시스템 관련
  INTERNAL_ERROR = 'SYS_001',
  RATE_LIMIT_EXCEEDED = 'SYS_002',
  SERVICE_UNAVAILABLE = 'SYS_003',
  INVALID_REQUEST = 'SYS_004',

  // 외부 API 관련
  EXTERNAL_API_ERROR = 'EXT_001',
  KAKAO_API_ERROR = 'EXT_002',
  SEOUL_API_ERROR = 'EXT_003',
}

// API 에러 응답
export interface ApiErrorResponse {
  /** 성공 여부 (항상 false) */
  success: false;
  /** 에러 정보 */
  error: {
    /** 에러 코드 */
    code: ApiErrorCode;
    /** 에러 메시지 */
    message: string;
    /** 에러 세부사항 */
    details?: {
      /** 필드명 */
      field?: string;
      /** 입력값 */
      value?: unknown;
      /** 제약조건 */
      constraint?: string;
    };
  };
  /** 응답 시간 */
  timestamp: string;
}

// ===== 공통 API 타입 =====

// API 요청 헤더
export interface ApiRequestHeaders {
  /** 인증 토큰 */
  Authorization?: string;
  /** 콘텐츠 타입 */
  'Content-Type': string;
  /** 수락 타입 */
  Accept: string;
  /** 사용자 에이전트 */
  'User-Agent'?: string;
  /** 요청 ID (추적용) */
  'X-Request-ID'?: string;
}

// API 응답 메타데이터
export interface ApiResponseMetadata {
  /** 요청 ID */
  requestId: string;
  /** 처리 시간 (ms) */
  processingTime: number;
  /** API 버전 */
  version: string;
  /** 서버 시간 */
  serverTime: string;
}
