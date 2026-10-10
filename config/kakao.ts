/**
 * 카카오 API 설정
 */

import { env } from '@/config/environment';

// 카카오맵 API 키
export const KAKAO_MAP_API_KEY = env.kakaoMapApiKey;

// 카카오 로그인 API 키
export const KAKAO_LOGIN_API_KEY = env.kakaoClientId;

// 카카오 API 설정
export const kakaoConfig = {
  map: {
    apiKey: KAKAO_MAP_API_KEY,
    defaultCenter: { lat: 37.5665, lng: 126.978 },
    defaultLevel: 3,
  },
  login: {
    apiKey: KAKAO_LOGIN_API_KEY,
    redirectUri: env.kakaoRedirectUri,
  },
};

// 디버깅용 로그 (개발 환경에서만)
if (typeof window !== 'undefined' && env.isDevelopment) {
  console.log('[KakaoConfig] 환경 변수 상태:', {
    mapApiKey: env.kakaoMapApiKey ? '✅ 설정됨' : '❌ 누락',
    loginApiKey: env.kakaoClientId ? '✅ 설정됨' : '❌ 누락',
    redirectUri: env.kakaoRedirectUri ? '✅ 설정됨' : '❌ 누락',
  });
  console.log('[KakaoConfig] 설정 완료');
}
