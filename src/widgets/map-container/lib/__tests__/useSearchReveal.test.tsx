import { act, renderHook, waitFor } from '@testing-library/react';
import type { Facility } from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { convertSearchResultToFacility } from '@/shared/api/searchDetail';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import { useSearchReveal } from '../useSearchReveal';

const mockParams = new URLSearchParams();
const mockFacility = {
  facilities: [] as Facility[],
  activateCategory: jest.fn(),
  addTransientFacility: jest.fn(),
  selectFacility: jest.fn(),
  clearSelection: jest.fn(),
};
const mockMap = { revealPosition: jest.fn(), mapStatus: { success: true } };
jest.mock('next/navigation', () => ({ useSearchParams: () => mockParams }));
jest.mock('../../ui/providers/FacilityProvider', () => ({
  useFacilityContext: () => mockFacility,
}));
jest.mock('../../ui/providers/MapProvider', () => ({ useMapContext: () => mockMap }));
jest.mock('@/shared/api/searchDetail', () => ({ convertSearchResultToFacility: jest.fn() }));

const position = { lat: 37.5665, lng: 126.978 };
const place: Facility = {
  id: '42',
  name: '서울 공원',
  category: 'park',
  address: '서울 중구',
  position,
  congestionLevel: 'low',
};
const search: SearchItem = { id: 'park:42', ref_id: 42, name: place.name, category: 'park' };
const publicPlace = {
  name: '공개 공원',
  address: null,
  description: null,
  phone: null,
  website: null,
  openingHours: null,
  latitude: position.lat,
  longitude: position.lng,
  reservable: null,
};
const originalFetch = global.fetch;
const mockFetch = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  global.fetch = mockFetch;
  mockParams.forEach((_, key) => mockParams.delete(key));
  mockFacility.facilities = [];
  mockMap.mapStatus.success = true;
  useNaturalLanguageRuleStore.setState({ appliedRule: null, revision: 0 });
  window.history.replaceState(null, '', '/?keep=value');
});
afterAll(() => {
  global.fetch = originalFetch;
});

it('selects a loaded result, moves the map, and preserves unrelated URL parameters', async () => {
  mockFacility.facilities = [place];
  const { result } = renderHook(useSearchReveal);
  await act(async () => {
    await result.current.handleSearchSelect(search);
  });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(place, 'search_result');
  expect(mockFacility.activateCategory).toHaveBeenCalledWith('park');
  expect(mockMap.revealPosition).toHaveBeenCalledWith(position, { minLevel: 4 });
  expect(new URLSearchParams(window.location.search).get('place')).toBe('park:42');
  expect(window.location.search).toContain('keep=value');
  expect(result.current.selectionMessage).toBe('서울 공원 위치로 이동했습니다.');
  act(() => result.current.handleSearchClear());
  expect(mockFacility.clearSelection).toHaveBeenCalled();
  expect(useNaturalLanguageRuleStore.getState().revision).toBe(1);
  expect(window.location.search).not.toContain('place=');
  expect(result.current.selectionMessage).toBe('');
});

it('matches normalized names and addresses without confusing categories or different addresses', async () => {
  mockFacility.facilities = [
    { ...place, id: 'other-category', category: 'library' },
    { ...place, id: 'other-name', name: '다른 공원' },
    { ...place, id: 'other-address', address: '서울 강남구' },
    { ...place, id: 'normalized', name: '서울-공원', address: '서울.중구' },
  ];
  const { result } = renderHook(useSearchReveal);
  await act(async () => {
    await result.current.handleSearchSelect({ ...search, ref_id: undefined, address: '서울 중구' });
  });
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'normalized' }),
    'search_result'
  );
  expect(mockFetch).not.toHaveBeenCalled();
});

it('uses supplied coordinates without fetching and removes a stale public-place link for transit', async () => {
  window.history.replaceState(null, '', '/?place=park:42&keep=value');
  const { result } = renderHook(useSearchReveal);
  await act(async () => {
    await result.current.handleSearchSelect({
      id: 'station',
      name: '서울역',
      category: 'subway',
      position,
    });
  });
  expect(mockFacility.addTransientFacility).toHaveBeenCalledWith(
    expect.objectContaining({ category: 'subway', address: '', position })
  );
  expect(window.location.search).not.toContain('place=');
  expect(mockFetch).not.toHaveBeenCalled();
});

it('loads missing place details through the same-origin endpoint and validates the converted position', async () => {
  const detail = { name: '공원 상세' };
  mockFetch.mockResolvedValue({ ok: true, json: async () => detail });
  jest.mocked(convertSearchResultToFacility).mockReturnValue(place);
  const { result } = renderHook(useSearchReveal);
  await act(async () => {
    await result.current.handleSearchSelect(search);
  });
  expect(mockFetch).toHaveBeenCalledWith('/api/search/data/park%3A42', { cache: 'no-store' });
  expect(convertSearchResultToFacility).toHaveBeenCalledWith('park', detail, search);
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(place, 'search_result');
});

