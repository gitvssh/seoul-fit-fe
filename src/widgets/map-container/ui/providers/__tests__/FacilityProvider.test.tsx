import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import type { Facility, ClusteredFacility } from '@/lib/types';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { FacilityProvider, useFacilityContext } from '../FacilityProvider';

const fetcher = () => jest.fn(async () => {});
const mockSources = {
  parks: { parks: [], fetchAllParksData: fetcher() },
  libraries: { libraries: [], fetchAllLibrariesData: fetcher() },
  culturalSpaces: { culturalSpaces: [], fetchCulturalSpaces: fetcher() },
  culturalEvents: { culturalEvents: [], fetchCulturalEvents: fetcher() },
  culturalReservations: { culturalReservations: [], fetchCulturalReservations: fetcher() },
  cooling: { facilities: [] as Facility[], fetchCoolingShelters: fetcher() },
  subway: { subwayStations: [] as Facility[], loading: false, error: null as string | null },
  pois: { pois: [], fetchNearbyPOIs: fetcher() },
  bike: { facilities: [] as Facility[], fetchBikeStations: fetcher() },
  sports: { sportsFacilities: [] as Facility[], fetchSportsFacilities: fetcher() },
  restaurants: { restaurants: [] as Facility[], fetchRestaurants: fetcher() },
};

jest.mock('@/shared/lib/hooks/useParks', () => ({ useParks: () => mockSources.parks }));
jest.mock('@/shared/lib/hooks/useLibraries', () => ({ useLibraries: () => mockSources.libraries }));
jest.mock('@/shared/lib/hooks/useCulturalSpaces', () => ({
  useCulturalSpaces: () => mockSources.culturalSpaces,
}));
jest.mock('@/shared/lib/hooks/useCulturalEvents', () => ({
  useCulturalEvents: () => mockSources.culturalEvents,
}));
jest.mock('@/shared/lib/hooks/useCulturalReservations', () => ({
  useCulturalReservations: () => mockSources.culturalReservations,
}));
jest.mock('@/shared/lib/hooks/useCoolingShelter', () => ({
  useCoolingShelter: () => mockSources.cooling,
}));
jest.mock('@/shared/lib/hooks/useSubwayStations', () => ({
  useSubwayStations: () => mockSources.subway,
}));
jest.mock('@/shared/lib/hooks/usePOI', () => ({ usePOI: () => mockSources.pois }));
jest.mock('@/shared/lib/hooks/useBikeStations', () => ({
  useBikeStations: () => mockSources.bike,
}));
jest.mock('@/shared/lib/hooks/useSportsFacilities', () => ({
  useSportsFacilities: () => mockSources.sports,
}));
jest.mock('@/shared/lib/hooks/useRestaurantFacilities', () => ({
  useRestaurantFacilities: () => mockSources.restaurants,
}));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));

const origin = { lat: 37.5665, lng: 126.978 };
const place = (id: string, changes: Partial<Facility> = {}): Facility => ({
  id,
  name: `장소 ${id}`,
  category: 'park',
  address: '서울 중구',
  position: origin,
  congestionLevel: 'low',
  ...changes,
});
let context: ReturnType<typeof useFacilityContext>;
function Consumer() {
  const value = useFacilityContext();
  React.useEffect(() => {
    context = value;
  }, [value]);
  return <output aria-label='loaded places'>{value.facilities.length}</output>;
}
type ProviderProps = React.ComponentProps<typeof FacilityProvider>;
async function mount(props: Omit<Partial<ProviderProps>, 'children'> = {}) {
  const view = render(
    <FacilityProvider {...props}>
      <Consumer />
    </FacilityProvider>
  );
  await waitFor(() => expect(context.loading).toBe(false));
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSources.subway.error = null;
  mockSources.subway.loading = false;
  mockSources.subway.subwayStations = [];
  mockSources.bike.facilities = [];
  mockSources.cooling.facilities = [];
  mockSources.sports.sportsFacilities = [];
  mockSources.restaurants.restaurants = [];
});

it('loads global sources once and keeps their source status available to consumers', async () => {
  mockSources.subway.subwayStations = [place('subway', { category: 'subway' })];
  await mount();
  expect(mockSources.parks.fetchAllParksData).toHaveBeenCalledTimes(1);
  expect(mockSources.libraries.fetchAllLibrariesData).toHaveBeenCalledWith(0, 1000);
  expect(context.sourceStatus).toMatchObject({
    parks: 'ready',
    libraries: 'ready',
    subway: 'ready',
  });
  expect(context.facilities.map(item => item.id)).toEqual(['subway']);
});

it('reuses nearby results, updates the origin, and honors forced reload and bike radius limits', async () => {
  await mount();
  await act(async () => {
    await context.updateLocation(origin.lat, origin.lng, { zoomLevel: 14 });
  });
  expect(mockSources.pois.fetchNearbyPOIs).toHaveBeenLastCalledWith(origin.lat, origin.lng, 100);
  expect(mockSources.bike.fetchBikeStations).toHaveBeenLastCalledWith(origin.lat, origin.lng, 5);
  await act(async () => {
    await context.updateLocation(origin.lat + 0.00001, origin.lng);
  });
  expect(mockSources.pois.fetchNearbyPOIs).toHaveBeenCalledTimes(1);
  expect(context.currentLocation.lat).toBe(origin.lat + 0.00001);
  await act(async () => {
    await context.updateLocation(origin.lat, origin.lng, { force: true, zoomLevel: 99 });
  });
  expect(mockSources.pois.fetchNearbyPOIs).toHaveBeenLastCalledWith(origin.lat, origin.lng, 2);
  await act(async () => {
    await context.updateLocation(origin.lat + 0.01, origin.lng);
  });
  expect(mockSources.pois.fetchNearbyPOIs).toHaveBeenCalledTimes(3);
  expect(context.lastLoadedLocation).toEqual({ lat: origin.lat + 0.01, lng: origin.lng });
  expect(context.locationLoading).toBe(false);
});

