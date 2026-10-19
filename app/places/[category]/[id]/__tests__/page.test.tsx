import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { getPublicPlace, type PublicPlace } from '@/shared/lib/seo/public-places';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import PlaceDetailPage, { generateMetadata } from '../page';

jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
jest.mock('@/shared/lib/seo/public-places', () => ({
  ...jest.requireActual('@/shared/lib/seo/public-places'),
  getPublicPlace: jest.fn(),
}));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const place: PublicPlace = {
  id: 42,
  category: 'park',
  categoryLabel: '공원',
  name: '서울 공원',
  address: '서울 중구',
  description: '산책하기 좋은 공원',
  phone: '02-000',
  website: 'https://example.com',
  openingHours: '24시간',
  imageUrl: 'https://example.com/park.jpg',
  latitude: 37.5665,
  longitude: 126.978,
  district: '중구',
  eventStart: null,
  eventEnd: null,
  reservable: false,
  lastModified: '2026-01-01T00:00:00Z',
};
const props = (category = 'park', id = '42') => ({ params: Promise.resolve({ category, id }) });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getPublicPlace).mockResolvedValue(place);
});

it('renders public place information, safe actions and structured data for the same map destination', async () => {
  const { container } = render(await PlaceDetailPage(props()));
  expect(screen.getByRole('heading', { level: 1, name: place.name })).toBeInTheDocument();
  expect(screen.getByText('산책하기 좋은 공원')).toBeInTheDocument();
  expect(screen.getByText('서울 중구')).toBeInTheDocument();
  expect(screen.getByText('24시간')).toBeInTheDocument();
  const map = screen.getByRole('link', { name: '지도에서 보기' });
  expect(new URL(map.getAttribute('href')!, window.location.origin).searchParams.get('place')).toBe(
    'park:42'
  );
  for (const [name, action] of [
    ['지도에서 보기', 'map'],
    ['카카오맵 길찾기', 'navigation'],
    ['전화하기', 'phone'],
    ['공식 페이지', 'website'],
  ] as const) {
    const link = screen.getByRole('link', { name });
    link.addEventListener('click', event => event.preventDefault());
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith('facility_action_clicked', {
      action_type: action,
      category: 'park',
    });
  }
  const schema = JSON.parse(
    container.querySelector('script[type="application/ld+json"]')!.textContent!
  );
  expect(schema).toMatchObject({
    '@type': 'Place',
    name: place.name,
    geo: { latitude: place.latitude, longitude: place.longitude },
  });
  const metadata = await generateMetadata(props());
  expect(metadata).toMatchObject({
    title: place.name,
    alternates: { canonical: '/places/park/42' },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', images: [{ url: place.imageUrl, alt: place.name }] },
  });
});

it('renders event schedule, badges and an event schema while keeping non-indexable categories out of search', async () => {
  jest
    .mocked(getPublicPlace)
    .mockResolvedValue({
      ...place,
      category: 'cultural-event',
      categoryLabel: '문화행사',
      description: '공연 · 가족',
      eventStart: '2026-01-01',
      eventEnd: '2026-02-01',
      reservable: true,
    });
  const { container } = render(await PlaceDetailPage(props('cultural-event')));
  expect(screen.getByText('2026-01-01 ~ 2026-02-01')).toBeInTheDocument();
  const reservation = screen.getByRole('link', { name: '예약·공식 페이지' });
  reservation.addEventListener('click', event => event.preventDefault());
  fireEvent.click(reservation);
  expect(trackEvent).toHaveBeenCalledWith('facility_action_clicked', {
    action_type: 'reservation',
    category: 'cultural-event',
  });
  const schema = JSON.parse(container.querySelector('script')!.textContent!);
  expect(schema).toMatchObject({
    '@type': 'Event',
    eventStatus: 'https://schema.org/EventScheduled',
    location: { address: place.address },
  });
  expect(await generateMetadata(props('cultural-event'))).toMatchObject({
    robots: { index: false },
    openGraph: { type: 'article' },
  });
});

it('labels closed places and omits unsafe or missing optional content and directions', async () => {
  jest
    .mocked(getPublicPlace)
    .mockResolvedValue({
      ...place,
      name: '[폐관] 옛 도서관',
      category: 'library',
      categoryLabel: '도서관',
      address: null,
      description: null,
      phone: null,
      website: 'javascript:alert(1)',
      imageUrl: 'javascript:alert(1)',
      latitude: null,
      longitude: null,
      openingHours: null,
      district: null,
      lastModified: null,
    });
  const { container } = render(await PlaceDetailPage(props('library')));
  expect(screen.getByRole('heading', { level: 1, name: '옛 도서관' })).toBeInTheDocument();
  expect(screen.getByText(/원천 데이터에 폐관/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: '카카오맵 길찾기' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: '공식 페이지' })).not.toBeInTheDocument();
  expect(JSON.parse(container.querySelector('script')!.textContent!)).not.toHaveProperty('geo');
  expect(await generateMetadata(props('library'))).toMatchObject({
    description: '서울 도서관 옛 도서관 정보',
    robots: { index: false },
  });
});

it('shows parsed restaurant facts and uses a restaurant schema', async () => {
  jest
    .mocked(getPublicPlace)
    .mockResolvedValue({
      ...place,
      category: 'restaurant',
      categoryLabel: '맛집',
      description: '비빔밥 · 시청역',
    });
  const { container } = render(await PlaceDetailPage(props('restaurant')));
  expect(screen.getByText('대표 메뉴')).toBeInTheDocument();
  expect(screen.getByText('시청역')).toBeInTheDocument();
  expect(JSON.parse(container.querySelector('script')!.textContent!)).toMatchObject({
    '@type': 'Restaurant',
  });
});

it.each([
  ['park', '0'],
  ['park', '1.5'],
  ['park', '9007199254740992'],
  ['unknown', '42'],
])('returns not-found for invalid route %s/%s without fetching', async (category, id) => {
  await expect(PlaceDetailPage(props(category, id))).rejects.toThrow('NEXT_NOT_FOUND');
  expect(await generateMetadata(props(category, id))).toEqual({});
  expect(getPublicPlace).not.toHaveBeenCalled();
});

it('returns not-found for an absent place and gives metadata a safe empty result', async () => {
  jest.mocked(getPublicPlace).mockResolvedValue(null);
  await expect(PlaceDetailPage(props())).rejects.toThrow('NEXT_NOT_FOUND');
  expect(await generateMetadata(props())).toEqual({});
});
