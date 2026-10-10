import { create } from 'zustand';
import {
  getUnreadNotificationCount,
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/shared/api/notifications';
import { Notification, NotificationHistoryResult, NotificationPage } from '@/lib/types';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;
  notifications: Notification[];
  notificationPage: NotificationPage | null;
  isLoadingHistory: boolean;
  fetchUnreadCount: (userId: number, accessToken: string) => Promise<void>;
  fetchNotificationHistory: (userId: number, accessToken: string, page?: number) => Promise<void>;
  markAsRead: (notificationId: number, userId: number, accessToken: string) => Promise<void>;
  markAllAsRead: (userId: number, accessToken: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  isLoading: false,
  notifications: [],
  notificationPage: null,
  isLoadingHistory: false,

  fetchUnreadCount: async (userId: number, accessToken: string) => {
    set({ isLoading: true });
    try {
      const count = await getUnreadNotificationCount(userId, accessToken);
      set({ unreadCount: count, isLoading: false });
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
      set({ isLoading: false });
    }
  },

  fetchNotificationHistory: async (userId: number, accessToken: string, page: number = 0) => {
    set({ isLoadingHistory: true });
    try {
      const result = await getNotificationHistory(userId, accessToken, page, 10);
      set({
        notifications: result.content,
        notificationPage: result,
        isLoadingHistory: false,
      });
    } catch (error) {
      console.error('알림 히스토리 조회 실패:', error);
      set({ isLoadingHistory: false });
    }
  },

  markAsRead: async (notificationId: number, userId: number, accessToken: string) => {
    try {
      await markNotificationAsRead(notificationId, userId, accessToken);

      // 로컬 상태 업데이트
      const currentNotifications = get().notifications;
      const updatedNotifications = currentNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, status: 'READ' as const, readAt: new Date().toISOString() }
          : notification
      );

      set({ notifications: updatedNotifications });

      // 읽지 않은 개수 감소
      get().decrementUnreadCount();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  },

  markAllAsRead: async (userId: number, accessToken: string) => {
    try {
      await markAllNotificationsAsRead(userId, accessToken);

      // 로컬 상태 업데이트 - 모든 알림을 읽음 처리
      const currentNotifications = get().notifications;
      const updatedNotifications = currentNotifications.map(notification => ({
        ...notification,
        status: 'READ' as const,
        readAt: notification.readAt || new Date().toISOString(),
      }));

      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  decrementUnreadCount: () => {
    const currentCount = get().unreadCount;
    set({ unreadCount: Math.max(0, currentCount - 1) });
  },
}));
