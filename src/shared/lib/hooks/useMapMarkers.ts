import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KakaoCustomOverlay, KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { createCustomMarkerContent } from '@/shared/lib/utils/marker';
import type { ClusteredFacility, Facility, FacilityCategory } from '@/lib/types';
import { getFacilityIcon } from '@/shared/lib/icons/facility';

interface UseMapMarkersProps {
  mapInstance: KakaoMap | null | undefined;
  mapStatus: { success: boolean; loading: boolean; error: string | null } | undefined;
  visibleFacilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
  onClusterSelect?: (cluster: ClusteredFacility) => void;
}

type MarkerItem = Facility | ClusteredFacility;

interface MarkerDescriptor {
  key: string;
  item: MarkerItem;
  isCluster: boolean;
  content: string;
  positionSignature: string;
  zIndex: number;
}

interface MarkerEntry {
  overlay: KakaoCustomOverlay;
  item: MarkerItem;
  isCluster: boolean;
  content: string;
  positionSignature: string;
  element: HTMLElement;
  cleanupEvents: () => void;
}

const isClusteredFacility = (item: MarkerItem): item is ClusteredFacility => 'facilities' in item;

const createClusterContent = (cluster: ClusteredFacility): string => {
  const representativeFacility =
    cluster.facilities.find(facility => facility.category === cluster.primaryCategory) ||
    cluster.facilities[0];
  const primaryIcon = getFacilityIcon(cluster.primaryCategory, representativeFacility);

  return `
    <div id="marker-${cluster.id}" style="
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
      <div style="pointer-events: none;">
        ${primaryIcon.svg}
      </div>
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
        pointer-events: none;
      ">
        ${cluster.count}
      </div>
    </div>
  `;
};

const createMarkerElement = (content: string): HTMLElement => {
  const template = document.createElement('template');
  template.innerHTML = content.trim();
  const element = template.content.firstElementChild;

  if (!(element instanceof HTMLElement)) {
    throw new Error('마커 콘텐츠를 DOM 요소로 변환하지 못했습니다.');
  }

  return element;
};

const getMarkerAriaLabel = (item: MarkerItem): string =>
  isClusteredFacility(item) ? `${item.count}개 시설 모음` : item.name;

/**
 * 화면에 남아 있는 마커 오버레이를 재사용하고 추가·삭제된 마커만 반영합니다.
 * 지도 이동마다 전체 오버레이를 해제하던 기존 방식의 깜빡임을 방지합니다.
 */
