// hooks/useCurrentLocationMarker.ts
import { useEffect, useRef } from 'react';
import type { KakaoCustomOverlay, KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import {
  createCurrentLocationElement,
  DEFAULT_MARKER_LABELS,
  MARKER_Z,
} from '@/shared/lib/utils/marker';

interface UseCurrentLocationMarkerProps {
  mapInstance: KakaoMap | null | undefined;
  mapStatus: { success: boolean; loading?: boolean; error?: string | null } | undefined;
  /** 실제 측위 좌표. 없으면(undefined/null/NaN) 아무것도 그리지 않는다. */
  lat?: number | null;
  lng?: number | null;
  /** 접근성 이름(기본 '현재 위치') */
  label?: string;
}

interface LocationOverlay {
  overlay: KakaoCustomOverlay;
  element: HTMLElement;
}

const isFiniteCoordinate = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * 현재 위치 점. 좌표 primitive만 의존해 재렌더마다 오버레이를 다시 만들지 않고
 * `setPosition`으로 옮긴다(코어 감사 D-13). 포커스 계층 z-order `MARKER_Z.me`.
 */
export const useCurrentLocationMarker = ({
  mapInstance,
  mapStatus,
  lat,
  lng,
  label = DEFAULT_MARKER_LABELS.currentLocation,
}: UseCurrentLocationMarkerProps): void => {
  const overlayRef = useRef<LocationOverlay | null>(null);
  const ready = Boolean(mapInstance && mapStatus?.success);
  const hasPosition = isFiniteCoordinate(lat) && isFiniteCoordinate(lng);

  useEffect(() => {
    const maps = (window as WindowWithKakao).kakao?.maps;

    if (!ready || !mapInstance || !maps || !hasPosition) {
      overlayRef.current?.overlay.setMap(null);
      overlayRef.current = null;
      return;
    }

    const position = new maps.LatLng(lat as number, lng as number);
    const current = overlayRef.current;

    if (current) {
      current.overlay.setPosition(position);
      current.element.setAttribute('aria-label', label);
      return;
    }

    const element = createCurrentLocationElement(label);
    const overlay = new maps.CustomOverlay({
      position,
      content: element,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: MARKER_Z.me,
      clickable: false,
    });
    overlay.setMap(mapInstance);
    overlayRef.current = { overlay, element };
  }, [ready, mapInstance, hasPosition, lat, lng, label]);

  useEffect(
    () => () => {
      overlayRef.current?.overlay.setMap(null);
      overlayRef.current = null;
    },
    [mapInstance]
  );
};
