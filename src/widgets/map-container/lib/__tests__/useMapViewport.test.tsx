import { act, renderHook } from '@testing-library/react';
import type { Facility } from '@/lib/types';
import type { KakaoMap } from '@/shared/lib/kakao';
import { facilitiesInBounds, useMapViewport } from '../useMapViewport';

const facility = (id: string, lat: number, lng = 5): Facility => ({
  id,
  name: id,
  category: 'park',
  address: '서울',
  position: { lat, lng },
  congestionLevel: 'low',
});
const facilities = [
  facility('inside', 5),
  facility('edge', -0.4),
  facility('outer', -0.9),
  facility('far', -1.4),
  facility('farthest', -1.9),
  facility('outside', -2.1),
];
const bounds = { sw: { lat: 0, lng: 0 }, ne: { lat: 10, lng: 10 } };
const coordinate = (lat: number, lng: number) => ({ getLat: () => lat, getLng: () => lng });

it.each([
  [3, ['inside']],
  [5, ['inside', 'edge']],
  [7, ['inside', 'edge', 'outer']],
  [9, ['inside', 'edge', 'outer', 'far']],
  [10, ['inside', 'edge', 'outer', 'far', 'farthest']],
])('includes the appropriate edge margin at zoom %s', (level, expected) => {
  expect(facilitiesInBounds(facilities, bounds, level).map(item => item.id)).toEqual(expected);
});

describe('viewport events', () => {
  const listeners = new Map<string, () => void>();
  const map = {
    getBounds: jest.fn(() => ({
      getSouthWest: () => coordinate(0, 0),
      getNorthEast: () => coordinate(10, 10),
    })),
    getCenter: () => coordinate(5, 5),
    getLevel: () => 5,
  };
  const event = {
    addListener: jest.fn((_map, name, callback) => listeners.set(name, callback)),
    removeListener: jest.fn((_map, name) => listeners.delete(name)),
  };
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    listeners.clear();
    Object.defineProperty(window, 'kakao', { configurable: true, value: { maps: { event } } });
  });
  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(window, 'kakao');
  });

  it('coalesces idle events, uses the latest data/callbacks and removes listeners on unmount', () => {
    const visible = jest.fn();
    const idle = jest.fn();
    const click = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ rows }) =>
        useMapViewport({
          mapInstance: map as unknown as KakaoMap,
          ready: true,
          facilities: rows,
          onVisibleChange: visible,
          onIdle: idle,
          onClick: click,
        }),
      { initialProps: { rows: facilities } }
    );
    act(() => {
      listeners.get('idle')?.();
      listeners.get('idle')?.();
      jest.advanceTimersByTime(60);
    });
    expect(visible).toHaveBeenCalledTimes(1);
    expect(visible.mock.calls[0][0].map((item: Facility) => item.id)).toEqual(['inside', 'edge']);
    expect(idle).toHaveBeenCalledWith({ lat: 5, lng: 5 }, 5);
    act(() => listeners.get('click')?.());
    expect(click).toHaveBeenCalledTimes(1);
    rerender({ rows: [facility('replacement', 5)] });
    act(() => jest.advanceTimersByTime(60));
    expect(visible.mock.calls.at(-1)?.[0].map((item: Facility) => item.id)).toEqual([
      'replacement',
    ]);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('keeps all results available before a map is ready and when SDK bounds fail', () => {
    const visible = jest.fn();
    const { result, rerender } = renderHook(
      ({ ready }) =>
        useMapViewport({
          mapInstance: map as unknown as KakaoMap,
          ready,
          facilities,
          onVisibleChange: visible,
        }),
      { initialProps: { ready: false } }
    );
    act(() => result.current.refresh());
    expect(visible).toHaveBeenLastCalledWith(facilities);
    rerender({ ready: true });
    map.getBounds.mockImplementationOnce(() => {
      throw new Error('synthetic unavailable bounds');
    });
    act(() => result.current.refresh());
    expect(visible).toHaveBeenLastCalledWith(facilities);
  });
});
