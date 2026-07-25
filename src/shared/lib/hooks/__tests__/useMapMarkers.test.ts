import { act, renderHook } from '@testing-library/react';
import type { Facility } from '@/lib/types';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { useMapMarkers } from '../useMapMarkers';

const createFacility = (id: string, lat: number, lng: number): Facility => ({
  id,
  name: `시설 ${id}`,
  category: 'park',
  position: { lat, lng },
  address: '서울시',
  congestionLevel: 'low',
});

describe('useMapMarkers', () => {
  const overlayInstances: Array<{
    setMap: jest.Mock;
    setPosition: jest.Mock;
    setContent: jest.Mock;
    setVisible: jest.Mock;
  }> = [];

  beforeEach(() => {
    overlayInstances.length = 0;

    class CustomOverlayMock {
      setMap = jest.fn();
      setPosition = jest.fn();
      setContent = jest.fn();
      setVisible = jest.fn();

      constructor() {
        overlayInstances.push(this);
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

  it('reuses retained overlays and only removes markers that left the viewport', () => {
    const map = {} as KakaoMap;
    const first = createFacility('first', 37.5, 127);
    const retained = createFacility('retained', 37.51, 127.01);
    const added = createFacility('added', 37.52, 127.02);
    const onFacilitySelect = jest.fn();

    const { rerender } = renderHook(
      ({ facilities }: { facilities: Facility[] }) =>
        useMapMarkers({
          mapInstance: map,
          mapStatus: { success: true, loading: false, error: null },
          visibleFacilities: facilities,
          onFacilitySelect,
        }),
      { initialProps: { facilities: [first, retained] } }
    );

    expect(overlayInstances).toHaveLength(2);
    const firstOverlay = overlayInstances[0];
    const retainedOverlay = overlayInstances[1];

    act(() => {
      rerender({ facilities: [retained, added] });
    });

    expect(overlayInstances).toHaveLength(3);
    expect(firstOverlay.setMap).toHaveBeenLastCalledWith(null);
    expect(retainedOverlay.setMap).toHaveBeenCalledTimes(1);
    expect(retainedOverlay.setMap).toHaveBeenLastCalledWith(map);
  });

  it('normalizes numeric public-data IDs before creating marker DOM content', () => {
    const numericIdFacility = {
      ...createFacility('831', 37.55, 126.99),
      id: 831 as unknown as string,
    };

    renderHook(() =>
      useMapMarkers({
        mapInstance: {} as KakaoMap,
        mapStatus: { success: true, loading: false, error: null },
        visibleFacilities: [numericIdFacility],
        onFacilitySelect: jest.fn(),
      })
    );

    expect(overlayInstances.length).toBeGreaterThan(0);
  });
});
