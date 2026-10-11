'use client';

import React from 'react';
import type { MessageKey } from '@/shared/i18n/messages';
import { readLocalFavorites } from '@/features/favorites/model/local-favorites';
import {
  EngagementApiError,
  getAlertSubscriptions,
  getFavoritePlaces,
  getRecentPlaces,
  getSavedZones,
  saveFavoritePlace,
} from '../../api/engagement';
import type { AlertEvaluation, AlertSubscription, SavedPlace, SavedZone } from '../../model/types';
import { toEngagementPlaceRequest } from '../../model/types';

export interface EngagementNotice {
  kind: 'success' | 'error';
  key: MessageKey;
}

export interface EngagementSnapshot {
  favorites: SavedPlace[];
  recentPlaces: SavedPlace[];
  zones: SavedZone[];
  subscriptions: AlertSubscription[];
}

const EMPTY_SNAPSHOT: EngagementSnapshot = {
  favorites: [],
  recentPlaces: [],
  zones: [],
  subscriptions: [],
};

const ERROR_KEYS: Record<EngagementApiError['code'], MessageKey> = {
  unauthorized: 'engagement.errorUnauthorized',
  forbidden: 'engagement.errorForbidden',
  request_failed: 'engagement.errorGeneric',
};

export function toErrorKey(error: unknown, fallback: MessageKey): MessageKey {
  return error instanceof EngagementApiError ? ERROR_KEYS[error.code] : fallback;
}

/** 이 기기에 저장된 장소를 서버로 먼저 올린 뒤 네 목록을 한 번에 읽는다. */
async function fetchSnapshot(accessToken: string): Promise<EngagementSnapshot> {
  const localFavorites = readLocalFavorites();
  if (localFavorites.length > 0) {
    await Promise.allSettled(
      localFavorites.map(favorite =>
        saveFavoritePlace(
          accessToken,
          toEngagementPlaceRequest({
            id: favorite.facilityId,
            category: favorite.category,
            name: favorite.name,
            address: favorite.address,
            position: favorite.position,
          })
        )
      )
    );
  }
  const [favorites, recentPlaces, zones, subscriptions] = await Promise.all([
    getFavoritePlaces(accessToken),
    getRecentPlaces(accessToken),
    getSavedZones(accessToken),
    getAlertSubscriptions(accessToken),
  ]);
  return { favorites, recentPlaces, zones, subscriptions };
}

interface Options {
  accessToken: string | null;
  /** 패널이 열려 있고 로그인된 상태일 때만 불러온다 */
  enabled: boolean;
}

/**
 * 내 생활 데이터(저장·최근·생활권·알림)의 로드와 변경.
 * 로드는 `revision`이 바뀔 때 효과가 수행하고, 상태 갱신은 응답 콜백에서만 한다.
 */
export function useEngagementData({ accessToken, enabled }: Options) {
  const [snapshot, setSnapshot] = React.useState<EngagementSnapshot>(EMPTY_SNAPSHOT);
  const [revision, setRevision] = React.useState(0);
  const [loadedRevision, setLoadedRevision] = React.useState(-1);
  const [isMutating, setIsMutating] = React.useState(false);
  const [notice, setNotice] = React.useState<EngagementNotice | null>(null);
  const [evaluation, setEvaluation] = React.useState<AlertEvaluation | null>(null);

  React.useEffect(() => {
    if (!enabled || !accessToken) return;
    let cancelled = false;
    fetchSnapshot(accessToken)
      .then(next => {
        if (!cancelled) setSnapshot(next);
      })
      .catch(error => {
        if (!cancelled) setNotice({ kind: 'error', key: toErrorKey(error, 'engagement.errorLoad') });
      })
      .finally(() => {
        if (!cancelled) setLoadedRevision(revision);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, enabled, revision]);

  /** 다시 읽기. 성공·오류 안내는 지우고 새 요청을 시작한다 */
  const load = React.useCallback(() => {
    setNotice(null);
    setRevision(current => current + 1);
  }, []);

  const mutate = React.useCallback(
    async (operation: () => Promise<void>, successKey: MessageKey) => {
      setIsMutating(true);
      setNotice(null);
      try {
        await operation();
        setNotice({ kind: 'success', key: successKey });
        setRevision(current => current + 1);
      } catch (error) {
        setNotice({ kind: 'error', key: toErrorKey(error, 'engagement.errorGeneric') });
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  return {
    ...snapshot,
    isLoading: enabled && loadedRevision !== revision,
    isMutating,
    notice,
    evaluation,
    setEvaluation,
    load,
    mutate,
  };
}

export type EngagementData = ReturnType<typeof useEngagementData>;