it('retains healthy data through one source failure and clears the failed category after retry', async () => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSources.culturalEvents.fetchCulturalEvents.mockRejectedValueOnce(
    new Error('synthetic source failure')
  );
  mockSources.pois.fetchNearbyPOIs.mockRejectedValueOnce(new Error('synthetic POI failure'));
  mockSources.bike.facilities = [place('bike', { category: 'bike' })];
  mockSources.subway.error = 'synthetic source failure';
  try {
    await mount();
    await act(async () => {
      await context.updateLocation(origin.lat, origin.lng);
    });
    expect(context.failedCategories).toEqual(expect.arrayContaining(['subway', 'cultural_event']));
    expect(context.failedCategories).not.toContain(null);
    expect(context.sourceStatus.pois).toBe('failed');
    expect(context.facilities.map(item => item.id)).toContain('bike');
    await act(async () => {
      await context.updateLocation(origin.lat, origin.lng, { force: true });
    });
    expect(context.sourceStatus.culturalEvents).toBe('ready');
    expect(context.failedCategories).toEqual(['subway']);
  } finally {
    errorLog.mockRestore();
  }
});

it('keeps place and cluster selections mutually exclusive and records the selection source', async () => {
  await mount();
  const selected = place('selected');
  const cluster: ClusteredFacility = {
    id: 'cluster',
    position: origin,
    facilities: [selected],
    count: 1,
    radius: 10,
    primaryCategory: 'park',
  };
  act(() => context.selectCluster(cluster));
  expect(context.selectedCluster).toEqual(cluster);
  act(() => context.selectFacility(selected, 'search_result'));
  expect(context.selectedCluster).toBeNull();
  expect(context.selectedFacility).toEqual(selected);
  expect(trackEvent).toHaveBeenCalledWith('facility_detail_viewed', {
    category: 'park',
    selection_source: 'search_result',
  });
  act(() => context.selectCluster(cluster));
  expect(context.selectedFacility).toBeNull();
  act(() => context.clearSelection());
  expect(context.selectedCluster).toBeNull();
  expect(context.selectedFacility).toBeNull();
});

it('toggles internal categories, adds missing categories once, and filters nearby places', async () => {
  await mount();
  act(() => context.setActiveCategories(['park']));
  act(() => context.toggleCategory('park'));
  expect(context.activeCategories).toEqual([]);
  act(() => context.toggleCategory('library'));
  act(() => context.activateCategory('park'));
  act(() => context.activateCategories(['park', 'bike']));
  act(() => context.activateCategory('park'));
  expect(context.activeCategories).toEqual(['library', 'park', 'bike']);
  act(() => {
    context.addTransientFacility(place('near'));
    context.addTransientFacility(
      place('far', { position: { lat: 37.8, lng: 127.2 }, category: 'sports' })
    );
  });
  expect(context.getFilteredFacilities().map(item => item.id)).toEqual(['near']);
  expect(context.getFacilitiesByCategory('sports').map(item => item.id)).toEqual(['far']);
  expect(context.getNearbyFacilities(origin, 1).map(item => item.id)).toEqual(['near']);
});

it('leaves controlled categories with the parent and applies its updated value', async () => {
  const onToggleCategory = jest.fn();
  const onSetCategories = jest.fn();
  const view = await mount({ categories: ['park'], onToggleCategory, onSetCategories });
  act(() => context.toggleCategory('bike'));
  expect(onToggleCategory).toHaveBeenCalledWith('bike');
  expect(context.activeCategories).toEqual(['park']);
  act(() => context.activateCategory('library'));
  expect(onSetCategories).toHaveBeenCalledWith(['park', 'library']);
  view.rerender(
    <FacilityProvider categories={['park', 'library']} onSetCategories={onSetCategories}>
      <Consumer />
    </FacilityProvider>
  );
  expect(context.activeCategories).toEqual(['park', 'library']);
});

it('replaces a matching fetched place and bounds transient search results to the latest ten', async () => {
  const existing = place('bike-1', { category: 'bike' });
  mockSources.bike.facilities = [existing];
  await mount();
  act(() => context.addTransientFacility({ ...existing, name: '갱신된 장소' }));
  expect(context.facilities.filter(item => item.id === 'bike-1')).toEqual([
    { ...existing, name: '갱신된 장소' },
  ]);
  act(() => {
    for (let index = 0; index < 12; index++)
      context.addTransientFacility(place(`transient-${index}`));
  });
  expect(context.facilities.filter(item => item.category === 'park').map(item => item.id)).toEqual(
    Array.from({ length: 10 }, (_, index) => `transient-${index + 2}`)
  );
});
