import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import * as authService from '@/shared/api/auth'
import { useAuthStore } from '@/shared/model/authStore'
import { useLocationTrigger } from '../useLocationTrigger'

// Mock dependencies
jest.mock('@/shared/api/auth')
jest.mock('@/shared/model/authStore')
jest.mock('../useLocationTrigger')

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true
})

describe('useAuth', () => {
  const mockSetAuth = jest.fn()
  const mockClearAuth = jest.fn()
  const mockHandleLoginSuccess = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
      accessToken: 'test-token',
      refreshToken: 'refresh-token'
    })
    
    ;(useLocationTrigger as jest.Mock).mockReturnValue({
      handleLoginSuccess: mockHandleLoginSuccess
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  describe('verifyOAuthCode', () => {
    it('verifies OAuth code successfully', async () => {
      const mockResult = { isValid: true, oauthUserId: 'kakao123' }
      ;(authService.verifyOAuthCode as jest.Mock).mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useAuth())
      
      let verifyResult: any
      await act(async () => {
        verifyResult = await result.current.verifyOAuthCode('kakao', 'auth-code', 'redirect-uri')
      })
      
      expect(authService.verifyOAuthCode).toHaveBeenCalledWith({
        provider: 'kakao',
        authorizationCode: 'auth-code',
        redirectUri: 'redirect-uri'
      })
      expect(verifyResult).toEqual(mockResult)
      expect(result.current.error).toBeNull()
    })

    it('handles verification error', async () => {
      const errorMessage = 'Invalid authorization code'
      ;(authService.verifyOAuthCode as jest.Mock).mockRejectedValue(new Error(errorMessage))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.verifyOAuthCode('kakao', 'invalid-code', 'redirect-uri')
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('checkOAuthUser', () => {
    it('checks OAuth user successfully', async () => {
      const mockResult = { exists: true, userId: 123 }
      ;(authService.checkOAuthUser as jest.Mock).mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useAuth())
      
      let checkResult: any
      await act(async () => {
        checkResult = await result.current.checkOAuthUser('kakao', 'kakao123')
      })
      
      expect(authService.checkOAuthUser).toHaveBeenCalledWith('kakao', 'kakao123')
      expect(checkResult).toEqual(mockResult)
    })

    it('handles check error', async () => {
      ;(authService.checkOAuthUser as jest.Mock).mockRejectedValue(new Error('User not found'))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.checkOAuthUser('kakao', 'nonexistent')
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.error).toBe('User not found')
    })
  })

  describe('oauthLogin', () => {
    it('performs OAuth login successfully', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      
      ;(authService.oauthLogin as jest.Mock).mockResolvedValue(mockResponse)
      
      const mockPosition = {
        coords: { latitude: 37.5665, longitude: 126.9780 }
      }
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.oauthLogin('kakao', 'auth-code', 'redirect-uri')
      })
      
      expect(authService.oauthLogin).toHaveBeenCalledWith({
        provider: 'kakao',
        authorizationCode: 'auth-code',
        redirectUri: 'redirect-uri'
      })
      expect(mockSetAuth).toHaveBeenCalledWith(
        mockResponse.user,
        mockResponse.accessToken,
        mockResponse.refreshToken
      )
      expect(mockHandleLoginSuccess).toHaveBeenCalledWith({
        lat: 37.5665,
        lng: 126.9780
      })
    })

    it('handles login without geolocation', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }
      
      ;(authService.oauthLogin as jest.Mock).mockResolvedValue(mockResponse)
      
      // Remove geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true
      })
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.oauthLogin('kakao', 'auth-code', 'redirect-uri')
      })
      
      expect(mockSetAuth).toHaveBeenCalled()
      expect(mockHandleLoginSuccess).not.toHaveBeenCalled()
      
      // Restore geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      })
    })

    it('handles login error', async () => {
      ;(authService.oauthLogin as jest.Mock).mockRejectedValue(new Error('Login failed'))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.oauthLogin('kakao', 'invalid-code', 'redirect-uri')
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.error).toBe('Login failed')
      expect(mockSetAuth).not.toHaveBeenCalled()
    })
  })

  describe('oauthSignup', () => {
    it('performs OAuth signup successfully', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      
      ;(authService.oauthSignup as jest.Mock).mockResolvedValue(mockResponse)
      
      const mockPosition = {
        coords: { latitude: 37.5665, longitude: 126.9780 }
      }
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.oauthSignup(
          'kakao',
          'kakao123',
          'Test User',
          'test@example.com',
          [{ id: 1, interestCategory: 'sports' }],
          'https://images.test.invalid/profile.jpg'
        )
      })
      
      expect(authService.oauthSignup).toHaveBeenCalledWith({
        provider: 'kakao',
        oauthUserId: 'kakao123',
        nickname: 'Test User',
        email: 'test@example.com',
        interests: [{ id: 1, interestCategory: 'sports' }],
        profileImageUrl: 'https://images.test.invalid/profile.jpg'
      })
      expect(mockSetAuth).toHaveBeenCalled()
      expect(mockHandleLoginSuccess).toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      
      ;(authService.refreshToken as jest.Mock).mockResolvedValue(mockResponse)
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.refreshToken()
      })
      
      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token')
      expect(mockSetAuth).toHaveBeenCalledWith(
        mockResponse.user,
        mockResponse.accessToken,
        mockResponse.refreshToken
      )
    })

    it('clears auth on refresh failure', async () => {
      ;(authService.refreshToken as jest.Mock).mockRejectedValue(new Error('Token expired'))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.refreshToken()
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(mockClearAuth).toHaveBeenCalled()
      expect(result.current.error).toBe('Token expired')
    })

    it('throws error when no refresh token available', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        setAuth: mockSetAuth,
        clearAuth: mockClearAuth,
        accessToken: 'test-token',
        refreshToken: null
      })
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.refreshToken()
        } catch (error) {
          expect(error).toEqual(new Error('리프레시 토큰이 없습니다.'))
        }
      })
    })
  })

  describe('oauthLogout', () => {
    it('performs logout successfully', async () => {
      ;(authService.oauthLogout as jest.Mock).mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.oauthLogout()
      })
      
      expect(authService.oauthLogout).toHaveBeenCalledWith('test-token')
      expect(mockClearAuth).toHaveBeenCalled()
    })

    it('clears auth even on logout error', async () => {
      ;(authService.oauthLogout as jest.Mock).mockRejectedValue(new Error('Logout failed'))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        try {
          await result.current.oauthLogout()
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(mockClearAuth).toHaveBeenCalled()
      expect(result.current.error).toBe('Logout failed')
    })

    it('clears auth when no access token', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        setAuth: mockSetAuth,
        clearAuth: mockClearAuth,
        accessToken: null,
        refreshToken: 'refresh-token'
      })
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.oauthLogout()
      })
      
      expect(authService.oauthLogout).not.toHaveBeenCalled()
      expect(mockClearAuth).toHaveBeenCalled()
    })
  })

  describe('checkEmailDuplicate', () => {
    it('checks email duplicate successfully', async () => {
      ;(authService.checkEmailDuplicate as jest.Mock).mockResolvedValue(false)
      
      const { result } = renderHook(() => useAuth())
      
      let isDuplicate: boolean
      await act(async () => {
        isDuplicate = await result.current.checkEmailDuplicate('test@example.com')
      })
      
      expect(authService.checkEmailDuplicate).toHaveBeenCalledWith('test@example.com')
      expect(isDuplicate!).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears error state', async () => {
      ;(authService.verifyOAuthCode as jest.Mock).mockRejectedValue(new Error('Test error'))
      
      const { result } = renderHook(() => useAuth())
      
      // Set an error
      await act(async () => {
        try {
          await result.current.verifyOAuthCode('kakao', 'invalid', 'uri')
        } catch (error) {
          // Expected
        }
      })
      
      expect(result.current.error).toBe('Test error')
      
      // Clear error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })
})
