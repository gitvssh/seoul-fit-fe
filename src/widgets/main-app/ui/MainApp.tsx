'use client';

import React, { useState, useRef } from 'react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { usePreferences } from '@/shared/lib/hooks/usePreferences';
import { Info } from 'lucide-react';
import { Header } from '@/widgets/header';
import { SideBar } from '@/widgets/sidebar';
import { MapContainer } from '@/widgets/map-container';
import { LogoutModal } from '@/features/auth';
import { useKakaoLogin } from '@/shared/lib/hooks/useKakaoLogin';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import type { HeaderRef, MapContainerRef } from '@/shared/types';
import type { FacilityCategory } from '@/lib/types';

import type { MapStatus } from '@/shared/types/map';
import { useI18n } from '@/shared/i18n/I18nProvider';

export interface MainAppProps {
  className?: string;
}

export const MainApp: React.FC<MainAppProps> = ({ className }) => {
  const { locale } = useI18n();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const { preferences, togglePreference, refreshPreferences, showWarning, setShowWarning } =
    usePreferences();
  const { login, logout } = useKakaoLogin();
  const [searchQuery, setSearchQuery] = useState('');
  const mapContainerRef = useRef<MapContainerRef>(null);
  const headerRef = useRef<HeaderRef>(null);

  // 상태 관리
  const [mapStatus] = useState<MapStatus>({
    loading: true,
    error: null,
    success: false,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 검색 결과 선택 핸들러
  const handleSearchSelect = async (searchItem: SearchItem) => {
    if (mapContainerRef.current) {
      await mapContainerRef.current.handleSearchSelect(searchItem);
    }
  };

  // 검색 초기화 핸들러
  const handleSearchClear = () => {
    setSearchQuery('');
    if (mapContainerRef.current) {
      mapContainerRef.current.handleSearchClear();
    }
  };

  // 메뉴 토글 함수로 변경
  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // 지도 클릭 핸들러 (검색 제안 닫기 및 검색창 포커스 해제)
  const handleMapClick = () => {
    if (headerRef.current) {
      headerRef.current.closeSearchSuggestions();
      headerRef.current.blurSearchInput();
    }
  };

  return (
    <div className={className || 'h-screen flex flex-col'}>
      <a
        href='#main-map'
        className='sr-only z-[100] rounded-md bg-white px-4 py-2 text-blue-800 shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3'
      >
        {locale === 'en' ? 'Skip to map and place results' : '지도와 장소 결과로 건너뛰기'}
      </a>
      {/* 헤더 섹션 - 고정 */}
      <div className='sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'>
        <Header
          ref={headerRef}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onSearchSelect={handleSearchSelect}
          onSearchClear={handleSearchClear}
          onMenuClick={handleMenuToggle}
        />
      </div>

      {/* 사이드바 */}

      {/* 에러 알림 */}
      {mapStatus.error && (
        <div className='p-4'>
          <Alert variant='destructive'>
            <Info className='h-4 w-4' />
            <AlertDescription>{mapStatus.error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 지도 영역 - 전체 화면에서 헤더 제외한 나머지 */}
      <main
        id='main-map'
        tabIndex={-1}
        aria-label={locale === 'en' ? 'Map and place results' : '지도와 장소 결과'}
        className='relative flex-1'
      >
        <MapContainer
          ref={mapContainerRef}
          preferences={preferences}
          onPreferenceToggle={togglePreference}
          onMapClick={handleMapClick}
          onLocationReset={() => setSearchQuery('')}
          className="w-full h-full"
          isSidebarOpen={isSidebarOpen}
          onSidebarClose={() => setIsSidebarOpen(false)}
          onLogin={login}
          onLogout={() => setShowLogoutModal(true)}
          showWarning={showWarning}
          onWarningClose={() => setShowWarning(false)}
        />
      </main>

      {/* 로그아웃 모달 */}
      <LogoutModal
        showLogoutModal={showLogoutModal}
        showLogoutSuccess={showLogoutSuccess}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          try {
            await logout();
            setShowLogoutModal(false);
            setShowLogoutSuccess(true);
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } catch (error) {
            console.error('로그아웃 처리 중 오류:', error);
            // 오류가 발생해도 로그아웃 처리는 완료
            setShowLogoutModal(false);
            setShowLogoutSuccess(true);
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        }}
      />
    </div>
  );
};