it.each(['subway', 'bike'] as const)(
  'rejects a %s result without a position before fetching',
  async category => {
    const { result } = renderHook(useSearchReveal);
    await act(async () => {
      await expect(result.current.handleSearchSelect({ ...search, category })).rejects.toThrow(
        '교통 시설'
      );
    });
    expect(result.current.selectionMessage).toContain('위치를 찾을 수 없습니다');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockFacility.selectFacility).not.toHaveBeenCalled();
  }
);

it.each([
  ['http', '장소 상세 정보를 불러오지 못했습니다.'],
  ['missing', '선택한 장소의 위치를 확인할 수 없습니다.'],
  ['invalid', '선택한 장소의 위치 정보가 올바르지 않습니다.'],
  ['unknown', '검색 결과를 지도에 표시하지 못했습니다.'],
])('reports %s lookup errors without selecting a place', async (mode, message) => {
  mockFetch.mockResolvedValue({ ok: mode !== 'http', json: async () => ({}) });
  jest
    .mocked(convertSearchResultToFacility)
    .mockReturnValue(mode === 'invalid' ? { ...place, position: { lat: 0, lng: 0 } } : null);
  if (mode === 'unknown') mockFetch.mockRejectedValue('synthetic unavailable');
  const { result } = renderHook(useSearchReveal);
  await act(async () => {
    await expect(result.current.handleSearchSelect(search)).rejects.toBeDefined();
  });
  expect(result.current.selectionMessage).toBe(message);
  expect(mockFacility.selectFacility).not.toHaveBeenCalled();
});

it('resolves a public deep link once, retaining optional place information', async () => {
  mockParams.set('place', 'cultural-event:7');
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      ...publicPlace,
      address: '서울',
      description: '공연',
      phone: '02-000',
      website: 'https://example.com',
      openingHours: '10-18',
      reservable: true,
    }),
  });
  const { result, rerender } = renderHook(useSearchReveal);
  await waitFor(() =>
    expect(result.current.selectionMessage).toBe('공개 공원 위치로 이동했습니다.')
  );
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/public/places/cultural-event/7',
    expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) })
  );
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'public:cultural-event:7',
      category: 'cultural_event',
      operatingHours: '10-18',
      isReservable: true,
    }),
    'public_place'
  );
  rerender();
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it('uses safe defaults for absent optional public-place fields', async () => {
  mockParams.set('place', 'park:7');
  mockFetch.mockResolvedValue({ ok: true, json: async () => publicPlace });
  const { result } = renderHook(useSearchReveal);
  await waitFor(() => expect(result.current.selectionMessage).toContain('위치로 이동'));
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(
    expect.objectContaining({
      address: '',
      description: undefined,
      phone: undefined,
      website: undefined,
      operatingHours: undefined,
      isReservable: false,
    }),
    'public_place'
  );
});

it.each(['park', ':3', 'unknown:7', 'park:0', 'park:1.5', 'park:9007199254740992'])(
  'ignores invalid public link %s',
  link => {
    mockParams.set('place', link);
    renderHook(useSearchReveal);
    expect(mockFetch).not.toHaveBeenCalled();
  }
);

it('waits for map readiness and aborts an unfinished request on unmount', async () => {
  mockParams.set('place', 'park:7');
  mockMap.mapStatus.success = false;
  mockFetch.mockReturnValue(new Promise(() => {}));
  const { rerender, unmount } = renderHook(useSearchReveal);
  expect(mockFetch).not.toHaveBeenCalled();
  mockMap.mapStatus.success = true;
  rerender();
  const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
});

it.each(['http', 'null-latitude', 'null-longitude', 'outside-seoul', 'unknown'])(
  'reports %s public-place failure',
  async mode => {
    mockParams.set('place', 'park:7');
    const changes =
      mode === 'null-latitude'
        ? { latitude: null }
        : mode === 'null-longitude'
          ? { longitude: null }
          : mode === 'outside-seoul'
            ? { latitude: 0 }
            : {};
    mockFetch.mockResolvedValue({
      ok: mode !== 'http',
      json: async () => ({ ...publicPlace, ...changes }),
    });
    if (mode === 'unknown') mockFetch.mockRejectedValue('synthetic failure');
    const { result } = renderHook(useSearchReveal);
    await waitFor(() => expect(result.current.selectionMessage).not.toBe(''));
    expect(result.current.selectionMessage).toMatch(/못했습니다|없습니다/);
    expect(mockFacility.selectFacility).not.toHaveBeenCalled();
  }
);
