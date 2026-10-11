'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ClusteredFacility, Facility, FacilityCategory, Position } from '@/lib/types';
import type { MessageKey } from '@/shared/i18n/messages';
import type { WindowWithKakao } from '@/shared/lib/kakao';
import { useMapMarkers, getFacilityMarkerId } from '@/shared/lib/hooks/useMapMarkers';
import { useMediaQuery, DESKTOP_QUERY, HOVER_QUERY } from '@/shared/lib/hooks/useMediaQuery';
import { useCurrentLocationMarker } from '@/shared/lib/hooks/useCurrentLocationMarker';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { useMapContext } from './providers/MapProvider';
import { calculateDistanceKm, useFacilityContext } from './providers/FacilityProvider';
import { useExploreContext } from './providers/ExploreProvider';
import { useMapViewport } from '../lib/useMapViewport';
import { CategoryChips } from './CategoryChips';
import { MapControls } from './MapControls';
import { MapStatusChip } from './MapStatusChip';
import { MapFallback } from './MapFallback';
import { LiveNowPanel } from './LiveNowPanel';
import { WelcomeCard } from './WelcomeCard';

interface MapViewProps {
  onMapTap?: () => void;
}

const RELOAD_DISTANCE_KM = 1;
const MAX_RELOAD_LEVEL = 9;

