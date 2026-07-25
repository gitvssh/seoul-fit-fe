import type { Facility } from '@/lib/types';

export type AlertRuleType =
  | 'AIR_QUALITY'
  | 'EXTREME_HEAT'
  | 'HEAVY_RAIN'
  | 'BIKE_SHORTAGE'
  | 'BIKE_FULL'
  | 'CULTURAL_EVENT'
  | 'RESERVATION_OPEN';

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface EngagementPlaceRequest {
  placeKey: string;
  sourceId: string;
  category: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface SavedPlace extends EngagementPlaceRequest {
  id: number;
  favorite: boolean;
  savedAt: string | null;
  lastViewedAt: string | null;
}

export interface SavedZone {
  id: number;
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

export interface ZoneRequest {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AlertSubscriptionRequest {
  zoneId: number;
  alertType: AlertRuleType;
  activeDays: Weekday[];
  activeStart: string | null;
  activeEnd: string | null;
  quietStart: string | null;
  quietEnd: string | null;
  cooldownMinutes: number;
  active: boolean;
}

export interface AlertSubscription extends AlertSubscriptionRequest {
  id: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface AlertEvaluation {
  evaluated: number;
  generated: number;
  deferred: number;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function toEngagementPlaceRequest(
  facility: Pick<Facility, 'id' | 'category' | 'name' | 'address' | 'position'>
): EngagementPlaceRequest {
  const rawId = String(facility.id);
  const safeId = rawId.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 110) || 'unknown';
  return {
    placeKey: `${facility.category}:${safeId}:${stableHash(rawId)}`.slice(0, 180),
    sourceId: rawId.trim().slice(0, 140) || 'unknown',
    category: facility.category,
    name: facility.name.slice(0, 200),
    address: facility.address.slice(0, 500),
    latitude: facility.position.lat,
    longitude: facility.position.lng,
  };
}

export function isSafeAppDeepLink(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith('/') && !value.startsWith('//'));
}
