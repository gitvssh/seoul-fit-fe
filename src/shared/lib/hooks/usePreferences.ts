'use client';

import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { INTEREST_CATEGORY_MAP } from '@/lib/types';
import { useAuthStore } from '@/shared/model/authStore';
import { updateUserInterests, getUserInterests } from '@/shared/api/preference';

/**
 * 마커·카테고리 선호의 단일 스토어.
 * 사이드 메뉴의 체크박스, 지도 칩, 프리셋 자동 활성화가 모두 같은 `activeCategories`를 읽고 쓴다.
 * 비로그인: localStorage에 저장. 로그인: 서버 관심사(interests)와 동기화한다.
 */
export const PREFERENCES_STORAGE_KEY = 'seoul-fit.preferences.v1';

export const FACILITY_PREFERENCE_KEYS: readonly FacilityCategory[] = [
  'sports',
  'culture',
  'restaurant',
  'library',
  'park',
  'subway',
  'bike',
  'cooling_shelter',
  'cultural_event',
  'cultural_reservation',
];

export const DEFAULT_ACTIVE_CATEGORIES: readonly FacilityCategory[] = FACILITY_PREFERENCE_KEYS;

const FACILITY_TO_INTEREST: Record<FacilityCategory, string> = {
  sports: 'SPORTS',
  culture: 'CULTURE',
  restaurant: 'RESTAURANTS',
  library: 'LIBRARY',
  park: 'PARK',
  subway: 'SUBWAY',
  bike: 'BIKE',
  cooling_shelter: 'COOLING_SHELTER',
  cultural_event: 'CULTURAL_EVENT',
  cultural_reservation: 'CULTURAL_RESERVATION',
};

/** 서버 관심사 코드(`PARK`)와 한국어 표시명(`공원`) 둘 다 카테고리로 되돌린다. */
const INTEREST_TO_FACILITY: Record<string, FacilityCategory> = Object.fromEntries([
  ...FACILITY_PREFERENCE_KEYS.map(category => [FACILITY_TO_INTEREST[category], category]),
  ...FACILITY_PREFERENCE_KEYS.map(category => [INTEREST_CATEGORY_MAP[category], category]),
]);

export function interestsToCategories(
  interests: Array<{ category?: string; interestCategory?: string }>
): FacilityCategory[] {
  const categories = new Set(interests
    .map(interest => INTEREST_TO_FACILITY[interest.category ?? interest.interestCategory ?? ''])
    .filter((category): category is FacilityCategory => Boolean(category)));
  return FACILITY_PREFERENCE_KEYS.filter(category => categories.has(category));
}

function normalizeCategories(categories: readonly FacilityCategory[]): FacilityCategory[] {
  return FACILITY_PREFERENCE_KEYS.filter(category => categories.includes(category));
}

function isAuthenticatedUser(): boolean {
  const { isAuthenticated, user } = useAuthStore.getState();
  return Boolean(isAuthenticated && user?.id);
}

interface PreferencesState {
  activeCategories: FacilityCategory[];
  /** 마지막 카테고리를 끄려 할 때 켜지는 안내 플래그 */
  showWarning: boolean;
  isLoaded: boolean;
  /** 서버 관심사를 이미 반영한 사용자 ID. 같은 사용자에게 두 번 묻지 않는다 */
  syncedUserId: number | null;
  /** 빈 목록은 거부하고 경고를 켠다. 성공 여부를 돌려준다 */
  setCategories: (categories: readonly FacilityCategory[]) => boolean;
  /** 로컬을 먼저 바꾸고 로그인 상태면 서버에 저장한다. 실패하면 되돌린다 */
  togglePreference: (category: FacilityCategory) => Promise<boolean>;
  setShowWarning: (value: boolean) => void;
  resetPreferences: () => void;
  /** 로그인 사용자의 서버 관심사를 한 번 읽어 온다. 비어 있으면 로컬 값을 유지한다 */
  syncFromServer: (userId: number) => Promise<void>;
  /** 서버 값을 강제로 다시 읽는다(로그인 직후·설정 저장 후) */
  refreshPreferences: () => Promise<void>;
}

