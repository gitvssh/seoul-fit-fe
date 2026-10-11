import { useState, useEffect, useCallback, useRef } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';

export type ZoomRange = 'far' | 'medium' | 'close';

export interface ZoomLevelInfo {
  level: number;
  range: ZoomRange;
}

interface UseZoomLevelProps {
  mapInstance: KakaoMap | null | undefined;
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

const ZOOM_DEBOUNCE_MS = 300;

/**
 * 카카오 지도의 줌 레벨을 감지하고 범위별로 분류하는 Hook.
 * 리스너는 등록한 핸들러 참조 그대로 `removeListener(map, type, handler)`로 해제한다(코어 감사 D-22).
 */
export const useZoomLevel = ({ mapInstance, mapStatus }: UseZoomLevelProps) => {
  const [zoomInfo, setZoomInfo] = useState<ZoomLevelInfo>({
    level: 3,
    range: 'far',
  });

  const [isZooming, setIsZooming] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateZoomLevel = useCallback((level: number) => {
    setZoomInfo({ level, range: getZoomRange(level) });
  }, []);

  useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const kakaoMaps = (window as WindowWithKakao).kakao?.maps;
    if (!kakaoMaps?.event) return;

    const handleZoomStart = () => {
      setIsZooming(true);
    };

    const handleZoomChanged = () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        debounceTimeout.current = null;
        try {
          updateZoomLevel(mapInstance.getLevel());
        } catch (error) {
          console.error('줌 레벨 조회 실패:', error);
        }
        setIsZooming(false);
      }, ZOOM_DEBOUNCE_MS);
    };

    try {
      updateZoomLevel(mapInstance.getLevel());
      kakaoMaps.event.addListener(mapInstance, 'zoom_start', handleZoomStart);
      kakaoMaps.event.addListener(mapInstance, 'zoom_changed', handleZoomChanged);
    } catch (error) {
      console.error('줌 이벤트 리스너 등록 실패:', error);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
      try {
        kakaoMaps.event.removeListener(mapInstance, 'zoom_start', handleZoomStart);
        kakaoMaps.event.removeListener(mapInstance, 'zoom_changed', handleZoomChanged);
      } catch (error) {
        console.warn('줌 이벤트 리스너 제거 실패:', error);
      }
    };
  }, [mapInstance, mapStatus?.success, updateZoomLevel]);

  // 수동으로 줌 레벨 새로고침
  const refreshZoomLevel = useCallback(() => {
    if (!mapInstance) return;

    try {
      updateZoomLevel(mapInstance.getLevel());
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
