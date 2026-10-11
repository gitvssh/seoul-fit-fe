import Link from 'next/link';
import { PUBLIC_PLACE_CATEGORIES } from '@/shared/lib/seo/public-places';
import { SITE_DESCRIPTION } from '@/shared/lib/seo/site';
import { LogoMark, Wordmark } from '@/shared/ui/brand/Logo';

/**
 * 서버가 보내는 홈 콘텐츠. 지도는 브라우저에서만 만들 수 있으므로 첫 HTML은 앱 셸과 같은 모양의
 * 랜딩이다: 헤더 띠, 왼쪽 패널 자리에 실제 제목·설명·카테고리 링크, 오른쪽에 지도 자리.
 * 검색엔진·링크 미리보기·JS 없는 환경이 의미 있는 내용을 받고, hydration 뒤 지도로 바뀌어도
 * 위치가 같아 화면이 튀지 않는다.
 */
export function HomeLanding() {
  return (
    <main
      className='grid h-dvh min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] bg-background text-foreground md:grid-cols-[400px_minmax(0,1fr)]'
      aria-busy='true'
    >
      <div className='col-start-1 row-start-1 flex h-[var(--header-height)] items-center gap-3 border-b border-border/60 bg-background px-4'>
        <LogoMark size={32} />
        <Wordmark />
      </div>

      <div className='col-start-1 row-start-2 min-h-0 overflow-y-auto px-4 pb-8 pt-4'>
        <p className='text-caption font-semibold uppercase tracking-wide text-primary'>Seoul Fit</p>
        <h1 className='mt-1 text-display'>서울 공공시설 지도</h1>
        <p className='mt-3 text-body text-muted-foreground'>{SITE_DESCRIPTION}</p>
        <output className='mt-2 block text-body-sm text-muted-foreground'>
          지도를 준비하고 있습니다. 지도가 열리지 않으면 아래 목록에서 장소를 찾아보세요.
        </output>
        <nav className='mt-6' aria-label='장소 카테고리'>
          <ul className='grid gap-2 sm:grid-cols-2 md:grid-cols-1'>
            {PUBLIC_PLACE_CATEGORIES.map(category => (
              <li key={category.slug}>
                <Link
                  href={`/places/${category.slug}`}
                  className='block rounded-lg border border-border bg-card p-3 shadow-float-sm transition-colors hover:bg-accent'
                >
                  <span className='block text-body font-semibold'>{category.label}</span>
                  <span className='mt-0.5 block text-caption text-muted-foreground'>
                    {category.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className='mt-6 text-body-sm'>
          <Link
            href='/places'
            className='font-medium text-primary underline-offset-4 hover:underline'
          >
            모든 장소 둘러보기
          </Link>
        </p>
      </div>

      <div
        className='hidden min-h-0 bg-muted [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] md:col-start-2 md:row-span-2 md:row-start-1 md:block'
        aria-hidden='true'
      />
    </main>
  );
}
