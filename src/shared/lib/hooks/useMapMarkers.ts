// hooks/useMapMarkers.ts - Improved version with clustering
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import type { KakaoMap, KakaoCustomOverlay, WindowWithKakao } from '@/shared/lib/kakao';
import { createCustomMarkerContent } from '@/shared/lib/utils/marker';
import type { Facility, FacilityCategory, ClusteredFacility } from '@/lib/types';
import { FACILITY_CONFIGS, getFacilityIcon } from '@/shared/lib/icons/facility';

// 개선된 디바운싱 유틸리티
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);

    if (callNow) func(...args);
  };
};

interface UseMapMarkersProps {
  mapInstance: KakaoMap | null | undefined;
  mapStatus: { success: boolean; loading: boolean; error: string | null } | undefined;
  visibleFacilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
  onClusterSelect?: (cluster: ClusteredFacility) => void;
}

export const useMapMarkers = ({
  mapInstance,
  mapStatus,
  visibleFacilities,
  onFacilitySelect,
  onClusterSelect,
}: UseMapMarkersProps) => {
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const facilityDataRef = useRef<Map<string, Facility>>(new Map());
  const mapListenersRef = useRef<any[]>([]);
  const eventBindingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [markersCount, setMarkersCount] = React.useState(0);

  // 클러스터링된 데이터 메모화
  const { clusteredData, facilitiesMap } = useMemo(() => {
    const locationGroups = new Map<string, Facility[]>();
    const facilityMap = new Map<string, Facility>();

    visibleFacilities.forEach(facility => {
      facilityMap.set(facility.id, facility);
      const key = `${facility.position.lat.toFixed(6)},${facility.position.lng.toFixed(6)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(facility);
    });

    const clusters: ClusteredFacility[] = [];
    const singleFacilities: Facility[] = [];

    locationGroups.forEach((facilities, locationKey) => {
      if (facilities.length === 1) {
        singleFacilities.push(facilities[0]);
      } else {
        const categoryCounts: Record<FacilityCategory, number> = {} as Record<
          FacilityCategory,
          number
        >;
        facilities.forEach(facility => {
          categoryCounts[facility.category] = (categoryCounts[facility.category] || 0) + 1;
        });

        const primaryCategory = Object.entries(categoryCounts).sort(
          ([, a], [, b]) => b - a
        )[0][0] as FacilityCategory;

        clusters.push({
          id: `cluster-${locationKey}`,
          position: facilities[0].position,
          facilities,
          count: facilities.length,
          radius: 0.01, // 기본 반경
          primaryCategory,
        });
      }
    });

    return { clusteredData: { clusters, singleFacilities }, facilitiesMap: facilityMap };
  }, [visibleFacilities]);

  // 개선된 이벤트 바인딩 함수 (클러스터 지원)
  const bindMarkerEvent = useCallback(
    (item: Facility | ClusteredFacility, isCluster: boolean): void => {
      const markerId = `marker-${item.id}`;
      const markerElement = document.getElementById(markerId);

      if (!markerElement) return;
      if (markerElement.dataset.eventBound === 'true') return;

      const handleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isCluster) {
          const cluster = item as ClusteredFacility;
          console.log('[useMapMarkers] 클러스터 클릭:', {
            id: cluster.id,
            count: cluster.count,
            facilities: cluster.facilities.length,
            primaryCategory: cluster.primaryCategory
          });
          if (onClusterSelect) {
            onClusterSelect(cluster);
          }
        } else {
          const facility = item as Facility;
          console.log('[useMapMarkers] 마커 클릭:', {
            id: facility.id,
            name: facility.name,
            category: facility.category
          });
          onFacilitySelect(facility);
        }
      };

      const handleMouseEnter = () => {
        markerElement.style.transform = 'scale(1.1)';
        markerElement.style.zIndex = '1001';
        markerElement.style.transition = 'transform 0.2s ease-out';
      };

      const handleMouseLeave = () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = '1000';
      };

      markerElement.addEventListener('click', handleClick);
      markerElement.addEventListener('mouseenter', handleMouseEnter);
      markerElement.addEventListener('mouseleave', handleMouseLeave);

      markerElement.dataset.eventBound = 'true';
      markerElement.dataset.cleanup = 'pending';
    },
    [onFacilitySelect, onClusterSelect]
  );

  // 배치로 이벤트 바인딩 (클러스터 포함)
  const bindAllMarkerEvents = useCallback(() => {
    clusteredData.singleFacilities.forEach(facility => {
      bindMarkerEvent(facility, false);
    });
    clusteredData.clusters.forEach(cluster => {
      bindMarkerEvent(cluster, true);
    });
  }, [clusteredData, bindMarkerEvent]);

  // 최적화된 디바운싱 함수
  const debouncedEventBinding = useCallback(debounce(bindAllMarkerEvents, 50, false), [ // 더 빠른 반응
    bindAllMarkerEvents,
  ]);

  // 모든 마커 제거 (메모리 누수 방지)
  const clearMarkers = useCallback(() => {
    // 기존 이벤트 리스너 정리
    facilityDataRef.current.forEach(facility => {
      const markerElement = document.getElementById(`marker-${facility.id}`);
      if (markerElement && markerElement.dataset.cleanup === 'pending') {
        // 이벤트 리스너 제거는 overlay.setMap(null)에서 자동으로 처리됨
        markerElement.dataset.eventBound = 'false';
        markerElement.dataset.cleanup = 'done';
      }
    });

    // 커스텀 오버레이 제거
    customOverlaysRef.current.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch (error) {
        console.error('마커 제거 중 오류:', error);
      }
    });

    // DOM에서 직접 마커 엘리먼트 제거 (중복 방지)
    const allMarkers = document.querySelectorAll('[id^="marker-"]');
    allMarkers.forEach(marker => {
      marker.remove();
    });

    customOverlaysRef.current = [];
    facilityDataRef.current.clear();
  }, []);

  // 마커 생성 (성능 최적화 + 클러스터링)
  const createMarkers = useCallback(() => {
    if (!mapInstance || !mapStatus?.success) {
      return;
    }

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) {
      return;
    }

    const kakaoMaps = windowWithKakao.kakao.maps;
    
    // 디버깅 로그
    console.log(`[useMapMarkers] 마커 생성 시작: ${visibleFacilities.length}개 시설`);
    
    // 카테고리별 시설 수 확인
    const categoryCount: Record<string, number> = {};
    visibleFacilities.forEach(f => {
      categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
    });
    console.log('[useMapMarkers] 카테고리별 시설 수:', categoryCount);
    
    // position이 잘못된 시설 확인
    const invalidPositions = visibleFacilities.filter(f => 
      !f.position || f.position.lat === 0 || f.position.lng === 0
    );
    if (invalidPositions.length > 0) {
      console.warn('[useMapMarkers] position이 없거나 0인 시설:', invalidPositions.length, '개');
      console.warn('[useMapMarkers] 문제 시설 샘플:', invalidPositions.slice(0, 3));
    }

    // 기존 마커 제거 (중요: 먼저 제거)
    clearMarkers();

    // 새 커스텀 오버레이 생성 (배치 처리)
    const newOverlays: KakaoCustomOverlay[] = [];

    // 단일 시설 마커 생성
    clusteredData.singleFacilities.forEach((facility, index) => {
      try {
        const facilityConfig = FACILITY_CONFIGS[facility.category];
        if (!facilityConfig) return;

        // 첫 몇 개 시설의 좌표 로그
        if (index < 3 && (facility.category === 'park' || facility.category === 'library')) {
          console.log(`[useMapMarkers] ${facility.category} 마커 생성:`, {
            id: facility.id,
            name: facility.name,
            position: facility.position,
            raw: facility
          });
        }

        const overlayPosition = new kakaoMaps.LatLng(facility.position.lat, facility.position.lng);
        const markerContent = createCustomMarkerContent(
          facility.category,
          facility.congestionLevel,
          facility.id,
          facility
        );

        const customOverlay = new kakaoMaps.CustomOverlay({
          position: overlayPosition,
          content: markerContent,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 1000,
        });

        customOverlay.setMap(mapInstance);
        newOverlays.push(customOverlay);
        facilityDataRef.current.set(facility.id, facility);
      } catch (error) {
        console.error(`마커 생성 실패 (ID: ${facility.id}):`, error);
      }
    });

    // 클러스터 마커 생성
    clusteredData.clusters.forEach(cluster => {
      try {
        // 클러스터의 대표 시설 정보 가져오기 (지하철역인 경우 호선 정보 포함)
        const representativeFacility =
          cluster.facilities.find(f => f.category === cluster.primaryCategory) ||
          cluster.facilities[0];
        const primaryIcon = getFacilityIcon(cluster.primaryCategory, representativeFacility);
        const overlayPosition = new kakaoMaps.LatLng(cluster.position.lat, cluster.position.lng);

        const clusterContent = `
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

        const customOverlay = new kakaoMaps.CustomOverlay({
          position: overlayPosition,
          content: clusterContent,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 1001,
        });

        customOverlay.setMap(mapInstance);
        newOverlays.push(customOverlay);
        facilityDataRef.current.set(cluster.id, cluster as any);
      } catch (error) {
        console.error(`클러스터 마커 생성 실패 (ID: ${cluster.id}):`, error);
      }
    });

    customOverlaysRef.current = newOverlays;
    setMarkersCount(newOverlays.length); // 마커 개수 상태 업데이트
    console.log(`[useMapMarkers] 마커 생성 완료: ${newOverlays.length}개 마커, ${clusteredData.clusters.length}개 클러스터`);

    // 이벤트 바인딩 (약간의 지연 후 실행)
    if (eventBindingTimeoutRef.current) {
      clearTimeout(eventBindingTimeoutRef.current);
    }

    eventBindingTimeoutRef.current = setTimeout(() => {
      bindAllMarkerEvents();
    }, 50); // 더 빠른 이벤트 바인딩
  }, [mapInstance, mapStatus?.success, clusteredData, clearMarkers, bindAllMarkerEvents]);

  // 특정 시설의 마커 하이라이트 (성능 최적화)
  const highlightMarker = useCallback((facilityId: string, highlight: boolean = true) => {
    const markerElement = document.getElementById(`marker-${facilityId}`);
    if (!markerElement) return;

    if (highlight) {
      markerElement.style.transform = 'scale(1.2)';
      markerElement.style.zIndex = '1002';
      markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
      markerElement.style.transition = 'all 0.2s ease-out';
    } else {
      markerElement.style.transform = 'scale(1)';
      markerElement.style.zIndex = '1000';
      markerElement.style.filter = 'none';
      markerElement.style.transition = 'all 0.2s ease-out';
    }
  }, []);

  // 모든 마커 하이라이트 해제
  const clearAllHighlights = useCallback(() => {
    facilityDataRef.current.forEach((_, facilityId) => {
      highlightMarker(facilityId, false);
    });
  }, [highlightMarker]);

  // 특정 카테고리의 마커만 표시/숨김
  const toggleCategoryMarkers = useCallback((category: FacilityCategory, visible: boolean) => {
    facilityDataRef.current.forEach((facility, facilityId) => {
      if (facility.category === category) {
        const markerElement = document.getElementById(`marker-${facilityId}`);
        if (markerElement) {
          markerElement.style.display = visible ? 'block' : 'none';
          markerElement.style.transition = 'opacity 0.2s ease-out';
          markerElement.style.opacity = visible ? '1' : '0';
        }
      }
    });
  }, []);

  // 시설 변경 시 마커 업데이트 (디바운싱 적용)
  const [updateKey, setUpdateKey] = React.useState(0);
  
  useEffect(() => {
    // 마커 업데이트를 디바운싱하여 중복 생성 방지
    const timer = setTimeout(() => {
      createMarkers();
    }, 200); // 200ms 디바운싱
    
    return () => clearTimeout(timer);
  }, [visibleFacilities, mapInstance, mapStatus?.success]); // createMarkers 의존성 제거

  // 지도 이벤트 리스너 등록 (최적화)
  useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    // 지도 이벤트 리스너들 (디바운싱 적용)
    const zoomListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance,
      'zoom_changed',
      debouncedEventBinding
    );

    const dragEndListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance,
      'dragend',
      debouncedEventBinding
    );

    // 리스너 참조 저장
    mapListenersRef.current = [zoomListener, dragEndListener];

    return () => {
      // 이벤트 리스너 제거
      const kakaoMaps = windowWithKakao.kakao?.maps;
      if (kakaoMaps) {
        mapListenersRef.current.forEach(listener => {
          try {
            kakaoMaps.event.removeListener(mapInstance, 'zoom_changed', listener);
          } catch (error) {
            console.error('이벤트 리스너 제거 실패:', error);
          }
        });
        mapListenersRef.current = [];
      }
    };
  }, [mapInstance, mapStatus?.success, debouncedEventBinding]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 타이머 정리
      if (eventBindingTimeoutRef.current) {
        clearTimeout(eventBindingTimeoutRef.current);
      }

      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    clearMarkers,
    createMarkers,
    highlightMarker,
    clearAllHighlights,
    toggleCategoryMarkers,
    rebindAllMarkerEvents: bindAllMarkerEvents,
    markersCount, // 상태 변수 사용
  };
};
