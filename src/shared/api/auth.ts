// services/auth.ts - Complete authentication service implementation
import { AuthResponse, OAuthProvider, UserInterests } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

export interface OAuthLoginRequest {
  provider: OAuthProvider;
  authorizationCode: string;
  redirectUri: string;
}

export interface OAuthSignupRequest {
  provider: OAuthProvider;
  oauthUserId: string;
  nickname: string;
  email: string;
  profileImageUrl?: string;
  interests: UserInterests[];
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * OAuth 인가코드 검증
 */
export async function verifyOAuthCode(request: OAuthLoginRequest) {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/authorizecheck`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`OAuth 인가코드 검증 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 사용자 존재 여부 확인
 */
export async function checkOAuthUser(provider: OAuthProvider, oauthUserId: string) {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      oauthUserId,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth 사용자 확인 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 로그인
 */
export async function oauthLogin(request: OAuthLoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`OAuth 로그인 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 회원가입
 */
export async function oauthSignup(request: OAuthSignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`OAuth 회원가입 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 토큰 갱신
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/refresh?refreshToken=${refreshToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`토큰 갱신 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 이메일 중복 확인
 */
export async function checkEmailDuplicate(email: string): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`이메일 중복 확인 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 인증 URL 생성
 */
export async function getOAuthUrl(
  provider: OAuthProvider,
  redirectUri: string,
  scope?: string,
  state?: string
) {
  const params = new URLSearchParams({
    redirectUri,
    ...(scope && { scope }),
    ...(state && { state }),
  });

  const response = await fetch(`${BASE_URL}/api/auth/oauth/url/${provider}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OAuth URL 생성 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 로그아웃
 */
export async function oauthLogout(accessToken: string) {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OAuth 로그아웃 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * OAuth 연결 해제
 */
export async function unlinkOAuth(accessToken: string) {
  const response = await fetch(`${BASE_URL}/api/auth/oauth/unlink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OAuth 연결 해제 실패: ${response.status}`);
  }

  return response.json();
}
