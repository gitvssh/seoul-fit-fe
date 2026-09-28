import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomeLanding } from '@/src/widgets/home-landing';
import { MainApp } from '@/src/widgets/main-app';
import { HOME_STRUCTURED_DATA, serializeJsonLd } from '@/src/shared/lib/seo/structured-data';

export const metadata: Metadata = {
  title: '서울 공공시설 지도',
  description: '서울의 공원, 도서관, 문화행사와 공공시설을 지도에서 탐색하세요.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(HOME_STRUCTURED_DATA) }}
      />
      <Suspense fallback={<HomeLanding />}>
        <MainApp />
      </Suspense>
    </>
  );
}
