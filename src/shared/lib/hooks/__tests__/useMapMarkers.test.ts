import { act, renderHook } from '@testing-library/react';
import type { Facility } from '@/lib/types';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { getFacilityMarkerId, useMapMarkers, type UseMapMarkersProps } from '../useMapMarkers';

const createFacility = (id: string, lat: number, lng: number, category: Facility['category'] = 'park'): Facility => ({
  id,
  name: `시설 ${id}`,
  category,
  position: { lat, lng },
  address: '서울시',
  congestionLevel: 'low',
});

interface LatLngMock {
  lat: number;
  lng: number;
  getLat: () => number;
  getLng: () => number;
}

const latLng = (lat: number, lng: number): LatLngMock => ({
  lat,
  lng,
  getLat: () => lat,
  getLng: () => lng,
});

class CustomOverlayMock {
  options: { content: HTMLElement; position: LatLngMock; zIndex?: number; clickable?: boolean };
  map: unknown = null;
  setMap = jest.fn((map: unknown) => {
    this.map = map;
  });
  setPosition = jest.fn();
  setContent = jest.fn();
  setVisible = jest.fn();
  setZIndex = jest.fn();

  constructor(options: CustomOverlayMock['options']) {
    this.options = options;
    overlayInstances.push(this);
  }

  getPosition() {
    return this.options.position;
  }

  getContent() {
    return this.options.content;
  }

  getMap() {
    return this.map;
  }
}

class MarkerClustererMock {
  options: Record<string, unknown>;
  markers: CustomOverlayMock[] = [];
  addMarkers = jest.fn((markers: CustomOverlayMock[]) => {
    this.markers.push(...markers);
  });
  removeMarkers = jest.fn((markers: CustomOverlayMock[]) => {
    this.markers = this.markers.filter(marker => !markers.includes(marker));
  });
  redraw = jest.fn();
  clear = jest.fn(() => {
    this.markers = [];
  });
  setMap = jest.fn();

  constructor(options: Record<string, unknown>) {
    this.options = options;
    clustererInstances.push(this);
  }
}

const overlayInstances: CustomOverlayMock[] = [];
const clustererInstances: MarkerClustererMock[] = [];
const listeners = new Map<object, Map<string, Set<(payload: unknown) => void>>>();

const eventMock = {
  addListener: jest.fn((target: object, type: string, handler: (payload: unknown) => void) => {
    const byType = listeners.get(target) ?? new Map<string, Set<(payload: unknown) => void>>();
    const set = byType.get(type) ?? new Set<(payload: unknown) => void>();
    set.add(handler);
    byType.set(type, set);
    listeners.set(target, byType);
  }),
  removeListener: jest.fn((target: object, type: string, handler: (payload: unknown) => void) => {
    listeners.get(target)?.get(type)?.delete(handler);
  }),
  trigger: (target: object, type: string, payload?: unknown) => {
    listeners
      .get(target)
      ?.get(type)
      ?.forEach(handler => handler(payload));
  },
};

const createMapMock = (level = 7) => {
  const bounds = {
    getSouthWest: () => latLng(37.4, 126.9),
    getNorthEast: () => latLng(37.6, 127.1),
  };
  return {
    getLevel: jest.fn(() => level),
    setLevel: jest.fn(),
    setBounds: jest.fn(),
    panBy: jest.fn(),
    getBounds: () => bounds,
    getProjection: () => ({
      // 200×200px 컨테이너: lng 126.9→x 0, lat 37.6→y 0
      containerPointFromCoords: (position: LatLngMock) => ({
        x: Math.round((position.lng - 126.9) * 1000),
        y: Math.round((37.6 - position.lat) * 1000),
      }),
    }),
  };
};

const createCluster = (markers: CustomOverlayMock[], center = latLng(37.5, 127)) => {
  const content = document.createElement('div');
  content.innerHTML = String(markers.length);
  const clusterMarker = new CustomOverlayMock({ content, position: center });
  const bounds = { id: 'cluster-bounds' };
  return {
    getMarkers: () => markers,
    getSize: () => markers.length,
    getCenter: () => center,
    getBounds: () => bounds,
    getClusterMarker: () => clusterMarker,
    content,
    clusterMarker,
    bounds,
  };
};

const installKakao = ({ withClusterer = true } = {}) => {
  const windowWithKakao = window as WindowWithKakao;
  windowWithKakao.kakao = {
    maps: {
      LatLng: jest.fn(latLng),
      CustomOverlay: CustomOverlayMock,
      ...(withClusterer ? { MarkerClusterer: MarkerClustererMock } : {}),
      event: eventMock,
    },
  } as unknown as typeof windowWithKakao.kakao;
};

