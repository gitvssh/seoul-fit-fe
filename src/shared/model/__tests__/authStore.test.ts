import { useAuthStore } from '../authStore'
import Cookies from 'js-cookie'

// Mock dependencies
jest.mock('js-cookie')
jest.mock('@/config/environment', () => ({
  env: {
    createPublicBackendEndpoint: (path: string) => `http://127.0.0.1:8080${path}`
  }
}))

// Mock fetch
global.fetch = jest.fn()

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true
})

describe('AuthStore', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: '테스트유저',
    status: 'active',
    oauthProvider: 'kakao',
    oauthUserId: 'kakao123',
    profileImageUrl: 'https://images.test.invalid/profile.jpg',
    interests: [
      { id: 1, interestCategory: '체육시설' },
      { id: 2, interestCategory: '문화시설' }
    ]
  }

  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false
    })
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('setAuth', () => {
    it('sets user and tokens correctly', () => {
      const { setAuth } = useAuthStore.getState()
      
      setAuth(mockUser, 'access-token-123', 'refresh-token-456')
      
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe('access-token-123')
      expect(state.refreshToken).toBe('refresh-token-456')
      expect(state.isAuthenticated).toBe(true)
    })

    it('stores tokens in cookies and localStorage', () => {
      const { setAuth } = useAuthStore.getState()
      
      setAuth(mockUser, 'access-token-123', 'refresh-token-456')
      
      expect(Cookies.set).toHaveBeenCalledWith(
        'access_token',
        'access-token-123',
        expect.objectContaining({
          expires: 7,
          secure: false,
          sameSite: 'lax'
        })
      )
      
      expect(Cookies.set).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token-456',
        expect.objectContaining({
          expires: 30,
          secure: false,
          sameSite: 'lax'
        })
      )
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token-123')
    })

    it('works without refresh token', () => {
      const { setAuth } = useAuthStore.getState()
      
      setAuth(mockUser, 'access-token-123')
      
      const state = useAuthStore.getState()
      expect(state.refreshToken).toBeNull()
      expect(Cookies.set).toHaveBeenCalledTimes(1) // Only access_token
    })
  })

  describe('clearAuth', () => {
    it('clears all auth data', () => {
      const { setAuth, clearAuth } = useAuthStore.getState()
      
      // First set auth
      setAuth(mockUser, 'access-token-123', 'refresh-token-456')
      
      // Then clear
      clearAuth()
      
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('removes tokens from cookies and localStorage', () => {
      const { clearAuth } = useAuthStore.getState()
      
      clearAuth()
      
      expect(Cookies.remove).toHaveBeenCalledWith('access_token')
      expect(Cookies.remove).toHaveBeenCalledWith('refresh_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('checkAuthStatus', () => {
    it('returns false when no access token exists', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined)
      localStorageMock.getItem.mockReturnValue(null)
      
      const { checkAuthStatus } = useAuthStore.getState()
      const result = await checkAuthStatus()
      
      expect(result).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('restores token from localStorage if not in cookies', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined)
      localStorageMock.getItem.mockReturnValue('stored-token')
      
      const { checkAuthStatus } = useAuthStore.getState()
      await checkAuthStatus()
      
      expect(Cookies.set).toHaveBeenCalledWith(
        'access_token',
        'stored-token',
        expect.objectContaining({
          expires: 30,
          secure: false,
          sameSite: 'lax'
        })
      )
    })

    it('validates token with API when user exists', async () => {
      // Setup initial state with user
      useAuthStore.getState().setAuth(mockUser, 'valid-token');
      
      (Cookies.get as jest.Mock).mockReturnValue('valid-token')
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser })
      })
      
      const { checkAuthStatus } = useAuthStore.getState()
      const result = await checkAuthStatus()
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token'
          })
        })
      )
    })

    it('refreshes token when access token is expired', async () => {
      useAuthStore.getState().setAuth(mockUser, 'expired-token', 'refresh-token');
      
      (Cookies.get as jest.Mock)
        .mockReturnValueOnce('expired-token') // access_token
        .mockReturnValueOnce('refresh-token') // refresh_token
      
      // First call returns 401 (expired)
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401 })
        // Refresh call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          })
        })
      
      const { checkAuthStatus } = useAuthStore.getState()
      const result = await checkAuthStatus()
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Refresh-Token': 'refresh-token'
          })
        })
      )
    })

    it('clears auth when refresh fails', async () => {
      useAuthStore.getState().setAuth(mockUser, 'expired-token');
      
      (Cookies.get as jest.Mock)
        .mockReturnValueOnce('expired-token')
        .mockReturnValueOnce('invalid-refresh-token')
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({ ok: false, status: 401 })
      
      const { checkAuthStatus } = useAuthStore.getState()
      const result = await checkAuthStatus()
      
      expect(result).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('handles network errors gracefully', async () => {
      useAuthStore.getState().setAuth(mockUser, 'token');
      
      (Cookies.get as jest.Mock).mockReturnValue('token')
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const { checkAuthStatus } = useAuthStore.getState()
      const result = await checkAuthStatus()
      
      expect(result).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('sets loading state during check', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('token')
      localStorageMock.getItem.mockReturnValue('token')
      
      const { checkAuthStatus } = useAuthStore.getState()
      
      // Don't await immediately to check loading state
      const promise = checkAuthStatus()
      
      // Check loading state after a small delay
      await new Promise(resolve => setTimeout(resolve, 0))
      
      await promise
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
