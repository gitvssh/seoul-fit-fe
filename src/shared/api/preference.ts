import { env } from '@/config/environment';
import { useAuthStore } from '@/shared/model/authStore';

export interface InterestCategory {
  id: number;
  interestCategory: string;
}

export interface UserInterestResponse {
  userId: number;
  interests: {
    category: string;
    displayName: string;
    description: string;
    emoji: string;
    isLocationBased: boolean;
    isRealtimeNotificationRequired: boolean;
  }[];
  totalCount: number;
  lastUpdated: string;
  isCompleted: boolean;
}

export const getUserInterests = async (): Promise<UserInterestResponse> => {
  const userId = useAuthStore.getState().user?.id ?? 0;
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }
    const response = await fetch(`${env.publicBackendUrl}/api/users/interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn(`Failed to get user interests: ${response.status}`);
      // Return empty interests instead of throwing
      return {
        userId,
        interests: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
        isCompleted: false,
      };
    }

    return response.json();
  } catch (error) {
    console.warn('Error fetching user interests:', error);
    // Return empty interests on network error
    return {
      userId,
      interests: [],
      totalCount: 0,
      lastUpdated: new Date().toISOString(),
      isCompleted: false,
    };
  }
};

export const updateUserInterests = async (interests: string[]): Promise<void> => {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('인증 토큰이 없습니다.');
  }
  const response = await fetch(`${env.publicBackendUrl}/api/users/interests`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      interests,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('사용자 선호도 업데이트 실패:', response.status, errorText);
    throw new Error(`사용자 선호도 업데이트에 실패했습니다. (${response.status})`);
  }
};