const READY = { success: true, loading: false, error: null };

const renderMarkers = (
  initial: Partial<UseMapMarkersProps> & { visibleFacilities: Facility[] },
  map: ReturnType<typeof createMapMock> = createMapMock()
) => {
  const onFacilitySelect = jest.fn();
  const onClusterSelect = jest.fn();
  const hook = renderHook(
    (props: Partial<UseMapMarkersProps> & { visibleFacilities: Facility[] }) =>
      useMapMarkers({
        mapInstance: map as unknown as KakaoMap,
        mapStatus: READY,
        onFacilitySelect,
        onClusterSelect,
        ...props,
      }),
    { initialProps: initial }
  );
  return { ...hook, onFacilitySelect, onClusterSelect, map };
};

const bulkOverlays = () =>
  overlayInstances.filter(
    overlay => overlay.options.content.classList.contains('sf-marker') && overlay.options.zIndex === 1
  );

describe('useMapMarkers', () => {
  beforeEach(() => {
    overlayInstances.length = 0;
    clustererInstances.length = 0;
    listeners.clear();
    eventMock.addListener.mockClear();
    eventMock.removeListener.mockClear();
    installKakao();
  });

  it('adds one overlay per facility to the official clusterer and reconciles by key', () => {
    const first = createFacility('first', 37.5, 127);
    const retained = createFacility('retained', 37.51, 127.01);
    const added = createFacility('added', 37.52, 127.02);

    const { rerender, result } = renderMarkers({ visibleFacilities: [first, retained] });

    const clusterer = clustererInstances[0];
    expect(clusterer.options).toEqual(
      expect.objectContaining({ minLevel: 4, gridSize: 64, disableClickZoom: true, averageCenter: true })
    );
    expect(overlayInstances).toHaveLength(2);
    expect(clusterer.addMarkers).toHaveBeenCalledWith(overlayInstances.slice(0, 2), true);
    expect(clusterer.redraw).toHaveBeenCalledTimes(1);
    expect(result.current.markersCount).toBe(2);

    const [firstOverlay, retainedOverlay] = overlayInstances;
    act(() => {
      rerender({ visibleFacilities: [retained, added] });
    });

    expect(overlayInstances).toHaveLength(3);
    expect(clusterer.removeMarkers).toHaveBeenCalledWith([firstOverlay], true);
    expect(clusterer.addMarkers).toHaveBeenLastCalledWith([overlayInstances[2]], true);
    expect(clusterer.redraw).toHaveBeenCalledTimes(2);
    expect(retainedOverlay.setMap).not.toHaveBeenCalled();
    expect(result.current.markersCount).toBe(2);

    act(() => {
      rerender({ visibleFacilities: [retained, added] });
    });
    expect(clusterer.redraw).toHaveBeenCalledTimes(2);
  });

  it('normalizes numeric public-data IDs before creating marker DOM content', () => {
    const numericIdFacility = {
      ...createFacility('831', 37.55, 126.99),
      id: 831 as unknown as string,
    };
    renderMarkers({ visibleFacilities: [numericIdFacility] });

    expect(overlayInstances).toHaveLength(1);
    expect(overlayInstances[0].options.content.dataset.facilityId).toBe('831');
    expect(overlayInstances[0].options.content.dataset.markerId).toBe('park:831');
  });

  it('exposes markers as buttons outside the tab order with translated names', () => {
    const facility = createFacility('a', 37.5, 127, 'library');
    renderMarkers({
      visibleFacilities: [facility],
      labels: { facility: (name, category) => `${name} (${category})` },
    });

    const element = overlayInstances[0].options.content;
    expect(element.getAttribute('role')).toBe('button');
    expect(element.tabIndex).toBe(-1);
    expect(element.getAttribute('aria-label')).toBe('시설 a (library)');
    expect(element.dataset.category).toBe('library');
    expect(overlayInstances[0].options.clickable).toBe(true);
    expect(overlayInstances[0].options.zIndex).toBe(1);
  });

  it('selects a facility on click, Enter and Space', () => {
    const facility = createFacility('a', 37.5, 127);
    const { onFacilitySelect } = renderMarkers({ visibleFacilities: [facility] });
    const element = overlayInstances[0].options.content;

    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onFacilitySelect).toHaveBeenCalledTimes(3);
    expect(onFacilitySelect).toHaveBeenCalledWith(facility, 'marker');
  });

  it('raises hovered markers with setZIndex only when hover is enabled', () => {
    const facility = createFacility('a', 37.5, 127);
    const { rerender } = renderMarkers({ visibleFacilities: [facility], hoverEnabled: true });
    const overlay = overlayInstances[0];
    const element = overlay.options.content;

    element.dispatchEvent(new Event('mouseenter'));
    expect(element.dataset.hover).toBe('');
    expect(overlay.setZIndex).toHaveBeenLastCalledWith(10);

    element.dispatchEvent(new Event('mouseleave'));
    expect(element.dataset.hover).toBeUndefined();
    expect(overlay.setZIndex).toHaveBeenLastCalledWith(1);

    act(() => {
      rerender({ visibleFacilities: [facility], hoverEnabled: false });
    });
    overlay.setZIndex.mockClear();
    element.dispatchEvent(new Event('mouseenter'));
    expect(overlay.setZIndex).not.toHaveBeenCalledWith(10);
  });

  it('stacks facilities that share a coordinate and opens the list on activation', () => {
    const a = createFacility('a', 37.5, 127, 'cultural_event');
    const b = createFacility('b', 37.5, 127, 'cultural_event');
    const { onClusterSelect } = renderMarkers({ visibleFacilities: [a, b] });

    expect(overlayInstances).toHaveLength(1);
    const element = overlayInstances[0].options.content;
    expect(element.classList.contains('sf-cluster')).toBe(true);
    expect(element.textContent).toBe('2');
    expect(element.getAttribute('aria-label')).toBe('장소 2곳 모음');

    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClusterSelect).toHaveBeenCalledWith([a, b], { lat: 37.5, lng: 127 });
  });

  it('renders the selected facility in the focus layer and hides its bulk twin', () => {
    const a = createFacility('a', 37.5, 127);
    const b = createFacility('b', 37.51, 127.01);
    const { rerender, map } = renderMarkers({ visibleFacilities: [a, b] });
    const [bulkA, bulkB] = overlayInstances;

    act(() => {
      rerender({ visibleFacilities: [a, b], selectedFacilityId: getFacilityMarkerId(a) });
    });

    const focus = overlayInstances[2];
    expect(focus.options.zIndex).toBe(20);
    expect(focus.options.content.dataset.selected).toBe('');
    expect(focus.options.content.getAttribute('aria-current')).toBe('true');
    expect(focus.options.content.tabIndex).toBe(0);
    expect(focus.options.content.querySelector('.sf-marker__label')?.textContent).toBe('시설 a');
    expect(focus.setMap).toHaveBeenCalledWith(map);
    expect(bulkA.options.content.dataset.hidden).toBe('');
    expect(bulkB.options.content.dataset.hidden).toBeUndefined();

    act(() => {
      rerender({ visibleFacilities: [a, b], selectedFacilityId: getFacilityMarkerId(b) });
    });
    expect(focus.setMap).toHaveBeenLastCalledWith(null);
    expect(bulkA.options.content.dataset.hidden).toBeUndefined();
    expect(bulkB.options.content.dataset.hidden).toBe('');
    expect(overlayInstances[3].options.content.getAttribute('aria-label')).toBe('시설 b, 공원');

    act(() => {
      rerender({ visibleFacilities: [a, b], selectedFacilityId: null });
    });
    expect(overlayInstances[3].setMap).toHaveBeenLastCalledWith(null);
    expect(bulkB.options.content.dataset.hidden).toBeUndefined();
  });

  it('keeps the selected facility visible after it leaves the visible set and re-selects on Enter', () => {
    const a = createFacility('a', 37.5, 127);
    const { rerender, onFacilitySelect } = renderMarkers({
      visibleFacilities: [a],
      selectedFacilityId: getFacilityMarkerId(a),
    });
    const focus = overlayInstances.find(overlay => overlay.options.zIndex === 20);
    expect(focus).toBeDefined();

    act(() => {
      rerender({ visibleFacilities: [], selectedFacilityId: getFacilityMarkerId(a) });
    });
    expect(focus?.setMap).not.toHaveBeenCalledWith(null);

    focus?.options.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onFacilitySelect).toHaveBeenCalledWith(a, 'marker');
  });

  it('opens the list for small clusters and zooms with padding for large ones', () => {
    const facilities = Array.from({ length: 10 }, (_, index) =>
      createFacility(`f${index}`, 37.5 + index * 0.001, 127)
    );
    const map = createMapMock(7);
    const { onClusterSelect } = renderMarkers(
      { visibleFacilities: facilities, viewportPadding: { top: 56, right: 0, bottom: 120, left: 0 } },
      map
    );
    const clusterer = clustererInstances[0];

    const small = createCluster(bulkOverlays().slice(0, 3));
    act(() => {
      eventMock.trigger(clusterer, 'clusterclick', small);
    });
    expect(onClusterSelect).toHaveBeenCalledWith(facilities.slice(0, 3), { lat: 37.5, lng: 127 });
    expect(map.setBounds).not.toHaveBeenCalled();

    const large = createCluster(bulkOverlays());
    act(() => {
      eventMock.trigger(clusterer, 'clusterclick', large);
    });
    expect(map.setBounds).toHaveBeenCalledWith(large.bounds, 56 + 48, 48, 120 + 48, 48);

    map.getLevel.mockReturnValue(3);
    act(() => {
      eventMock.trigger(clusterer, 'clusterclick', large);
    });
    expect(onClusterSelect).toHaveBeenLastCalledWith(facilities, { lat: 37.5, lng: 127 });
  });

  it('decorates clusterer DOM on `clustered` with a11y, a stack-aware count and keyboard activation', () => {
    const a = createFacility('a', 37.5, 127);
    const stack1 = createFacility('s1', 37.52, 127.02);
    const stack2 = createFacility('s2', 37.52, 127.02);
    const { result, onClusterSelect } = renderMarkers({
      visibleFacilities: [a, stack1, stack2],
      labels: { cluster: count => `${count} places` },
    });
    const clusterer = clustererInstances[0];
    const cluster = createCluster(clusterer.markers);

    act(() => {
      eventMock.trigger(clusterer, 'clustered', [cluster]);
    });

    expect(cluster.content.getAttribute('role')).toBe('button');
    expect(cluster.content.tabIndex).toBe(-1);
    expect(cluster.content.getAttribute('aria-label')).toBe('3 places');
    expect(cluster.content.textContent).toBe('3');
    expect(cluster.content.classList.contains('sf-cluster')).toBe(true);
    expect(cluster.clusterMarker.setZIndex).toHaveBeenCalledWith(0);
    expect(result.current.clustersCount).toBe(1);

    cluster.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onClusterSelect).toHaveBeenCalledWith([a, stack1, stack2], { lat: 37.5, lng: 127 });
  });

  it('falls back to plain overlays and warns once when the clusterer library is missing', () => {
    installKakao({ withClusterer: false });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = createFacility('first', 37.5, 127);
    const retained = createFacility('retained', 37.51, 127.01);
    const { rerender, map } = renderMarkers({ visibleFacilities: [first, retained] });

    expect(clustererInstances).toHaveLength(0);
    expect(overlayInstances[0].setMap).toHaveBeenCalledWith(map);
    expect(overlayInstances[1].setMap).toHaveBeenCalledWith(map);

    act(() => {
      rerender({ visibleFacilities: [retained] });
    });
    expect(overlayInstances[0].setMap).toHaveBeenLastCalledWith(null);
    expect(overlayInstances[1].setMap).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('pans the minimal distance so a facility clears the sheet padding', () => {
    const inView = createFacility('in', 37.55, 127);
    const underSheet = createFacility('under', 37.45, 127);
    const map = createMapMock();
    const { result } = renderMarkers(
      { visibleFacilities: [inView, underSheet], viewportPadding: { top: 0, right: 0, bottom: 100, left: 0 } },
      map
    );

    act(() => {
      result.current.revealFacility(getFacilityMarkerId(inView));
    });
    expect(map.panBy).not.toHaveBeenCalled();

    act(() => {
      result.current.revealFacility(getFacilityMarkerId(underSheet));
    });
    // y=150, 보이는 아래 한계 = 200 - 100(시트) - 44(여백) = 56 → 94px 아래로
    expect(map.panBy).toHaveBeenCalledWith(0, 94);
  });

  it('clears and tears down both layers', () => {
    const a = createFacility('a', 37.5, 127);
    const { result, unmount } = renderMarkers({
      visibleFacilities: [a],
      selectedFacilityId: getFacilityMarkerId(a),
    });
    const clusterer = clustererInstances[0];
    const focus = overlayInstances.find(overlay => overlay.options.zIndex === 20);

    act(() => {
      result.current.clearMarkers();
    });
    expect(clusterer.clear).toHaveBeenCalledTimes(1);
    expect(focus?.setMap).toHaveBeenLastCalledWith(null);

    unmount();
    expect(clusterer.setMap).toHaveBeenCalledWith(null);
    expect(eventMock.removeListener).toHaveBeenCalledWith(clusterer, 'clustered', expect.any(Function));
    expect(eventMock.removeListener).toHaveBeenCalledWith(clusterer, 'clusterclick', expect.any(Function));
  });
});
