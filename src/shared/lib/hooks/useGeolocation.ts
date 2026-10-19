'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Position } from '@/lib/types';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface GeolocationState {
  status: GeolocationStatus;
  position: Position | null;
  accuracy: number | null;
  updatedAt: number | null;
}

const FIRST_REQUEST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 5 * 60 * 1000,
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

function statusFromError(error: GeolocationPositionError): GeolocationStatus {
  if (error.code === error.PERMISSION_DENIED) return 'denied';
  if (error.code === error.TIMEOUT) return 'timeout';
  return 'unavailable';
}

/**
 * 위치 권한을 사용자 행동 뒤에만 요청하는 지오로케이션 훅.
 * - 로드 시 자동 프롬프트를 띄우지 않는다. `request()`를 버튼에서 부른다.
 * - Permissions API로 이미 허용/거부된 상태를 읽어 불필요한 프롬프트와 오류 로그를 막는다.
 * - 설정에서 권한을 켜면(`PermissionStatus.onchange`) 자동으로 다시 시도한다.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: 'idle',
    position: null,
    accuracy: null,
    updatedAt: null,
  });
  const [permission, setPermission] = useState<PermissionState | 'unknown'>('unknown');
  const watchIdRef = useRef<number | null>(null);

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const request = useCallback((): Promise<Position | null> => {
    if (!supported) {
      setState(previous => ({ ...previous, status: 'unsupported' }));
      return Promise.resolve(null);
    }
    setState(previous => ({ ...previous, status: 'requesting' }));
    const updateFailure = (error: GeolocationPositionError) => {
      setState(previous => ({ ...previous, status: statusFromError(error) }));
    };
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        result => {
          const position = { lat: result.coords.latitude, lng: result.coords.longitude };
          setState({
            status: 'granted',
            position,
            accuracy: result.coords.accuracy,
            updatedAt: Date.now(),
          });
          resolve(position);
        },
        error => {
          updateFailure(error);
          resolve(null);
        },
        FIRST_REQUEST_OPTIONS
      );
    });
  }, [supported]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && supported) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [supported]);

  /** 현재 위치 마커 갱신용 감시. 지도 중심은 옮기지 않는다. */
  const startWatch = useCallback(() => {
    if (!supported || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      result => {
        setState({
          status: 'granted',
          position: { lat: result.coords.latitude, lng: result.coords.longitude },
          accuracy: result.coords.accuracy,
          updatedAt: Date.now(),
        });
      },
      error => {
        setState(previous => ({ ...previous, status: statusFromError(error) }));
        watchIdRef.current = null;
      },
      WATCH_OPTIONS
    );
  }, [supported]);

  useEffect(() => stopWatch, [stopWatch]);

  // Permissions API: 이미 결정된 권한을 읽고, 설정에서 바뀌면 반영한다.
  useEffect(() => {
    if (!supported || typeof navigator.permissions?.query !== 'function') return;
    let status: PermissionStatus | null = null;
    let cancelled = false;
    const onChange = () => {
      if (!status || cancelled) return;
      setPermission(status.state);
      if (status.state === 'denied') {
        setState(previous => ({ ...previous, status: 'denied' }));
      }
    };
    navigator.permissions
      .query({ name: 'geolocation' })
      .then(result => {
        if (cancelled) return;
        status = result;
        setPermission(result.state);
        if (result.state === 'denied') {
          setState(previous => ({ ...previous, status: 'denied' }));
        }
        result.addEventListener('change', onChange);
      })
      .catch(() => {
        // Permissions API가 geolocation을 지원하지 않는 브라우저: 요청 결과로만 판단한다.
      });
    return () => {
      cancelled = true;
      status?.removeEventListener('change', onChange);
    };
  }, [supported]);

  return { ...state, permission, supported, request, startWatch, stopWatch };
}
