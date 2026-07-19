import { useState, useEffect, useCallback, useRef } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';

export type ZoomRange = 'far' | 'medium' | 'close';

export interface ZoomLevelInfo {
  level: number;
  range: ZoomRange;
}

interface UseZoomLevelProps {
  mapInstance: any;
  mapStatus?: { success: boolean; loading: boolean; error: string | null };
}

/**
 * 줌 레벨을 범위별로 분류하는 함수
 */
const getZoomRange = (level: number): ZoomRange => {
  if (level <= 10) return 'far';
  if (level <= 13) return 'medium';
  return 'close';
};

/**
 * 줌 레벨별 검색 반경을 계산하는 함수 (km)
 */
export const getSearchRadius = (zoomRange: ZoomRange): number => {
  switch (zoomRange) {
    case 'far':
      return 5.0; // 넓은 범위 검색
    case 'medium':
      return 2.0; // 중간 범위 검색
    case 'close':
      return 1.0; // 좁은 범위 검색
    default:
      return 2.0;
  }
};

/**
 * 카카오 지도의 줌 레벨을 감지하고 범위별로 분류하는 Hook
 */
export const useZoomLevel = ({ mapInstance, mapStatus }: UseZoomLevelProps) => {
  const [zoomInfo, setZoomInfo] = useState<ZoomLevelInfo>({
    level: 3,
    range: 'far',
  });

  const [isZooming, setIsZooming] = useState(false);
  const zoomStartListener = useRef<any>(null);
  const zoomChangedListener = useRef<any>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // 줌 레벨 업데이트 함수
  const updateZoomLevel = useCallback((level: number) => {
    const range = getZoomRange(level);
    setZoomInfo({ level, range });
  }, []);

  // 디바운스된 줌 변경 핸들러
  const debouncedZoomUpdate = useCallback(
    (level: number) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        updateZoomLevel(level);
        setIsZooming(false);
      }, 300);
    },
    [updateZoomLevel]
  );

  // 줌 시작 핸들러
  const handleZoomStart = useCallback(() => {
    setIsZooming(true);
  }, []);

  // 줌 변경 핸들러
  const handleZoomChanged = useCallback(() => {
    if (!mapInstance) return;

    try {
      const currentLevel = mapInstance.getLevel();
      debouncedZoomUpdate(currentLevel);
    } catch (error) {
      console.error('줌 레벨 조회 실패:', error);
    }
  }, [mapInstance, debouncedZoomUpdate]);

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps?.event) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    try {
      // 초기 줌 레벨 설정
      const initialLevel = mapInstance.getLevel();
      updateZoomLevel(initialLevel);

      // 줌 이벤트 리스너 등록
      zoomStartListener.current = kakaoMaps.event.addListener(
        mapInstance,
        'zoom_start',
        handleZoomStart
      );

      zoomChangedListener.current = kakaoMaps.event.addListener(
        mapInstance,
        'zoom_changed',
        handleZoomChanged
      );
    } catch (error) {
      console.error('줌 이벤트 리스너 등록 실패:', error);
    }

    return () => {
      try {
        if (kakaoMaps.event && zoomStartListener.current && zoomChangedListener.current) {
          (kakaoMaps.event as any).removeListener?.(zoomStartListener.current);
          (kakaoMaps.event as any).removeListener?.(zoomChangedListener.current);
        }
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      } catch (error) {
        console.warn('줌 이벤트 리스너 제거 실패:', error);
      }
    };
  }, [mapInstance, mapStatus?.success, updateZoomLevel, handleZoomStart, handleZoomChanged]);

  // 수동으로 줌 레벨 새로고침
  const refreshZoomLevel = useCallback(() => {
    if (!mapInstance) return;

    try {
      const currentLevel = mapInstance.getLevel();
      updateZoomLevel(currentLevel);
    } catch (error) {
      console.error('줌 레벨 새로고침 실패:', error);
    }
  }, [mapInstance, updateZoomLevel]);

  return {
    zoomInfo,
    isZooming,
    searchRadius: getSearchRadius(zoomInfo.range),
    refreshZoomLevel,
  };
};
