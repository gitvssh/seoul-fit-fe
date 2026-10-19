import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Facility, WeatherData, CongestionData } from '@/lib/types';
import type { LiveSlice } from '@/shared/lib/hooks/useLiveData';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { useAuthStore } from '@/shared/model/authStore';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { FacilityDetail } from '../FacilityDetail';
import { FacilityInfo } from '../FacilityInfo';
import { FacilityHeader, formatDistanceKm } from '../FacilityHeader';

const position = { lat: 37.5665, lng: 126.978 };
const place: Facility = {
  id: 'park',
  name: '서울 공원',
  category: 'park',
  address: '서울 중구',
  position,
  congestionLevel: 'low',
  operatingHours: '24시간',
  description: '산책하기 좋은 곳',
  distance: 0.3,
};
const alternative: Facility = {
  ...place,
  id: 'alternative',
  name: '근처 공원',
  position: { ...position, lat: position.lat + 0.001 },
};
const mockFacility = { facilities: [place, alternative], selectFacility: jest.fn() };
const mockMap = { revealPosition: jest.fn() };
const mockExplore = {
  origin: position,
  activePreset: 'quiet',
  live: {
    weather: { status: 'idle', data: null, fetchedAt: null } as LiveSlice<WeatherData>,
    congestion: { status: 'idle', data: null, fetchedAt: null } as LiveSlice<CongestionData>,
  },
};
const mockRecord = jest.fn(async (...args: unknown[]) => {
  void args;
});
jest.mock('../../providers/FacilityProvider', () => ({ useFacilityContext: () => mockFacility }));
jest.mock('../../providers/MapProvider', () => ({ useMapContext: () => mockMap }));
jest.mock('../../providers/ExploreProvider', () => ({ useExploreContext: () => mockExplore }));
jest.mock('@/features/engagement/api/engagement', () => ({
  markRecentlyViewed: (...args: unknown[]) => mockRecord(...args),
}));
jest.mock('@/features/favorites/lib/useLocalFacilityFavorite', () => ({
  useLocalFacilityFavorite: () => ({
    isFavorite: false,
    isSaving: false,
    error: null,
    toggleFavorite: jest.fn(),
  }),
}));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const mount = (facility = place, compact = false) =>
  render(
    <I18nProvider>
      <FacilityDetail facility={facility} onBack={jest.fn()} compact={compact} />
    </I18nProvider>
  );
beforeEach(() => {
  jest.clearAllMocks();
  mockRecord.mockResolvedValue(undefined);
  mockFacility.facilities = [place, alternative];
  mockExplore.live.weather = { status: 'idle', data: null, fetchedAt: null };
  mockExplore.live.congestion = { status: 'idle', data: null, fetchedAt: null };
  useAuthStore.setState({ isAuthenticated: false, accessToken: null });
});

it('renders decision, source information, nearby alternatives and accessible back navigation together', () => {
  const onBack = jest.fn();
  render(
    <I18nProvider>
      <FacilityDetail facility={place} onBack={onBack} />
    </I18nProvider>
  );
  expect(screen.getByRole('article', { name: place.name })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: labels['facility.decision'] })).toHaveTextContent(/점/);
  expect(screen.getByText('산책하기 좋은 곳')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /근처 공원/ }));
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'alternative' }),
    'recommendation'
  );
  expect(mockMap.revealPosition).toHaveBeenCalledWith(alternative.position, { minLevel: 4 });
  expect(trackEvent).toHaveBeenCalledWith(
    'alternative_selected',
    expect.objectContaining({ category: 'park' })
  );
  fireEvent.click(screen.getByRole('button', { name: labels['facility.back'] }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(mockRecord).not.toHaveBeenCalled();
});

it('keeps compact detail limited to its heading and primary actions', () => {
  mount(place, true);
  expect(screen.getByRole('article', { name: place.name })).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: labels['facility.decision'] })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('산책하기 좋은 곳')).not.toBeInTheDocument();
});

