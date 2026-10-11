import { render, screen } from '@testing-library/react';
import { I18nProvider, LOCALE_STORAGE_KEY } from '@/shared/i18n/I18nProvider';
import { FreshnessBadge } from '../freshness-badge';

const now = new Date('2026-07-25T12:00:00+09:00');

describe('FreshnessBadge', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the live label with a machine-readable time and relative text', () => {
    render(
      <I18nProvider>
        <FreshnessBadge timestamp='2026-07-25T11:57:00+09:00' now={now} />
      </I18nProvider>
    );

    const badge = screen.getByText(/실시간/);
    expect(badge).toHaveAttribute('data-freshness', 'live');
    const time = badge.querySelector('time');
    expect(time).toHaveAttribute('dateTime', '2026-07-25T02:57:00.000Z');
    expect(time).toHaveTextContent('3분 전');
  });

  it('falls back to the unknown label without a time element', () => {
    render(
      <I18nProvider>
        <FreshnessBadge timestamp={undefined} now={now} />
      </I18nProvider>
    );

    const badge = screen.getByText('기준 시각 미확인');
    expect(badge).toHaveAttribute('data-freshness', 'unknown');
    expect(badge.querySelector('time')).toBeNull();
  });

  it('prefers an explicit status and honours the locale', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    render(
      <I18nProvider>
        <FreshnessBadge timestamp='2026-07-25T09:00:00+09:00' status='stale' now={now} />
      </I18nProvider>
    );

    const badge = await screen.findByText(/Update delayed/);
    expect(badge).toHaveAttribute('data-freshness', 'stale');
    expect(badge.querySelector('time')).toHaveTextContent('3 hours ago');
  });
});
