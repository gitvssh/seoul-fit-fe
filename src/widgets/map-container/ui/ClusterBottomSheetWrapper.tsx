import React from 'react';
import { useFacilityContext } from './providers/FacilityProvider';
import { ClusterBottomSheet } from './ClusterBottomSheet';

export const ClusterBottomSheetWrapper: React.FC = () => {
  const { selectedCluster, selectCluster } = useFacilityContext();

  if (!selectedCluster) {
    return null;
  }

  return (
    <ClusterBottomSheet
      cluster={selectedCluster}
      isOpen={!!selectedCluster}
      onClose={() => selectCluster(null)}
    />
  );
};
