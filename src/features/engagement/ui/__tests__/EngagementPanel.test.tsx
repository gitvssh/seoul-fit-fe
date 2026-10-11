import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { useAuthStore } from '@/shared/model/authStore';
import { LOCAL_FAVORITES_STORAGE_KEY } from '@/features/favorites/model/local-favorites';
import { EngagementPanel } from '../EngagementPanel';

const currentLocation = { lat: 37.5665, lng: 126.978 };

function renderPanel(props: Partial<React.ComponentProps<typeof EngagementPanel>> = {}) {
  const onClose = jest.fn();
  const onLogin = jest.fn();
  const onPlaceSelect = jest.fn();
  render(
    <I18nProvider>
      <EngagementPanel
        isOpen
        currentLocation={currentLocation}
        onClose={onClose}
        onLogin={onLogin}
        onPlaceSelect={onPlaceSelect}
        {...props}
      />
    </I18nProvider>
  );
  return { onClose, onLogin, onPlaceSelect };
}

function mockBackend(routes: Record<string, unknown>) {
  (global.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const path = new URL(url).pathname;
    const key = `${method} ${path}`;
    if (!(key in routes)) {
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    }
    const body = routes[key];
    return Promise.resolve({
      ok: true,
      status: body === undefined ? 204 : 200,
      json: async () => body,
    });
  });
}

describe('EngagementPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn();
    useAuthStore.setState({ isAuthenticated: false, accessToken: null, user: null });
  });

  it('shows an inline Kakao login CTA and device-saved places when logged out', () => {
    window.localStorage.setItem(
      LOCAL_FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          key: 'library:lib-1',
          facilityId: 'lib-1',
          category: 'library',
          name: '서울도서관',
          address: '서울 중구 세종대로 110',
          position: { lat: 37.5663, lng: 126.9779 },
          savedAt: '2026-07-25T00:00:00.000Z',
        },
      ])
    );
    const { onLogin, onPlaceSelect, onClose } = renderPanel();

    const dialog = screen.getByRole('dialog', { name: '내 생활' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('로그인하면 여러 기기에서 이어져요')).toBeInTheDocument();
    expect(screen.getByText('로그인 없이도 저장은 이 기기에 남아요.')).toBeInTheDocument();
    expect(dialog.textContent).not.toContain('왼쪽 메뉴');

    fireEvent.click(screen.getByRole('button', { name: '카카오 로그인' }));
    expect(onLogin).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('heading', { name: /이 기기에 저장한 장소/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '서울도서관 지도에서 보기' }));
    expect(onPlaceSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: '서울도서관', latitude: 37.5663, longitude: 126.9779 })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('hides the login button without onLogin but keeps the device-saved note', () => {
    renderPanel({ onLogin: undefined });
    expect(screen.queryByRole('button', { name: '카카오 로그인' })).not.toBeInTheDocument();
    expect(screen.getByText('로그인 없이도 저장은 이 기기에 남아요.')).toBeInTheDocument();
    expect(screen.getByText(/아직 저장한 장소가 없어요/)).toBeInTheDocument();
  });

  it('lists saved places from the account and removes one through the scoped endpoint', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'token',
      user: {
        id: 7,
        email: 'a@b.c',
        nickname: '서울시민',
        status: 'ACTIVE',
        oauthProvider: 'kakao',
        oauthUserId: '1',
        profileImageUrl: '',
        interests: [],
      },
    });
    const favorite = {
      id: 11,
      placeKey: 'park:p-1:x',
      sourceId: 'p-1',
      category: 'park',
      name: '남산공원',
      address: '서울 중구 삼일대로 231',
      latitude: 37.55,
      longitude: 126.99,
      favorite: true,
      savedAt: null,
      lastViewedAt: null,
    };
    mockBackend({
      'GET /api/me/places/favorites': [favorite],
      'GET /api/me/places/recent': [],
      'GET /api/me/zones': [
        { id: 3, label: '집', latitude: 37.5, longitude: 127, radiusMeters: 1500, createdAt: '' },
      ],
      'GET /api/me/alert-subscriptions': [],
      'DELETE /api/me/places/favorites/11': undefined,
    });
    renderPanel();

    expect(await screen.findByText('서울시민님의 장소와 알림')).toBeInTheDocument();
    expect(await screen.findByText('남산공원')).toBeInTheDocument();
    expect(screen.getByText('반경 1.5km')).toBeInTheDocument();
    expect(screen.getByText(/알림 규칙이 없어요/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '남산공원 저장 해제' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8080/api/me/places/favorites/11',
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    const notice = await screen.findByText('저장한 장소에서 뺐어요.');
    expect(notice).toHaveAttribute('role', 'status');
  });

  it('explains a failed load and offers a retry', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token', user: null });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('로그인이 만료됐어요');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });
});
