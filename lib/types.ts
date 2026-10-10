/**
 * @fileoverview 메인 타입 정의 파일 (기존 호환성 유지)
 * @description 새로운 모듈화된 타입 시스템으로 마이그레이션 중입니다.
 * @deprecated 새로운 코드에서는 lib/types/index.ts를 사용하세요.
 * @author Seoul Fit Team
 * @since 1.0.0
 * @version 2.0.0 - 모듈화된 타입 시스템으로 전환
 */

// 새로운 모듈화된 타입 시스템에서 모든 타입을 re-export
// 기존 코드의 호환성을 유지하면서 점진적 마이그레이션을 지원합니다.
export * from './types/index';

// 기존 코드와의 완전한 호환성을 위해 명시적으로 re-export
export {
  FACILITY_CATEGORIES,
  type FacilityCategory,
  type Facility,
  type ClusteredFacility,
  type User,
  type UserPreferences,
  type UserInterests,
  type OAuthProvider,
  type Position,
  type KakaoLatLng,
  type MapStatus,
  type LoadingState,
} from './types/index';
