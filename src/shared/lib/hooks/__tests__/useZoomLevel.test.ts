import { act, renderHook } from '@testing-library/react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { useZoomLevel } from '../useZoomLevel';

describe('useZoomLevel', () => {
  const handlers = new Map<string, () => void>();
  const addListener = jest.fn((_target: unknown, type: string, handler: () => void) => {
    handlers.set(type, handler);
  });
  const removeListener = jest.fn();
  const map = { getLevel: jest.fn(() => 5) } as unknown as KakaoMap;

  beforeEach(() => {
    jest.useFakeTimers();
    handlers.clear();
    (map.getLevel as jest.Mock).mockReturnValue(5);
    addListener.mockClear();
    removeListener.mockClear();
    const windowWithKakao = window as WindowWithKakao;
    windowWithKakao.kakao = {
      maps: {
        ...(windowWithKakao.kakao?.maps as NonNullable<typeof windowWithKakao.kakao>['maps']),
        event: { addListener, removeListener, trigger: jest.fn() },
      },
    } as unknown as typeof windowWithKakao.kakao;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('removes the exact handlers it registered and clears the debounce timer', () => {
    const { result, unmount } = renderHook(() =>
      useZoomLevel({ mapInstance: map, mapStatus: { success: true, loading: false, error: null } })
    );

    expect(result.current.zoomInfo.level).toBe(5);
    expect(addListener).toHaveBeenCalledWith(map, 'zoom_start', expect.any(Function));
    expect(addListener).toHaveBeenCalledWith(map, 'zoom_changed', expect.any(Function));

    (map.getLevel as jest.Mock).mockReturnValue(7);
    act(() => {
      handlers.get('zoom_start')?.();
      handlers.get('zoom_changed')?.();
    });
    expect(result.current.isZooming).toBe(true);

    unmount();

    expect(removeListener).toHaveBeenCalledWith(map, 'zoom_start', handlers.get('zoom_start'));
    expect(removeListener).toHaveBeenCalledWith(map, 'zoom_changed', handlers.get('zoom_changed'));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('debounces zoom changes before publishing the new level', () => {
    const { result } = renderHook(() =>
      useZoomLevel({ mapInstance: map, mapStatus: { success: true, loading: false, error: null } })
    );

    (map.getLevel as jest.Mock).mockReturnValue(9);
    act(() => {
      handlers.get('zoom_changed')?.();
    });
    expect(result.current.zoomInfo.level).toBe(5);

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.zoomInfo.level).toBe(9);
    expect(result.current.isZooming).toBe(false);
  });
});