export const useMapMarkers = ({
  mapInstance,
  mapStatus,
  visibleFacilities,
  onFacilitySelect,
  onClusterSelect,
}: UseMapMarkersProps) => {
  const markerEntriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const activeMapRef = useRef<KakaoMap | null>(null);
  const onFacilitySelectRef = useRef(onFacilitySelect);
  const onClusterSelectRef = useRef(onClusterSelect);
  const [markersCount, setMarkersCount] = useState(0);

  onFacilitySelectRef.current = onFacilitySelect;
  onClusterSelectRef.current = onClusterSelect;

  const clusteredData = useMemo(() => {
    const locationGroups = new Map<string, Facility[]>();

    visibleFacilities.forEach(facility => {
      if (
        !facility.position ||
        !Number.isFinite(facility.position.lat) ||
        !Number.isFinite(facility.position.lng) ||
        facility.position.lat === 0 ||
        facility.position.lng === 0
      ) {
        return;
      }

      const key = `${facility.position.lat.toFixed(6)},${facility.position.lng.toFixed(6)}`;
      const group = locationGroups.get(key);
      if (group) {
        group.push(facility);
      } else {
        locationGroups.set(key, [facility]);
      }
    });

    const clusters: ClusteredFacility[] = [];
    const singleFacilities: Facility[] = [];

    locationGroups.forEach((facilities, locationKey) => {
      if (facilities.length === 1) {
        singleFacilities.push(facilities[0]);
        return;
      }

      const categoryCounts = new Map<FacilityCategory, number>();
      facilities.forEach(facility => {
        categoryCounts.set(facility.category, (categoryCounts.get(facility.category) ?? 0) + 1);
      });
      const primaryCategory = [...categoryCounts.entries()].sort(([, a], [, b]) => b - a)[0][0];

      clusters.push({
        id: `cluster-${locationKey}`,
        position: facilities[0].position,
        facilities,
        count: facilities.length,
        radius: 0.01,
        primaryCategory,
      });
    });

    return { clusters, singleFacilities };
  }, [visibleFacilities]);

  const descriptors = useMemo<MarkerDescriptor[]>(() => {
    const singleMarkers = clusteredData.singleFacilities.map<MarkerDescriptor>(facility => {
      // 일부 공공데이터 응답은 타입 계약과 달리 숫자 ID를 반환하므로 DOM ID 생성 전에 정규화합니다.
      const facilityId = String(facility.id);
      return {
        key: `facility:${facility.category}:${facilityId}`,
        item: facility,
        isCluster: false,
        content: createCustomMarkerContent(
          facility.category,
          facility.congestionLevel,
          facilityId,
          facility
        ),
        positionSignature: `${facility.position.lat},${facility.position.lng}`,
        zIndex: 1000,
      };
    });
    const clusterMarkers = clusteredData.clusters.map<MarkerDescriptor>(cluster => ({
      key: `cluster:${cluster.id}`,
      item: cluster,
      isCluster: true,
      content: createClusterContent(cluster),
      positionSignature: `${cluster.position.lat},${cluster.position.lng}`,
      zIndex: 1001,
    }));

    return [...singleMarkers, ...clusterMarkers];
  }, [clusteredData]);

  const bindMarkerEvents = useCallback((element: HTMLElement, key: string): (() => void) => {
    const activate = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentEntry = markerEntriesRef.current.get(key);
      if (!currentEntry) return;

      if (currentEntry.isCluster) {
        onClusterSelectRef.current?.(currentEntry.item as ClusteredFacility);
      } else {
        onFacilitySelectRef.current(currentEntry.item as Facility);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        activate(event);
      }
    };
    const handleMouseEnter = () => {
      element.style.transform = 'scale(1.1)';
      element.style.zIndex = '1001';
    };
    const handleMouseLeave = () => {
      element.style.transform = 'scale(1)';
      element.style.zIndex = '1000';
    };

    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    element.addEventListener('click', activate);
    element.addEventListener('keydown', handleKeyDown);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('click', activate);
      element.removeEventListener('keydown', handleKeyDown);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const disposeAllMarkers = useCallback(() => {
    markerEntriesRef.current.forEach(entry => {
      entry.cleanupEvents();
      entry.overlay.setMap(null);
    });
    markerEntriesRef.current.clear();
  }, []);

  const clearMarkers = useCallback(() => {
    disposeAllMarkers();
    setMarkersCount(0);
  }, [disposeAllMarkers]);

  const reconcileMarkers = useCallback(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    const kakaoMaps = windowWithKakao.kakao?.maps;
    if (!kakaoMaps) return;

    const desiredKeys = new Set(descriptors.map(descriptor => descriptor.key));

    markerEntriesRef.current.forEach((entry, key) => {
      if (desiredKeys.has(key)) return;

      entry.cleanupEvents();
      entry.overlay.setMap(null);
      markerEntriesRef.current.delete(key);
    });

    descriptors.forEach(descriptor => {
      const existing = markerEntriesRef.current.get(descriptor.key);
      const position = descriptor.item.position;

      if (existing) {
        existing.item = descriptor.item;
        existing.isCluster = descriptor.isCluster;
        existing.element.setAttribute('aria-label', getMarkerAriaLabel(descriptor.item));

        if (existing.positionSignature !== descriptor.positionSignature) {
          existing.overlay.setPosition(new kakaoMaps.LatLng(position.lat, position.lng));
          existing.positionSignature = descriptor.positionSignature;
        }

        if (existing.content !== descriptor.content) {
          existing.cleanupEvents();
          const element = createMarkerElement(descriptor.content);
          element.setAttribute('aria-label', getMarkerAriaLabel(descriptor.item));
          const cleanupEvents = bindMarkerEvents(element, descriptor.key);
          existing.overlay.setContent(element);
          existing.content = descriptor.content;
          existing.element = element;
          existing.cleanupEvents = cleanupEvents;
        }
        return;
      }

      try {
        const element = createMarkerElement(descriptor.content);
        element.setAttribute('aria-label', getMarkerAriaLabel(descriptor.item));
        const cleanupEvents = bindMarkerEvents(element, descriptor.key);
        const overlay = new kakaoMaps.CustomOverlay({
          position: new kakaoMaps.LatLng(position.lat, position.lng),
          content: element,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: descriptor.zIndex,
        });
        const entry: MarkerEntry = {
          overlay,
          item: descriptor.item,
          isCluster: descriptor.isCluster,
          content: descriptor.content,
          positionSignature: descriptor.positionSignature,
          element,
          cleanupEvents,
        };

        markerEntriesRef.current.set(descriptor.key, entry);
        overlay.setMap(mapInstance);
      } catch (error) {
        console.error(`마커 생성 실패 (${descriptor.key}):`, error);
      }
    });

    const nextCount = markerEntriesRef.current.size;
    setMarkersCount(current => (current === nextCount ? current : nextCount));
  }, [bindMarkerEvents, descriptors, mapInstance, mapStatus?.success]);

  useEffect(() => {
    if (activeMapRef.current && activeMapRef.current !== mapInstance) {
      clearMarkers();
    }
    activeMapRef.current = mapInstance ?? null;
  }, [clearMarkers, mapInstance]);

  useEffect(() => {
    reconcileMarkers();
  }, [reconcileMarkers]);

  useEffect(
    () => () => {
      disposeAllMarkers();
    },
    [disposeAllMarkers]
  );

  const highlightMarker = useCallback((facilityId: string, highlight = true) => {
    markerEntriesRef.current.forEach(entry => {
      if (entry.isCluster || String(entry.item.id) !== facilityId) return;

      entry.element.style.transform = highlight ? 'scale(1.2)' : 'scale(1)';
      entry.element.style.zIndex = highlight ? '1002' : '1000';
      entry.element.style.filter = highlight ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none';
    });
  }, []);

  const clearAllHighlights = useCallback(() => {
    markerEntriesRef.current.forEach(entry => {
      if (!entry.isCluster) {
        entry.element.style.transform = 'scale(1)';
        entry.element.style.zIndex = '1000';
        entry.element.style.filter = 'none';
      }
    });
  }, []);

  const toggleCategoryMarkers = useCallback((category: FacilityCategory, visible: boolean) => {
    markerEntriesRef.current.forEach(entry => {
      const markerCategory = isClusteredFacility(entry.item)
        ? entry.item.primaryCategory
        : entry.item.category;
      if (markerCategory === category) {
        entry.overlay.setVisible(visible);
      }
    });
  }, []);

  return {
    clearMarkers,
    createMarkers: reconcileMarkers,
    highlightMarker,
    clearAllHighlights,
    toggleCategoryMarkers,
    rebindAllMarkerEvents: reconcileMarkers,
    markersCount,
  };
};
