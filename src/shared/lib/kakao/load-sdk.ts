/**
 * 카카오맵 SDK 로더.
 *
 * `useKakaoMap`이 쓰는 1회 시도 단위다. 재시도(백오프)는 호출부가 맡고, 이 모듈은
 * "실패한 `<script>` 태그를 제거하고 새로 넣는다"는 규칙(인터랙션 조사 §8)과
 * 로드 타임아웃을 책임진다. 같은 태그를 두 호출자가 기다릴 수 있도록 태그의
 * 진행 상태를 `data-kakao-sdk` 속성에 기록한다.
 */
import type { KakaoMapsAPI, WindowWithKakao } from './index';

export type KakaoSdkErrorCode = 'sdk_load_failed' | 'sdk_timeout';

export class KakaoSdkLoadError extends Error {
  readonly code: KakaoSdkErrorCode;

  constructor(code: KakaoSdkErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'KakaoSdkLoadError';
    this.code = code;
  }
}

export const KAKAO_SDK_SCRIPT_ATTRIBUTE = 'data-kakao-sdk';
export const DEFAULT_SDK_TIMEOUT_MS = 8000;
export const DEFAULT_SDK_LIBRARIES = ['clusterer'] as const;

type ScriptState = 'loading' | 'loaded' | 'failed';

export interface LoadKakaoSdkOptions {
  appKey: string;
  libraries?: readonly string[];
  timeoutMs?: number;
}

export const buildKakaoSdkUrl = (
  appKey: string,
  libraries: readonly string[] = DEFAULT_SDK_LIBRARIES
): string => {
  const params = new URLSearchParams({ appkey: appKey, autoload: 'false' });
  if (libraries.length > 0) {
    params.set('libraries', libraries.join(','));
  }
  return `https://dapi.kakao.com/v2/maps/sdk.js?${params.toString()}`;
};

const LIBRARY_POLL_INTERVAL_MS = 50;
/** 라이브러리 스크립트가 core 뒤에 붙을 때까지 기다리는 상한. 넘기면 라이브러리 없이 진행한다. */
export const LIBRARY_GRACE_MS = 2000;

/** 라이브러리 이름 → 로드 완료를 뜻하는 `kakao.maps` 전역 */
const LIBRARY_GLOBALS: Record<string, string> = {
  clusterer: 'MarkerClusterer',
  services: 'services',
  drawing: 'drawing',
};

/** 요청한 라이브러리의 전역이 전부 있는지 */
export const hasLibraries = (maps: KakaoMapsAPI, libraries: readonly string[]): boolean =>
  libraries.every(library => {
    const globalName = LIBRARY_GLOBALS[library];
    return !globalName || Boolean((maps as unknown as Record<string, unknown>)[globalName]);
  });

/**
 * 요청한 라이브러리 전역이 생길 때까지 짧게 기다린다. 카카오 SDK는 `load()` 콜백 뒤에
 * 라이브러리 스크립트를 붙이는 경우가 있어, 바로 resolve 하면 clusterer가 없는 채로 지도가 만들어진다.
 * 상한을 넘기면 라이브러리 없이 계속한다(호출부가 비클러스터 폴백을 가진다).
 */
const waitForLibraries = (
  maps: KakaoMapsAPI,
  libraries: readonly string[],
  onReady: () => void,
  isCancelled: () => boolean = () => false
) => {
  const deadline = Date.now() + LIBRARY_GRACE_MS;
  const poll = () => {
    if (isCancelled()) return;
    if (hasLibraries(maps, libraries) || Date.now() >= deadline) {
      onReady();
      return;
    }
    setTimeout(poll, LIBRARY_POLL_INTERVAL_MS);
  };
  poll();
};

/** 지도 생성이 가능한 상태의 `kakao.maps`, 아니면 null */
export const getLoadedKakaoMaps = (): KakaoMapsAPI | null => {
  if (typeof window === 'undefined') return null;
  const maps = (window as WindowWithKakao).kakao?.maps;
  return maps && typeof maps.Map === 'function' ? maps : null;
};