const memoryStorage = (): StateStorage => {
  const store = new Map<string, string>();
  return {
    getItem: name => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: name => {
      store.delete(name);
    },
  };
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      activeCategories: [...DEFAULT_ACTIVE_CATEGORIES],
      showWarning: false,
      isLoaded: false,
      syncedUserId: null,

      setCategories: categories => {
        const next = normalizeCategories(categories);
        if (next.length === 0) {
          set({ showWarning: true });
          return false;
        }
        set({ activeCategories: next, showWarning: false });
        return true;
      },

      togglePreference: async category => {
        const previous = get().activeCategories;
        const next = previous.includes(category)
          ? previous.filter(item => item !== category)
          : normalizeCategories([...previous, category]);
        if (!get().setCategories(next)) return false;

        if (!isAuthenticatedUser()) return true;
        try {
          await updateUserInterests(next.map(item => FACILITY_TO_INTEREST[item]));
          return true;
        } catch {
          set({ activeCategories: previous });
          return false;
        }
      },

      setShowWarning: value => set({ showWarning: value }),

      resetPreferences: () =>
        set({ activeCategories: [...DEFAULT_ACTIVE_CATEGORIES], showWarning: false }),

      syncFromServer: async userId => {
        if (get().syncedUserId === userId) return;
        set({ syncedUserId: userId });
        try {
          const response = await getUserInterests();
          const categories = interestsToCategories(response.interests);
          if (categories.length > 0) set({ activeCategories: categories });
        } catch {
          // 서버를 읽지 못하면 이 기기의 선택을 그대로 쓴다.
        } finally {
          set({ isLoaded: true });
        }
      },

      refreshPreferences: async () => {
        const { user, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !user?.id) {
          set({ isLoaded: true });
          return;
        }
        set({ syncedUserId: null });
        await get().syncFromServer(user.id);
      },
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? memoryStorage() : window.localStorage
      ),
      partialize: state => ({ activeCategories: state.activeCategories }),
      onRehydrateStorage: () => state => {
        state?.setCategories(state.activeCategories);
        usePreferencesStore.setState({ isLoaded: true });
      },
    }
  )
);

function toUserPreferences(activeCategories: FacilityCategory[]): UserPreferences {
  const flags = Object.fromEntries(
    FACILITY_PREFERENCE_KEYS.map(category => [category, activeCategories.includes(category)])
  ) as Record<FacilityCategory, boolean>;
  return {
    ...flags,
    preferredCategories: activeCategories,
    language: 'ko',
    theme: 'light',
  };
}

/**
 * React 훅. `preferences`는 레거시 불리언 형식(+`preferredCategories`)이고
 * `activeCategories`가 정본이다. 로그인하면 서버 관심사를 한 번 읽어 온다.
 */
export function usePreferences() {
  const activeCategories = usePreferencesStore(state => state.activeCategories);
  const showWarning = usePreferencesStore(state => state.showWarning);
  const isLoaded = usePreferencesStore(state => state.isLoaded);
  const togglePreference = usePreferencesStore(state => state.togglePreference);
  const setCategories = usePreferencesStore(state => state.setCategories);
  const setShowWarning = usePreferencesStore(state => state.setShowWarning);
  const resetPreferences = usePreferencesStore(state => state.resetPreferences);
  const refreshPreferences = usePreferencesStore(state => state.refreshPreferences);
  const syncFromServer = usePreferencesStore(state => state.syncFromServer);
  const { isAuthenticated, user } = useAuthStore();
  const userId = isAuthenticated && user?.id ? user.id : null;

  useEffect(() => {
    if (userId !== null) void syncFromServer(userId);
  }, [syncFromServer, userId]);

  const preferences = useMemo(() => toUserPreferences(activeCategories), [activeCategories]);

  return {
    preferences,
    activeCategories,
    isLoaded,
    togglePreference,
    setCategories,
    resetPreferences,
    refreshPreferences,
    showWarning,
    setShowWarning,
  };
}
