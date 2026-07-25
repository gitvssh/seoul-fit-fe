import { kakaoLogin, kakaoLogout } from '@/shared/api/login';
import { useCallback } from 'react';
import { useAuthStore } from '@/shared/model/authStore';
import { trackEvent } from '@/shared/lib/analytics/analytics';

export function useKakaoLogin() {
  const { clearAuth } = useAuthStore();

  const login = useCallback(() => {
    trackEvent('login_started', { entry_point: 'sidebar' });
    kakaoLogin();
  }, []);

  const logout = useCallback(async () => {
    try {
      // 백엔드 로그아웃 처리 (실패해도 계속 진행)
      await kakaoLogout();
    } catch (error) {
      console.error('백엔드 로그아웃 중 오류:', error);
    } finally {
      // 항상 로컬 인증 상태는 초기화
      clearAuth();
    }
  }, [clearAuth]);

  return { login, logout };
}
