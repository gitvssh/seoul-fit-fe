import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Facility, Position } from '@/lib/types';
import type { GeolocationStatus } from '@/shared/lib/hooks/useGeolocation';
import { DEFAULT_PLACE_FILTERS } from '@/features/place-filter/model/types';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import type { NaturalLanguageSearchRule } from '@/features/natural-language-search/model/types';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { ExploreProvider, useExploreContext } from '../ExploreProvider';

const origin = { lat: 37.5665, lng: 126.978 };
const place: Facility = {
  id: 'park',
  name: '서울 공원',
  category: 'park',
  address: '서울',
  position: origin,
  congestionLevel: 'low',
};
const mockParams = new URLSearchParams();
const mockFacility = {
  facilities: [place],
  currentLocation: origin,
  activateCategories: jest.fn(),
  updateLocation: jest.fn(async () => {}),
};
const mockMap = {
  setCenter: jest.fn(),
  setZoom: jest.fn(),
  mapStatus: { success: true },
  getCenter: jest.fn((): Position | null => origin),
};
const mockLive = {
  weather: { data: null },
  congestion: { data: null },
  load: jest.fn(async () => {}),
};
const mockGeo = {
  position: null as Position | null,
  status: 'idle' as GeolocationStatus,
  permission: 'prompt' as PermissionState,
  request: jest.fn(async (): Promise<Position | null> => origin),
  startWatch: jest.fn(),
};
jest.mock('next/navigation', () => ({ useSearchParams: () => mockParams }));
jest.mock('../FacilityProvider', () => ({ useFacilityContext: () => mockFacility }));
jest.mock('../MapProvider', () => ({ useMapContext: () => mockMap }));
jest.mock('@/shared/lib/hooks/useLiveData', () => ({ useLiveData: () => mockLive }));
jest.mock('@/shared/lib/hooks/useGeolocation', () => ({ useGeolocation: () => mockGeo }));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <ExploreProvider>{children}</ExploreProvider>
);
const mount = () => renderHook(useExploreContext, { wrapper });
beforeEach(() => {
  jest.clearAllMocks();
  for (const key of [...mockParams.keys()]) mockParams.delete(key);
  mockFacility.facilities = [place];
  mockGeo.position = null;
  mockGeo.status = 'idle';
  mockGeo.permission = 'prompt';
  mockGeo.request.mockResolvedValue(origin);
  mockMap.mapStatus.success = true;
  mockMap.getCenter.mockReturnValue(origin);
  useNaturalLanguageRuleStore.setState({ appliedRule: null, revision: 0 });
});

it('loads default map data without prompting for location and exposes panel state', () => {
  const { result } = mount();
  expect(mockLive.load).toHaveBeenCalledWith(origin);
  expect(mockFacility.updateLocation).toHaveBeenCalledWith(origin.lat, origin.lng, {
    zoomLevel: 4,
  });
  expect(mockGeo.request).not.toHaveBeenCalled();
  expect(result.current.activePreset).toBe('available_now');
  expect(result.current.geolocationBanner).toBe('prompt');
  act(() => {
    result.current.setListOpen(true);
    result.current.setEngagementOpen(true);
    result.current.setSelectedRegionCode('11110');
  });
  expect(result.current).toMatchObject({
    isListOpen: true,
    isEngagementOpen: true,
    selectedRegionCode: '11110',
  });
});

it.each(['quiet', 'not-a-preset'])('validates the initial preset %s', preset => {
  mockParams.set('preset', preset);
  const { result } = mount();
  expect(result.current.activePreset).toBe(preset === 'quiet' ? 'quiet' : 'available_now');
});

it('filters visible places and changes preset categories without repeating viewed analytics', () => {
  const { result } = mount();
  const library = { ...place, id: 'library', category: 'library' as const };
  act(() => result.current.setVisibleFacilities([place, library]));
  expect(result.current.facilitiesInView).toHaveLength(2);
  expect(result.current.recommendations).toHaveLength(2);
  const firstViewCount = jest
    .mocked(trackEvent)
    .mock.calls.filter(([name]) => name === 'recommendation_viewed').length;
  act(() => result.current.setVisibleFacilities([place, library]));
  expect(
    jest.mocked(trackEvent).mock.calls.filter(([name]) => name === 'recommendation_viewed')
  ).toHaveLength(firstViewCount);
  act(() =>
    result.current.setFilters(
      { ...DEFAULT_PLACE_FILTERS, categories: ['park'] },
      'category',
      'park'
    )
  );
  expect(result.current.facilitiesInView.map(item => item.id)).toEqual(['park']);
  expect(result.current.activeFilterCount).toBe(1);
  expect(trackEvent).toHaveBeenCalledWith('filter_applied', {
    filter_type: 'category',
    filter_value: 'park',
    page_type: 'home_map',
  });
  act(() => result.current.setPreset('rainy_day'));
  expect(mockFacility.activateCategories).toHaveBeenCalledWith([
    'library',
    'culture',
    'cooling_shelter',
  ]);
  expect(result.current.activePreset).toBe('rainy_day');
  act(() =>
    result.current.setFilters(
      {
        categories: ['park'],
        maxDistanceKm: 1,
        openOnly: true,
        reservableOnly: true,
        indoorOnly: true,
        lowCongestionOnly: true,
      },
      'max_distance',
      '1'
    )
  );
  expect(result.current.activeFilterCount).toBe(6);
  act(() => result.current.resetFilters());
  expect(result.current.filters).toEqual(DEFAULT_PLACE_FILTERS);
  expect(trackEvent).toHaveBeenCalledWith(
    'filter_applied',
    expect.objectContaining({ filter_value: 'reset' })
  );
});

