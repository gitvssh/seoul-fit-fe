'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  clearAnalyticsConsent,
  getAnalyticsConsent,
  initializeAnalytics,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  trackPageView,
  type AnalyticsConsent,
} from '@/shared/lib/analytics/analytics';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function pageTypeFor(pathname: string) {
  if (pathname === '/') return 'home_map' as const;
  if (pathname === '/profile') return 'profile' as const;
  if (pathname.startsWith('/places/'))
    return pathname.split('/').length > 3 ? ('place_detail' as const) : ('place_list' as const);
  return undefined;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [consent, setConsent] = useState<AnalyticsConsent>('unknown');

  useEffect(() => {
    setConsent(getAnalyticsConsent());
  }, []);

  useEffect(() => {
    if (consent === 'granted') initializeAnalytics();
  }, [consent]);

  useEffect(() => {
    if (consent === 'granted') trackPageView(pathname, pageTypeFor(pathname));
  }, [consent, pathname]);

  if (!isAnalyticsConfigured() || !measurementId) return <>{children}</>;

  const chooseConsent = (choice: Exclude<AnalyticsConsent, 'unknown'>) => {
    setAnalyticsConsent(choice);
    setConsent(choice);
  };

  return (
    <>
      {consent === 'granted' && (
        <Script
          id='google-analytics'
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
          strategy='afterInteractive'
        />
      )}
      {children}
      {consent === 'unknown' && (
        <aside
          className='fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl'
          aria-label='분석 쿠키 선택'
        >
          <p className='text-sm font-semibold text-slate-900'>서비스 개선을 위한 이용 분석</p>
          <p className='mt-1 text-sm leading-5 text-slate-600'>
            동의하면 익명화된 화면 이동과 기능 사용 흐름만 분석합니다. 검색어·정확한 위치·계정
            정보는 전송하지 않습니다.
          </p>
          <div className='mt-3 flex flex-wrap justify-end gap-2'>
            <button
              type='button'
              onClick={() => chooseConsent('denied')}
              className='rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
            >
              거부
            </button>
            <button
              type='button'
              onClick={() => chooseConsent('granted')}
              className='rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800'
            >
              동의
            </button>
          </div>
        </aside>
      )}
      {consent !== 'unknown' && (
        <button
          type='button'
          onClick={() => {
            clearAnalyticsConsent();
            setConsent('unknown');
          }}
          className='fixed bottom-3 right-3 z-50 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:bg-slate-50'
        >
          분석 설정
        </button>
      )}
    </>
  );
}
