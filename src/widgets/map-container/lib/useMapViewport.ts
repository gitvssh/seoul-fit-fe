'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Facility, Position } from '@/lib/types';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';

interface UseMapViewportOptions {
  mapInstance: KakaoMap | null;
  ready: boolean;
  /** 활성 카테고리로 거른 전체 장소 */
  facilities: Facility[];
  onVisibleChange: (visible: Facility[]) => void;
  onIdle?: (center: Position, level: number) => void;
  onClick?: () => void;
}

/** 줌 레벨별 화면 밖 여유 비율: 넓게 볼수록 가장자리 장소를 더 포함한다. */
function marginRatioFor(level: number): number {
  if (level <= 3) return 0;
  if (level <= 5) return 0.05;
  if (level <= 7) return 0.1;
  if (level <= 9) return 0.15;
  return 0.2;
}

export function facilitiesInBounds(
  facilities: Facility[],
  bounds: { sw: Position; ne: Position },
  level: number
): Facility[] {
  const ratio = marginRatioFor(level);
  const latMargin = (bounds.ne.lat - bounds.sw.lat) * ratio;
  const lngMargin = (bounds.ne.lng - bounds.sw.lng) * ratio;
  return facilities.filter(
    ({ position }) =>
      position.lat >= bounds.sw.lat - latMargin &&
      position.lat <= bounds.ne.lat + latMargin &&
      position.lng >= bounds.sw.lng - lngMargin &&
      position.lng <= bounds.ne.lng + lngMargin
  );
}

/**
 * 지도 화면 영역 안의 장소를 계산해 올리고, idle·click 이벤트를 연결한다.
 */
export function useMapViewport({
  mapInstance,
  ready,
  facilities,
  onVisibleChange,
  onIdle,
  onClick,
}: UseMapViewportOptions) {
  const facilitiesRef = useRef(facilities);
  facilitiesRef.current = facilities;
  const onVisibleChangeRef = useRef(onVisibleChange);
  onVisibleChangeRef.current = onVisibleChange;
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compute = useCallback(() => {
    if (!mapInstance || !ready) {
      onVisibleChangeRef.current(facilitiesRef.current);
      return;
    }
    try {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onVisibleChangeRef.current(
        facilitiesInBounds(
          facilitiesRef.current,
          {
            sw: { lat: sw.getLat(), lng: sw.getLng() },
            ne: { lat: ne.getLat(), lng: ne.getLng() },
          },
          mapInstance.getLevel()
        )
      );
    } catch {
      onVisibleChangeRef.current(facilitiesRef.current);
    }
  }, [mapInstance, ready]);

  const scheduleCompute = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(compute, 60);
  }, [compute]);

  // 장소 목록이 바뀌면 다시 계산한다.
  useEffect(() => {
    scheduleCompute();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [facilities, scheduleCompute]);

  useEffect(() => {
    if (!mapInstance || !ready) return;
    const maps = (window as WindowWithKakao).kakao?.maps;
    if (!maps) return;

    const handleIdle = () => {
      scheduleCompute();
      const center = mapInstance.getCenter();
      onIdleRef.current?.({ lat: center.getLat(), lng: center.getLng() }, mapInstance.getLevel());
    };
    const handleClick = () => onClickRef.current?.();

    maps.event.addListener(mapInstance, 'idle', handleIdle);
    maps.event.addListener(mapInstance, 'click', handleClick);
    scheduleCompute();
    return () => {
      maps.event.removeListener(mapInstance, 'idle', handleIdle);
      maps.event.removeListener(mapInstance, 'click', handleClick);
    };
  }, [mapInstance, ready, scheduleCompute]);

  return { refresh: compute };
}
