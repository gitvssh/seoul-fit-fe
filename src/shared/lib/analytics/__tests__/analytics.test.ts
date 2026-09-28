import {
  cleanParams,
  dispatchAnalyticsEvent,
  isAnalyticsAvailable,
  trackEvent,
} from '../analytics';

describe('Zaraz analytics transport', () => {
  afterEach(() => {
    delete window.zaraz;
  });

  it('is a no-op when the consent-controlled Zaraz client is absent', () => {
    expect(isAnalyticsAvailable()).toBe(false);
    expect(() => trackEvent('map_ready', { page_type: 'home_map' })).not.toThrow();
  });

  it('sends only the allowlisted, non-identifying event fields', () => {
    const track = jest.fn();
    window.zaraz = { track };

    trackEvent('facility_action_clicked', {
      action_type: 'phone',
      category: 'park',
      entry_point: 'sidebar?search=private',
      // @ts-expect-error unknown keys are dropped at runtime as well as by the type
      email: 'someone@example.com',
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('facility_action_clicked', {
      event_version: '1',
      action_type: 'phone',
      category: 'park',
    });
  });

  it('rejects free text, URLs and over-long values', () => {
    expect(
      cleanParams({
        filter_value: 'https://example.com/private',
        preset: 'x'.repeat(81),
        reason_code: 'ok_value-1',
        category: '공원',
      })
    ).toEqual({ reason_code: 'ok_value-1' });
  });

  it('does not let a throwing tracker interrupt the caller', () => {
    window.zaraz = {
      track: jest.fn(() => {
        throw new Error('tracker unavailable');
      }),
    };

    expect(() => dispatchAnalyticsEvent('map_ready', { page_type: 'home_map' })).not.toThrow();
  });

  it('absorbs an asynchronous tracker rejection', async () => {
    const track = jest.fn(() => Promise.reject(new Error('tracker unavailable')));
    window.zaraz = { track };

    dispatchAnalyticsEvent('map_ready', { page_type: 'home_map' });
    await Promise.resolve();

    expect(track).toHaveBeenCalledTimes(1);
  });

  it('never references a measurement ID or vendor script', () => {
    expect(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });
});

declare global {
  interface Window {
    dataLayer?: unknown;
    gtag?: unknown;
  }
}
