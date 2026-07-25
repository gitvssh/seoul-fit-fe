import { env } from '@/config/environment';
import type {
  AlertEvaluation,
  AlertSubscription,
  AlertSubscriptionRequest,
  EngagementPlaceRequest,
  SavedPlace,
  SavedZone,
  ZoneRequest,
} from '../model/types';

async function authenticatedRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(env.createPublicBackendEndpoint(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('로그인이 만료되었습니다.');
    if (response.status === 403) throw new Error('이 작업을 수행할 권한이 없습니다.');
    throw new Error(`요청을 처리하지 못했습니다. (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const getFavoritePlaces = (token: string) =>
  authenticatedRequest<SavedPlace[]>('/api/me/places/favorites', token);

export const saveFavoritePlace = (token: string, place: EngagementPlaceRequest) =>
  authenticatedRequest<SavedPlace>('/api/me/places/favorites', token, {
    method: 'POST',
    body: JSON.stringify(place),
  });

export const deleteFavoritePlace = (token: string, placeId: number) =>
  authenticatedRequest<void>(`/api/me/places/favorites/${placeId}`, token, {
    method: 'DELETE',
  });

export const getRecentPlaces = (token: string) =>
  authenticatedRequest<SavedPlace[]>('/api/me/places/recent', token);

export const markRecentlyViewed = (token: string, place: EngagementPlaceRequest) =>
  authenticatedRequest<SavedPlace>('/api/me/places/recent', token, {
    method: 'POST',
    body: JSON.stringify(place),
  });

export const getSavedZones = (token: string) =>
  authenticatedRequest<SavedZone[]>('/api/me/zones', token);

export const createSavedZone = (token: string, zone: ZoneRequest) =>
  authenticatedRequest<SavedZone>('/api/me/zones', token, {
    method: 'POST',
    body: JSON.stringify(zone),
  });

export const updateSavedZone = (token: string, zoneId: number, zone: ZoneRequest) =>
  authenticatedRequest<SavedZone>(`/api/me/zones/${zoneId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(zone),
  });

export const deleteSavedZone = (token: string, zoneId: number) =>
  authenticatedRequest<void>(`/api/me/zones/${zoneId}`, token, { method: 'DELETE' });

export const getAlertSubscriptions = (token: string) =>
  authenticatedRequest<AlertSubscription[]>('/api/me/alert-subscriptions', token);

export const createAlertSubscription = (
  token: string,
  subscription: AlertSubscriptionRequest
) =>
  authenticatedRequest<AlertSubscription>('/api/me/alert-subscriptions', token, {
    method: 'POST',
    body: JSON.stringify(subscription),
  });

export const updateAlertSubscription = (
  token: string,
  subscriptionId: number,
  subscription: AlertSubscriptionRequest
) =>
  authenticatedRequest<AlertSubscription>(
    `/api/me/alert-subscriptions/${subscriptionId}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(subscription),
    }
  );

export const deleteAlertSubscription = (token: string, subscriptionId: number) =>
  authenticatedRequest<void>(`/api/me/alert-subscriptions/${subscriptionId}`, token, {
    method: 'DELETE',
  });

export const evaluateAlertSubscriptions = (token: string) =>
  authenticatedRequest<AlertEvaluation>('/api/me/alert-subscriptions/evaluate', token, {
    method: 'POST',
  });
