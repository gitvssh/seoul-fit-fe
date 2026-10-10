/**
 * @fileoverview 지도 컨텍스트 프로바이더
 * @description 지도 인스턴스와 관련 상태를 관리하는 컨텍스트 프로바이더
 * @author Seoul Fit Team
 * @since 2.0.0
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useKakaoMap } from '@/shared/lib/hooks/useKakaoMap';
import { useLocation } from '@/shared/lib/hooks/useLocation';
import { useZoomLevel } from '@/shared/lib/hooks/useZoomLevel';
import type { Position, MapStatus } from '@/lib/types';

// 지도 컨텍스트 타입 정의
interface MapContextValue {
  // 지도 인스턴스
  mapInstance: any | null; // KakaoMap 타입 대신 any 사용
  mapStatus: MapStatus;

  // 위치 관련
  currentLocation: Position | null;
  moveToCurrentLocation: () => Promise<void>;
  setCurrentLocation: (location: Position) => void;

  // 줌 관련
  zoomInfo: {
    level: number;
    minLevel: number;
    maxLevel: number;
    isZooming: boolean;
  };
  searchRadius: number;

  // 지도 조작 메서드
  panTo: (position: Position) => void;
  setZoom: (level: number) => void;
  getBounds: () => { sw: Position; ne: Position } | null;

  // 이벤트 핸들러
  onMapClick: (position: Position) => void;
  onMapIdle: () => void;
}

// 컨텍스트 생성
const MapContext = createContext<MapContextValue | null>(null);

// 지도 프로바이더 Props
interface MapProviderProps {
  /** 초기 중심 좌표 */
  initialCenter?: Position;
  /** 초기 줌 레벨 */
  initialZoom?: number;
  /** 지도 컨테이너 ID */
  containerId?: string;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 지도 클릭 핸들러 */
  onMapClick?: (position: Position) => void;
  /** 지도 유휴 상태 핸들러 */
  onMapIdle?: () => void;
}

/**
 * 지도 컨텍스트 프로바이더 컴포넌트
 */
export function MapProvider({
  initialCenter = { lat: 37.5665, lng: 126.978 },
  initialZoom = 3,
  containerId = 'kakaoMap',
  children,
  onMapClick,
  onMapIdle,
}: MapProviderProps) {
  // console.log('[MapProvider] 렌더링 시작', { initialCenter, initialZoom, containerId });
  // 지도 인스턴스 생성
  const { mapInstance, mapStatus } = useKakaoMap({
    containerId,
    center: initialCenter,
    level: initialZoom,
  });

  // 위치 관련 훅
  const { currentLocation, moveToCurrentLocation, setCurrentLocation } = useLocation(mapInstance);

  // 줌 레벨 관련 훅
  const { zoomInfo, isZooming, searchRadius } = useZoomLevel({
    mapInstance,
    mapStatus,
  });

  // 지도 조작 메서드들
  const panTo = useCallback(
    (position: Position) => {
      if (mapInstance && typeof window !== 'undefined') {
        const windowWithKakao = window as any;
        if (windowWithKakao.kakao?.maps) {
          const kakaoLatLng = new windowWithKakao.kakao.maps.LatLng(position.lat, position.lng);
          mapInstance.panTo(kakaoLatLng);
        }
      }
    },
    [mapInstance]
  );

  const setZoom = useCallback(
    (level: number) => {
      if (mapInstance) {
        mapInstance.setLevel(level);
      }
    },
    [mapInstance]
  );

  const getBounds = useCallback(() => {
    if (!mapInstance) return null;

    const bounds = mapInstance.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    };
  }, [mapInstance]);

  // 이벤트 핸들러들
  const handleMapClick = useCallback(
    (position: Position) => {
      onMapClick?.(position);
    },
    [onMapClick]
  );

  const handleMapIdle = useCallback(() => {
    onMapIdle?.();
  }, [onMapIdle]);

  // 컨텍스트 값 메모이제이션
  const contextValue = useMemo<MapContextValue>(
    () => ({
      // 지도 인스턴스
      mapInstance,
      mapStatus: {
        ...mapStatus,
        initialized: !!mapInstance,
        ready: !!mapInstance && mapStatus.success,
      },

      // 위치 관련
      currentLocation: currentLocation
        ? {
            lat: currentLocation.latitude || currentLocation.coords?.lat || 0,
            lng: currentLocation.longitude || currentLocation.coords?.lng || 0,
          }
        : null,
      moveToCurrentLocation: async () => {
        moveToCurrentLocation();
      },
      setCurrentLocation: (location: Position) => {
        setCurrentLocation({
          address: '',
          coords: { lat: location.lat, lng: location.lng },
          type: 'current',
          latitude: location.lat,
          longitude: location.lng,
        });
      },

      // 줌 관련
      zoomInfo: {
        level: zoomInfo.level,
        minLevel: (zoomInfo.range as any).min || 1,
        maxLevel: (zoomInfo.range as any).max || 14,
        isZooming,
      },
      searchRadius,

      // 지도 조작 메서드
      panTo,
      setZoom,
      getBounds,

      // 이벤트 핸들러
      onMapClick: handleMapClick,
      onMapIdle: handleMapIdle,
    }),
    [
      mapInstance,
      mapStatus,
      currentLocation,
      moveToCurrentLocation,
      setCurrentLocation,
      zoomInfo,
      isZooming,
      searchRadius,
      panTo,
      setZoom,
      getBounds,
      handleMapClick,
      handleMapIdle,
    ]
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
}

/**
 * 지도 컨텍스트를 사용하는 훅
 * @returns 지도 컨텍스트 값
 * @throws MapProvider 외부에서 사용 시 에러
 */
export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }

  return context;
}

/**
 * 지도 인스턴스만 필요한 경우 사용하는 훅
 * @returns 지도 인스턴스와 상태
 */
export function useMapInstance() {
  const { mapInstance, mapStatus } = useMapContext();
  return { mapInstance, mapStatus };
}

/**
 * 지도 위치 관련 기능만 필요한 경우 사용하는 훅
 * @returns 위치 관련 상태와 메서드
 */
export function useMapLocation() {
  const { currentLocation, moveToCurrentLocation, setCurrentLocation, panTo } = useMapContext();

  return {
    currentLocation,
    moveToCurrentLocation,
    setCurrentLocation,
    panTo,
  };
}

/**
 * 지도 줌 관련 기능만 필요한 경우 사용하는 훅
 * @returns 줌 관련 상태와 메서드
 */
export function useMapZoom() {
  const { zoomInfo, searchRadius, setZoom } = useMapContext();

  return {
    zoomInfo,
    searchRadius,
    setZoom,
  };
}

/**
 * 지도 경계 정보가 필요한 경우 사용하는 훅
 * @returns 지도 경계 관련 메서드
 */
export function useMapBounds() {
  const { getBounds } = useMapContext();

  return {
    getBounds,
  };
}
