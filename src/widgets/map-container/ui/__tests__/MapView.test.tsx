import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  Facility,
  FacilityCategory,
  WeatherData,
  CongestionData,
  Position,
} from '@/lib/types';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { useMapMarkers } from '@/shared/lib/hooks/useMapMarkers';
import { useCurrentLocationMarker } from '@/shared/lib/hooks/useCurrentLocationMarker';
import { useMapViewport } from '../../lib/useMapViewport';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import type { LiveSlice } from '@/shared/lib/hooks/useLiveData';
import type { GeolocationBannerState } from '../providers/ExploreProvider';
import { MapView } from '../MapView';

const origin = { lat: 37.5665, lng: 126.978 };
const place: Facility = {
  id: 'park',
  name: '서울 공원',
  address: '서울',
  category: 'park',
  position: origin,
  congestionLevel: 'low',
};
const mockParams = new URLSearchParams();
const mockMap = {
  mapInstance: { setCenter: jest.fn(), setLevel: jest.fn() },
  mapStatus: { success: true, loading: false, error: null as string | null },
  containerId: 'test-map',
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  retryMap: jest.fn(),
  revealPosition: jest.fn(),
  bottomInset: 120,
};
const mockFacility = {
  facilities: [place, { ...place, id: 'second' }],
  getFilteredFacilities: jest.fn(() => [place]),
  activeCategories: ['park'] as FacilityCategory[],
  toggleCategory: jest.fn(),
  selectedFacility: null as Facility | null,
  selectFacility: jest.fn(),
  selectCluster: jest.fn(),
  updateLocation: jest.fn(async () => {}),
  loading: false,
  locationLoading: false,
  failedCategories: [] as FacilityCategory[],
  lastLoadedLocation: origin as Position | null,
};
const mockExplore = {
  setVisibleFacilities: jest.fn(),
  live: {
    weather: { status: 'idle', data: null, fetchedAt: null } as LiveSlice<WeatherData>,
    congestion: { status: 'idle', data: null, fetchedAt: null } as LiveSlice<CongestionData>,
    loading: false,
    refresh: jest.fn(),
  },
  geolocation: { position: null as Position | null, status: 'idle' },
  locateMe: jest.fn(async () => true),
  geolocationBanner: 'none' as GeolocationBannerState,
  dismissGeolocationBanner: jest.fn(),
  setPreset: jest.fn(),
};
let mockDesktop = true;
jest.mock('next/navigation', () => ({ useSearchParams: () => mockParams }));
jest.mock('../providers/MapProvider', () => ({ useMapContext: () => mockMap }));
jest.mock('../providers/FacilityProvider', () => ({
  ...jest.requireActual('../providers/FacilityProvider'),
  useFacilityContext: () => mockFacility,
}));
jest.mock('../providers/ExploreProvider', () => ({ useExploreContext: () => mockExplore }));
jest.mock('@/shared/lib/hooks/useMapMarkers', () => ({
  useMapMarkers: jest.fn(),
  getFacilityMarkerId: (facility: Facility) => `${facility.category}:${facility.id}`,
}));
jest.mock('@/shared/lib/hooks/useCurrentLocationMarker', () => ({
  useCurrentLocationMarker: jest.fn(),
}));
jest.mock('../../lib/useMapViewport', () => ({ useMapViewport: jest.fn() }));
jest.mock('@/shared/lib/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockDesktop,
  DESKTOP_QUERY: 'desktop',
  HOVER_QUERY: 'hover',
}));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const mount = (props: React.ComponentProps<typeof MapView> = {}) =>
  render(
    <I18nProvider>
      <MapView {...props} />
    </I18nProvider>
  );
const viewport = () => jest.mocked(useMapViewport).mock.calls.at(-1)![0];
const markers = () => jest.mocked(useMapMarkers).mock.calls.at(-1)![0];

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  for (const key of [...mockParams.keys()]) mockParams.delete(key);
  mockDesktop = true;
  mockMap.mapStatus = { success: true, loading: false, error: null };
  mockFacility.activeCategories = ['park'];
  mockFacility.failedCategories = [];
  mockFacility.selectedFacility = null;
  mockFacility.lastLoadedLocation = origin;
  mockFacility.loading = false;
  mockFacility.locationLoading = false;
  mockExplore.geolocationBanner = 'none';
  mockExplore.geolocation = { position: null, status: 'idle' };
  mockExplore.live.weather = { status: 'idle', data: null, fetchedAt: null };
  mockExplore.live.congestion = { status: 'idle', data: null, fetchedAt: null };
  mockExplore.live.loading = false;
});
afterEach(() => jest.useRealTimers());

