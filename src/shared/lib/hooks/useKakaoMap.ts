// hooks/useKakaoMap.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { KakaoMap, KakaoMapsAPI, WindowWithKakao } from '@/shared/lib/kakao';
import {
  KakaoSdkLoadError,
  loadKakaoSdk,
  DEFAULT_SDK_TIMEOUT_MS,
} from '@/shared/lib/kakao/load-sdk';
import { KAKAO_MAP_API_KEY } from '@/config/kakao';

interface MapPosition {
  lat: number;
  lng: number;
}

export interface UseKakaoMapOptions {
  containerId: string;
  /** 최초 중심. 이후 이동은 `setCenter`로 한다(변경해도 지도를 다시 만들지 않는다). */
  center: MapPosition;
  /** 최초 레벨. 이후 변경은 `setLevel`로 한다. */
  level?: number;
  /** 방향키·+/- 키 조작. 생성자 옵션으로만 동작하므로 여기서 받는다. */
  keyboardShortcuts?: boolean;
}

export type KakaoMapErrorCode =
  | 'sdk_load_failed'
  | 'sdk_timeout'
  | 'container_missing'
  | 'init_failed';

export interface KakaoMapStatus {
  loading: boolean;
  success: boolean;
  error: string | null;
  errorCode?: KakaoMapErrorCode;
}

/** 자동 재시도 간격(ms). 최초 시도 + 3회 재시도. */
export const KAKAO_MAP_RETRY_DELAYS_MS = [1000, 3000, 9000] as const;
const CONTAINER_WAIT_ATTEMPTS = 10;
const CONTAINER_WAIT_INTERVAL_MS = 100;

const ERROR_MESSAGES: Record<KakaoMapErrorCode, string> = {
  sdk_load_failed: '지도를 불러오지 못했어요',
  sdk_timeout: '지도를 불러오는 데 시간이 너무 오래 걸려요',
  container_missing: '지도를 표시할 영역을 찾지 못했어요',
  init_failed: '지도를 시작하지 못했어요',
};

const failedStatus = (errorCode: KakaoMapErrorCode): KakaoMapStatus => ({
  loading: false,
  success: false,
  error: ERROR_MESSAGES[errorCode],
  errorCode,
});

const LOADING_STATUS: KakaoMapStatus = { loading: true, success: false, error: null };
const READY_STATUS: KakaoMapStatus = { loading: false, success: true, error: null };

const wait = (ms: number, register: (timer: ReturnType<typeof setTimeout>) => void) =>
  new Promise<void>(resolve => {
    register(setTimeout(resolve, ms));
  });

export const useKakaoMap = ({
  containerId,
  center,
  level = 3,
  keyboardShortcuts = false,
}: UseKakaoMapOptions) => {
  const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
  const [mapStatus, setMapStatus] = useState<KakaoMapStatus>(LOADING_STATUS);
  const [attemptSeed, setAttemptSeed] = useState(0);
  // 최초 뷰 설정은 지도 생성 시점에만 읽는다. 이후 변경은 setCenter/setLevel 경로다.
  const initialViewRef = useRef({ center, level, keyboardShortcuts });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const registerTimer = (next: ReturnType<typeof setTimeout>) => {
      timer = next;
    };

    const findContainer = async (): Promise<HTMLElement | null> => {
      for (let attempt = 0; attempt < CONTAINER_WAIT_ATTEMPTS; attempt += 1) {
        const container = document.getElementById(containerId);
        if (container) return container;
        await wait(CONTAINER_WAIT_INTERVAL_MS, registerTimer);
        if (cancelled) return null;
      }
      return document.getElementById(containerId);
    };

    const createMap = async (maps: KakaoMapsAPI) => {
      const container = await findContainer();
      if (cancelled) return;
      if (!container) {
        setMapStatus(failedStatus('container_missing'));
        return;
      }

      try {
        const view = initialViewRef.current;
        const map = new maps.Map(container, {
          center: new maps.LatLng(view.center.lat, view.center.lng),
          level: view.level,
          scrollwheel: true,
          disableDoubleClick: false,
          disableDoubleClickZoom: false,
          keyboardShortcuts: view.keyboardShortcuts,
        });
        map.setZoomable(true);
        const bottomRight = maps.CopyrightPosition?.BOTTOMRIGHT;
        if (typeof map.setCopyrightPosition === 'function' && typeof bottomRight === 'number') {
          map.setCopyrightPosition(bottomRight, true);
        }
        setMapInstance(map);
        setMapStatus(READY_STATUS);
      } catch (error) {
        console.error('[useKakaoMap] 지도 생성 실패', error);
        setMapStatus(failedStatus('init_failed'));
      }
    };

    const run = async () => {
      let attempt = 0;
      while (!cancelled) {
        try {
          const maps = await loadKakaoSdk({
            appKey: KAKAO_MAP_API_KEY,
            timeoutMs: DEFAULT_SDK_TIMEOUT_MS,
          });
          if (cancelled) return;
          await createMap(maps);
          return;
        } catch (error) {
          const code: KakaoMapErrorCode =
            error instanceof KakaoSdkLoadError ? error.code : 'sdk_load_failed';
          if (attempt >= KAKAO_MAP_RETRY_DELAYS_MS.length) {
            if (!cancelled) {
              console.error('[useKakaoMap] 카카오맵 SDK 로드 실패', code);
              setMapStatus(failedStatus(code));
            }
            return;
          }
          const delay = KAKAO_MAP_RETRY_DELAYS_MS[attempt];
          attempt += 1;
          await wait(delay, registerTimer);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [containerId, attemptSeed]);

  useEffect(
    () => () => {
      setMapInstance(null);
    },
    []
  );

  /** 수동 재시도. 자동 재시도 횟수를 다 쓴 뒤 복구 버튼에서 호출한다. */
  const retry = useCallback(() => {
    setMapStatus(LOADING_STATUS);
    setAttemptSeed(seed => seed + 1);
  }, []);

  const setCenter = useCallback(
    (position: MapPosition) => {
      if (!mapInstance || typeof window === 'undefined') return;
      const maps = (window as WindowWithKakao).kakao?.maps;
      if (!maps) return;
      mapInstance.setCenter(new maps.LatLng(position.lat, position.lng));
    },
    [mapInstance]
  );

  const setLevel = useCallback(
    (newLevel: number) => {
      mapInstance?.setLevel(newLevel);
    },
    [mapInstance]
  );

  return {
    mapInstance,
    mapStatus,
    setCenter,
    setLevel,
    retry,
  };
};
