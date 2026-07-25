'use client';

import { useRef } from 'react';
import { useAuthStore } from '@/shared/model/authStore';
import { evaluateLocationTriggers } from '@/shared/api/triggers';

interface LocationCoords {
  lat: number;
  lng: number;
}

export const useLocationTrigger = () => {
  // Use separate selectors to avoid creating new objects
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastLocationRef = useRef<LocationCoords | null>(null);

  const callLocationTrigger = async (coords: LocationCoords) => {
    if (!isAuthenticated || !user || !accessToken) {
      return;
    }

    try {
      await evaluateLocationTriggers(
        {
          latitude: coords.lat,
          longitude: coords.lng,
          radius: 1000,
        },
        accessToken
      );
    } catch (error) {
      console.error('사용자 위치 기반 트리거 호출 실패:', error);
    }
  };

  const handleLocationChange = (coords: LocationCoords) => {
    if (!lastLocationRef.current) {
      lastLocationRef.current = coords;
      callLocationTrigger(coords).then();
      return;
    }

    const distance = getDistance(lastLocationRef.current, coords);
    if (distance > 100) {
      // 100m 이상 이동 시
      lastLocationRef.current = coords;
      callLocationTrigger(coords).then();
    }
  };

  const handleLoginSuccess = (coords?: LocationCoords) => {
    if (coords) {
      lastLocationRef.current = coords;
      callLocationTrigger(coords).then();
    }
  };

  return {
    handleLocationChange,
    handleLoginSuccess,
  };
};

// 두 좌표 간 거리 계산
function getDistance(pos1: LocationCoords, pos2: LocationCoords): number {
  const R = 6371e3;
  const p1 = (pos1.lat * Math.PI) / 180;
  const p2 = (pos2.lat * Math.PI) / 180;
  const a1 = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const a2 = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a =
    Math.sin(a1 / 2) * Math.sin(a1 / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(a2 / 2) * Math.sin(a2 / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
