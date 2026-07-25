/**
 * @fileoverview Auth Feature Types
 * @description 인증 기능 타입 정의
 */

// 사용자 정보 인터페이스
export interface UserInfo {
  id?: number;
  provider: string;
  oauthUserId: string;
  nickname: string;
  email: string;
  profileImageUrl: string;
}

// 회원가입 데이터
export interface SignupData extends UserInfo {
  interests: string[];
}

// OAuth 인증 상태
export type AuthStatus = 
  | 'loading'
  | 'success' 
  | 'error' 
  | 'need_signup' 
  | 'success_signup';

// OAuth 콜백 파라미터
export interface OAuthCallbackParams {
  code?: string;
  error?: string;
  state?: string;
}

// 인증 API 응답
export interface AuthResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken?: string;
}

// 관심사 옵션
export interface InterestOption {
  value: string;
  category: string;
}
