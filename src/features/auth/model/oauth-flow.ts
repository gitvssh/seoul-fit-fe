/**
 * @fileoverview Auth OAuth Flow Logic
 * @description OAuth 인증 플로우 상태 관리 로직
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/model/authStore';
import { env } from '@/config/environment';
import type { 
  AuthStatus, 
  UserInfo, 
  OAuthCallbackParams, 
  AuthResponse 
} from './types';

const BACKEND_URL = env.publicBackendUrl;
const KAKAO_CLIENT_ID = env.kakaoClientId;
const REDIRECT_URI = env.kakaoRedirectUri;

/**
 * OAuth 콜백 처리 훅
 */
export const useOAuthCallback = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 에러 처리
  const handleError = useCallback((errorMsg: string, shouldRedirect = true) => {
    console.error('Authentication error:', errorMsg);
    setStatus('error');
    setErrorMessage(errorMsg);

    if (shouldRedirect) {
      setTimeout(() => router.push('/'), 3000);
    }
  }, [router]);

  // 카카오 재로그인 리다이렉트
  const redirectToKakaoLogin = useCallback(() => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    
    localStorage.setItem('kakao_login_attempt', 'true');
    localStorage.setItem('kakao_login_type', 'existing_user');
    
    window.location.href = kakaoAuthUrl;
  }, []);

  // OAuth 콜백 처리
  const handleCallback = useCallback(async (params: OAuthCallbackParams) => {
    try {
      const { code, error } = params;

      if (error) {
        handleError(`카카오 로그인 오류: ${error}`);
        return;
      }

      if (!code) {
        handleError('인가 코드가 없습니다. 다시 로그인 해주세요.');
        return;
      }

      // 기존 사용자 재로그인 처리
      const isLoginAttempt = localStorage.getItem('kakao_login_attempt');
      const loginType = localStorage.getItem('kakao_login_type');

      if (isLoginAttempt && loginType === 'existing_user') {
        localStorage.removeItem('kakao_login_attempt');
        localStorage.removeItem('kakao_login_type');

        const loginResponse = await fetch(`${BACKEND_URL}/api/auth/oauth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'KAKAO',
            authorizationCode: code,
            redirectUri: REDIRECT_URI,
          }),
        });

        if (!loginResponse.ok) {
          handleError('로그인에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        const loginData: AuthResponse = await loginResponse.json();
        
        // UserInfo를 User 타입으로 변환
        const user = {
          id: loginData.user.id || 0,
          email: loginData.user.email,
          nickname: loginData.user.nickname,
          status: 'active',
          oauthProvider: loginData.user.provider,
          oauthUserId: loginData.user.oauthUserId,
          profileImageUrl: loginData.user.profileImageUrl,
          interests: []
        };
        
        setAuth(user, loginData.accessToken);
        localStorage.setItem('access_token', loginData.accessToken);
        setStatus('success');
        setTimeout(() => router.push('/'), 1500);
        return;
      }

      // 신규 사용자 가입 프로세스
      const tokenResponse = await fetch(`${BACKEND_URL}/api/auth/oauth/authorizecheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'KAKAO',
          authorizationCode: code,
          redirectUri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        handleError('카카오 토큰 요청 실패');
        return;
      }

      const tokenData = await tokenResponse.json();

      // 사용자 존재 여부 확인
      const checkResponse = await fetch(`${BACKEND_URL}/api/auth/oauth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'KAKAO',
          authorizationCode: code,
          redirectUri: REDIRECT_URI,
          oauthUserId: tokenData.oauthUserId,
        }),
      });

      if (!checkResponse.ok) {
        handleError('사용자 존재 여부 확인 실패');
        return;
      }

      const checkResult = await checkResponse.json();

      if (checkResult.exists) {
        redirectToKakaoLogin();
      } else {
        setUserInfo({
          provider: 'KAKAO',
          oauthUserId: tokenData.oauthUserId,
          nickname: tokenData.nickname,
          email: tokenData.email,
          profileImageUrl: tokenData.profileImageUrl,
        });
        setStatus('need_signup');
      }

    } catch (error) {
      console.error('Authentication failed:', error);
      handleError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }, [setAuth, router, handleError, redirectToKakaoLogin]);

  // 회원가입 처리
  const handleSignUp = useCallback(async (interests: string[]) => {
    if (!userInfo) return;

    try {
      setStatus('loading');

      const signUpResponse = await fetch(`${BACKEND_URL}/api/auth/oauth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: userInfo.provider,
          oauthUserId: userInfo.oauthUserId,
          nickname: userInfo.nickname || `tester_${userInfo.oauthUserId}`,
          email: userInfo.email || `${userInfo.oauthUserId}@test.com`,
          profileImageUrl: userInfo.profileImageUrl || '',
          interests,
        }),
      });

      if (!signUpResponse.ok) {
        // 409 Conflict는 이미 가입된 사용자 (탈퇴 후 재가입 시도 포함)
        if (signUpResponse.status === 409) {
          if (process.env.NODE_ENV === 'development') {
            console.log('이미 가입된 사용자, 로그인 시도...');
          }
          // 로그인으로 전환
          const loginResponse = await fetch(`${BACKEND_URL}/api/auth/oauth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: userInfo.provider,
              authorizationCode: userInfo.oauthUserId,
              redirectUri: REDIRECT_URI,
            }),
          });

          if (!loginResponse.ok) {
            handleError('로그인 실패');
            return;
          }

          const loginResult = await loginResponse.json();
          
          // 로그인 성공 처리
          const user = {
            id: loginResult.user.id || 0,
            email: loginResult.user.email,
            nickname: loginResult.user.nickname,
            status: loginResult.user.status || 'active',
            oauthProvider: userInfo.provider,
            oauthUserId: userInfo.oauthUserId,
            profileImageUrl: loginResult.user.profileImageUrl,
            interests: loginResult.user.interests || [],
          };

          setAuth(user, loginResult.token.accessToken, loginResult.token.refreshToken);
          localStorage.setItem('access_token', loginResult.token.accessToken);
          
          setStatus('success');
          router.push('/');
          return;
        }
        
        handleError('회원가입 실패');
        return;
      }

      const signUpResult = await signUpResponse.json();
      
      // UserInfo를 User 타입으로 변환
      const user = {
        id: signUpResult.user.id || 0,
        email: signUpResult.user.email,
        nickname: signUpResult.user.nickname,
        status: signUpResult.user.status || 'active',
        oauthProvider: signUpResult.user.provider || signUpResult.user.oauthProvider,
        oauthUserId: signUpResult.user.oauthUserId,
        profileImageUrl: signUpResult.user.profileImageUrl,
        interests: signUpResult.user.interests || interests.map((interest, index) => ({
          id: index,
          interestCategory: interest
        }))
      };
      
      setAuth(user, signUpResult.accessToken);
      localStorage.setItem('access_token', signUpResult.accessToken);
      setStatus('success_signup');
      setTimeout(() => router.push('/'), 1500);

    } catch (error) {
      console.error('Sign up failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    }
  }, [userInfo, setAuth, router, handleError]);

  return {
    status,
    errorMessage,
    userInfo,
    handleCallback,
    handleSignUp,
  };
};