it('applies natural language rules by revision and clears their visible summary', () => {
  const { result } = mount();
  const rule: NaturalLanguageSearchRule = {
    matched: true,
    categories: ['library'],
    filters: {
      maxDistanceKm: 2,
      openOnly: true,
      reservableOnly: false,
      indoorOnly: true,
      lowCongestionOnly: false,
    },
    preset: 'quiet',
    summary: '가까운 도서관',
    summaryEn: 'Nearby libraries',
    matchedRuleCodes: ['library'],
  };
  act(() => useNaturalLanguageRuleStore.getState().applyRule(rule));
  expect(result.current).toMatchObject({
    isListOpen: true,
    activePreset: 'quiet',
    naturalLanguageSummary: { ko: '가까운 도서관', en: 'Nearby libraries' },
  });
  expect(result.current.filters.categories).toEqual(['library']);
  expect(mockFacility.activateCategories).toHaveBeenCalledTimes(1);
  act(() => result.current.setListOpen(false));
  expect(mockFacility.activateCategories).toHaveBeenCalledTimes(1);
  act(() =>
    useNaturalLanguageRuleStore.getState().applyRule({ ...rule, categories: [], preset: null })
  );
  expect(result.current.activePreset).toBe('quiet');
  expect(mockFacility.activateCategories).toHaveBeenCalledTimes(1);
  act(() => result.current.clearNaturalLanguageRule());
  expect(result.current.naturalLanguageSummary).toEqual({ ko: null, en: null });
});

it('locates on an explicit action, watches position, and reloads nearby data', async () => {
  const { result } = mount();
  mockFacility.updateLocation.mockClear();
  await act(async () => {
    expect(await result.current.locateMe()).toBe(true);
  });
  expect(mockMap.setCenter).toHaveBeenCalledWith(origin);
  expect(mockMap.setZoom).toHaveBeenCalledWith(4);
  expect(mockGeo.startWatch).toHaveBeenCalledTimes(1);
  expect(mockFacility.updateLocation).toHaveBeenCalledWith(origin.lat, origin.lng, {
    force: true,
    zoomLevel: 4,
  });
  expect(trackEvent).toHaveBeenCalledWith('geolocation_result', { location_permission: 'granted' });
});

it.each(['denied', 'unavailable'] as const)('retains the map if location is %s', async status => {
  mockGeo.status = status;
  mockGeo.request.mockResolvedValue(null);
  const { result } = mount();
  await act(async () => {
    expect(await result.current.locateMe()).toBe(false);
  });
  expect(mockMap.setCenter).not.toHaveBeenCalled();
  expect(trackEvent).toHaveBeenCalledWith('geolocation_result', { location_permission: status });
  expect(result.current.geolocationBanner).toBe(status);
});

it('automatically locates once only after permission and map readiness', async () => {
  mockGeo.permission = 'granted';
  mockMap.mapStatus.success = false;
  const { rerender } = mount();
  expect(mockGeo.request).not.toHaveBeenCalled();
  mockMap.mapStatus.success = true;
  rerender();
  await waitFor(() => expect(mockMap.setCenter).toHaveBeenCalledWith(origin));
  rerender();
  expect(mockGeo.request).toHaveBeenCalledTimes(1);
});

it.each(['lat', 'place'])('preserves a %s deep link while starting position tracking', key => {
  mockParams.set(key, key === 'lat' ? '37.57' : 'park:42');
  mockGeo.permission = 'granted';
  mount();
  expect(mockGeo.startWatch).toHaveBeenCalledTimes(1);
  expect(mockGeo.request).not.toHaveBeenCalled();
  expect(mockMap.setCenter).not.toHaveBeenCalled();
});

it('uses the actual position for live data and falls back to the configured map origin', () => {
  mockGeo.position = { lat: 37.57, lng: 126.99 };
  mockMap.getCenter.mockReturnValue(null);
  const { result } = mount();
  expect(result.current.origin).toEqual(mockGeo.position);
  expect(mockLive.load).toHaveBeenCalledWith(mockGeo.position);
  expect(mockFacility.updateLocation).toHaveBeenCalledWith(origin.lat, origin.lng, {
    zoomLevel: 4,
  });
  expect(result.current.geolocationBanner).toBe('none');
});

it.each(['timeout', 'requesting', 'unsupported'] as const)(
  'renders a useful location banner for %s',
  status => {
    mockGeo.status = status;
    const { result } = mount();
    expect(result.current.geolocationBanner).toBe(status === 'timeout' ? 'unavailable' : 'none');
    act(() => result.current.dismissGeolocationBanner());
    expect(result.current.geolocationBanner).toBe('none');
  }
);

it('does not prompt for location without loaded facilities and requires its provider', () => {
  mockFacility.facilities = [];
  expect(mount().result.current.geolocationBanner).toBe('none');
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() => renderHook(useExploreContext)).toThrow('ExploreProvider');
  } finally {
    error.mockRestore();
  }
});
