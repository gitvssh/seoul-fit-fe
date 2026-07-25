describe('GA4 privacy boundary', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123';
    jest.resetModules();
    window.localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  });

  it('does not initialise or send events before explicit consent', () => {
    const analytics = require('../analytics') as typeof import('../analytics');

    analytics.initializeAnalytics();
    analytics.trackEvent('facility_detail_viewed', { category: 'park' });

    expect(window.dataLayer).toBeUndefined();
  });

  it('sends only the allowlisted, non-identifying event fields after consent', () => {
    const analytics = require('../analytics') as typeof import('../analytics');
    analytics.setAnalyticsConsent('granted');

    analytics.initializeAnalytics();
    analytics.trackEvent('facility_action_clicked', {
      action_type: 'phone',
      category: 'park',
      entry_point: 'sidebar?search=private',
    });

    expect(window.dataLayer).toHaveLength(4);
    expect(window.dataLayer?.[0]).toEqual(['consent', 'update', { analytics_storage: 'granted' }]);
    expect(window.dataLayer?.[2]).toEqual(['config', 'G-TEST123', { send_page_view: false }]);
    expect(window.dataLayer?.[3]).toEqual([
      'event',
      'facility_action_clicked',
      {
        event_version: '1',
        action_type: 'phone',
        category: 'park',
      },
    ]);
  });

  it('removes query strings from page-view paths', () => {
    const analytics = require('../analytics') as typeof import('../analytics');
    analytics.setAnalyticsConsent('granted');

    analytics.trackPageView('/places/park/42?search=private', 'place_detail');

    expect(window.dataLayer?.[1]).toEqual([
      'event',
      'page_view',
      { page_path: '/places/park/42', page_type: 'place_detail' },
    ]);
  });

  it('notifies Google consent mode when consent is cleared', () => {
    const analytics = require('../analytics') as typeof import('../analytics');
    analytics.setAnalyticsConsent('granted');

    analytics.clearAnalyticsConsent();

    expect(window.dataLayer?.at(-1)).toEqual([
      'consent',
      'update',
      { analytics_storage: 'denied' },
    ]);
  });
});
