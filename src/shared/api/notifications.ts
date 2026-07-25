// services/notifications.ts - Notifications service implementation
import { Notification, NotificationPage } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

/**
 * 알림 목록 조회
 */
export async function getNotifications(accessToken: string): Promise<Notification[]> {
  const response = await fetch(`${BASE_URL}/api/notifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`알림 목록 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(
  _userId: number,
  accessToken: string
): Promise<number> {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`읽지 않은 알림 개수 조회 실패: ${response.status}`);
      return 0; // 백엔드 연결 실패 시 기본값 반환
    }

    return response.json();
  } catch (error) {
    // CORS 또는 네트워크 에러 시 기본값 반환
    console.warn('알림 서버 연결 실패:', error);
    return 0;
  }
}

/**
 * 알림 히스토리 조회 (페이지네이션)
 */
export async function getNotificationHistory(
  _userId: number,
  accessToken: string,
  page: number = 0,
  size: number = 20
): Promise<NotificationPage> {
  const response = await fetch(
    `${BASE_URL}/api/notifications?page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`알림 히스토리 조회 실패: ${response.status}`);
  }

  const result = await response.json();

  return {
    notifications: result.content || [],
    content: result.content || [],
    totalCount: result.totalElements || 0,
    hasMore: result.last === false,
  };
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: number,
  _userId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`알림 읽음 처리 실패: ${response.status}`);
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(
  _userId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/notifications/read-all`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    // JWT 토큰 만료 처리
    if (response.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      const { useAuthStore } = await import('@/shared/model/authStore');
      useAuthStore.getState().clearAuth();
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    throw new Error(`모든 알림 읽음 처리 실패: ${response.status}`);
  }
}
