/**
 * @fileoverview 사용자 관련 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { FacilityCategory } from './facility';
import type { Status } from './common';

// OAuth 제공자
export type OAuthProvider = 'kakao' | 'google' | 'naver' | 'apple';

// 사용자 관심사
export interface UserInterest {
  /** 관심사 ID */
  id: number;
  /** 관심 카테고리 */
  interestCategory: FacilityCategory;
}

// 사용자 관심사 (기존 호환성)
export type UserInterests = UserInterest;

// 사용자 기본 정보
export interface BaseUser {
  /** 사용자 ID */
  id: number;
  /** 이메일 */
  email: string;
  /** 닉네임 */
  nickname: string;
  /** 계정 상태 */
  status: Status;
  /** OAuth 제공자 */
  oauthProvider: OAuthProvider;
  /** OAuth 사용자 ID */
  oauthUserId: string;
  /** 프로필 이미지 URL */
  profileImageUrl: string;
  /** 계정 생성일 */
  createdAt: string;
  /** 마지막 업데이트일 */
  updatedAt: string;
}

// 사용자 정보 (관심사 포함)
export interface User extends BaseUser {
  /** 사용자 관심사 목록 */
  interests: UserInterest[];
  /** 마지막 위치 정보 */
  lastLocation?: UserLocation;
}

// 사용자 선호도 설정
export interface UserPreferences {
  /** 사용자 ID */
  userId?: number;
  /** 선호하는 시설 카테고리 (기존 배열 형식) */
  preferredCategories?: FacilityCategory[];
  /** 기본 검색 반경 (km) */
  defaultRadius?: number;

  // 카테고리별 선호도 (UI에서 사용하는 형식)
  sports?: boolean;
  culture?: boolean;
  restaurant?: boolean;
  library?: boolean;
  park?: boolean;
  subway?: boolean;
  bike?: boolean;
  cooling_shelter?: boolean;
  cultural_event?: boolean;
  cultural_reservation?: boolean;
  /** 알림 설정 */
  notifications?: {
    /** 새로운 시설 알림 */
    newFacilities: boolean;
    /** 혼잡도 알림 */
    congestionAlerts: boolean;
    /** 이벤트 알림 */
    eventNotifications: boolean;
    /** 즐겨찾기 시설 업데이트 알림 */
    bookmarkUpdates: boolean;
  };
  /** 지도 설정 */
  mapSettings?: {
    /** 기본 줌 레벨 */
    defaultZoom: number;
    /** 클러스터링 사용 여부 */
    enableClustering: boolean;
    /** 실시간 위치 추적 */
    enableLocationTracking: boolean;
  };
  /** 접근성 설정 */
  accessibility?: {
    /** 고대비 모드 */
    highContrast: boolean;
    /** 큰 글씨 */
    largeText: boolean;
    /** 키보드 네비게이션 */
    keyboardNavigation: boolean;
    /** 스크린 리더 지원 */
    screenReader: boolean;
  };
  /** 언어 설정 */
  language: 'ko' | 'en' | 'ja';
  /** 테마 설정 */
  theme: 'light' | 'dark' | 'system';
}

// 사용자 위치 정보
export interface UserLocation {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 정확도 (미터) */
  accuracy?: number;
  /** 위치 업데이트 시간 */
  timestamp: number;
  /** 주소 (역지오코딩 결과) */
  address?: string;
}

// 사용자 활동 로그
export interface UserActivity {
  /** 활동 ID */
  id: string;
  /** 사용자 ID */
  userId: number;
  /** 활동 유형 */
  type: 'search' | 'view' | 'bookmark' | 'visit' | 'review';
  /** 대상 시설 ID */
  facilityId?: string;
  /** 활동 세부사항 */
  details: Record<string, unknown>;
  /** 활동 시간 */
  timestamp: string;
}

// 사용자 통계
export interface UserStats {
  /** 총 검색 횟수 */
  totalSearches: number;
  /** 즐겨찾기 개수 */
  bookmarkCount: number;
  /** 방문한 시설 수 */
  visitedFacilities: number;
  /** 작성한 리뷰 수 */
  reviewCount: number;
  /** 가장 많이 검색한 카테고리 */
  topCategory: FacilityCategory;
  /** 평균 검색 반경 */
  averageSearchRadius: number;
}

// 사용자 프로필 업데이트 요청
export interface UpdateUserProfileRequest {
  /** 닉네임 */
  nickname?: string;
  /** 프로필 이미지 URL */
  profileImageUrl?: string;
  /** 관심사 목록 */
  interests?: UserInterest[];
}

// 사용자 선호도 업데이트 요청
export interface UpdateUserPreferencesRequest {
  /** 선호 카테고리 */
  preferredCategories?: FacilityCategory[];
  /** 기본 검색 반경 */
  defaultRadius?: number;
  /** 알림 설정 */
  notifications?: Partial<UserPreferences['notifications']>;
  /** 지도 설정 */
  mapSettings?: Partial<UserPreferences['mapSettings']>;
  /** 접근성 설정 */
  accessibility?: Partial<UserPreferences['accessibility']>;
  /** 언어 설정 */
  language?: UserPreferences['language'];
  /** 테마 설정 */
  theme?: UserPreferences['theme'];
}

// 사용자 검색 히스토리
export interface UserSearchHistory {
  /** 검색 ID */
  id: string;
  /** 사용자 ID */
  userId: number;
  /** 검색 쿼리 */
  query: string;
  /** 검색 위치 */
  location: {
    lat: number;
    lng: number;
  };
  /** 검색 필터 */
  filters: {
    categories: FacilityCategory[];
    radius: number;
  };
  /** 검색 시간 */
  timestamp: string;
  /** 검색 결과 수 */
  resultCount: number;
}

// 사용자 세션 정보
export interface UserSession {
  /** 세션 ID */
  sessionId: string;
  /** 사용자 ID */
  userId: number;
  /** 세션 시작 시간 */
  startTime: string;
  /** 마지막 활동 시간 */
  lastActivity: string;
  /** 사용자 에이전트 */
  userAgent: string;
  /** IP 주소 */
  ipAddress: string;
  /** 세션 만료 시간 */
  expiresAt: string;
}
