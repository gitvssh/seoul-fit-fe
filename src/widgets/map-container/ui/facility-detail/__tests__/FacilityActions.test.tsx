import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Facility } from '@/lib/types';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { showToast } from '@/shared/lib/utils/toast';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { FacilityActions } from '../FacilityActions';

const place: Facility = {
  id: 'public:park:42',
  name: '서울 공원',
  category: 'park',
  address: '서울',
  position: { lat: 37.5665, lng: 126.978 },
  congestionLevel: 'low',
};
const mockFavorite = {
  isFavorite: false,
  isSaving: false,
  error: null as string | null,
  toggleFavorite: jest.fn(async () => true),
};
jest.mock('@/features/favorites/lib/useLocalFacilityFavorite', () => ({
  useLocalFacilityFavorite: () => mockFavorite,
}));
jest.mock('@/shared/lib/utils/toast', () => ({ showToast: jest.fn() }));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const mount = (facility = place, compact = false) =>
  render(
    <I18nProvider>
      <FacilityActions facility={facility} compact={compact} />
    </I18nProvider>
  );
const setShare = (share: unknown) =>
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
const setClipboard = (clipboard: unknown) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
beforeEach(() => {
  jest.clearAllMocks();
  setShare(undefined);
  setClipboard(undefined);
  mockFavorite.isFavorite = false;
  mockFavorite.isSaving = false;
  mockFavorite.error = null;
  mockFavorite.toggleFavorite.mockResolvedValue(true);
});
afterAll(() => {
  if (originalShare) Object.defineProperty(navigator, 'share', originalShare);
  else Reflect.deleteProperty(navigator, 'share');
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});

it.each([
  [
    { reservationUrl: 'https://example.com/book', website: 'https://example.com', phone: '02-000' },
    'reservation',
    'https://example.com/book',
  ],
  [{ website: 'https://example.com', phone: '02-000' }, 'website', 'https://example.com/'],
  [{ phone: '02-000' }, 'phone', 'tel:02-000'],
] as const)('selects a safe secondary action in priority order', (extras, action, href) => {
  mount({ ...place, ...extras });
  const link = screen.getByRole('link', {
    name: labels[
      action === 'reservation'
        ? 'facility.reservation'
        : action === 'website'
          ? 'facility.website'
          : 'facility.phoneAction'
    ],
  });
  expect(link).toHaveAttribute('href', href);
  // Prevent jsdom from following the external destination while exercising React's click handler.
  link.addEventListener('click', event => event.preventDefault());
  fireEvent.click(link);
  expect(trackEvent).toHaveBeenCalledWith('facility_action_clicked', {
    action_type: action,
    category: 'park',
  });
  const navigation = screen.getByRole('link', { name: labels['facility.directions'] });
  expect(navigation).toHaveAttribute('rel', 'noopener noreferrer');
  expect(navigation.getAttribute('href')).toContain('https://map.kakao.com/link/to/');
  navigation.addEventListener('click', event => event.preventDefault());
  fireEvent.click(navigation);
  expect(trackEvent).toHaveBeenCalledWith('facility_action_clicked', {
    action_type: 'navigation',
    category: 'park',
  });
});

it('hides optional actions in compact mode and rejects unsafe website links', () => {
  const view = mount({ ...place, website: 'javascript:alert(1)' });
  expect(screen.queryByRole('link', { name: labels['facility.website'] })).not.toBeInTheDocument();
  view.rerender(
    <I18nProvider>
      <FacilityActions facility={{ ...place, phone: '02-000' }} compact />
    </I18nProvider>
  );
  expect(screen.getAllByRole('link')).toHaveLength(1);
});

it.each([true, false])(
  'reports the actual favorite result %s and renders its saved state',
  async saved => {
    mockFavorite.isFavorite = !saved;
    mockFavorite.toggleFavorite.mockResolvedValue(saved);
    mount();
    fireEvent.click(
      screen.getByRole('button', { name: labels[saved ? 'facility.save' : 'facility.saved'] })
    );
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith('favorite_changed', {
        action_type: 'save',
        category: 'park',
        favorite_state: saved ? 'saved' : 'removed',
      })
    );
  }
);

it('disables repeat saves while pending and presents a recoverable save error', () => {
  mockFavorite.isSaving = true;
  mockFavorite.error = '저장할 수 없습니다';
  mount();
  expect(screen.getByRole('button', { name: labels['facility.save'] })).toBeDisabled();
  expect(screen.getByText('저장할 수 없습니다')).toBeInTheDocument();
});

it.each(['native', 'clipboard', 'unsupported', 'abort', 'error'])(
  'handles %s sharing without inventing a successful share',
  async mode => {
    const share = jest.fn(async () => {}),
      writeText = jest.fn(async () => {});
    if (mode === 'native' || mode === 'abort' || mode === 'error') setShare(share);
    if (mode === 'clipboard') setClipboard({ writeText });
    if (mode === 'abort') share.mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    if (mode === 'error') share.mockRejectedValue(new Error('synthetic share failure'));
    mount();
    fireEvent.click(screen.getByRole('button', { name: labels['facility.share'] }));
    if (mode === 'abort') {
      await waitFor(() => expect(share).toHaveBeenCalled());
      expect(showToast).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(showToast).toHaveBeenCalled());
      const key =
        mode === 'native'
          ? 'facility.shareDone'
          : mode === 'clipboard'
            ? 'facility.linkCopied'
            : mode === 'unsupported'
              ? 'facility.shareUnsupported'
              : 'facility.shareFailed';
      expect(showToast).toHaveBeenCalledWith(
        labels[key],
        mode === 'unsupported' ? 'warning' : mode === 'error' ? 'error' : 'success'
      );
    }
    if (mode === 'native')
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: place.name,
          url: expect.stringContaining('place=park%3A42'),
        })
      );
    if (mode === 'clipboard')
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('place=park%3A42'));
    expect(
      jest.mocked(trackEvent).mock.calls.some(([name]) => name === 'facility_action_clicked')
    ).toBe(mode === 'native' || mode === 'clipboard');
  }
);
