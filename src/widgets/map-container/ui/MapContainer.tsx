/**
 * @fileoverview 지도 화면 컨테이너
 * @description 지도·시설·탐색 프로바이더를 묶고, 헤더(검색)·지도·패널(탐색/상세)을 반응형 셸에 배치한다.
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { MapProvider } from './providers/MapProvider';
import { FacilityProvider, useFacilityContext } from './providers/FacilityProvider';
import { ExploreProvider } from './providers/ExploreProvider';
import { MapView } from './MapView';
import { AppShell } from './layout/AppShell';
import { PanelHost, type PanelHostHandle } from './layout/PanelHost';
import { useSearchReveal } from '../lib/useSearchReveal';
import { Header } from '@/widgets/header';
import SideBar from '@/shared/ui/layout/SideBar';
import type { UserPreferences, Position } from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import type { HeaderRef } from '@/shared/types';

interface MapContainerProps {
  className?: string;
  preferences?: UserPreferences;
  initialCenter?: Position;
  initialZoom?: number;
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
  onSidebarClose?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  showWarning?: boolean;
  onWarningClose?: () => void;
}

export interface MapContainerRef {
  handleSearchSelect: (searchItem: SearchItem) => Promise<void>;
  handleSearchClear: () => void;
}

const MapContainerInner: React.FC<
  Omit<MapContainerProps, 'preferences' | 'initialCenter' | 'initialZoom'> & {
    forwardedRef: React.Ref<MapContainerRef>;
  }
> = ({
  className,
  onMenuClick,
  isSidebarOpen,
  onSidebarClose,
  onLogin,
  onLogout,
  showWarning,
  onWarningClose,
  forwardedRef,
}) => {
  const { handleSearchSelect, handleSearchClear, selectionMessage } = useSearchReveal();
  const { activeCategories, toggleCategory } = useFacilityContext();
  const [searchQuery, setSearchQuery] = useState('');
  const headerRef = useRef<HeaderRef>(null);
  const panelHandleRef = useRef<PanelHostHandle | null>(null);

  React.useImperativeHandle(forwardedRef, () => ({ handleSearchSelect, handleSearchClear }), [
    handleSearchClear,
    handleSearchSelect,
  ]);

  const onSearchClear = useCallback(() => {
    setSearchQuery('');
    handleSearchClear();
  }, [handleSearchClear]);

  const onMapTap = useCallback(() => {
    headerRef.current?.closeSearchSuggestions();
    headerRef.current?.blurSearchInput();
    panelHandleRef.current?.onMapTap();
  }, []);

  const onPanelReady = useCallback((handle: PanelHostHandle) => {
    panelHandleRef.current = handle;
  }, []);

  return (
    <>
      <AppShell
        className={className}
        header={
          <Header
            ref={headerRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSelect={handleSearchSelect}
            onSearchClear={onSearchClear}
            onMenuClick={onMenuClick}
          />
        }
        map={<MapView onMapTap={onMapTap} />}
        panel={<PanelHost onReady={onPanelReady} onLogin={onLogin} />}
      />
      <p className='sr-only' role='status' aria-live='polite'>
        {selectionMessage}
      </p>
      {isSidebarOpen !== undefined && (
        <SideBar
          isOpen={isSidebarOpen}
          onClose={onSidebarClose || (() => {})}
          activeCategories={activeCategories}
          onCategoryToggle={toggleCategory}
          showWarning={showWarning}
          onWarningClose={onWarningClose}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      )}
    </>
  );
};

const MapContainer = React.forwardRef<MapContainerRef, MapContainerProps>(
  (
    { preferences, initialCenter = { lat: 37.5665, lng: 126.978 }, initialZoom = 4, ...rest },
    ref
  ) => (
    <MapProvider initialCenter={initialCenter} initialZoom={initialZoom} containerId='kakaoMap'>
      <FacilityProvider userPreferences={preferences}>
        <ExploreProvider>
          <MapContainerInner {...rest} forwardedRef={ref} />
        </ExploreProvider>
      </FacilityProvider>
    </MapProvider>
  )
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
