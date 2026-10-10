/**
 * @fileoverview 타입 정의 통합 export
 * @description 모든 도메인별 타입을 통합하여 export하며, 기존 코드와의 호환성을 유지합니다.
 * @author Seoul Fit Team
 * @since 2.0.0
 */

// ===== 공통 타입 =====
export type {
  Position,
  KakaoLatLng,
  TimeSlot,
  CongestionLevel,
  Status,
  ApiResponse,
  Pagination,
  BaseFilter,
  AppError,
  LoadingState,
  BaseComponentProps,
} from './common';

// ===== 시설 관련 타입 =====
export { FACILITY_CATEGORIES } from './facility';

export type {
  FacilityCategory,
  BaseFacility,
  SportsFacilityInfo,
  CulturalFacilityInfo,
  CulturalEvent,
  Exhibition,
  RestaurantInfo,
  MenuItem,
  Facility,
  ClusteredFacility,
  FacilityFilter,
  FacilitySearchResult,
  FacilityDetailRequest,
  FacilityBookmark,
} from './facility';

// ===== 사용자 관련 타입 =====
export type {
  OAuthProvider,
  UserInterest,
  UserInterests, // 기존 호환성
  BaseUser,
  User,
  UserPreferences,
  UserLocation,
  UserActivity,
  UserStats,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UserSearchHistory,
  UserSession,
} from './user';

// ===== 지도 관련 타입 =====
export type {
  MapConfig,
  MapStatus,
  ZoomInfo,
  MapViewport,
  MapMarker,
  ClusterMarker,
  MapEventType,
  MapEvent,
  MapControls,
  MapLayer,
  HeatmapData,
  PolygonData,
  PolylineData,
  MapSearchResult,
  MapPerformanceMetrics,
  MapInteractionState,
} from './map';

// ===== API 관련 타입 =====
export { ApiErrorCode } from './api';

export type {
  OAuthVerifyRequest,
  OAuthVerifyResponse,
  OAuthUserCheckRequest,
  OAuthUserCheckResponse,
  OAuthLoginRequest,
  OAuthSignupRequest,
  AuthResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UpdateUserRequest,
  UpdateUserInterestsRequest,
  NearbyFacilitiesRequest,
  FacilitySearchRequest,
  FacilityListResponse,
  LocationDataRequest,
  LocationDataResponse,
  WeatherInfo,
  WeatherForecastRequest,
  DailyWeatherForecast,
  HourlyWeatherForecast,
  WeatherForecastResponse,
  CongestionInfo,
  SubwayStationInfo,
  BikeStationInfo,
  ApiErrorResponse,
  ApiRequestHeaders,
  ApiResponseMetadata,
} from './api';

// ===== UI 컴포넌트 타입 =====
export type {
  Size,
  ColorVariant,
  ButtonVariant,
  Alignment,
  Direction,
  Position as UIPosition, // 충돌 방지를 위해 별칭 사용
  ClickHandler,
  KeyboardHandler,
  FocusHandler,
  ChangeHandler,
  ButtonProps,
  InputProps,
  ModalProps,
  DropdownProps,
  ToastProps,
  MapContainerProps,
  FacilityCardProps,
  ClusterCardProps,
  SearchInputProps,
  FilterProps,
  HeaderProps,
  SidebarProps,
  BottomSheetProps,
  LoadingStateProps,
  EmptyStateProps,
  AnimationType,
  AnimationDirection,
  AnimationProps,
} from './ui';

// ===== 레거시 타입 (기존 호환성) =====
export {
  INTEREST_CATEGORY_MAP,
  convertToLegacyPreferences,
  convertFromLegacyPreferences,
} from './legacy';

export type {
  LegacyUserPreferences,
  CongestionData,
  WeatherData,
  SubwayArrivalData,
  POIData,
  NearbyPOIsResponse,
  Library,
  Park,
  Restaurant,
  TouristRestaurant,
  RestaurantDataStatistics,
  CoolingCenter,
  CulturalSpace,
  CulturalReservation,
  AirQuality,
  UserResult,
  Notification,
  NotificationPage,
  NotificationHistoryResult,
  ExtendedFacility,
  ExtendedClusteredFacility,
} from './legacy';

// ===== 기존 호환성을 위한 재export =====

// 기존 코드에서 사용하던 타입들을 그대로 유지
export type { BikeStationData } from './legacy';

// ===== 유틸리티 타입 =====

/**
 * 선택적 속성을 가진 타입을 생성합니다.
 * @template T - 기본 타입
 * @template K - 선택적으로 만들 키들
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 속성을 가진 타입을 생성합니다.
 * @template T - 기본 타입
 * @template K - 필수로 만들 키들
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * 깊은 부분 타입을 생성합니다.
 * @template T - 기본 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 깊은 필수 타입을 생성합니다.
 * @template T - 기본 타입
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 함수 타입에서 매개변수 타입을 추출합니다.
 * @template T - 함수 타입
 */
export type ExtractFunctionParams<T> = T extends (...args: infer P) => unknown ? P : never;

/**
 * 함수 타입에서 반환 타입을 추출합니다.
 * @template T - 함수 타입
 */
export type ExtractFunctionReturn<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * 배열 타입에서 요소 타입을 추출합니다.
 * @template T - 배열 타입
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Promise 타입에서 해결된 값의 타입을 추출합니다.
 * @template T - Promise 타입
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 객체의 값 타입들의 유니온을 생성합니다.
 * @template T - 객체 타입
 */
export type ValueOf<T> = T[keyof T];

/**
 * 문자열 리터럴 타입을 생성합니다.
 * @template T - 문자열 배열
 */
export type StringLiteral<T extends readonly string[]> = T[number];

// ===== 타입 가드 함수들 =====

/**
 * 값이 정의되어 있는지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 null이나 undefined가 아닌지 여부
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 값이 문자열인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 문자열인지 여부
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 값이 숫자인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 숫자인지 여부
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 값이 불린인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 불린인지 여부
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 값이 객체인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 객체인지 여부
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 값이 배열인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 배열인지 여부
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 값이 함수인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 함수인지 여부
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * 값이 유효한 위치 정보인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 유효한 Position인지 여부
 */
export function isValidPosition(value: unknown): value is import('./common').Position {
  return (
    isObject(value) &&
    isNumber(value.lat) &&
    isNumber(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

/**
 * 값이 유효한 시설 카테고리인지 확인합니다.
 * @param value - 확인할 값
 * @returns 값이 유효한 FacilityCategory인지 여부
 */
export function isValidFacilityCategory(
  value: unknown
): value is import('./facility').FacilityCategory {
  const FACILITY_CATEGORIES_VALUES = [
    'sports',
    'culture',
    'restaurant',
    'library',
    'park',
    'subway',
    'bike',
    'cooling_shelter',
    'cultural_event',
    'cultural_reservation',
  ];
  return isString(value) && FACILITY_CATEGORIES_VALUES.includes(value);
}
