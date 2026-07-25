import React from 'react';
import { useFacilityContext } from './providers/FacilityProvider';
import { FacilityBottomSheet } from './FacilityBottomSheet';
import { useMapContext } from './providers/MapProvider';
import {
  getNearbyAlternatives,
  scoreFacility,
} from '@/features/recommendation/lib/recommendation-engine';
import { markRecentlyViewed } from '@/features/engagement/api/engagement';
import { toEngagementPlaceRequest } from '@/features/engagement/model/types';
import { useAuthStore } from '@/shared/model/authStore';

export const FacilityBottomSheetWrapper: React.FC = () => {
  const { selectedFacility, facilities, currentLocation, selectFacility } = useFacilityContext();
  const { panTo, setZoom } = useMapContext();
  const { isAuthenticated, accessToken } = useAuthStore();
  const lastRecordedPlaceRef = React.useRef<string | null>(null);
  const alternatives = React.useMemo(
    () =>
      selectedFacility
        ? getNearbyAlternatives(
            selectedFacility,
            facilities,
            { now: new Date(), preset: 'available_now' },
            3
          )
        : [],
    [facilities, selectedFacility]
  );
  const decisionSummary = React.useMemo(
    () =>
      selectedFacility
        ? scoreFacility(selectedFacility, {
            origin: currentLocation,
            now: new Date(),
            preset: 'available_now',
          })
        : undefined,
    [currentLocation, selectedFacility]
  );
  React.useEffect(() => {
    if (!selectedFacility || !isAuthenticated || !accessToken) return;
    const request = toEngagementPlaceRequest(selectedFacility);
    if (lastRecordedPlaceRef.current === request.placeKey) return;
    lastRecordedPlaceRef.current = request.placeKey;
    void markRecentlyViewed(accessToken, request).catch(() => {
      lastRecordedPlaceRef.current = null;
    });
  }, [accessToken, isAuthenticated, selectedFacility]);
  
  if (!selectedFacility) return null;
  
  return (
    <FacilityBottomSheet
      facility={selectedFacility}
      isOpen={!!selectedFacility}
      onClose={() => selectFacility(null)}
      alternatives={alternatives}
      decisionSummary={decisionSummary}
      onAlternativeSelect={recommendation => {
        panTo(recommendation.facility.position);
        setZoom(4);
        selectFacility(recommendation.facility, 'recommendation');
      }}
    />
  );
};