export const MapView: React.FC<MapViewProps> = ({ onMapTap }) => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const {
    mapInstance,
    mapStatus,
    containerId,
    zoomIn,
    zoomOut,
    retryMap,
    revealPosition,
    bottomInset,
  } = useMapContext();
  const {
    facilities,
    getFilteredFacilities,
    activeCategories,
    toggleCategory,
    selectedFacility,
    selectFacility,
    selectCluster,
    updateLocation,
    loading,
    locationLoading,
    failedCategories,
    lastLoadedLocation,
  } = useFacilityContext();
  const {
    setVisibleFacilities,
    live,
    geolocation,
    locateMe,
    geolocationBanner,
    dismissGeolocationBanner,
    setPreset,
  } = useExploreContext();
  const [liveOpen, setLiveOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const hasTrackedReadyRef = useRef(false);
  const hasAppliedDeepLinkRef = useRef(false);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categoryVisible, setCategoryVisible] = useState<Facility[]>([]);

  const ready = mapStatus.success && !!mapInstance;
  const activeFacilities = useMemo(() => getFilteredFacilities(), [getFilteredFacilities]);

  useEffect(() => {
    if (ready && !hasTrackedReadyRef.current) {
      hasTrackedReadyRef.current = true;
      trackEvent('map_ready', { page_type: 'home_map' });
    }
  }, [ready]);

  // /?lat&lng 딥링크 → 초기 중심
  useEffect(() => {
    if (!ready || !mapInstance || hasAppliedDeepLinkRef.current) return;
    const lat = Number(searchParams?.get('lat'));
    const lng = Number(searchParams?.get('lng'));
    if (!isValidSeoulCoordinate(lat, lng)) return;
    const maps = (window as WindowWithKakao).kakao?.maps;
    if (!maps) return;
    hasAppliedDeepLinkRef.current = true;
    mapInstance.setCenter(new maps.LatLng(lat, lng));
    mapInstance.setLevel(4);
  }, [mapInstance, ready, searchParams]);

  const handleVisibleChange = useCallback(
    (visible: Facility[]) => {
      setCategoryVisible(visible);
      setVisibleFacilities(visible);
    },
    [setVisibleFacilities]
  );

  // 지도를 멀리 옮기면 그 주변 데이터를 다시 읽는다 (1km 이상, 0.8초 디바운스).
  const handleIdle = useCallback(
    (center: { lat: number; lng: number }, level: number) => {
      if (level > MAX_RELOAD_LEVEL) return;
      if (
        lastLoadedLocation &&
        calculateDistanceKm(center, lastLoadedLocation) < RELOAD_DISTANCE_KM
      )
        return;
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = setTimeout(() => {
        void updateLocation(center.lat, center.lng, { force: true, zoomLevel: level });
      }, 800);
    },
    [lastLoadedLocation, updateLocation]
  );

  useEffect(
    () => () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    },
    []
  );

  const handleMapClick = useCallback(() => {
    setLiveOpen(false);
    onMapTap?.();
  }, [onMapTap]);

  useMapViewport({
    mapInstance,
    ready,
    facilities: activeFacilities,
    onVisibleChange: handleVisibleChange,
    onIdle: handleIdle,
    onClick: handleMapClick,
  });

  const handleFacilitySelect = useCallback(
    (facility: Facility, source: 'marker' | 'cluster' = 'marker') => {
      selectFacility(facility, source === 'cluster' ? 'cluster' : 'map_marker');
      revealPosition(facility.position);
    },
    [revealPosition, selectFacility]
  );

  const handleClusterSelect = useCallback(
    (clusterFacilities: Facility[], center: Position) => {
      const cluster: ClusteredFacility = {
        id: `cluster-${center.lat.toFixed(6)},${center.lng.toFixed(6)}`,
        position: center,
        count: clusterFacilities.length,
        facilities: clusterFacilities,
        radius: 0,
        primaryCategory: clusterFacilities[0]?.category ?? 'park',
      };
      selectCluster(cluster);
    },
    [selectCluster]
  );

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const hoverEnabled = useMediaQuery(HOVER_QUERY, false);
  const markerLabels = useMemo(
    () => ({
      facility: (name: string, category: string) =>
        `${name}, ${t(`category.${category}` as MessageKey)}`,
      cluster: (count: number) => t('explorer.clusterTitle', { count }),
      currentLocation: t('map.currentLocationMarker'),
    }),
    [t]
  );

  const { markersCount } = useMapMarkers({
    mapInstance,
    mapStatus: { success: mapStatus.success, loading: mapStatus.loading, error: mapStatus.error },
    visibleFacilities: categoryVisible,
    onFacilitySelect: handleFacilitySelect,
    onClusterSelect: handleClusterSelect,
    selectedFacilityId: selectedFacility ? getFacilityMarkerId(selectedFacility) : null,
    hoverEnabled,
    labels: markerLabels,
    viewportPadding: {
      top: isDesktop ? 56 : 112,
      right: 64,
      bottom: bottomInset + 16,
      left: 16,
    },
  });

  useCurrentLocationMarker({
    mapInstance,
    mapStatus: { success: mapStatus.success, loading: mapStatus.loading, error: mapStatus.error },
    lat: geolocation.position?.lat ?? null,
    lng: geolocation.position?.lng ?? null,
    label: markerLabels.currentLocation,
  });

  const counts = useMemo(() => {
    const result: Partial<Record<FacilityCategory, number>> = {};
    facilities.forEach(facility => {
      result[facility.category] = (result[facility.category] ?? 0) + 1;
    });
    return result;
  }, [facilities]);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      await locateMe();
    } finally {
      setLocating(false);
    }
  }, [locateMe]);

  const handleRetryFailed = useCallback(() => {
    const center = lastLoadedLocation ?? { lat: 37.5665, lng: 126.978 };
    void updateLocation(center.lat, center.lng, { force: true, zoomLevel: 4 });
  }, [lastLoadedLocation, updateLocation]);

  const liveTemperature = live.weather.data?.TEMP
    ? String(Math.round(Number(live.weather.data.TEMP)))
    : null;

  return (
    <div
      className='relative h-full w-full overflow-hidden bg-muted'
      style={{ '--sheet-visible': `${bottomInset}px` } as React.CSSProperties}
    >
      <div
        id={containerId}
        className='h-full w-full outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50'
        role='application'
        aria-label={t('map.canvasLabel')}
        tabIndex={0}
      />

      {mapStatus.loading && !mapStatus.error && (
        <div
          className='absolute inset-0 z-map-status flex items-center justify-center bg-background/80 backdrop-blur-sm'
          aria-busy='true'
        >
          <div className='flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-body-sm text-muted-foreground shadow-float-md'>
            <Loader2 className='size-4 animate-spin text-primary' aria-hidden='true' />
            {t('map.status.loading')}
          </div>
        </div>
      )}

      {mapStatus.error && <MapFallback onRetry={retryMap} />}

      {/* 상단: 장소 종류 칩 */}
      <div className='absolute inset-x-0 top-[var(--header-height)] z-map-controls md:top-2'>
        <CategoryChips
          counts={counts}
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />
      </div>

      {/* 상단 중앙: 상태 칩 */}
      <div className='pointer-events-none absolute inset-x-3 top-[calc(var(--header-height)+3.5rem)] z-map-status flex justify-center md:top-14'>
        <MapStatusChip
          loading={loading}
          locationLoading={locationLoading}
          failedCategories={failedCategories}
          geolocationBanner={geolocationBanner}
          onRetryFailed={handleRetryFailed}
          onLocate={handleLocate}
          onDismissBanner={dismissGeolocationBanner}
        />
      </div>

      {/* 우측: 컨트롤 열 (시트 위에 떠 있도록 하단 inset 반영) */}
      <MapControls
        className='absolute right-3 z-map-controls bottom-[calc(var(--sheet-visible)+0.75rem)] md:bottom-6'
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onLocate={handleLocate}
        locating={locating || geolocation.status === 'requesting'}
        locationActive={Boolean(geolocation.position)}
        onToggleLive={() => setLiveOpen(open => !open)}
        liveOpen={liveOpen}
        liveTemperature={liveTemperature}
      />

      {liveOpen && (
        <div className='pointer-events-none absolute inset-x-3 z-map-popover bottom-[calc(var(--sheet-visible)+13.75rem)] md:inset-x-auto md:right-16 md:top-14 md:bottom-auto md:w-80'>
          <LiveNowPanel
            weather={live.weather}
            congestion={live.congestion}
            loading={live.loading}
            onRefresh={() =>
              void live.refresh(
                geolocation.position ?? lastLoadedLocation ?? { lat: 37.5665, lng: 126.978 }
              )
            }
            onClose={() => setLiveOpen(false)}
          />
        </div>
      )}

      {ready && (
        <div className='pointer-events-none absolute left-3 z-map-status w-[min(100%-5rem,24rem)] bottom-[calc(var(--sheet-visible)+0.75rem)] md:bottom-6'>
          <WelcomeCard onPreset={setPreset} />
        </div>
      )}

      <p className='sr-only' role='status' aria-live='polite'>
        {t('map.facilityCount', { count: markersCount })}
      </p>
    </div>
  );
};
