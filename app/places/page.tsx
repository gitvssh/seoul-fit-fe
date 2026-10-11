import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { SiteFooter } from '@/shared/ui/layout/SiteFooter';
import { SiteBreadcrumb, SiteHeader } from '@/shared/ui/layout/SiteHeader';
import { PUBLIC_PLACE_CATEGORIES } from '@/shared/lib/seo/public-places';
import { CategoryGlyph } from './_components/CategoryGlyph';

export const metadata: Metadata = {
  title: '서울 장소 둘러보기',
  description: '서울의 공원, 도서관, 맛집, 문화행사와 공공시설 정보를 카테고리별로 둘러보세요.',
  alternates: { canonical: '/places' },
};

/** Public category hub. Korean-only server page; the map stays one tap away. */
export default function PublicPlacesPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <SiteHeader />
      <main className='mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10'>
        <SiteBreadcrumb items={[{ label: '지도', href: '/' }, { label: '장소 둘러보기' }]} />
        <h1 className='mt-4 text-display text-foreground'>서울 장소 둘러보기</h1>
        <p className='mt-3 max-w-2xl text-body text-muted-foreground'>
          서울시 공공데이터에 등록된 장소를 카테고리별로 봅니다. 지금 열려 있는지, 가까운지,
          붐비는지는 지도에서 실시간 데이터와 함께 확인할 수 있어요.
        </p>
        <div className='mt-5'>
          <Button asChild size='lg'>
            <Link href='/'>
              <Map aria-hidden='true' />
              지도에서 지금 갈 곳 찾기
            </Link>
          </Button>
        </div>

        <section className='mt-10' aria-labelledby='categories-heading'>
          <h2 id='categories-heading' className='text-section text-foreground'>
            카테고리
          </h2>
          <ul className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {PUBLIC_PLACE_CATEGORIES.map(category => (
              <li key={category.slug}>
                <Link
                  href={`/places/${category.slug}`}
                  className='group flex h-full items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-float-sm outline-none transition-[border-color,box-shadow] duration-fast ease-standard hover:border-input/60 hover:shadow-float-md focus-visible:ring-[3px] focus-visible:ring-ring/50'
                >
                  <CategoryGlyph category={category.facilityCategory} size='lg' />
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-1 text-section text-foreground'>
                      {category.label}
                      <ArrowRight
                        aria-hidden='true'
                        className='size-4 text-muted-foreground transition-transform duration-fast ease-standard group-hover:translate-x-0.5'
                      />
                    </span>
                    <span className='mt-1 block text-body-sm text-muted-foreground'>
                      {category.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
