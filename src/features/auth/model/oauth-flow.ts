/**
 * @fileoverview 카카오 Authorization Code 기반 인증 흐름
 */

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { env } from '@/config/environment';
import { consumeOAuthState } from '@/shared/api/login';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useAuthStore } from '@/shared/model/authStore';
import type { AuthResponse, AuthStatus, OAuthCallbackParams } from './types';

interface UserProfile {
  id: number;
  nickname?: string;
  profileImageUrl?: string;
  status?: string;
  interests?: string[];
}

const toStoredUser = (auth: AuthResponse, profile?: UserProfile) => ({
  id: profile?.id ?? auth.user.id ?? 0,
  email: '',
  nickname: profile?.nickname ?? auth.user.nickname ?? '서울핏 사용자',
  status: profile?.status?.toLowerCase() ?? 'active',
  oauthProvider: 'KAKAO',
  oauthUserId: '',
  profileImageUrl: profile?.profileImageUrl ?? '',
  interests: (profile?.interests ?? []).map((interestCategory, id) => ({
    id,
    interestCategory,
  })),
});

export const useOAuthCallback = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = useCallback(
    (message: string) => {
      setStatus('error');
      setErrorMessage(message);
      trackEvent('login_failed', { reason_code: 'oauth_callback' });
      window.setTimeout(() => router.push('/'), 3000);
    },
    [router]
  );

  const handleCallback = useCallback(
    async ({ code, error, state }: OAuthCallbackParams) => {
      if (error) {
        handleError('카카오 로그인이 취소되었거나 실패했습니다.');
        return;
      }
      if (!code) {
        handleError('인가 코드가 없습니다. 다시 로그인해 주세요.');
        return;
      }
      if (!consumeOAuthState(state)) {
        handleError('로그인 요청을 확인할 수 없습니다. 처음부터 다시 시도해 주세요.');
        return;
      }

      try {
        const response = await fetch(
          env.createPublicBackendEndpoint('/api/auth/oauth/login'),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'KAKAO',
              authorizationCode: code,
              redirectUri: env.kakaoRedirectUri,
            }),
          }
        );

        if (!response.ok) {
          handleError('카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
          return;
        }

        const auth: AuthResponse = await response.json();
        const profileResponse = await fetch(
          env.createPublicBackendEndpoint('/api/users/me'),
          {
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const profile = profileResponse.ok
          ? await profileResponse.json() as UserProfile
          : undefined;

        setAuth(toStoredUser(auth, profile), auth.accessToken, auth.refreshToken);
        setStatus('success');
        trackEvent('login_completed', { result: 'authorization_code' });
        window.setTimeout(() => router.push('/'), 1200);
      } catch {
        handleError('로그인 처리 중 오류가 발생했습니다.');
      }
    },
    [handleError, router, setAuth]
  );

  return {
    status,
    errorMessage,
    userInfo: null,
    handleCallback,
    handleSignUp: async () => undefined,
  };
};
