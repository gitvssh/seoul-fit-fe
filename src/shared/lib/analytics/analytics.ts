/**
 * Thin, consent-agnostic analytics transport.
 *
 * GA4 is connected through Cloudflare Zaraz. The application never holds a
 * measurement ID and never loads a vendor script: it only calls
 * `window.zaraz.track(eventName, properties)`. Zaraz Consent decides whether a
 * tool runs, so when Zaraz is absent, consent was not granted, or the tracker
 * fails, every call here is a silent no-op and the product flow is unaffected.
 *
 * Event names and allowed properties are typed and allowlisted below. Search
 * text, exact coordinates, facility IDs, names, addresses, phone numbers, URLs,
 * account IDs, emails and OAuth values are never sent.
 */

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
    | 'search_result'
    | 'region_shortcut';
  duration_bucket?: string;
  stop_count?: string;
  language?: 'ko' | 'en';
}

export type AnalyticsProperties = Readonly<Record<string, string>>;

interface ZarazClient {
  track: (eventName: string, properties?: Record<string, string>) => void | Promise<unknown>;
}

declare global {
  interface Window {
    zaraz?: ZarazClient;
  }
}

export const ANALYTICS_EVENT_VERSION = '1';

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

const SAFE_VALUE = /^[a-z0-9_-]+$/i;
const MAX_VALUE_LENGTH = 80;

/**
 * Keep only allowlisted keys with short, enum-like string values. Anything that
 * looks like free text, a URL, a query string or an identifier is dropped.
 */
export function cleanParams(params: AnalyticsEventParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) =>
        allowedParamKeys.has(key as keyof AnalyticsEventParams) &&
        typeof value === 'string' &&
        value.length <= MAX_VALUE_LENGTH &&
        SAFE_VALUE.test(value)
    )
  );
}

function ignoreRejectedDispatch(result: void | Promise<unknown>): void {
  if (result && typeof (result as Promise<unknown>).catch === 'function') {
    void (result as Promise<unknown>).catch(() => undefined);
  }
}

/** True only when the consent-controlled Zaraz client is present on the page. */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.zaraz?.track === 'function';
}

export function dispatchAnalyticsEvent(eventName: string, properties: AnalyticsProperties): void {
  if (!isAnalyticsAvailable()) return;

  try {
    ignoreRejectedDispatch(window.zaraz!.track(eventName, { ...properties }));
  } catch {
    // Analytics must never interrupt the map or login flows.
  }
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  dispatchAnalyticsEvent(name, {
    event_version: ANALYTICS_EVENT_VERSION,
    ...cleanParams(params),
  });
}
