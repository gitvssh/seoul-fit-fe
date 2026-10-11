import { renderHook } from '@testing-library/react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { useCurrentLocationMarker } from '../useCurrentLocationMarker';

interface OverlayMock {
  options: { content: HTMLElement; zIndex: number; clickable: boolean };
  setMap: jest.Mock;
  setPosition: jest.Mock;
}

describe('useCurrentLocationMarker', () => {
  const overlays: OverlayMock[] = [];
  const map = {} as KakaoMap;
  const status = { success: true, loading: false, error: null };

  beforeEach(() => {
    overlays.length = 0;
    class CustomOverlayMock implements OverlayMock {
      options: OverlayMock['options'];
      setMap = jest.fn();
      setPosition = jest.fn();
      constructor(options: OverlayMock['options']) {
        this.options = options;
        overlays.push(this);
      }
    }
    const windowWithKakao = window as WindowWithKakao;
    windowWithKakao.kakao = {
      maps: {
        ...(windowWithKakao.kakao?.maps as NonNullable<typeof windowWithKakao.kakao>['maps']),
        LatLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
        CustomOverlay: CustomOverlayMock,
      },
    } as unknown as typeof windowWithKakao.kakao;
  });

  it('renders nothing until a real position exists', () => {
    const { rerender } = renderHook(
      ({ lat, lng }: { lat?: number; lng?: number }) =>
        useCurrentLocationMarker({ mapInstance: map, mapStatus: status, lat, lng }),
      { initialProps: {} }
    );
    expect(overlays).toHaveLength(0);

    rerender({ lat: Number.NaN, lng: 127 });
    expect(overlays).toHaveLength(0);
  });

  it('creates one overlay on the focus layer and moves it instead of recreating it', () => {
    const { rerender } = renderHook(
      ({ lat, lng }: { lat?: number; lng?: number }) =>
        useCurrentLocationMarker({ mapInstance: map, mapStatus: status, lat, lng, label: 'Here' }),
      { initialProps: { lat: 37.5, lng: 127 } as { lat?: number; lng?: number } }
    );

    expect(overlays).toHaveLength(1);
    const overlay = overlays[0];
    expect(overlay.options.zIndex).toBe(30);
    expect(overlay.options.clickable).toBe(false);
    expect(overlay.options.content.getAttribute('role')).toBe('img');
    expect(overlay.options.content.getAttribute('aria-label')).toBe('Here');
    expect(overlay.setMap).toHaveBeenCalledWith(map);

    rerender({ lat: 37.51, lng: 127.01 });
    expect(overlays).toHaveLength(1);
    expect(overlay.setPosition).toHaveBeenCalledWith({ lat: 37.51, lng: 127.01 });

    rerender({ lat: undefined, lng: undefined });
    expect(overlay.setMap).toHaveBeenLastCalledWith(null);
  });

  it('removes the overlay on unmount', () => {
    const { unmount } = renderHook(() =>
      useCurrentLocationMarker({ mapInstance: map, mapStatus: status, lat: 37.5, lng: 127 })
    );
    unmount();
    expect(overlays[0].setMap).toHaveBeenLastCalledWith(null);
  });
});
