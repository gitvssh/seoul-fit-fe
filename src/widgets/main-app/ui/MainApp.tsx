'use client';

import React, { useState } from 'react';
import { usePreferences } from '@/shared/lib/hooks/usePreferences';
import { MapContainer } from '@/widgets/map-container';
import { LogoutModal } from '@/features/auth';
import { useKakaoLogin } from '@/shared/lib/hooks/useKakaoLogin';
import { useI18n } from '@/shared/i18n/I18nProvider';

export interface MainAppProps {
  className?: string;
}

/** 홈 화면: 건너뛰기 링크 + 지도 셸(헤더·지도·패널) + 설정 메뉴·로그아웃 다이얼로그 */
export const MainApp: React.FC<MainAppProps> = ({ className }) => {
  const { locale } = useI18n();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const { preferences, showWarning, setShowWarning } = usePreferences();
  const { login, logout } = useKakaoLogin();

  const finishLogout = () => {
    setShowLogoutModal(false);
    setShowLogoutSuccess(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div className={className || 'flex h-dvh flex-col bg-background'}>
      <a
        href='#main-map'
        className='sr-only z-skip-link rounded-md bg-card px-4 py-2 text-primary shadow-float-md focus:not-sr-only focus:fixed focus:left-3 focus:top-3'
      >
        {locale === 'en' ? 'Skip to map and place results' : '지도와 장소 결과로 건너뛰기'}
      </a>

      <main
        id='main-map'
        tabIndex={-1}
        aria-label={locale === 'en' ? 'Map and place results' : '지도와 장소 결과'}
        className='relative min-h-0 flex-1'
      >
        <h1 className='sr-only'>
          {locale === 'en' ? 'Seoul public facility map' : '서울 공공시설 지도'}
        </h1>
        <MapContainer
          preferences={preferences}
          className='h-full w-full'
          onMenuClick={() => setIsSidebarOpen(previous => !previous)}
          isSidebarOpen={isSidebarOpen}
          onSidebarClose={() => setIsSidebarOpen(false)}
          onLogin={login}
          onLogout={() => setShowLogoutModal(true)}
          showWarning={showWarning}
          onWarningClose={() => setShowWarning(false)}
        />
      </main>

      <LogoutModal
        showLogoutModal={showLogoutModal}
        showLogoutSuccess={showLogoutSuccess}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          try {
            await logout();
          } catch (error) {
            console.error('로그아웃 처리 중 오류:', error);
          } finally {
            finishLogout();
          }
        }}
      />
    </div>
  );
};
