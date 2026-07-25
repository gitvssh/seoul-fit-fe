/**
 * @fileoverview Auth Callback UI Component
 * @description OAuth 콜백 처리 UI 컴포넌트
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

  if (status === 'loading') {
    return <LoadingStates.Loading />;
  }

  if (status === 'success') {
    return <LoadingStates.Success message="로그인 성공!" />;
  }

  if (status === 'error') {
    return <LoadingStates.Error message={errorMessage} />;
  }

  return null;
}

export const AuthCallback = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
};