const getPendingKakaoMaps = (): KakaoMapsAPI | null => {
  if (typeof window === 'undefined') return null;
  const maps = (window as WindowWithKakao).kakao?.maps;
  return maps && typeof maps.load === 'function' ? maps : null;
};

export const findKakaoSdkScript = (): HTMLScriptElement | null =>
  typeof document === 'undefined'
    ? null
    : document.querySelector<HTMLScriptElement>(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`);

const setScriptState = (script: HTMLScriptElement, state: ScriptState) => {
  script.setAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE, state);
};

/**
 * SDK 스크립트를 로드하고 `kakao.maps.load()`까지 끝낸 뒤 `kakao.maps`를 돌려준다.
 * 이미 로드돼 있으면 즉시 resolve 한다. 실패하면 태그를 제거하고 코드가 있는 오류로 reject 한다.
 */
export const loadKakaoSdk = ({
  appKey,
  libraries = DEFAULT_SDK_LIBRARIES,
  timeoutMs = DEFAULT_SDK_TIMEOUT_MS,
}: LoadKakaoSdkOptions): Promise<KakaoMapsAPI> =>
  new Promise<KakaoMapsAPI>((resolve, reject) => {
    const ready = getLoadedKakaoMaps();
    if (ready) {
      waitForLibraries(ready, libraries, () => resolve(ready));
      return;
    }

    if (!appKey) {
      reject(new KakaoSdkLoadError('sdk_load_failed', 'missing app key'));
      return;
    }

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let script: HTMLScriptElement | null = null;

    const cleanupListeners = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };

    const fail = (code: KakaoSdkErrorCode) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      // 실패한 태그를 남겨 두면 다음 시도가 같은 실패를 다시 기다리므로 즉시 제거한다.
      if (script) {
        setScriptState(script, 'failed');
        script.remove();
      }
      reject(new KakaoSdkLoadError(code));
    };

    const succeed = (maps: KakaoMapsAPI) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      resolve(maps);
    };

    const isSettled = () => settled;
    const waitUntilReady = (loaded: KakaoMapsAPI) => {
      waitForLibraries(loaded, libraries, () => succeed(loaded), isSettled);
    };

    const initialize = () => {
      const maps = getPendingKakaoMaps();
      if (!maps) {
        fail('sdk_load_failed');
        return;
      }
      if (script) setScriptState(script, 'loaded');
      maps.load(() => {
        const loaded = getLoadedKakaoMaps();
        if (!loaded) {
          fail('sdk_load_failed');
          return;
        }
        waitUntilReady(loaded);
      });
    };

    function handleLoad() {
      initialize();
    }

    function handleError() {
      fail('sdk_load_failed');
    }

    // `autoload=false` 스크립트는 로드됐지만 `kakao.maps.load()`만 남은 상태일 수 있다.
    if (getPendingKakaoMaps()) {
      timer = setTimeout(() => fail('sdk_timeout'), timeoutMs);
      initialize();
      return;
    }

    const existing = findKakaoSdkScript();
    if (existing) {
      const state = existing.getAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE);
      if (state === 'loading') {
        // 다른 호출자가 넣은 태그가 아직 로드 중이면 같은 태그를 기다린다.
        script = existing;
        timer = setTimeout(() => fail('sdk_timeout'), timeoutMs);
        existing.addEventListener('load', handleLoad);
        existing.addEventListener('error', handleError);
        return;
      }
      // 실패했거나 로드됐는데 API가 없는 태그는 재시도 전에 반드시 제거한다.
      existing.remove();
    }

    script = document.createElement('script');
    script.async = true;
    script.src = buildKakaoSdkUrl(appKey, libraries);
    setScriptState(script, 'loading');
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    timer = setTimeout(() => fail('sdk_timeout'), timeoutMs);
    document.head.appendChild(script);
  });
