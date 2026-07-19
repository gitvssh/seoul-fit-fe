// hooks/useCurrentLocationMarker.ts
import { useEffect, useRef, useCallback } from 'react';
import type { KakaoMap, KakaoMarker, WindowWithKakao } from '@/shared/lib/kakao';

// 디바운싱 유틸리티
const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface UseCurrentLocationMarkerProps {
  mapInstance: KakaoMap | null;
  mapStatus: { success: boolean; loading?: boolean; error?: string | null };
  currentLocation: { coords: { lat: number; lng: number } } | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

export const useCurrentLocationMarker = ({
  mapInstance,
  mapStatus,
  currentLocation,
  onLocationChange,
}: UseCurrentLocationMarkerProps) => {
  const markerRef = useRef<KakaoMarker | null>(null);

  // 마커 생성
  const createMarker = useCallback(
    (lat: number, lng: number) => {
      if (!mapInstance || !mapStatus.success) return;

      const windowWithKakao = window as WindowWithKakao;
      if (!windowWithKakao.kakao?.maps) return;

      const kakaoMaps = windowWithKakao.kakao.maps;

      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // 커스텀 오버레이로 현재 위치 마커 생성 (더 명확한 스타일링)
      const markerContent = `
        <div style="
          position: relative;
          width: 50px;
          height: 50px;
          cursor: move;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: rgba(66, 133, 244, 0.2);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.8;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.4;
              }
              100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.8;
              }
            }
          </style>
        </div>
      `;

      const customOverlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(lat, lng),
        content: markerContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 999,
      });

      customOverlay.setMap(mapInstance);

      // 드래그 기능을 위한 표준 마커 (투명하게 처리)
      const invisibleMarker = new kakaoMaps.Marker({
        position: new kakaoMaps.LatLng(lat, lng),
        draggable: true,
        opacity: 0,
        zIndex: 998,
      });

      invisibleMarker.setMap(mapInstance);

      // 드래그 종료 시 위치 업데이트 (디바운싱 적용)
      const debouncedLocationChange = debounce((lat: number, lng: number) => {
        if (onLocationChange) {
          console.log(`마커 드래그로 위치 변경: ${lat}, ${lng}`);
          onLocationChange(lat, lng);
        }
      }, 1000); // 1초 디바운싱

      // 드래그 중일 때 커스텀 오버레이도 함께 이동
      kakaoMaps.event.addListener(invisibleMarker, 'drag', () => {
        const position = invisibleMarker.getPosition();
        customOverlay.setPosition(position);
      });

      kakaoMaps.event.addListener(invisibleMarker, 'dragend', () => {
        const position = invisibleMarker.getPosition();
        const newLat = position.getLat();
        const newLng = position.getLng();

        // 커스텀 오버레이 위치 업데이트
        customOverlay.setPosition(position);

        // 지도 중심을 마커 위치로 이동
        mapInstance.setCenter(position);

        // 디바운싱된 위치 변경 콜백 호출
        debouncedLocationChange(newLat, newLng);
      });

      // 기존 마커 참조를 커스텀 오버레이와 투명 마커 둘 다 저장
      markerRef.current = {
        setMap: (map: any) => {
          customOverlay.setMap(map);
          invisibleMarker.setMap(map);
        },
      } as KakaoMarker;
    },
    [mapInstance, mapStatus.success, onLocationChange]
  );

  // 현재 위치 있으면 마커 생성
  useEffect(() => {
    if (currentLocation?.coords) {
      createMarker(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [currentLocation, createMarker]);

  // 정리
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return {};
};
