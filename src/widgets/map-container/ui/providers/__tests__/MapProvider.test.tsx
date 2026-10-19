import React from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { useKakaoMap } from '@/shared/lib/hooks/useKakaoMap';
import { MapProvider, useMapContext } from '../MapProvider';

class LatLng {
  constructor(
    public lat: number,
    public lng: number
  ) {}
  getLat() {
    return this.lat;
  }
  getLng() {
    return this.lng;
  }
}
class Point {
  constructor(
    public x: number,
    public y: number
  ) {}
}
const mockProjection = {
  containerPointFromCoords: jest.fn(() => new Point(10, 20)),
  coordsFromContainerPoint: jest.fn(() => new LatLng(37.57, 126.98)),
};
const mockMap = {
  panTo: jest.fn(),
  setCenter: jest.fn(),
  setLevel: jest.fn(),
  relayout: jest.fn(),
  getLevel: jest.fn(() => 8),
  getCenter: jest.fn(() => new LatLng(37.56, 126.97)),
  getBounds: jest.fn(() => ({
    getSouthWest: () => new LatLng(37.5, 126.9),
    getNorthEast: () => new LatLng(37.6, 127),
  })),
  getProjection: jest.fn<typeof mockProjection | undefined, []>(() => mockProjection),
};
const mockKakao = {
  mapInstance: mockMap as typeof mockMap | null,
  mapStatus: { loading: false, success: true, error: null },
  retry: jest.fn(),
};
jest.mock('@/shared/lib/hooks/useKakaoMap', () => ({ useKakaoMap: jest.fn(() => mockKakao) }));
jest.mock('@/shared/lib/hooks/useZoomLevel', () => ({
  useZoomLevel: () => ({ zoomInfo: { level: 8 }, isZooming: false, searchRadius: 5 }),
}));

let context: ReturnType<typeof useMapContext>;
function Consumer() {
  const value = useMapContext();
  React.useEffect(() => {
    context = value;
  }, [value]);
  return null;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockKakao.mapInstance = mockMap;
  mockMap.getProjection.mockReturnValue(mockProjection);
  Object.defineProperty(window, 'kakao', {
    configurable: true,
    value: { maps: { LatLng, Point } },
  });
});
afterEach(() => {
  Reflect.deleteProperty(window, 'kakao');
});

it('forwards initial view, exposes bounds and center, and clamps all zoom commands', () => {
  render(
    <MapProvider initialCenter={{ lat: 37.55, lng: 126.95 }} initialZoom={6} containerId='map-test'>
      <Consumer />
    </MapProvider>
  );
  expect(useKakaoMap).toHaveBeenCalledWith({
    containerId: 'map-test',
    center: { lat: 37.55, lng: 126.95 },
    level: 6,
  });
  expect(context.getCenter()).toEqual({ lat: 37.56, lng: 126.97 });
  expect(context.getBounds()).toEqual({
    sw: { lat: 37.5, lng: 126.9 },
    ne: { lat: 37.6, lng: 127 },
  });
  context.setZoom(-5);
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(1, { animate: true });
  context.setZoom(20);
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(14, { animate: true });
  context.setZoom(4.6);
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(5, { animate: true });
  context.zoomIn();
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(7, { animate: true });
  context.zoomOut();
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(9, { animate: true });
});

it('pans and centers using SDK coordinates and offsets selected places above the mobile sheet', () => {
  render(
    <MapProvider>
      <Consumer />
    </MapProvider>
  );
  const destination = { lat: 37.58, lng: 126.99 };
  context.panTo(destination);
  expect(mockMap.panTo).toHaveBeenLastCalledWith(new LatLng(destination.lat, destination.lng));
  context.setCenter(destination);
  expect(mockMap.setCenter).toHaveBeenLastCalledWith(new LatLng(destination.lat, destination.lng));
  context.revealPosition(destination, { minLevel: 4 });
  expect(mockMap.setLevel).toHaveBeenLastCalledWith(4);
  expect(mockProjection.coordsFromContainerPoint).not.toHaveBeenCalled();
  act(() => context.setBottomInset(200));
  context.revealPosition(destination, { minLevel: 10 });
  expect(mockProjection.coordsFromContainerPoint).toHaveBeenLastCalledWith(new Point(10, 120));
  expect(mockMap.panTo).toHaveBeenLastCalledWith(new LatLng(37.57, 126.98));
  mockMap.getProjection.mockReturnValueOnce(undefined);
  context.revealPosition(destination);
  expect(mockMap.panTo).toHaveBeenLastCalledWith(new LatLng(destination.lat, destination.lng));
  context.relayout();
  expect(mockMap.relayout).toHaveBeenCalledTimes(1);
  context.retryMap();
  expect(mockKakao.retry).toHaveBeenCalledTimes(1);
});

it('safely leaves commands idle while a map or its SDK is unavailable', () => {
  mockKakao.mapInstance = null;
  render(
    <MapProvider>
      <Consumer />
    </MapProvider>
  );
  context.panTo({ lat: 37.5, lng: 127 });
  context.setCenter({ lat: 37.5, lng: 127 });
  context.revealPosition({ lat: 37.5, lng: 127 });
  context.setZoom(2);
  context.zoomIn();
  context.zoomOut();
  context.relayout();
  expect(context.getBounds()).toBeNull();
  expect(context.getCenter()).toBeNull();
  expect(mockMap.panTo).not.toHaveBeenCalled();
  expect(mockMap.setLevel).not.toHaveBeenCalled();
});

it('rejects a consumer mounted outside the map provider', () => {
  expect(() => renderHook(useMapContext)).toThrow(
    'useMapContext must be used within a MapProvider'
  );
});