it('records authenticated views once per place and never sends an absent token', async () => {
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'synthetic-test-token' });
  const view = mount();
  await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(1));
  expect(mockRecord).toHaveBeenCalledWith(
    'synthetic-test-token',
    expect.objectContaining({ name: place.name, latitude: position.lat })
  );
  view.rerender(
    <I18nProvider>
      <FacilityDetail facility={{ ...place }} onBack={jest.fn()} />
    </I18nProvider>
  );
  expect(mockRecord).toHaveBeenCalledTimes(1);
  view.rerender(
    <I18nProvider>
      <FacilityDetail facility={alternative} onBack={jest.fn()} />
    </I18nProvider>
  );
  await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(2));
});

it('allows a failed recent-view record to be retried on a later render', async () => {
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'synthetic-test-token' });
  mockRecord.mockRejectedValueOnce(new Error('synthetic API unavailable'));
  const view = mount();
  await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(1));
  view.rerender(
    <I18nProvider>
      <FacilityDetail facility={{ ...place }} onBack={jest.fn()} />
    </I18nProvider>
  );
  await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(2));
});

it('presents stale provenance, valid source links, phone, hours, reservation and bike capacity', () => {
  const facility: Facility = {
    ...place,
    category: 'bike',
    phone: '02-000',
    isReservable: true,
    sourceUpdatedAt: '2020-01-01T00:00:00Z',
    dataSourceUrl: 'https://example.com/data',
    bikeFacility: { parkingBikeTotCnt: 3, rackTotCnt: 10, shared: 30 },
  };
  render(
    <I18nProvider>
      <FacilityInfo facility={facility} />
    </I18nProvider>
  );
  expect(screen.getByText(labels['facility.staleWarning'])).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '서울자전거 따릉이' })).toHaveAttribute(
    'href',
    'https://example.com/data'
  );
  const phone = screen.getByRole('link', { name: '02-000' });
  phone.addEventListener('click', event => event.preventDefault());
  fireEvent.click(phone);
  expect(trackEvent).toHaveBeenCalledWith('facility_action_clicked', {
    action_type: 'phone',
    category: 'bike',
  });
  expect(screen.getByText('24시간')).toBeInTheDocument();
  expect(screen.getByText(labels['facility.reservableYes'])).toBeInTheDocument();
  expect(screen.getByText(/3.*10/)).toBeInTheDocument();
});

it('renders cultural-event details without treating the event description as general place prose', () => {
  const facility: Facility = {
    ...place,
    category: 'cultural_event',
    culturalEvent: {
      id: 'event',
      title: '전시',
      description: '전시 소개',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      type: 'exhibition',
      requiresReservation: false,
      codeName: '전시',
      useFee: '무료',
      useTarget: '전체',
      ticket: '현장',
      isFree: true,
      mainImg: '/poster.png',
    },
  };
  render(
    <I18nProvider>
      <FacilityInfo facility={facility} />
    </I18nProvider>
  );
  expect(screen.getByRole('region', { name: labels['facility.eventInfo'] })).toHaveTextContent(
    '전시'
  );
  expect(screen.getByText('무료')).toBeInTheDocument();
  expect(screen.getByText('전체')).toBeInTheDocument();
  expect(screen.getByText('현장')).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: labels['facility.description'] })
  ).not.toBeInTheDocument();
});

it.each(['closed', 'unknown', 'subway'] as const)(
  'represents %s hours without promising unavailable opening information',
  mode => {
    const facility: Facility = {
      ...place,
      category: mode === 'subway' ? 'subway' : 'library',
      operatingHours: mode === 'closed' ? '휴무' : undefined,
      distance: mode === 'unknown' ? undefined : 1.5,
    };
    render(
      <I18nProvider>
        <FacilityHeader facility={facility} onBack={jest.fn()} titleId='title' />
      </I18nProvider>
    );
    if (mode === 'subway')
      expect(screen.queryByText(labels['explorer.hoursUnknown'])).not.toBeInTheDocument();
    else
      expect(
        screen.getByText(labels[mode === 'closed' ? 'explorer.closed' : 'explorer.hoursUnknown'])
      ).toBeInTheDocument();
  }
);

it.each([
  [undefined, 'unknown'],
  [Number.NaN, 'unknown'],
  [0.3, '300m'],
  [1.52, '1.5km'],
] as const)('formats distance %s for place details', (distance, expected) => {
  expect(formatDistanceKm(distance, 'unknown')).toBe(expected);
});
