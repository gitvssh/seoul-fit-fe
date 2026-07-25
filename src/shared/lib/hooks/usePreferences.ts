import { useState, useEffect, useCallback } from 'react';
import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { INTEREST_CATEGORY_MAP } from '@/lib/types';
import { useAuthStore } from '@/shared/model/authStore';
import { updateUserInterests, getUserInterests } from '@/shared/api/preference';

const defaultPreferences: UserPreferences = {
  sports: true,
  culture: true,
  restaurant: true,
  library: true,
  park: true,
  subway: true,
  bike: true,
  cooling_shelter: true,
  cultural_event: true,
  cultural_reservation: true,
  language: 'ko',
  theme: 'light',
};

const FACILITY_PREFERENCE_KEYS: FacilityCategory[] = [
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

const FACILITY_TO_INTEREST_MAP: Record<FacilityCategory, string> = {
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

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // 사용자 선호도 조회
  const loadUserPreferences = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const userInterests = await getUserInterests();
      // 모든 선호도를 false로 초기화
      const userPreferences: UserPreferences = {
        sports: false,
        culture: false,
        restaurant: false,
        library: false,
        park: false,
        subway: false,
        bike: false,
        cooling_shelter: false,
        cultural_event: false,
        cultural_reservation: false,
        language: 'ko',
        theme: 'light',
      };

      // 사용자 관심사에 따라 선호도 설정
      userInterests.interests.forEach(interest => {
        const facilityCategory = INTEREST_CATEGORY_MAP[interest.category as keyof typeof INTEREST_CATEGORY_MAP];
        if (facilityCategory && facilityCategory in userPreferences) {
          (userPreferences as any)[facilityCategory] = true;
        }
      });

      setPreferences(userPreferences);
      setIsLoaded(true);
    } catch (error) {
      console.error('사용자 관심사를 불러오는데 실패했습니다:', error);
      loadLocalPreferences();
      setIsLoaded(true);
    }
  }, [isAuthenticated, user?.id]);

  // 로컬 스토리지에서 선호도 로드
  const loadLocalPreferences = useCallback(() => {
    if (isLoaded) return;

    setPreferences(defaultPreferences);
    setIsLoaded(true);
  }, [isLoaded]);

  // 인증 상태에 따른 선호도 로드
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserPreferences();
    } else {
      loadLocalPreferences();
    }
  }, [isAuthenticated, user?.id, loadUserPreferences, loadLocalPreferences]);

  const togglePreference = async (type: FacilityCategory) => {
    const newPreferences = {
      ...preferences,
      [type]: !preferences[type],
    };

    // 최소 1개 선택 검증
    const selectedCount = FACILITY_PREFERENCE_KEYS.filter(
      category => newPreferences[category]
    ).length;
    if (selectedCount === 0) {
      setShowWarning(true);
      return;
    }

    setPreferences(newPreferences);

    if (isAuthenticated && user?.id) {
      try {
        const selectedInterests = FACILITY_PREFERENCE_KEYS
          .filter(category => newPreferences[category])
          .map(category => FACILITY_TO_INTEREST_MAP[category]);

        await updateUserInterests(selectedInterests);
      } catch (error) {
        console.error('선호도 업데이트 실패:', error);
        setPreferences(preferences);
      }
    }
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  // 무한 호출 방지를 위해 의존성 배열 최적화
  const refreshPreferences = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      setIsLoaded(false);
      try {
        const userInterests = await getUserInterests();
        // 모든 선호도를 false로 초기화
        const userPreferences: UserPreferences = {
          sports: false,
          culture: false,
          restaurant: false,
          library: false,
          park: false,
          subway: false,
          bike: false,
          cooling_shelter: false,
          cultural_event: false,
          cultural_reservation: false,
          language: 'ko',
          theme: 'light',
        };

        // 사용자 관심사에 따라 선호도 설정
        userInterests.interests.forEach(interest => {
          const facilityCategory = INTEREST_CATEGORY_MAP[interest.category as keyof typeof INTEREST_CATEGORY_MAP];
          if (facilityCategory && facilityCategory in userPreferences) {
            (userPreferences as any)[facilityCategory] = true;
          }
        });

        setPreferences(userPreferences);
        setIsLoaded(true);
      } catch (error) {
        console.error('사용자 관심사를 불러오는데 실패했습니다:', error);
        setPreferences(defaultPreferences);
        setIsLoaded(true);
      }
    } else {
      setPreferences(defaultPreferences);
      setIsLoaded(true);
    }
  }, [isAuthenticated, user?.id]);

  return {
    preferences,
    togglePreference,
    resetPreferences,
    refreshPreferences,
    showWarning,
    setShowWarning,
  };
}
