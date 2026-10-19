'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { useMediaQuery, DESKTOP_QUERY } from '@/shared/lib/hooks/useMediaQuery';
import { useFacilityContext } from '../providers/FacilityProvider';
import { useMapContext } from '../providers/MapProvider';
import { useExploreContext } from '../providers/ExploreProvider';
import { ExplorerPanelConnected } from '../ExplorerPanelConnected';
import { FacilityDetail } from '../facility-detail/FacilityDetail';
import { ClusterList } from '../ClusterList';
import { MobileSheet, sheetVisibleHeight, type SheetSnap } from './MobileSheet';

export type PanelMode = 'explore' | 'detail' | 'cluster';

export interface PanelHostHandle {
  /** 지도 빈 곳을 탭했을 때: 펼친 시트는 접고, 피크 상태면 선택을 해제한다. */
  onMapTap: () => void;
}

interface PanelHostProps {
  onReady?: (handle: PanelHostHandle) => void;
  onLogin?: () => void;
}

/**
 * 탐색·상세·클러스터 목록을 하나의 호스트에서 전환한다.
 * 데스크톱은 좌측 solid 패널, 모바일은 비모달 3단 바텀시트다.
 */
export function PanelHost({ onReady, onLogin }: Readonly<PanelHostProps>) {
  const { t } = useI18n();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const { selectedFacility, selectedCluster, clearSelection } = useFacilityContext();
  const { setBottomInset } = useMapContext();
  const { isListOpen } = useExploreContext();
  const [snap, setSnap] = useState<SheetSnap>('peek');

  const mode: PanelMode = selectedFacility ? 'detail' : selectedCluster ? 'cluster' : 'explore';

  // 상세·클러스터가 열리면 반쯤, 탐색으로 돌아오면 피크로.
  useEffect(() => {
    if (isDesktop) return;
    setSnap(mode === 'explore' ? (isListOpen ? 'half' : 'peek') : 'half');
  }, [isDesktop, isListOpen, mode]);

  useEffect(() => {
    if (isDesktop) {
      setBottomInset(0);
      return;
    }
    const update = () => setBottomInset(sheetVisibleHeight(snap, window.innerHeight));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isDesktop, setBottomInset, snap]);

  const onMapTap = useCallback(() => {
    if (isDesktop) return;
    if (snap !== 'peek') setSnap('peek');
    else if (mode !== 'explore') clearSelection();
  }, [clearSelection, isDesktop, mode, snap]);

  useEffect(() => {
    onReady?.({ onMapTap });
  }, [onMapTap, onReady]);

  const content =
    mode === 'detail' && selectedFacility ? (
      <FacilityDetail
        facility={selectedFacility}
        onBack={clearSelection}
        compact={!isDesktop && snap === 'peek'}
      />
    ) : mode === 'cluster' && selectedCluster ? (
      <ClusterList cluster={selectedCluster} onBack={clearSelection} />
    ) : (
      <ExplorerPanelConnected compact={!isDesktop && snap === 'peek'} onLogin={onLogin} />
    );

  if (isDesktop) {
    return (
      <aside
        aria-label={t('map.panelLabel')}
        data-panel-mode={mode}
        className='flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain border-r border-border bg-background px-4 pb-6'
      >
        {content}
      </aside>
    );
  }

  return (
    <MobileSheet
      snap={snap}
      onSnapChange={setSnap}
      label={t('map.panelLabel')}
      mode={mode}
      onDismissAttempt={() => {
        if (mode !== 'explore') clearSelection();
      }}
    >
      {content}
    </MobileSheet>
  );
}
