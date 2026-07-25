export const ANALYTICS_CONSENT_STORAGE_KEY = 'seoul-fit.analytics-consent.v1';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

export type AnalyticsEventName =
  | 'map_ready'
  | 'geolocation_result'
  | 'discovery_started'
  | 'filter_applied'
  | 'place_list_viewed'
  | 'facility_detail_viewed'
  | 'facility_action_clicked'
  | 'recommendation_viewed'
  | 'recommendation_selected'
  | 'alternative_selected'
  | 'favorite_changed'
  | 'area_saved'
  | 'alert_rule_changed'
  | 'activity_plan_created'
  | 'language_changed'
  | 'accessibility_preference_changed'
  | 'login_started'
  | 'login_completed'
  | 'login_failed'
  | 'signup_completed'
  | 'preferences_saved';

export interface AnalyticsEventParams {
  action_type?: 'map' | 'phone' | 'website' | 'navigation' | 'share' | 'save' | 'reservation';
  category?: string;
  entry_point?: string;
  favorite_state?: 'saved' | 'removed';
  filter_type?: string;
  filter_value?: string;
  preset?: string;
  reason_code?: string;
  location_permission?: 'granted' | 'denied' | 'unavailable';
  page_type?: 'home_map' | 'place_list' | 'place_detail' | 'profile';
  result?: 'existing_user' | 'new_user' | 'recovered_existing_user' | 'authorization_code';
  selection_source?:
    | 'category_filter'
    | 'cluster'
    | 'map_marker'
    | 'public_place'
    | 'recommendation'
    | 'natural_language'
    | 'search_history'
    | 'search_result';
  duration_bucket?: string;
  stop_count?: string;
  language?: 'ko' | 'en';
}

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const allowedParamKeys = new Set<keyof AnalyticsEventParams>([
  'action_type',
  'category',
  'entry_point',
  'favorite_state',
  'filter_type',
  'filter_value',
  'preset',
  'reason_code',
  'location_permission',
  'page_type',
  'result',
  'selection_source',
  'duration_bucket',
  'stop_count',
  'language',
]);

export function isAnalyticsConfigured(): boolean {
  return Boolean(measurementId && /^G-[A-Z0-9]+$/i.test(measurementId));
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown';

  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'unknown'>): void {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage can be unavailable in private browsing. The current page still respects the choice.
  }

  if (isAnalyticsConfigured()) {
    sendToGtag('consent', 'update', {
      analytics_storage: consent,
    });
  }
}

export function clearAnalyticsConsent(): void {
  if (isAnalyticsConfigured()) {
    sendToGtag('consent', 'update', { analytics_storage: 'denied' });
  }

  try {
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

function sendToGtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...queuedArgs: unknown[]) => window.dataLayer?.push(queuedArgs));
  window.gtag(...args);
}

function cleanParams(params: AnalyticsEventParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) =>
        allowedParamKeys.has(key as keyof AnalyticsEventParams) &&
        typeof value === 'string' &&
        value.length <= 80 &&
        /^[a-z0-9_-]+$/i.test(value)
    )
  );
}

function canTrack(): boolean {
  return isAnalyticsConfigured() && getAnalyticsConsent() === 'granted';
}

export function initializeAnalytics(): void {
  if (!canTrack() || !measurementId) return;

  sendToGtag('js', new Date());
  sendToGtag('config', measurementId, { send_page_view: false });
}

/**
 * GA4 events intentionally exclude search text, exact coordinates, facility IDs,
 * contact details, account IDs, and OAuth values. Those values are not needed for
 * the aggregate product funnel and may be personal data.
 */
export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  if (!canTrack()) return;

  sendToGtag('event', name, {
    event_version: '1',
    ...cleanParams(params),
  });
}

export function trackPageView(
  pathname: string,
  pageType?: AnalyticsEventParams['page_type']
): void {
  if (!canTrack()) return;

  const safePath = pathname.startsWith('/') ? pathname.split('?')[0] : '/';
  sendToGtag('event', 'page_view', {
    page_path: safePath,
    ...(pageType ? { page_type: pageType } : {}),
  });
}
