'use client';

import React from 'react';
import { useNotificationStore } from '@/shared/model/notificationStore';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import {
  createAlertSubscription,
  createSavedZone,
  deleteAlertSubscription,
  deleteFavoritePlace,
  deleteSavedZone,
  evaluateAlertSubscriptions,
  updateAlertSubscription,
  updateSavedZone,
} from '../../api/engagement';
import type {
  AlertRuleType,
  AlertSubscription,
  AlertSubscriptionRequest,
  EngagementPlaceSummary,
  SavedZone,
  Weekday,
} from '../../model/types';
import { toPlaceSummary } from '../../model/types';
import type { EngagementData } from './useEngagementData';

const ALL_DAYS: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function subscriptionRequest(
  subscription: AlertSubscription,
  active: boolean
): AlertSubscriptionRequest {
  return {
    zoneId: subscription.zoneId,
    alertType: subscription.alertType,
    activeDays: subscription.activeDays,
    activeStart: subscription.activeStart,
    activeEnd: subscription.activeEnd,
    quietStart: subscription.quietStart,
    quietEnd: subscription.quietEnd,
    cooldownMinutes: subscription.cooldownMinutes,
    active,
  };
}

interface Options {
  token: string;
  userId: number | null;
  currentLocation: { lat: number; lng: number };
  data: EngagementData;
}

/** 로그인 사용자의 변경 동작. 각 동작은 성공 문구 키와 함께 `data.mutate`로 감싼다. */
export function useEngagementActions({ token, userId, currentLocation, data }: Options) {
  const { fetchNotificationHistory, fetchUnreadCount } = useNotificationStore();
  const { mutate, favorites, setEvaluation } = data;

  return React.useMemo(
    () => ({
      removeFavorite: (place: EngagementPlaceSummary) => {
        const saved = favorites.find(item => toPlaceSummary(item).key === place.key);
        if (!saved) return;
        void mutate(() => deleteFavoritePlace(token, saved.id), 'engagement.savedRemoved');
      },
      createZone: (label: string, radiusMeters: number) =>
        void mutate(async () => {
          await createSavedZone(token, {
            label,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            radiusMeters,
          });
          trackEvent('area_saved', { action_type: 'save' });
        }, 'engagement.zoneSaved'),
      recenterZone: (zone: SavedZone) =>
        void mutate(async () => {
          await updateSavedZone(token, zone.id, {
            label: zone.label,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            radiusMeters: zone.radiusMeters,
          });
        }, 'engagement.zoneRecentered'),
      deleteZone: (zone: SavedZone) =>
        void mutate(() => deleteSavedZone(token, zone.id), 'engagement.zoneDeleted'),
      createRule: (zoneId: number, alertType: AlertRuleType, quietHours: boolean) =>
        void mutate(async () => {
          await createAlertSubscription(token, {
            zoneId,
            alertType,
            activeDays: ALL_DAYS,
            activeStart: null,
            activeEnd: null,
            quietStart: quietHours ? '22:00' : null,
            quietEnd: quietHours ? '07:00' : null,
            cooldownMinutes: 60,
            active: true,
          });
          trackEvent('alert_rule_changed', { action_type: 'save' });
        }, 'engagement.alertAdded'),
      toggleRule: (subscription: AlertSubscription, active: boolean) =>
        void mutate(
          async () => {
            await updateAlertSubscription(
              token,
              subscription.id,
              subscriptionRequest(subscription, active)
            );
          },
          active ? 'engagement.alertTurnedOn' : 'engagement.alertTurnedOff'
        ),
      deleteRule: (subscription: AlertSubscription) =>
        void mutate(
          () => deleteAlertSubscription(token, subscription.id),
          'engagement.alertDeleted'
        ),
      evaluate: () =>
        void mutate(async () => {
          setEvaluation(await evaluateAlertSubscriptions(token));
          if (userId !== null) {
            await Promise.all([
              fetchNotificationHistory(userId, token),
              fetchUnreadCount(userId, token),
            ]);
          }
        }, 'engagement.alertEvaluated'),
    }),
    [
      currentLocation.lat,
      currentLocation.lng,
      favorites,
      fetchNotificationHistory,
      fetchUnreadCount,
      mutate,
      setEvaluation,
      token,
      userId,
    ]
  );
}

export type EngagementActions = ReturnType<typeof useEngagementActions>;
