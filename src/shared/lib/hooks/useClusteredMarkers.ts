import { useMemo } from 'react';
import { Facility, ClusteredFacility, FacilityCategory } from '@/lib/types';
import { getFacilityIcon } from '@/shared/lib/icons/facility';

interface MarkerData {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  icon: {
    content: string;
    size: {
      width: number;
      height: number;
    };
    anchor: {
      x: number;
      y: number;
    };
  };
  facility?: Facility;
  cluster?: ClusteredFacility;
  isCluster: boolean;
}

export function useClusteredMarkers(facilities: Facility[]) {
  const { markers, clusteredFacilities } = useMemo(() => {
    const locationGroups = new Map<string, Facility[]>();

    facilities.forEach(facility => {
      const key = `${facility.position.lat.toFixed(6)},${facility.position.lng.toFixed(6)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(facility);
    });

    const markerData: MarkerData[] = [];
    const clusters: ClusteredFacility[] = [];

    locationGroups.forEach((groupFacilities, locationKey) => {
      if (groupFacilities.length === 1) {
        const facility = groupFacilities[0];
        const icon = getFacilityIcon(facility.category);

        markerData.push({
          id: facility.id,
          position: facility.position,
          icon: {
            content: `
              <div style="
                width: 32px;
                height: 32px;
                background: ${icon.color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                cursor: pointer;
              ">
                ${icon.svg}
              </div>
            `,
            size: { width: 32, height: 32 },
            anchor: { x: 16, y: 16 },
          },
          facility,
          isCluster: false,
        });
      } else {
        const centerLat = groupFacilities[0].position.lat;
        const centerLng = groupFacilities[0].position.lng;

        const categoryCounts: Record<FacilityCategory, number> = {} as Record<
          FacilityCategory,
          number
        >;
        groupFacilities.forEach(facility => {
          categoryCounts[facility.category] = (categoryCounts[facility.category] || 0) + 1;
        });

        const primaryCategory = Object.entries(categoryCounts).sort(
          ([, a], [, b]) => b - a
        )[0][0] as FacilityCategory;

        const clusteredFacility: ClusteredFacility = {
          id: `cluster-${locationKey}`,
          position: { lat: centerLat, lng: centerLng },
          facilities: groupFacilities,
          count: groupFacilities.length,
          radius: 0.01, // 기본 반경
          primaryCategory,
        };

        clusters.push(clusteredFacility);

        const primaryIcon = getFacilityIcon(primaryCategory);

        markerData.push({
          id: clusteredFacility.id,
          position: { lat: centerLat, lng: centerLng },
          icon: {
            content: `
              <div style="
                width: 40px;
                height: 40px;
                background: ${primaryIcon.color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                position: relative;
                cursor: pointer;
              ">
                ${primaryIcon.svg}
                <div style="
                  position: absolute;
                  top: -5px;
                  right: -5px;
                  background: #ff4444;
                  color: white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: bold;
                  border: 2px solid white;
                ">
                  ${groupFacilities.length}
                </div>
              </div>
            `,
            size: { width: 40, height: 40 },
            anchor: { x: 20, y: 20 },
          },
          cluster: clusteredFacility,
          isCluster: true,
        });
      }
    });

    return { markers: markerData, clusteredFacilities: clusters };
  }, [facilities]);

  return { markers, clusteredFacilities };
}
