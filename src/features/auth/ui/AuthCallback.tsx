/**
 * @fileoverview Auth Callback UI Component
 * @description OAuth 콜백 처리 UI 컴포넌트
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { kakaoLogin } from '@/shared/api/login';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useOAuthCallback } from '../model/oauth-flow';
import { LoadingStates } from './LoadingStates';

function AuthContent() {
  const searchParams = useSearchParams();
  const { status, errorMessage, handleCallback } = useOAuthCallback();

  useEffect(() => {
    const code = searchParams?.get('code');
    const error = searchParams?.get('error');
    const state = searchParams?.get('state');

    handleCallback({
      code: code || undefined,
      error: error || undefined,
      state: state || undefined,
    });
  }, [searchParams, handleCallback]);

  const retry = () => {
    trackEvent('login_started', { entry_point: 'auth_callback' });
    kakaoLogin();
  };

  if (status === 'loading') {
    return <LoadingStates.Loading />;
  }

  if (status === 'success') {
    return <LoadingStates.Success />;
  }

  if (status === 'error') {
    return <LoadingStates.Error message={errorMessage} onRetry={retry} />;
  }

  return null;
}

export const AuthCallback = () => {
  return (
    <Suspense fallback={<LoadingStates.Loading />}>
      <AuthContent />
    </Suspense>
  );
};
