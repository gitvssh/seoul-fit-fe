import {
  KAKAO_SDK_SCRIPT_ATTRIBUTE,
  LIBRARY_GRACE_MS,
  KakaoSdkLoadError,
  buildKakaoSdkUrl,
  loadKakaoSdk,
} from '../load-sdk';

type KakaoWindow = Window & { kakao?: unknown };

const installKakao = ({ clusterer = true }: { clusterer?: boolean } = {}) => {
  const maps: Record<string, unknown> = {
    Map: jest.fn(),
    LatLng: jest.fn(),
    load: jest.fn((callback: () => void) => callback()),
  };
  if (clusterer) maps.MarkerClusterer = jest.fn();
  (window as KakaoWindow).kakao = { maps };
  return maps;
};

const findScript = () =>
  document.querySelector<HTMLScriptElement>(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`);

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('loadKakaoSdk', () => {
  const originalKakao = (window as KakaoWindow).kakao;

  beforeEach(() => {
    jest.useFakeTimers();
    delete (window as KakaoWindow).kakao;
    document.head.querySelectorAll('script').forEach(script => script.remove());
  });

  afterEach(() => {
    jest.useRealTimers();
    (window as KakaoWindow).kakao = originalKakao;
  });

  it('requests the clusterer library with autoload disabled', () => {
    const url = new URL(buildKakaoSdkUrl('key-1'));
    expect(url.origin).toBe('https://dapi.kakao.com');
    expect(url.searchParams.get('appkey')).toBe('key-1');
    expect(url.searchParams.get('libraries')).toBe('clusterer');
    expect(url.searchParams.get('autoload')).toBe('false');
  });

  it('resolves immediately when the SDK is already usable', async () => {
    const maps = installKakao();
    await expect(loadKakaoSdk({ appKey: 'key-1' })).resolves.toBe(maps);
    expect(findScript()).toBeNull();
  });

  it('waits for the clusterer library to attach before resolving', async () => {
    const maps = installKakao({ clusterer: false });
    const resolved = jest.fn();
    void loadKakaoSdk({ appKey: 'key-1' }).then(resolved);
    await flush();
    expect(resolved).not.toHaveBeenCalled();
    maps.MarkerClusterer = jest.fn();
    jest.advanceTimersByTime(100);
    await flush();
    expect(resolved).toHaveBeenCalledWith(maps);
    expect(findScript()).toBeNull();
  });

  it('gives up waiting for a library after the grace period and resolves anyway', async () => {
    const maps = installKakao({ clusterer: false });
    const resolved = jest.fn();
    void loadKakaoSdk({ appKey: 'key-1' }).then(resolved);
    jest.advanceTimersByTime(LIBRARY_GRACE_MS + 100);
    await flush();
    expect(resolved).toHaveBeenCalledWith(maps);
  });

  it('rejects without inserting a script when the app key is missing', async () => {
    await expect(loadKakaoSdk({ appKey: '' })).rejects.toMatchObject({ code: 'sdk_load_failed' });
    expect(findScript()).toBeNull();
  });

  it('inserts one tagged script and resolves after kakao.maps.load()', async () => {
    const promise = loadKakaoSdk({ appKey: 'key-1' });
    const script = findScript();

    expect(script).not.toBeNull();
    expect(script?.getAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE)).toBe('loading');
    expect(script?.async).toBe(true);

    const maps = installKakao();
    script?.dispatchEvent(new Event('load'));

    await expect(promise).resolves.toBe(maps);
    expect(maps.load).toHaveBeenCalledTimes(1);
    expect(script?.getAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE)).toBe('loaded');
  });

  it('removes the failed script tag so the next attempt starts clean', async () => {
    const promise = loadKakaoSdk({ appKey: 'key-1' });
    const script = findScript();
    script?.dispatchEvent(new Event('error'));

    await expect(promise).rejects.toBeInstanceOf(KakaoSdkLoadError);
    await expect(promise).rejects.toMatchObject({ code: 'sdk_load_failed' });
    expect(findScript()).toBeNull();
    expect(script?.isConnected).toBe(false);
  });

  it('times out after 8 seconds and removes the tag', async () => {
    const promise = loadKakaoSdk({ appKey: 'key-1' });
    expect(findScript()).not.toBeNull();

    jest.advanceTimersByTime(7999);
    expect(findScript()).not.toBeNull();
    jest.advanceTimersByTime(1);

    await expect(promise).rejects.toMatchObject({ code: 'sdk_timeout' });
    expect(findScript()).toBeNull();
  });

  it('replaces a leftover failed tag instead of waiting on it', async () => {
    const stale = document.createElement('script');
    stale.setAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE, 'failed');
    document.head.appendChild(stale);

    void loadKakaoSdk({ appKey: 'key-1' }).catch(() => undefined);

    const scripts = document.head.querySelectorAll(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).not.toBe(stale);
    expect(scripts[0].getAttribute(KAKAO_SDK_SCRIPT_ATTRIBUTE)).toBe('loading');
  });

  it('lets a second caller wait on the tag that is already loading', async () => {
    const first = loadKakaoSdk({ appKey: 'key-1' });
    const second = loadKakaoSdk({ appKey: 'key-1' });
    expect(document.head.querySelectorAll(`script[${KAKAO_SDK_SCRIPT_ATTRIBUTE}]`)).toHaveLength(1);

    const maps = installKakao();
    findScript()?.dispatchEvent(new Event('load'));
    await flush();

    await expect(first).resolves.toBe(maps);
    await expect(second).resolves.toBe(maps);
  });
});
