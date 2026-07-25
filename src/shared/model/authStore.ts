import { create } from 'zustand'; // React용 경량 상태 관리 라이브러리
import { persist } from 'zustand/middleware'; // Zustand 미들웨어 기능 (persist : 데이터 영속성 제공)
import Cookies from 'js-cookie'; // 브라우저 쿠키 조작 라이브러리
import { env } from '@/config/environment';

// User 정보
interface User {
  id: number;
  email: string;
  nickname: string;
  status: string;
  oauthProvider: string; // 카카오(kakao), 구글(google), 네이버(naver), 애플(apple)
  oauthUserId: string;
  profileImageUrl: string;
  interests: Array<{
    id: number;
    interestCategory: string; // 체육시설, 문화시설, 맛집, 도서관, 공원
  }>;
}

// User Token 정보
interface AuthToken {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthToken>()(
  persist(
    (set, get) => ({
      // User 초기 상태
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // User Token 상태 설정
      setAuth: (user: User, accessToken: string, refreshToken?: string) => {
        const secureCookie = window.location.protocol === 'https:';
        // 쿠키에 토큰 저장
        Cookies.set('access_token', accessToken, {
          expires: 7, // 7일 후 만료
          secure: secureCookie,
          sameSite: 'lax', // CSRF 공격 방지
        });
        localStorage.setItem('access_token', accessToken);

        if (refreshToken) {
          Cookies.set('refresh_token', refreshToken, {
            expires: 30, // 30일 후 만료
            secure: secureCookie,
            sameSite: 'lax',
          });
        }

        // Zustand 상태 업데이트
        set({
          user,
          accessToken: accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });
      },

      // User 상태 초기화 (로그아웃 시에만 호출)
      clearAuth: () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        localStorage.removeItem('access_token');

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // User 상태 확인
      checkAuthStatus: async () => {
        set({ isLoading: true });
        const cookieAccessToken = Cookies.get('access_token');
        const accessToken = cookieAccessToken || localStorage.getItem('access_token');

        // localStorage에서 복원했다면 쿠키에도 다시 저장
        if (accessToken && !cookieAccessToken) {
          Cookies.set('access_token', accessToken, {
            expires: 30,
            secure: window.location.protocol === 'https:',
            sameSite: 'lax',
          });
        }

        if (!accessToken) {
          // accessToken 없는 경우 User 상태 초기화
          get().clearAuth();
          set({ isLoading: false });
          return false;
        }

        const currentState = get();

        // persist된 user 정보가 있으면 토큰 유효성 검증
        if (currentState.user) {
          try {
            // OAuth 정보로 사용자 정보 조회
            const response = await fetch(
              env.createPublicBackendEndpoint('/api/users/me'),
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const userResult = await response.json();

              // 유효한 accessToken인 경우 User 상태 업데이트
              set({
                user: {
                  ...currentState.user,
                  id: userResult.id,
                  nickname: userResult.nickname,
                  profileImageUrl: userResult.profileImageUrl || '',
                  status: String(userResult.status || 'active').toLowerCase(),
                  interests: (userResult.interests || []).map(
                    (interestCategory: string, id: number) => ({
                      id,
                      interestCategory,
                    })
                  ),
                },
                accessToken,
                refreshToken: Cookies.get('refresh_token') || null,
                isAuthenticated: true,
                isLoading: false,
              });

              // 인증 확인 성공 시 현재 위치로 트리거 호출
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  position => {
                    import('@/services/triggers').then(({ evaluateLocationTriggers }) => {
                      evaluateLocationTriggers(
                        {
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                          radius: 1000,
                        },
                        accessToken
                      ).catch(error => console.error('위치 트리거 호출 실패:', error));
                    });
                  },
                  error => console.error('위치 정보 가져오기 실패:', error)
                );
              }

              return true;
            } else if (response.status === 401) {
              // accessToken 만료 시 refreshToken으로 갱신
              const refreshToken = Cookies.get('refresh_token');

              if (refreshToken) {
                const refreshResponse = await fetch(env.createPublicBackendEndpoint('/api/auth/refresh'), {
                  method: 'POST',
                  headers: {
                    'Refresh-Token': refreshToken,
                    'Content-Type': 'application/json',
                  },
                });

                if (refreshResponse.ok) {
                  const tokenData = await refreshResponse.json();
                  get().setAuth(tokenData.user, tokenData.accessToken, tokenData.refreshToken);

                  // 토큰 갱신 성공 시 현재 위치로 트리거 호출
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      position => {
                        import('@/services/triggers').then(({ evaluateLocationTriggers }) => {
                          evaluateLocationTriggers(
                            {
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude,
                              radius: 1000,
                            },
                            tokenData.accessToken
                          ).catch(error => console.error('위치 트리거 호출 실패:', error));
                        });
                      },
                      error => console.error('위치 정보 가져오기 실패:', error)
                    );
                  }

                  return true;
                }
              }

              // 갱신 실패 시, User 상태 초기화
              get().clearAuth();
              set({ isLoading: false });
              return false;
            } else {
              get().clearAuth();
              set({ isLoading: false });
              return false;
            }
          } catch (error) {
            console.error('Auth status check failed:', error);
            get().clearAuth();
            set({ isLoading: false });
            return false;
          }
        } else {
          // persist된 user 정보가 없으면 단순히 토큰만 설정
          set({
            accessToken,
            refreshToken: Cookies.get('refresh_token') || null,
            isAuthenticated: !!accessToken,
            isLoading: false,
          });
          return !!accessToken;
        }
      },
    }),
    {
      name: 'auth-storage', // 로컬 스토리지 키
      partialize: state => ({
        // 토큰은 쿠키에 저장하므로 로컬 스토리지에는 User 정보만 저장
        // 브라우저 새로고침 해도 User Token 상태 유지
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
