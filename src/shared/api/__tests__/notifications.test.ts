import {
  getNotifications,
  getUnreadNotificationCount,
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../notifications'
import type { Notification, NotificationPage } from '@/lib/types'

// Mock fetch
global.fetch = jest.fn()

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation()
}

describe('Notifications API', () => {
  const mockBaseUrl = 'http://127.0.0.1:8080'
  const mockAccessToken = 'test-access-token'
  const mockUserId = 123
  
  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy.warn.mockClear()
  })

  afterAll(() => {
    consoleSpy.warn.mockRestore()
  })

  const mockNotification: Notification = {
    id: 1,
    userId: mockUserId,
    type: 'info',
    title: '테스트 알림',
    message: '테스트 메시지입니다',
    read: false,
    status: 'SENT',
    createdAt: '2024-01-20T10:00:00Z',
  }

  describe('getNotifications', () => {
    it('fetches notifications successfully', async () => {
      const mockNotifications = [mockNotification]
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockNotifications
      })
      
      const result = await getNotifications(mockAccessToken)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockNotifications)
    })

    it('throws error on fetch failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      })
      
      await expect(getNotifications(mockAccessToken)).rejects.toThrow('알림 목록 조회 실패: 404')
    })
  })

  describe('getUnreadNotificationCount', () => {
    it('fetches unread count successfully', async () => {
      const mockCount = 5
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCount
      })
      
      const result = await getUnreadNotificationCount(mockUserId, mockAccessToken)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/notifications/unread-count?userId=${mockUserId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toBe(mockCount)
    })

    it('returns 0 on fetch failure with warning', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })
      
      const result = await getUnreadNotificationCount(mockUserId, mockAccessToken)
      
      expect(result).toBe(0)
      expect(consoleSpy.warn).toHaveBeenCalledWith('읽지 않은 알림 개수 조회 실패: 500')
    })

    it('returns 0 on network error with warning', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const result = await getUnreadNotificationCount(mockUserId, mockAccessToken)
      
      expect(result).toBe(0)
      expect(consoleSpy.warn).toHaveBeenCalledWith('알림 서버 연결 실패:', expect.any(Error))
    })
  })

  describe('getNotificationHistory', () => {
    it('fetches notification history successfully', async () => {
      const mockApiResponse = {
        content: [mockNotification],
        totalElements: 1,
        last: true
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      })
      
      const result = await getNotificationHistory(mockUserId, mockAccessToken, 0, 10)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/notifications?userId=${mockUserId}&page=0&size=10`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      expect(result).toEqual({
        notifications: [mockNotification],
        content: [mockNotification],
        totalCount: 1,
        hasMore: false
      })
    })

    it('uses default page and size values', async () => {
      const mockApiResponse = {
        content: [],
        totalElements: 0,
        last: true
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      })
      
      await getNotificationHistory(mockUserId, mockAccessToken)
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=0&size=20'),
        expect.any(Object)
      )
    })

    it('handles empty response gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({})
      })
      
      const result = await getNotificationHistory(mockUserId, mockAccessToken)
      
      expect(result).toEqual({
        notifications: [],
        content: [],
        totalCount: 0,
        hasMore: false
      })
    })

    it('throws error on fetch failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403
      })
      
      await expect(getNotificationHistory(mockUserId, mockAccessToken)).rejects.toThrow('알림 히스토리 조회 실패: 403')
    })
  })

  describe('markNotificationAsRead', () => {
    const mockNotificationId = 1

    it('marks notification as read successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true
      })
      
      await markNotificationAsRead(mockNotificationId, mockUserId, mockAccessToken)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/notifications/${mockNotificationId}/read?userId=${mockUserId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('throws error on failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      })
      
      await expect(markNotificationAsRead(mockNotificationId, mockUserId, mockAccessToken))
        .rejects.toThrow('알림 읽음 처리 실패: 404')
    })
  })

  describe('markAllNotificationsAsRead', () => {
    it('marks all notifications as read successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true
      })
      
      await markAllNotificationsAsRead(mockUserId, mockAccessToken)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/notifications/read-all?userId=${mockUserId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('throws error on failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })
      
      await expect(markAllNotificationsAsRead(mockUserId, mockAccessToken))
        .rejects.toThrow('모든 알림 읽음 처리 실패: 500')
    })

    it('handles 401 error with specific message', async () => {
      // Mock the auth store import
      const mockClearAuth = jest.fn()
      jest.doMock('@/shared/model/authStore', () => ({
        useAuthStore: {
          getState: () => ({
            clearAuth: mockClearAuth
          })
        }
      }))
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      })
      
      await expect(markAllNotificationsAsRead(mockUserId, mockAccessToken))
        .rejects.toThrow('인증이 만료되었습니다. 다시 로그인해주세요.')
    })
  })
})
