import Link from 'next/link';
import { PUBLIC_PLACE_CATEGORIES } from '@/shared/lib/seo/public-places';
import { SITE_DESCRIPTION } from '@/shared/lib/seo/site';

/**
 * Server-rendered home content.
 *
 * The interactive map depends on the browser (Kakao SDK, geolocation, query
 * string), so it can only render after hydration. This landing is what the
 * server sends in the initial HTML: a real heading, the service description and
 * the public place categories, so search engines, link previews and users
 * without JavaScript get meaningful content while the map is being prepared.
 */
export function HomeLanding() {
  return (
    <main
      className='flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 sm:px-6'
      aria-busy='true'
    >
      <div className='w-full max-w-3xl'>
        <p className='text-sm font-semibold text-blue-700'>Seoul Fit</p>
        <h1 className='mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>서울 공공시설 지도</h1>
        <p className='mt-4 max-w-2xl text-base leading-7 text-slate-600'>{SITE_DESCRIPTION}</p>
        <output className='mt-2 block text-sm text-slate-500'>
          지도를 준비하고 있습니다. 지도가 열리지 않으면 아래 목록에서 장소를 찾아보세요.
        </output>
        <nav className='mt-8' aria-label='장소 카테고리'>
          <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {PUBLIC_PLACE_CATEGORIES.map(category => (
              <li key={category.slug}>
                <Link
                  href={`/places/${category.slug}`}
                  className='block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow'
                >
                  <span className='block text-base font-semibold'>{category.label}</span>
                  <span className='mt-1 block text-sm leading-6 text-slate-600'>
                    {category.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className='mt-8 text-sm text-slate-600'>
          <Link href='/places' className='font-medium text-blue-700 hover:underline'>
            모든 장소 둘러보기
          </Link>
        </p>
      </div>
    </main>
  );
}
