import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, Map } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { SiteFooter } from '@/shared/ui/layout/SiteFooter';
import { SiteHeader } from '@/shared/ui/layout/SiteHeader';
import { Logo } from '@/shared/ui/brand/Logo';
import { SITE_REPOSITORY_URL, SITE_VALUE_PROPOSITION } from '@/shared/lib/seo/site';
import {
  DataFlowSection,
  DataSection,
  DecisionsSection,
  DeepLinks,
  LimitsSection,
  LinksSection,
  ProblemSection,
  QualitySection,
  ScreenshotGallery,
} from './_components/about-sections';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: `${SITE_VALUE_PROPOSITION}. 문제와 접근, 데이터 흐름, 설계 결정과 트레이드오프, 데이터 출처, 품질 현황과 한계를 한 화면에 정리한 케이스 스터디.`,
  alternates: { canonical: '/about' },
  openGraph: { title: '서비스 소개 | Seoul Fit', url: '/about' },
};

/** One-screen case study for reviewers. Korean-only server page. */
export default function AboutPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <SiteHeader />
      <main className='mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-6'>
        <section aria-labelledby='about-heading'>
          <Logo size={40} wordmarkClassName='text-title' />
          <h1 id='about-heading' className='mt-6 max-w-3xl text-display text-foreground'>
            {SITE_VALUE_PROPOSITION}
          </h1>
          <p className='mt-4 max-w-prose text-body text-muted-foreground'>
            서울의 공공시설과 실시간 도시데이터를 한 지도에 모아, 지금 갈 수 있는 곳을 점수와 근거로
            고르게 돕는 생활 의사결정 지도입니다. 2025 공개SW개발자대회에 출품했던 팀 프로젝트의
            프런트엔드를 공모전 이후 개인 포트폴리오로 이어가고 있으며, 실사용자는 없습니다.
          </p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Button asChild size='lg'>
              <Link href='/'>
                <Map aria-hidden='true' />
                지도 열기
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <a href={SITE_REPOSITORY_URL} target='_blank' rel='noreferrer'>
                <Github aria-hidden='true' />
                GitHub 저장소
              </a>
            </Button>
          </div>
          <ScreenshotGallery />
          <DeepLinks />
        </section>
        <ProblemSection />
        <DataFlowSection />
        <DecisionsSection />
        <DataSection />
        <QualitySection />
        <LimitsSection />
        <LinksSection />
      </main>
      <SiteFooter />
    </div>
  );
}
