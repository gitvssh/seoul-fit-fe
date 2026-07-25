'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Facility } from '@/lib/types';
import {
  deleteFavoritePlace,
  getFavoritePlaces,
  saveFavoritePlace,
} from '@/features/engagement/api/engagement';
import {
  toEngagementPlaceRequest,
  type SavedPlace,
} from '@/features/engagement/model/types';
import { useAuthStore } from '@/shared/model/authStore';
import {
  getFacilityFavoriteKey,
  readLocalFavorites,
  toggleLocalFavorite,
  writeLocalFavorites,
} from '../model/local-favorites';

export function useLocalFacilityFavorite(facility: Facility | null) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remotePlace, setRemotePlace] = useState<SavedPlace | null>(null);
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    if (!facility) {
      setIsFavorite(false);
      return;
    }
    const key = getFacilityFavoriteKey(facility);
    setIsFavorite(readLocalFavorites().some(favorite => favorite.key === key));
    setRemotePlace(null);
    setError(null);

    if (!isAuthenticated || !accessToken) return;
    const controller = new AbortController();
    const request = toEngagementPlaceRequest(facility);
    setIsSaving(true);
    void getFavoritePlaces(accessToken)
      .then(places => {
        if (controller.signal.aborted) return;
        const saved = places.find(place => place.placeKey === request.placeKey) ?? null;
        setRemotePlace(saved);
        setIsFavorite(Boolean(saved));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('서버 저장 상태를 확인하지 못해 이 기기의 저장 상태를 표시합니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSaving(false);
      });
    return () => controller.abort();
  }, [accessToken, facility, isAuthenticated]);

  const toggleFavorite = useCallback(async () => {
    if (!facility || isSaving) return isFavorite;
    const nextFavorite = !isFavorite;
    const previousFavorite = isFavorite;
    setIsSaving(true);
    setError(null);
    setIsFavorite(nextFavorite);

    try {
      const localFavorites = readLocalFavorites();
      const localKey = getFacilityFavoriteKey(facility);
      const locallySaved = localFavorites.some(favorite => favorite.key === localKey);
      if (locallySaved !== nextFavorite) {
        writeLocalFavorites(toggleLocalFavorite(facility, localFavorites).favorites);
      }

      if (isAuthenticated && accessToken) {
        if (nextFavorite) {
          const saved = await saveFavoritePlace(
            accessToken,
            toEngagementPlaceRequest(facility)
          );
          setRemotePlace(saved);
        } else {
          let saved = remotePlace;
          if (!saved) {
            const request = toEngagementPlaceRequest(facility);
            saved =
              (await getFavoritePlaces(accessToken)).find(
                place => place.placeKey === request.placeKey
              ) ?? null;
          }
          if (saved) await deleteFavoritePlace(accessToken, saved.id);
          setRemotePlace(null);
        }
      }
      return nextFavorite;
    } catch (caught) {
      setIsFavorite(previousFavorite);
      setError(caught instanceof Error ? caught.message : '저장 상태를 변경하지 못했습니다.');
      return previousFavorite;
    } finally {
      setIsSaving(false);
    }
  }, [
    accessToken,
    facility,
    isAuthenticated,
    isFavorite,
    isSaving,
    remotePlace,
  ]);

  return { isFavorite, isSaving, error, toggleFavorite };
}
