/**
 * @fileoverview 공통 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

// 기본 위치 정보
export interface Position {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
}

// 카카오맵 위치 타입 (기존 호환성 유지)
export interface KakaoLatLng {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
}

// 시간 슬롯
export interface TimeSlot {
  /** 시작 시간 */
  startTime: string;
  /** 종료 시간 */
  endTime: string;
  /** 예약 가능 여부 */
  available: boolean;
  /** 예약 URL */
  reservationUrl?: string;
}

// 혼잡도 레벨
export type CongestionLevel = 'low' | 'medium' | 'high';

// 상태 타입
export type Status = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SUSPENDED';

// API 응답 기본 구조
export interface ApiResponse<T> {
  /** 성공 여부 */
  success: boolean;
  /** 응답 데이터 */
  data?: T;
  /** 에러 정보 */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** 응답 시간 */
  timestamp: string;
}

// 페이지네이션
export interface Pagination {
  /** 현재 페이지 */
  page: number;
  /** 페이지 크기 */
  size: number;
  /** 전체 개수 */
  total: number;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
}

// 검색 필터 기본 구조
export interface BaseFilter {
  /** 검색 쿼리 */
  query?: string;
  /** 위치 */
  location?: Position;
  /** 검색 반경 (km) */
  radius?: number;
}

// 에러 타입
export interface AppError {
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
  /** 에러 세부사항 */
  details?: unknown;
  /** 에러 발생 시간 */
  timestamp: Date;
}

// 로딩 상태
export interface LoadingState {
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 정보 */
  error: string | null;
  /** 성공 여부 */
  success: boolean;
}

// 컴포넌트 기본 Props
export interface BaseComponentProps {
  /** CSS 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 라벨 */
  'aria-label'?: string;
}
