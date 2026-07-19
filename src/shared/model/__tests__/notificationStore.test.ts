import { useNotificationStore } from '../notificationStore'
import * as notificationApi from '@/shared/api/notifications'
import type { Notification, NotificationPage } from '@/lib/types'

// Mock the API module
jest.mock('@/shared/api/notifications')

describe('NotificationStore', () => {
  const mockNotification: Notification = {
    id: 1,
    userId: 123,
    type: 'info',
    title: '테스트 알림',
    message: '테스트 메시지입니다',
    read: false,
    status: 'SENT',
    createdAt: '2024-01-20T10:00:00Z',
  }

  const mockNotificationPage: NotificationPage = {
    notifications: [mockNotification],
    content: [mockNotification],
    totalCount: 1,
    hasMore: false
  }

  beforeEach(() => {
    // Reset store
    useNotificationStore.setState({
      unreadCount: 0,
      isLoading: false,
      notifications: [],
      notificationPage: null,
      isLoadingHistory: false
    })
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('fetchUnreadCount', () => {
    it('fetches and sets unread count successfully', async () => {
      (notificationApi.getUnreadNotificationCount as jest.Mock).mockResolvedValue(5)
      
      const { fetchUnreadCount } = useNotificationStore.getState()
      await fetchUnreadCount(123, 'test-token')
      
      expect(notificationApi.getUnreadNotificationCount).toHaveBeenCalledWith(123, 'test-token')
      expect(useNotificationStore.getState().unreadCount).toBe(5)
      expect(useNotificationStore.getState().isLoading).toBe(false)
    })

    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(notificationApi.getUnreadNotificationCount as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const { fetchUnreadCount } = useNotificationStore.getState()
      await fetchUnreadCount(123, 'test-token')
      
      expect(useNotificationStore.getState().isLoading).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('읽지 않은 알림 개수 조회 실패:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })

    it('sets loading state during fetch', async () => {
      let loadingStateWhenCalled = false
      ;(notificationApi.getUnreadNotificationCount as jest.Mock).mockImplementation(() => {
        loadingStateWhenCalled = useNotificationStore.getState().isLoading
        return Promise.resolve(3)
      })
      
      const { fetchUnreadCount } = useNotificationStore.getState()
      await fetchUnreadCount(123, 'test-token')
      
      expect(loadingStateWhenCalled).toBe(true)
      expect(useNotificationStore.getState().isLoading).toBe(false)
    })
  })

  describe('fetchNotificationHistory', () => {
    it('fetches and sets notification history successfully', async () => {
      (notificationApi.getNotificationHistory as jest.Mock).mockResolvedValue(mockNotificationPage)
      
      const { fetchNotificationHistory } = useNotificationStore.getState()
      await fetchNotificationHistory(123, 'test-token', 0)
      
      expect(notificationApi.getNotificationHistory).toHaveBeenCalledWith(123, 'test-token', 0, 10)
      expect(useNotificationStore.getState().notifications).toEqual([mockNotification])
      expect(useNotificationStore.getState().notificationPage).toEqual(mockNotificationPage)
      expect(useNotificationStore.getState().isLoadingHistory).toBe(false)
    })

    it('uses default page 0 when not specified', async () => {
      (notificationApi.getNotificationHistory as jest.Mock).mockResolvedValue(mockNotificationPage)
      
      const { fetchNotificationHistory } = useNotificationStore.getState()
      await fetchNotificationHistory(123, 'test-token')
      
      expect(notificationApi.getNotificationHistory).toHaveBeenCalledWith(123, 'test-token', 0, 10)
    })

    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(notificationApi.getNotificationHistory as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const { fetchNotificationHistory } = useNotificationStore.getState()
      await fetchNotificationHistory(123, 'test-token')
      
      expect(useNotificationStore.getState().isLoadingHistory).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('알림 히스토리 조회 실패:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('markAsRead', () => {
    it('marks notification as read and updates local state', async () => {
      // Setup initial state
      const unreadNotification = { ...mockNotification, status: 'SENT' as const }
      useNotificationStore.setState({
        notifications: [unreadNotification],
        unreadCount: 3
      })
      
      ;(notificationApi.markNotificationAsRead as jest.Mock).mockResolvedValue(undefined)
      
      const { markAsRead } = useNotificationStore.getState()
      await markAsRead(1, 123, 'test-token')
      
      expect(notificationApi.markNotificationAsRead).toHaveBeenCalledWith(1, 123, 'test-token')
      
      const updatedNotification = useNotificationStore.getState().notifications[0]
      expect(updatedNotification.status).toBe('READ')
      expect(updatedNotification.readAt).toBeDefined()
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })

    it('handles notification not found in local state', async () => {
      useNotificationStore.setState({
        notifications: [mockNotification],
        unreadCount: 1
      })
      
      ;(notificationApi.markNotificationAsRead as jest.Mock).mockResolvedValue(undefined)
      
      const { markAsRead } = useNotificationStore.getState()
      await markAsRead(999, 123, 'test-token') // Non-existent ID
      
      // Should still decrement count even if notification not found locally
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      useNotificationStore.setState({
        notifications: [mockNotification],
        unreadCount: 1
      })
      
      ;(notificationApi.markNotificationAsRead as jest.Mock).mockRejectedValue(new Error('API error'))
      
      const { markAsRead } = useNotificationStore.getState()
      await markAsRead(1, 123, 'test-token')
      
      // State should remain unchanged on error
      expect(useNotificationStore.getState().notifications[0].status).toBe('SENT')
      expect(useNotificationStore.getState().unreadCount).toBe(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('알림 읽음 처리 실패:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      const notifications = [
        { ...mockNotification, id: 1, status: 'SENT' as const },
        { ...mockNotification, id: 2, status: 'SENT' as const },
        { ...mockNotification, id: 3, status: 'READ' as const, readAt: '2024-01-20T09:00:00Z' }
      ]
      
      useNotificationStore.setState({
        notifications,
        unreadCount: 2
      })
      
      ;(notificationApi.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(undefined)
      
      const { markAllAsRead } = useNotificationStore.getState()
      await markAllAsRead(123, 'test-token')
      
      expect(notificationApi.markAllNotificationsAsRead).toHaveBeenCalledWith(123, 'test-token')
      
      const updatedNotifications = useNotificationStore.getState().notifications
      expect(updatedNotifications.every(n => n.status === 'READ')).toBe(true)
      expect(updatedNotifications[2].readAt).toBe('2024-01-20T09:00:00Z') // Preserves existing readAt
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      useNotificationStore.setState({
        notifications: [mockNotification],
        unreadCount: 1
      })
      
      ;(notificationApi.markAllNotificationsAsRead as jest.Mock).mockRejectedValue(new Error('API error'))
      
      const { markAllAsRead } = useNotificationStore.getState()
      await markAllAsRead(123, 'test-token')
      
      // State should remain unchanged on error
      expect(useNotificationStore.getState().notifications[0].status).toBe('SENT')
      expect(useNotificationStore.getState().unreadCount).toBe(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('모든 알림 읽음 처리 실패:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('setUnreadCount', () => {
    it('sets unread count directly', () => {
      const { setUnreadCount } = useNotificationStore.getState()
      
      setUnreadCount(10)
      expect(useNotificationStore.getState().unreadCount).toBe(10)
      
      setUnreadCount(0)
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('decrementUnreadCount', () => {
    it('decrements unread count by 1', () => {
      useNotificationStore.setState({ unreadCount: 5 })
      
      const { decrementUnreadCount } = useNotificationStore.getState()
      decrementUnreadCount()
      
      expect(useNotificationStore.getState().unreadCount).toBe(4)
    })

    it('does not go below 0', () => {
      useNotificationStore.setState({ unreadCount: 0 })
      
      const { decrementUnreadCount } = useNotificationStore.getState()
      decrementUnreadCount()
      
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('handles edge case at 1', () => {
      useNotificationStore.setState({ unreadCount: 1 })
      
      const { decrementUnreadCount } = useNotificationStore.getState()
      decrementUnreadCount()
      
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })
})
