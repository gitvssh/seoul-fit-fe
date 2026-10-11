import { act, renderHook } from '@testing-library/react';
import { KAKAO_SDK_SCRIPT_ATTRIBUTE } from '@/shared/lib/kakao/load-sdk';
import { KAKAO_MAP_RETRY_DELAYS_MS, useKakaoMap } from '../useKakaoMap';

jest.mock('@/config/kakao', () => ({ KAKAO_MAP_API_KEY: 'test-map-key' }));

type KakaoWindow = Window & { kakao?: unknown };

const CONTAINER_ID = 'kakaoMap';

const createMapMock = () => ({
  setZoomable: jest.fn(),
  setCopyrightPosition: jest.fn(),
  setCenter: jest.fn(),
  setLevel: jest.fn(),
});

const installKakao = (mapMock = createMapMock()) => {
  const maps = {
    Map: jest.fn(() => mapMock),
    LatLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
    CopyrightPosition: { BOTTOMLEFT: 0, BOTTOMRIGHT: 1 },
    load: jest.fn((callback: () => void) => callback()),
  };
  (window as KakaoWindow).kakao = { maps };
  return { maps, mapMock };
};

const findScript = () =>
  document.querySelector<HTMLScriptElement>(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`);

const settle = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });

const fireScriptLoad = async () => {
  const installed = installKakao();
  const script = findScript();
  expect(script).not.toBeNull();
  await act(async () => {
    script?.dispatchEvent(new Event('load'));
  });
  await settle();
  return installed;
};

const renderMap = (keyboardShortcuts = true) =>
  renderHook(() =>
    useKakaoMap({
      containerId: CONTAINER_ID,
      center: { lat: 37.5665, lng: 126.978 },
      level: 3,
      keyboardShortcuts,
    })
  );

describe('useKakaoMap', () => {
  const originalKakao = (window as KakaoWindow).kakao;
  let container: HTMLDivElement;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    delete (window as KakaoWindow).kakao;
    document.head.querySelectorAll('script').forEach(script => script.remove());
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
    container.remove();
    jest.useRealTimers();
    (window as KakaoWindow).kakao = originalKakao;
  });

  it('loads the SDK once and creates the map with keyboard shortcuts as a constructor option', async () => {
    const { result } = renderMap();
    expect(result.current.mapStatus).toEqual({ loading: true, success: false, error: null });

    const { maps, mapMock } = await fireScriptLoad();

    expect(result.current.mapStatus).toEqual({ loading: false, success: true, error: null });
    expect(result.current.mapInstance).toBe(mapMock);
    expect(maps.Map).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ level: 3, keyboardShortcuts: true })
    );
    expect(mapMock.setCopyrightPosition).toHaveBeenCalledWith(1, true);
    expect(document.querySelectorAll(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('retries with backoff after a script error and succeeds on the next attempt', async () => {
    const { result } = renderMap();
    const failed = findScript();
    await act(async () => {
      failed?.dispatchEvent(new Event('error'));
    });
    await settle();

    expect(result.current.mapStatus.loading).toBe(true);
    expect(findScript()).toBeNull();

    await advance(KAKAO_MAP_RETRY_DELAYS_MS[0] - 1);
    expect(findScript()).toBeNull();
    await advance(1);
    expect(findScript()).not.toBeNull();

    await fireScriptLoad();
    expect(result.current.mapStatus.success).toBe(true);
  });

  it('reports sdk_timeout once every automatic retry has timed out', async () => {
    const { result } = renderMap();

    for (const delay of KAKAO_MAP_RETRY_DELAYS_MS) {
      await advance(8000);
      expect(result.current.mapStatus.loading).toBe(true);
      await advance(delay);
      expect(findScript()).not.toBeNull();
    }
    await advance(8000);

    expect(result.current.mapStatus).toMatchObject({
      loading: false,
      success: false,
      errorCode: 'sdk_timeout',
    });
    expect(result.current.mapStatus.error).toEqual(expect.any(String));
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(findScript()).toBeNull();
  });

  it('starts over when retry() is called after the final failure', async () => {
    const { result } = renderMap();
    for (const delay of KAKAO_MAP_RETRY_DELAYS_MS) {
      await advance(8000);
      await advance(delay);
    }
    await advance(8000);
    expect(result.current.mapStatus.errorCode).toBe('sdk_timeout');

    await act(async () => {
      result.current.retry();
    });

    expect(result.current.mapStatus).toEqual({ loading: true, success: false, error: null });
    expect(findScript()).not.toBeNull();

    await fireScriptLoad();
    expect(result.current.mapStatus.success).toBe(true);
  });

  it('reports container_missing when the map element never appears', async () => {
    container.remove();
    const { result } = renderMap();
    await fireScriptLoad();

    // 컨테이너 대기는 한 번에 하나씩 타이머를 건다. 가짜 타이머에서는 시도 횟수만큼 차례로 진행한다.
    for (let attempt = 0; attempt <= 12; attempt += 1) {
      await advance(100);
      await settle();
    }

    expect(result.current.mapStatus).toMatchObject({
      loading: false,
      success: false,
      errorCode: 'container_missing',
    });
  });

  it('reports init_failed when the SDK throws while creating the map', async () => {
    const { result } = renderMap();
    const script = findScript();
    (window as KakaoWindow).kakao = {
      maps: {
        Map: jest.fn(() => {
          throw new Error('boom');
        }),
        LatLng: jest.fn(),
        load: jest.fn((callback: () => void) => callback()),
      },
    };
    await act(async () => {
      script?.dispatchEvent(new Event('load'));
    });
    await settle();

    expect(result.current.mapStatus).toMatchObject({ success: false, errorCode: 'init_failed' });
  });
});
