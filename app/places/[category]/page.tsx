import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { SiteFooter } from '@/shared/ui/layout/SiteFooter';
import { SiteBreadcrumb, SiteHeader } from '@/shared/ui/layout/SiteHeader';
import {
  formatPlaceCount,
  getPublicPlaceCategory,
  getPublicPlacePage,
  isPublicPlaceCategory,
} from '@/shared/lib/seo/public-places';
import { CategoryGlyph } from '../_components/CategoryGlyph';
import { PlaceCard } from '../_components/PlaceCard';
import { PlacePagination } from '../_components/PlacePagination';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const placeCategory = getPublicPlaceCategory(category);
  if (!placeCategory) return {};
  const currentPage = parsePage((await searchParams).page);

  return {
    title:
      currentPage > 1
        ? `서울 ${placeCategory.label} ${currentPage}페이지`
        : `서울 ${placeCategory.label}`,
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

  const categoryInfo = getPublicPlaceCategory(category);
  if (!categoryInfo) notFound();

  const currentPage = parsePage((await searchParams).page);
  const result = await getPublicPlacePage(category, currentPage - 1);
  if (!result) notFound();

  // The backend total counts index rows; once duplicates were seen it is inflated, so only the page count is honest.
  const countLabel =
    result.removed.duplicates > 0
      ? `이 페이지 ${formatPlaceCount(result.content.length)}곳`
      : `총 ${formatPlaceCount(result.totalElements)}곳`;

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <SiteHeader />
      <main className='mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10'>
        <SiteBreadcrumb
          items={[
            { label: '지도', href: '/' },
            { label: '장소 둘러보기', href: '/places' },
            { label: categoryInfo.label },
          ]}
        />
        <div className='mt-4 flex items-start gap-4'>
          <CategoryGlyph category={categoryInfo.facilityCategory} size='lg' className='mt-1' />
          <div className='min-w-0'>
            <h1 className='text-display text-foreground'>서울 {categoryInfo.label}</h1>
            <p className='mt-2 text-body text-muted-foreground'>{categoryInfo.description}</p>
            <p className='mt-2 text-body-sm text-muted-foreground tabular-nums'>
              {countLabel} · {currentPage} / {Math.max(result.totalPages, 1)} 페이지
            </p>
          </div>
        </div>

        {result.content.length > 0 ? (
          <section
            className='mt-8 grid gap-4 sm:grid-cols-2'
            aria-label={`${categoryInfo.label} 목록`}
          >
            {result.content.map(place => (
              <PlaceCard
                key={`${place.category}:${place.id}`}
                place={place}
                facilityCategory={categoryInfo.facilityCategory}
              />
            ))}
          </section>
        ) : (
          <div className='mt-8 rounded-lg border border-border bg-card p-6 text-center shadow-float-sm'>
            <p className='text-body text-foreground'>이 페이지에는 표시할 장소가 없어요.</p>
            <p className='mt-1 text-body-sm text-muted-foreground'>
              첫 페이지로 돌아가거나 지도에서 찾아보세요.
            </p>
            <div className='mt-4 flex flex-wrap justify-center gap-3'>
              <Button asChild variant='outline' size='lg'>
                <Link href={`/places/${category}`}>첫 페이지로</Link>
              </Button>
              <Button asChild size='lg'>
                <Link href='/'>지도로 보기</Link>
              </Button>
            </div>
          </div>
        )}

        <PlacePagination
          category={category}
          page={currentPage}
          totalPages={result.totalPages}
          hasNext={result.hasNext}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
