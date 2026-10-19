'use client';

import React, { useCallback } from 'react';
import type { Facility } from '@/lib/types';
import type { FacilityRecommendation } from '@/features/recommendation/model/types';
import { PlaceExplorerPanel } from '@/features/place-filter/ui/PlaceExplorerPanel';
import { EngagementPanel } from '@/features/engagement/ui/EngagementPanel';
import { findSeoulRegion } from '@/shared/lib/data/seoul-districts';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useFacilityContext } from './providers/FacilityProvider';
import { useMapContext } from './providers/MapProvider';
import { useExploreContext } from './providers/ExploreProvider';

interface ExplorerPanelConnectedProps {
  compact?: boolean;
  onLogin?: () => void;
}

/** 탐색 패널에 컨텍스트 상태와 지도 동작을 연결한다. */
export function ExplorerPanelConnected({
  compact,
  onLogin,
}: Readonly<ExplorerPanelConnectedProps>) {
  const { selectedFacility, selectFacility, activeCategories, currentLocation } =
    useFacilityContext();
  const { setCenter, setZoom, revealPosition } = useMapContext();
  const explore = useExploreContext();

  const handleRegionSelect = useCallback(
    (regionCode: string) => {
      const region = findSeoulRegion(regionCode);
      if (!region) return;
      explore.setSelectedRegionCode(regionCode);
      setZoom(region.zoomLevel);
      setCenter(region.position);
      trackEvent('discovery_started', {
        selection_source: 'region_shortcut',
        page_type: 'home_map',
      });
    },
    [explore, setCenter, setZoom]
  );

  const handleFacilitySelect = useCallback(
    (facility: Facility) => {
      selectFacility(facility, 'list');
      revealPosition(facility.position, { minLevel: 4 });
    },
    [revealPosition, selectFacility]
  );

  const handleRecommendationSelect = useCallback(
    (recommendation: FacilityRecommendation) => {
      trackEvent('recommendation_selected', {
        preset: explore.activePreset,
        category: recommendation.facility.category,
        reason_code: recommendation.reasonCodes[0],
      });
      selectFacility(recommendation.facility, 'recommendation');
      revealPosition(recommendation.facility.position, { minLevel: 4 });
    },
    [explore.activePreset, revealPosition, selectFacility]
  );

  const handleListOpenChange = useCallback(
    (open: boolean) => {
      explore.setListOpen(open);
      if (open) trackEvent('place_list_viewed', { page_type: 'home_map' });
    },
    [explore]
  );

  return (
    <>
      <PlaceExplorerPanel
        compact={compact}
        filters={explore.filters}
        facilities={explore.facilitiesInView}
        selectedFacility={selectedFacility}
        isListOpen={explore.isListOpen}
        weatherData={explore.live.weather.data}
        congestionData={explore.live.congestion.data}
        liveDataLoading={explore.live.loading}
        activePreset={explore.activePreset}
        recommendations={explore.recommendations}
        naturalLanguageSummaryKo={explore.naturalLanguageSummary.ko}
        naturalLanguageSummaryEn={explore.naturalLanguageSummary.en}
        origin={explore.origin}
        preferredCategories={
          activeCategories.length > 0 && activeCategories.length <= 5 ? activeCategories : undefined
        }
        selectedRegionCode={explore.selectedRegionCode}
        onRegionSelect={handleRegionSelect}
        onListOpenChange={handleListOpenChange}
        onFilterChange={explore.setFilters}
        onReset={explore.resetFilters}
        onFacilitySelect={handleFacilitySelect}
        onPresetChange={explore.setPreset}
        onRecommendationSelect={handleRecommendationSelect}
        onEngagementOpen={() => explore.setEngagementOpen(true)}
      />
      <EngagementPanel
        isOpen={explore.isEngagementOpen}
        currentLocation={explore.geolocation.position ?? currentLocation}
        onClose={() => explore.setEngagementOpen(false)}
        {...(onLogin ? { onLogin } : {})}
      />
    </>
  );
}
