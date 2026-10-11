/**
 * @fileoverview 지도 컨텍스트 프로바이더
 * @description 카카오 지도 인스턴스와 조작 메서드, 시트가 가리는 영역(bottom inset)을 관리한다.
 */

'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useKakaoMap } from '@/shared/lib/hooks/useKakaoMap';
import { useZoomLevel } from '@/shared/lib/hooks/useZoomLevel';
import type { KakaoLatLng, KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import type { Position } from '@/lib/types';

export interface MapViewStatus {
  loading: boolean;
  success: boolean;
  error: string | null;
  errorCode?: string;
}

interface MapContextValue {
  mapInstance: KakaoMap | null;
  mapStatus: MapViewStatus;
  zoomLevel: number;
  isZooming: boolean;
  searchRadius: number;
  containerId: string;
  panTo: (position: Position) => void;
  setCenter: (position: Position) => void;
  /** 시트·패널이 가리지 않는 영역의 중앙에 좌표가 오도록 이동한다. */
  revealPosition: (position: Position, options?: { minLevel?: number }) => void;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getCenter: () => Position | null;
  getBounds: () => { sw: Position; ne: Position } | null;
  relayout: () => void;
  retryMap: () => void;
  /** 모바일 시트가 지도 하단을 가리는 높이(px) */
  bottomInset: number;
  setBottomInset: (px: number) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
  initialCenter?: Position;
  initialZoom?: number;
  containerId?: string;
  children: React.ReactNode;
}

type KakaoMapsNamespace = {
  LatLng: new (lat: number, lng: number) => unknown;
  Point: new (x: number, y: number) => unknown;
};

function getKakaoMaps(): KakaoMapsNamespace | null {
  if (typeof window === 'undefined') return null;
  const maps = (window as WindowWithKakao).kakao?.maps as unknown as KakaoMapsNamespace | undefined;
  return maps ?? null;
}

export function MapProvider({
  initialCenter = { lat: 37.5665, lng: 126.978 },
  initialZoom = 4,
  containerId = 'kakaoMap',
  children,
}: MapProviderProps) {
  const kakao = useKakaoMap({
    containerId,
    center: initialCenter,
    level: initialZoom,
  }) as ReturnType<typeof useKakaoMap> & { retry?: () => void; mapStatus: MapViewStatus };
  const { mapInstance, mapStatus } = kakao;
  const { zoomInfo, isZooming, searchRadius } = useZoomLevel({ mapInstance, mapStatus });
  const [bottomInset, setBottomInset] = useState(0);

  const toLatLng = useCallback((position: Position): KakaoLatLng | null => {
    const maps = getKakaoMaps();
    return maps ? (new maps.LatLng(position.lat, position.lng) as KakaoLatLng) : null;
  }, []);

  const panTo = useCallback(
    (position: Position) => {
      const latLng = toLatLng(position);
      if (mapInstance && latLng) mapInstance.panTo(latLng);
    },
    [mapInstance, toLatLng]
  );

  const setCenter = useCallback(
    (position: Position) => {
      const latLng = toLatLng(position);
      if (mapInstance && latLng) mapInstance.setCenter(latLng);
    },
    [mapInstance, toLatLng]
  );

  const setZoom = useCallback(
    (level: number) => {
      if (!mapInstance) return;
      const clamped = Math.min(14, Math.max(1, Math.round(level)));
      (
        mapInstance as unknown as {
          setLevel: (level: number, options?: { animate?: boolean }) => void;
        }
      ).setLevel(clamped, { animate: true });
    },
    [mapInstance]
  );

  const zoomIn = useCallback(() => {
    if (mapInstance) setZoom(mapInstance.getLevel() - 1);
  }, [mapInstance, setZoom]);

  const zoomOut = useCallback(() => {
    if (mapInstance) setZoom(mapInstance.getLevel() + 1);
  }, [mapInstance, setZoom]);

  const revealPosition = useCallback(
    (position: Position, options: { minLevel?: number } = {}) => {
      const maps = getKakaoMaps();
      if (!mapInstance || !maps) return;
      if (options.minLevel !== undefined && mapInstance.getLevel() > options.minLevel) {
        mapInstance.setLevel(options.minLevel);
      }
      const latLng = new maps.LatLng(position.lat, position.lng);
      const map = mapInstance as unknown as {
        getProjection?: () => {
          containerPointFromCoords: (latLng: unknown) => { x: number; y: number };
          coordsFromContainerPoint: (point: unknown) => unknown;
        };
        panTo: (latLng: unknown) => void;
      };
      const projection = map.getProjection?.();
      if (!projection || bottomInset <= 0) {
        map.panTo(latLng);
        return;
      }
      const point = projection.containerPointFromCoords(latLng);
      const target = projection.coordsFromContainerPoint(
        new maps.Point(point.x, point.y + bottomInset / 2)
      );
      map.panTo(target);
    },
    [bottomInset, mapInstance]
  );

  const getCenter = useCallback((): Position | null => {
    if (!mapInstance) return null;
    const center = mapInstance.getCenter();
    return { lat: center.getLat(), lng: center.getLng() };
  }, [mapInstance]);

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

  const relayout = useCallback(() => {
    (mapInstance as unknown as { relayout?: () => void } | null)?.relayout?.();
  }, [mapInstance]);

  const retryMap = useCallback(() => {
    if (kakao.retry) kakao.retry();
    else window.location.reload();
  }, [kakao]);

  const contextValue = useMemo<MapContextValue>(
    () => ({
      mapInstance,
      mapStatus: {
        loading: mapStatus.loading,
        success: mapStatus.success,
        error: mapStatus.error,
        errorCode: mapStatus.errorCode,
      },
      zoomLevel: zoomInfo.level,
      isZooming,
      searchRadius,
      containerId,
      panTo,
      setCenter,
      revealPosition,
      setZoom,
      zoomIn,
      zoomOut,
      getCenter,
      getBounds,
      relayout,
      retryMap,
      bottomInset,
      setBottomInset,
    }),
    [
      mapInstance,
      mapStatus.loading,
      mapStatus.success,
      mapStatus.error,
      mapStatus.errorCode,
      zoomInfo.level,
      isZooming,
      searchRadius,
      containerId,
      panTo,
      setCenter,
      revealPosition,
      setZoom,
      zoomIn,
      zoomOut,
      getCenter,
      getBounds,
      relayout,
      retryMap,
      bottomInset,
    ]
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