it('connects accessible map controls, category counts, selection, and live-popover dismissal', async () => {
  const onMapTap = jest.fn();
  mount({ onMapTap });
  expect(screen.getByRole('region', { name: labels['map.canvasLabel'] })).toHaveAttribute(
    'id',
    'test-map'
  );
  expect(trackEvent).toHaveBeenCalledWith('map_ready', { page_type: 'home_map' });
  fireEvent.click(screen.getByRole('button', { name: labels['map.zoomIn'] }));
  fireEvent.click(screen.getByRole('button', { name: labels['map.zoomOut'] }));
  expect(mockMap.zoomIn).toHaveBeenCalledTimes(1);
  expect(mockMap.zoomOut).toHaveBeenCalledTimes(1);
  const parkButton = screen.getByRole('button', { name: /공원.*2/ });
  expect(parkButton).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(parkButton);
  expect(mockFacility.toggleCategory).toHaveBeenCalledWith('park');
  act(() => viewport().onVisibleChange([place]));
  expect(mockExplore.setVisibleFacilities).toHaveBeenCalledWith([place]);
  expect(screen.getByText(labels['map.facilityCount'].replace('{count}', '1'))).toBeInTheDocument();
  act(() => markers().onFacilitySelect(place, 'marker'));
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(place, 'map_marker');
  expect(mockMap.revealPosition).toHaveBeenCalledWith(origin);
  act(() => markers().onFacilitySelect(place, 'cluster'));
  expect(mockFacility.selectFacility).toHaveBeenLastCalledWith(place, 'cluster');
  act(() => markers().onClusterSelect?.([place], origin));
  expect(mockFacility.selectCluster).toHaveBeenCalledWith(
    expect.objectContaining({ count: 1, primaryCategory: 'park', facilities: [place] })
  );
  act(() => markers().onClusterSelect?.([], origin));
  expect(mockFacility.selectCluster).toHaveBeenLastCalledWith(
    expect.objectContaining({ count: 0, primaryCategory: 'park' })
  );
  expect(markers().labels?.facility?.(place.name, place.category)).toContain(place.name);
  expect(markers().labels?.cluster?.(2)).toContain('2');
  fireEvent.click(screen.getByRole('button', { name: labels['map.liveNow'] }));
  expect(screen.getByRole('region', { name: labels['map.liveNow'] })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('region', { name: labels['map.liveNow'] })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: labels['map.liveNow'] }));
  act(() => viewport().onClick?.());
  expect(onMapTap).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('region', { name: labels['map.liveNow'] })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: labels['map.locateMe'] }));
  await waitFor(() => expect(mockExplore.locateMe).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: labels['map.locateMe'] })).toHaveAttribute(
    'aria-busy',
    'false'
  );
});

it('debounces distant map reloads, ignores nearby or wide views, and cancels on unmount', () => {
  jest.useFakeTimers();
  const view = mount();
  act(() => {
    viewport().onIdle?.(origin, 4);
    viewport().onIdle?.({ lat: 37.7, lng: 127 }, 10);
    jest.advanceTimersByTime(900);
  });
  expect(mockFacility.updateLocation).not.toHaveBeenCalled();
  act(() => {
    viewport().onIdle?.({ lat: 37.7, lng: 127 }, 5);
    jest.advanceTimersByTime(300);
    viewport().onIdle?.({ lat: 37.71, lng: 127 }, 6);
    jest.advanceTimersByTime(800);
  });
  expect(mockFacility.updateLocation).toHaveBeenCalledTimes(1);
  expect(mockFacility.updateLocation).toHaveBeenCalledWith(37.71, 127, {
    force: true,
    zoomLevel: 6,
  });
  act(() => viewport().onIdle?.({ lat: 37.75, lng: 127 }, 5));
  view.unmount();
  act(() => jest.advanceTimersByTime(1000));
  expect(mockFacility.updateLocation).toHaveBeenCalledTimes(1);
});

it('retains selected markers on mobile and provides position and viewport padding to the SDK', () => {
  mockDesktop = false;
  mockFacility.selectedFacility = place;
  mockExplore.geolocation.position = origin;
  mockExplore.geolocation.status = 'requesting';
  mount();
  expect(markers()).toMatchObject({
    selectedFacilityId: 'park:park',
    hoverEnabled: false,
    viewportPadding: { top: 112, bottom: 136 },
  });
  expect(useCurrentLocationMarker).toHaveBeenCalledWith(
    expect.objectContaining({ lat: origin.lat, lng: origin.lng })
  );
  expect(screen.getByRole('button', { name: labels['map.locateMe'] })).toHaveAttribute(
    'aria-busy',
    'true'
  );
});

