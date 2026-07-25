import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPublicPlaceCategory,
  getPublicPlacePage,
  getPublicPlacePath,
  isPublicPlaceCategory,
} from '@/shared/lib/seo/public-places';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const placeCategory = getPublicPlaceCategory(category);
  if (!placeCategory) return {};
  const currentPage = parsePage((await searchParams).page);

  return {
    title: `서울 ${placeCategory.label}`,
    description: placeCategory.description,
    alternates: { canonical: `/places/${placeCategory.slug}` },
    robots: {
      index: placeCategory.indexable && currentPage === 1,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  if (!isPublicPlaceCategory(category)) notFound();

  const currentPage = parsePage((await searchParams).page);
  const result = await getPublicPlacePage(category, currentPage - 1);
  if (!result) notFound();

  const categoryInfo = getPublicPlaceCategory(category);
  if (!categoryInfo) notFound();

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6'>
      <div className='mx-auto max-w-5xl'>
        <nav className='text-sm font-medium text-blue-700' aria-label='경로'>
          <Link href='/'>지도</Link> <span className='text-slate-400'>/</span>{' '}
          <Link href='/places'>장소 둘러보기</Link>
        </nav>
        <h1 className='mt-6 text-3xl font-bold tracking-tight'>서울 {categoryInfo.label}</h1>
        <p className='mt-3 text-slate-600'>{categoryInfo.description}</p>
        <p className='mt-2 text-sm text-slate-500'>
          총 {result.totalElements.toLocaleString('ko-KR')}곳
        </p>

        <section
          className='mt-8 grid gap-4 sm:grid-cols-2'
          aria-label={`${categoryInfo.label} 목록`}
        >
          {result.content.map(place => (
            <article
              key={place.id}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <p className='text-xs font-medium text-blue-700'>{place.categoryLabel}</p>
              <h2 className='mt-1 text-lg font-semibold'>
                <Link
                  href={getPublicPlacePath(place.category, place.id)}
                  className='hover:underline'
                >
                  {place.name}
                </Link>
              </h2>
              {place.address && <p className='mt-2 text-sm text-slate-600'>{place.address}</p>}
              {place.description && (
                <p className='mt-2 line-clamp-2 text-sm leading-6 text-slate-500'>
                  {place.description}
                </p>
              )}
            </article>
          ))}
        </section>

        {result.content.length === 0 && (
          <p className='mt-8 rounded-lg bg-white p-6 text-slate-600'>
            표시할 장소 정보가 아직 없습니다.
          </p>
        )}

        <nav className='mt-10 flex items-center justify-between' aria-label='페이지 이동'>
          {currentPage > 1 ? (
            <Link
              href={`/places/${category}?page=${currentPage - 1}`}
              className='rounded-md border bg-white px-4 py-2 text-sm font-medium'
            >
              이전
            </Link>
          ) : (
            <span />
          )}
          {result.hasNext ? (
            <Link
              href={`/places/${category}?page=${currentPage + 1}`}
              className='rounded-md border bg-white px-4 py-2 text-sm font-medium'
            >
              다음
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
