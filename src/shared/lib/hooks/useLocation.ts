import { useState, useCallback, useEffect, useRef } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { useLocationTrigger } from './useLocationTrigger';

export interface LocationInfo {
  address: string;
  coords: { lat: number; lng: number };
  type: 'current' | 'searched';
  // 기존 코드 호환성
  latitude?: number;
  longitude?: number;
}

// Simple location interface for testing
export interface SimpleLocation {
  lat: number;
  lng: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Simple useLocation hook for testing (overloaded function)
export function useLocation(): {
  location: SimpleLocation | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
  watchId: number | null;
  getCurrentLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
};

export function useLocation(options: LocationOptions): {
  location: SimpleLocation | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
  watchId: number | null;
  getCurrentLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
};

// Kakao Map version
export function useLocation(mapInstance: any): {
  currentLocation: LocationInfo | null;
  moveToCurrentLocation: () => void;
  setCurrentLocation: (location: LocationInfo | null) => void;
};

export function useLocation(mapInstanceOrOptions?: any): any {
  // All hooks must be declared at the top level, before any conditional logic
  const [location, setLocation] = useState<SimpleLocation | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { handleLocationChange } = useLocationTrigger();

  // Determine the mode
  const isSimpleMode = !mapInstanceOrOptions || (mapInstanceOrOptions && typeof mapInstanceOrOptions === 'object' && !mapInstanceOrOptions.setCenter);
  const mapInstance = isSimpleMode ? null : mapInstanceOrOptions;
  const options = isSimpleMode ? (mapInstanceOrOptions as LocationOptions | undefined) : undefined;

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 300000,
    ...options,
  };

  // Simple location callbacks
  const getCurrentLocation = useCallback(() => {
    if (!isSimpleMode) return;
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported',
      } as GeolocationPositionError);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      defaultOptions
    );
  }, [isSimpleMode, defaultOptions]);

  const watchPosition = useCallback(() => {
    if (!isSimpleMode) return;
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported',
      } as GeolocationPositionError);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
      },
      (err) => {
        setError(err);
      },
      defaultOptions
    );

    setWatchId(id);
  }, [isSimpleMode, defaultOptions]);

  const stopWatching = useCallback(() => {
    if (!isSimpleMode) return;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [isSimpleMode, watchId]);

  // Kakao Map callbacks
  const startLocationTracking = useCallback(() => {
    if (isSimpleMode || !mapInstance || !navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      console.log('이미 위치 추적 중');
      return;
    }

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    console.log('실시간 위치 추적 시작');

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 지도 중심을 새 위치로 이동
        mapInstance.setCenter(new kakaoMaps.LatLng(lat, lng));

        const coords = { lat, lng };
        setCurrentLocation({
          address: '현재 위치',
          coords,
          type: 'current',
        });

        // 위치 변화 시 트리거는 useEffect에서 처리
      },
      error => {
        console.error('GPS 오류:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    watchIdRef.current = watchId;
  }, [isSimpleMode, mapInstance, setCurrentLocation]); // handleLocationChange 대신 setCurrentLocation 사용

  const moveToCurrentLocation = useCallback(() => {
    if (isSimpleMode || !mapInstance || !navigator.geolocation) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 지도 중심을 현재 위치로 이동
        mapInstance.setCenter(new kakaoMaps.LatLng(lat, lng));

        const coords = { lat, lng };
        setCurrentLocation({
          address: '현재 위치',
          coords,
          type: 'current',
        });

        // 위치 추적도 자동 시작
        startLocationTracking();
        
        // 위치 트리거는 useEffect에서 처리
      },
      error => {
        console.error('위치 정보를 가져올 수 없습니다:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [isSimpleMode, mapInstance, startLocationTracking]);

  // Effect to handle location changes
  useEffect(() => {
    if (!isSimpleMode && currentLocation?.coords) {
      handleLocationChange(currentLocation.coords);
    }
  }, [currentLocation, isSimpleMode, handleLocationChange]);

  // Effects
  useEffect(() => {
    if (isSimpleMode) {
      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }
  }, [isSimpleMode, watchId]);

  useEffect(() => {
    if (!isSimpleMode && mapInstance) {
      // 위치 추적 자동 시작 - 한 번만 실행
      const timer = setTimeout(() => {
        startLocationTracking();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSimpleMode, mapInstance]); // startLocationTracking를 의존성에서 제거

  useEffect(() => {
    if (!isSimpleMode) {
      // 컴포넌트 언마운트 시 위치 추적 중지
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }
  }, [isSimpleMode]);

  // Return based on mode
  if (isSimpleMode) {
    return {
      location,
      error,
      loading,
      accuracy,
      watchId,
      getCurrentLocation,
      watchPosition,
      stopWatching,
    };
  }

  return {
    currentLocation,
    moveToCurrentLocation,
    setCurrentLocation,
  };
}
