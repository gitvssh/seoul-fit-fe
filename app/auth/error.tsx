'use client';

import { useRouter } from 'next/navigation';
import { env } from '@/config/environment';

export default function AuthError() {
  const router = useRouter();

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <div className='text-center bg-white p-8 rounded-lg shadow-md max-w-md'>
        <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
          <svg
            className='w-8 h-8 text-red-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>

        <h1 className='text-2xl font-bold text-red-600 mb-4'>로그인 실패</h1>
        <p className='text-gray-600 mb-6'>
          로그인 중 오류가 발생했습니다.
          <br />
          다시 시도해주세요.
        </p>

        <div className='space-y-3'>
          <button
            onClick={() => router.push('/')}
            className='w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
          >
            메인으로 돌아가기
          </button>

          <button
            onClick={() =>
              (window.location.href = `${env.publicBackendUrl}/oauth2/authorization/kakao`)
            }
            className='w-full px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors'
          >
            다시 로그인 시도
          </button>
        </div>
      </div>
    </div>
  );
}
