import { env } from '@/config/environment';

const OAUTH_STATE_KEY = 'seoul-fit.oauth.state';

const createOAuthState = (): string => {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const kakaoLogin = () => {
  const state = createOAuthState();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.kakaoClientId,
    redirect_uri: env.kakaoRedirectUri,
    state,
  });
  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};

export const consumeOAuthState = (receivedState?: string): boolean => {
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  return Boolean(
    expectedState
      && receivedState
      && expectedState.length === receivedState.length
      && expectedState === receivedState
  );
};

export const kakaoLogout = async () => {
  const accessToken = localStorage.getItem('access_token');

  if (!accessToken) {
    console.warn('인증 토큰이 없습니다. 로컬 정리만 수행합니다.');
    // 토큰이 없어도 로컬 스토리지는 정리
    localStorage.removeItem('kakao_login_attempt');
    localStorage.removeItem('kakao_login_type');
    localStorage.removeItem('access_token');
    return;
  }

  try {
    const BACKEND_URL = env.publicBackendUrl;
    const response = await fetch(`${BACKEND_URL}/api/auth/oauth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // 백엔드 로그아웃 실패해도 로컬 정리는 수행
    if (!response.ok) {
      console.warn('백엔드 로그아웃 요청 실패:', response.status);
    } else {
      const result = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('로그아웃 성공');
      }
    }
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
  } finally {
    // 항상 로컬 스토리지 정리
    localStorage.removeItem('kakao_login_attempt');
    localStorage.removeItem('kakao_login_type');
    localStorage.removeItem('access_token');
  }
};