it('applies a valid coordinate deep link once and labels SDK attribution links', () => {
  jest.useFakeTimers();
  mockParams.set('lat', '37.57');
  mockParams.set('lng', '126.99');
  class LatLng {
    constructor(
      public lat: number,
      public lng: number
    ) {}
  }
  Object.defineProperty(window, 'kakao', { configurable: true, value: { maps: { LatLng } } });
  const view = mount();
  expect(mockMap.mapInstance.setCenter).toHaveBeenCalledWith(new LatLng(37.57, 126.99));
  expect(mockMap.mapInstance.setLevel).toHaveBeenCalledWith(4);
  const link = document.createElement('a');
  link.href = 'https://map.kakao.com';
  document.getElementById('test-map')!.append(link);
  act(() => jest.advanceTimersByTime(1500));
  expect(link).toHaveAttribute('aria-label', labels['map.kakaoAttribution']);
  view.rerender(
    <I18nProvider>
      <MapView />
    </I18nProvider>
  );
  expect(mockMap.mapInstance.setCenter).toHaveBeenCalledTimes(1);
  Reflect.deleteProperty(window, 'kakao');
});

it('shows a loading state, then an actionable SDK error without reporting readiness', () => {
  mockMap.mapStatus = { success: false, loading: true, error: null };
  const view = mount();
  expect(screen.getByText(labels['map.status.loading'])).toBeInTheDocument();
  expect(trackEvent).not.toHaveBeenCalledWith('map_ready', expect.anything());
  mockMap.mapStatus = { success: false, loading: false, error: 'synthetic SDK error' };
  view.rerender(
    <I18nProvider>
      <MapView />
    </I18nProvider>
  );
  const retry = screen.getAllByRole('button').find(button => button.textContent?.includes('다시'))!;
  expect(retry).toBeDefined();
  fireEvent.click(retry);
  expect(mockMap.retryMap).toHaveBeenCalled();
});

it.each([true, false])(
  'retries failed sources with a %s known origin and prioritizes failures over location prompts',
  known => {
    mockFacility.failedCategories = ['park'];
    if (!known) mockFacility.lastLoadedLocation = null;
    mockExplore.geolocationBanner = 'prompt';
    mount();
    fireEvent.click(screen.getByRole('button', { name: labels['map.status.retry'] }));
    expect(mockFacility.updateLocation).toHaveBeenCalledWith(origin.lat, origin.lng, {
      force: true,
      zoomLevel: 4,
    });
    expect(
      screen.queryByRole('button', { name: labels['map.status.locationPromptAction'] })
    ).not.toBeInTheDocument();
  }
);

it.each(['prompt', 'denied', 'unavailable'] as const)(
  'supports the %s location banner without hiding the map',
  async banner => {
    mockExplore.geolocationBanner = banner;
    mount();
    fireEvent.click(screen.getByRole('button', { name: labels['map.status.keepDefault'] }));
    expect(mockExplore.dismissGeolocationBanner).toHaveBeenCalled();
    if (banner === 'prompt') {
      fireEvent.click(
        screen.getByRole('button', { name: labels['map.status.locationPromptAction'] })
      );
      await waitFor(() => expect(mockExplore.locateMe).toHaveBeenCalledTimes(1));
    }
  }
);

it.each(['loading', 'locationLoading'] as const)(
  'announces %s without replacing the map',
  field => {
    mockFacility[field] = true;
    mount();
    expect(
      screen.getByText(
        labels[field === 'loading' ? 'map.status.loading' : 'map.status.locationLoading']
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: labels['map.canvasLabel'] })).toBeInTheDocument();
  }
);

it.each(['actual', 'loaded', 'default'])('refreshes live data at the %s position', mode => {
  mockExplore.geolocation.position = mode === 'actual' ? { lat: 37.57, lng: 126.99 } : null;
  if (mode === 'default') mockFacility.lastLoadedLocation = null;
  mount();
  fireEvent.click(screen.getByRole('button', { name: labels['map.liveNow'] }));
  fireEvent.click(screen.getByRole('button', { name: labels['map.live.refresh'] }));
  expect(mockExplore.live.refresh).toHaveBeenCalledWith(mockExplore.geolocation.position ?? origin);
  fireEvent.click(screen.getAllByRole('button', { name: labels['map.liveNowHide'] }).at(-1)!);
  expect(screen.queryByRole('region', { name: labels['map.liveNow'] })).not.toBeInTheDocument();
});
