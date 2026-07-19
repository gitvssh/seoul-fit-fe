import {
  verifyOAuthCode,
  checkOAuthUser,
  oauthLogin,
  oauthSignup,
  refreshToken,
  checkEmailDuplicate,
  getOAuthUrl,
  oauthLogout,
  unlinkOAuth,
  type OAuthLoginRequest,
  type OAuthSignupRequest
} from '../auth'

// Mock fetch
global.fetch = jest.fn()

describe('Auth API', () => {
  const mockBaseUrl = 'http://127.0.0.1:8080'
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment
    jest.mock('@/config/environment', () => ({
      env: {
        publicBackendUrl: mockBaseUrl
      }
    }))
  })

  describe('verifyOAuthCode', () => {
    it('verifies OAuth code successfully', async () => {
      const mockRequest: OAuthLoginRequest = {
        provider: 'kakao',
        authorizationCode: 'test-code',
        redirectUri: 'http://localhost:3000/auth/callback'
      }
      
      const mockResponse = { isValid: true, oauthUserId: 'kakao123' }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await verifyOAuthCode(mockRequest)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/authorizecheck`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockRequest)
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on failed verification', async () => {
      const mockRequest: OAuthLoginRequest = {
        provider: 'kakao',
        authorizationCode: 'invalid-code',
        redirectUri: 'http://localhost:3000/auth/callback'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      })
      
      await expect(verifyOAuthCode(mockRequest)).rejects.toThrow('OAuth 인가코드 검증 실패: 400')
    })
  })

  describe('checkOAuthUser', () => {
    it('checks OAuth user existence successfully', async () => {
      const mockResponse = { exists: true, userId: 123 }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await checkOAuthUser('kakao', 'kakao123')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'kakao',
            oauthUserId: 'kakao123'
          })
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error when check fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      })
      
      await expect(checkOAuthUser('kakao', 'kakao123')).rejects.toThrow('OAuth 사용자 확인 실패: 404')
    })
  })

  describe('oauthLogin', () => {
    it('performs OAuth login successfully', async () => {
      const mockRequest: OAuthLoginRequest = {
        provider: 'kakao',
        authorizationCode: 'test-code',
        redirectUri: 'http://localhost:3000/auth/callback'
      }
      
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await oauthLogin(mockRequest)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockRequest)
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on login failure', async () => {
      const mockRequest: OAuthLoginRequest = {
        provider: 'kakao',
        authorizationCode: 'invalid-code',
        redirectUri: 'http://localhost:3000/auth/callback'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      })
      
      await expect(oauthLogin(mockRequest)).rejects.toThrow('OAuth 로그인 실패: 401')
    })
  })

  describe('oauthSignup', () => {
    it('performs OAuth signup successfully', async () => {
      const mockRequest: OAuthSignupRequest = {
        provider: 'kakao',
        oauthUserId: 'kakao123',
        nickname: 'Test User',
        email: 'test@example.com',
        profileImageUrl: 'https://images.test.invalid/profile.jpg',
        interests: [{ id: 1, interestCategory: 'sports' }]
      }
      
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await oauthSignup(mockRequest)
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockRequest)
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on signup failure', async () => {
      const mockRequest: OAuthSignupRequest = {
        provider: 'kakao',
        oauthUserId: 'kakao123',
        nickname: 'Test User',
        email: 'test@example.com',
        interests: []
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      })
      
      await expect(oauthSignup(mockRequest)).rejects.toThrow('OAuth 회원가입 실패: 400')
    })
  })

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await refreshToken('old-refresh-token')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/refresh?refreshToken=old-refresh-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on refresh failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      })
      
      await expect(refreshToken('invalid-token')).rejects.toThrow('토큰 갱신 실패: 401')
    })
  })

  describe('checkEmailDuplicate', () => {
    it('checks email duplicate successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ isDuplicate: false })
      })
      
      const result = await checkEmailDuplicate('test@example.com')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/check-email?email=test%40example.com`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      expect(result).toEqual({ isDuplicate: false })
    })

    it('handles special characters in email', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ isDuplicate: true })
      })
      
      await checkEmailDuplicate('test+special@example.com')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test%2Bspecial%40example.com'),
        expect.any(Object)
      )
    })

    it('throws error on check failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })
      
      await expect(checkEmailDuplicate('test@example.com')).rejects.toThrow('이메일 중복 확인 실패: 500')
    })
  })

  describe('getOAuthUrl', () => {
    it('generates OAuth URL successfully', async () => {
      const mockResponse = { 
        url: 'https://kauth.kakao.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000'
      }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await getOAuthUrl('kakao', 'http://localhost:3000/auth/callback')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/url/kakao?redirectUri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('includes optional parameters', async () => {
      const mockResponse = { url: 'https://oauth.provider.com/auth' }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      await getOAuthUrl('google', 'http://localhost:3000/auth/callback', 'profile email', 'random-state')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('scope=profile+email'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('state=random-state'),
        expect.any(Object)
      )
    })

    it('throws error on URL generation failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      })
      
      await expect(getOAuthUrl('kakao', 'invalid-uri')).rejects.toThrow('OAuth URL 생성 실패: 400')
    })
  })

  describe('oauthLogout', () => {
    it('performs OAuth logout successfully', async () => {
      const mockResponse = { success: true }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await oauthLogout('access-token-123')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/logout`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer access-token-123',
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on logout failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      })
      
      await expect(oauthLogout('invalid-token')).rejects.toThrow('OAuth 로그아웃 실패: 401')
    })
  })

  describe('unlinkOAuth', () => {
    it('unlinks OAuth successfully', async () => {
      const mockResponse = { success: true }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      
      const result = await unlinkOAuth('access-token-123')
      
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/auth/oauth/unlink`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer access-token-123',
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on unlink failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403
      })
      
      await expect(unlinkOAuth('invalid-token')).rejects.toThrow('OAuth 연결 해제 실패: 403')
    })
  })
})
