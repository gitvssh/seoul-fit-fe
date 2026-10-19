import Link from 'next/link';
import { SITE_REPOSITORY_URL } from '@/shared/lib/seo/site';
import { Logo } from '@/shared/ui/brand/Logo';

const SEOUL_OPEN_DATA_URL = 'https://data.seoul.go.kr';

/**
 * Footer shared by the public place pages and /about: data attribution,
 * platform notices and the honest project status. Korean-only (server rendered).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className='border-t border-border bg-card'>
      <div className='mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr]'>
        <div>
          <Logo size={24} />
          <p className='mt-3 max-w-prose text-body-sm text-muted-foreground'>
            서울시가 운영하는 서비스가 아닌 개인 포트폴리오 프로젝트입니다. 공모전 이후 실사용자
            없이 포트폴리오 목적으로 운영합니다.
          </p>
          <ul className='mt-4 max-w-prose space-y-2 text-body-sm text-muted-foreground'>
            <li>
              공공데이터 출처: 서울특별시,{' '}
              <a
                href={SEOUL_OPEN_DATA_URL}
                target='_blank'
                rel='noreferrer'
                className='text-foreground underline underline-offset-4'
              >
                서울 열린데이터광장
              </a>
              {'. 각'} 데이터셋의 공공누리 유형에 따라 출처를 표시하고 이용합니다.
            </li>
            <li>
              지도와 로그인은 Kakao 지도 API와 카카오 로그인을 사용합니다. 지도 타일과 로고는
              Kakao의 저작물입니다.
            </li>
            <li>
              추천은 규칙 기반이며 AI가 아닙니다. 운영시간·혼잡도·날씨는 원천 데이터의 갱신 시각에
              따라 실제와 다를 수 있으니 방문 전에 확인하세요.
            </li>
          </ul>
        </div>
        <nav aria-label='사이트 링크'>
          <h2 className='text-label text-muted-foreground'>바로가기</h2>
          <ul className='mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm md:grid-cols-1'>
            <li>
              <Link href='/' className='inline-block py-1 text-foreground hover:underline'>
                지도
              </Link>
            </li>
            <li>
              <Link href='/places' className='inline-block py-1 text-foreground hover:underline'>
                장소 둘러보기
              </Link>
            </li>
            <li>
              <Link href='/about' className='inline-block py-1 text-foreground hover:underline'>
                서비스 소개
              </Link>
            </li>
            <li>
              <a
                href={SITE_REPOSITORY_URL}
                target='_blank'
                rel='noreferrer'
                className='inline-block py-1 text-foreground hover:underline'
              >
                GitHub 저장소
              </a>
            </li>
            <li>
              <a
                href={`${SITE_REPOSITORY_URL}/blob/master/docs/decisions/README.md`}
                target='_blank'
                rel='noreferrer'
                className='inline-block py-1 text-foreground hover:underline'
              >
                설계 결정 기록
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className='border-t border-border'>
        <p className='mx-auto max-w-5xl px-4 py-4 text-caption text-muted-foreground sm:px-6'>
          © {year} Seoul Fit Team · MIT License
        </p>
      </div>
    </footer>
  );
}
