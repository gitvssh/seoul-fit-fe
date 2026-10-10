/**
 * @fileoverview Auth Loading States UI
 * @description 인증 과정의 다양한 상태 UI 컴포넌트들
 */

interface LoadingProps {
  message?: string;
}

interface SuccessProps {
  message: string;
}

interface ErrorProps {
  message: string;
}

export const LoadingStates = {
  Loading: ({ message = '로그인 처리 중...' }: LoadingProps) => (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4' />
        <p className='text-lg text-gray-600'>{message}</p>
      </div>
    </div>
  ),

  Success: ({ message }: SuccessProps) => (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='text-6xl mb-4'>✅</div>
        <h2 className='text-2xl font-bold text-green-600 mb-2'>{message}</h2>
        <p className='text-gray-600'>메인 페이지로 이동합니다...</p>
      </div>
    </div>
  ),

  Error: ({ message }: ErrorProps) => (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='text-6xl mb-4'>❌</div>
        <h2 className='text-2xl font-bold text-red-600 mb-2'>오류 발생</h2>
        <p className='text-gray-600 mb-4'>{message}</p>
        <p className='text-sm text-gray-500'>잠시 후 메인 페이지로 이동합니다...</p>
      </div>
    </div>
  ),
};
