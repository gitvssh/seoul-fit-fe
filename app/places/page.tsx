import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_PLACE_CATEGORIES } from '@/shared/lib/seo/public-places';

export const metadata: Metadata = {
  title: '서울 장소 둘러보기',
  description: '서울의 공원, 도서관, 맛집, 문화행사와 공공시설 정보를 카테고리별로 둘러보세요.',
  alternates: { canonical: '/places' },
};

export default function PublicPlacesPage() {
  return (
    <main className='min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6'>
      <div className='mx-auto max-w-5xl'>
        <Link href='/' className='text-sm font-medium text-blue-700 hover:underline'>
          ← 지도 보기
        </Link>
        <h1 className='mt-6 text-3xl font-bold tracking-tight sm:text-4xl'>서울 장소 둘러보기</h1>
        <p className='mt-3 max-w-2xl text-slate-600'>
          서울시 공공데이터를 바탕으로 공원, 도서관, 맛집과 문화 정보를 찾아보세요.
        </p>
        <section
          className='mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          aria-label='장소 카테고리'
        >
          {PUBLIC_PLACE_CATEGORIES.map(category => (
            <Link
              key={category.slug}
              href={`/places/${category.slug}`}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow'
            >
              <h2 className='text-lg font-semibold'>{category.label}</h2>
              <p className='mt-2 text-sm leading-6 text-slate-600'>{category.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
