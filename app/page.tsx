import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MainApp } from '@/src/widgets/main-app';

export const metadata: Metadata = {
  title: '서울 공공시설 지도',
  description: '서울의 공원, 도서관, 문화행사와 공공시설을 지도에서 탐색하세요.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main
          className='flex min-h-screen items-center justify-center bg-slate-50 text-slate-700'
          aria-busy='true'
        >
          서울 공공시설 지도를 준비하고 있습니다.
        </main>
      }
    >
      <MainApp />
    </Suspense>
  );
}
