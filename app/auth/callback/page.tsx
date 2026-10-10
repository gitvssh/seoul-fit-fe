/**
 * OAuth 콜백 처리 페이지 (단순 래퍼)
 *
 * 역할: Next.js App Router 진입점
 * 실제 로직: src/features/auth/ui/AuthCallback.tsx 에서 처리
 */

import { AuthCallback } from '@/features/auth';

export default function AuthCallbackPage() {
  return <AuthCallback />;
}
