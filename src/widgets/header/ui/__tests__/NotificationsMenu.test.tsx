import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Notification } from '@/lib/types';
import { I18nProvider, LOCALE_STORAGE_KEY } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { NotificationsMenu } from '../NotificationsMenu';

const mockAuth = {
  isAuthenticated: true,
  user: { id: 1 } as { id: number } | null,
  accessToken: 'synthetic-test-token' as string | null,
};
const mockNotifications = {
  unreadCount: 3,
  notifications: [] as Notification[],
  isLoadingHistory: false,
  fetchUnreadCount: jest.fn(),
  fetchNotificationHistory: jest.fn(),
  markAsRead: jest.fn(async () => {}),
  markAllAsRead: jest.fn(async () => {}),
};
jest.mock('@/shared/model/authStore', () => ({ useAuthStore: () => mockAuth }));
jest.mock('@/shared/model/notificationStore', () => ({
  useNotificationStore: () => mockNotifications,
}));
const mount = () =>
  render(
    <I18nProvider>
      <NotificationsMenu />
    </I18nProvider>
  );
const open = () =>
  fireEvent.keyDown(screen.getByRole('button', { name: labels['header.openNotifications'] }), {
    key: 'ArrowDown',
  });
const note = (id: number, minutes: number, changes: Partial<Notification> = {}): Notification => ({
  id,
  userId: 1,
  title: `알림 ${id}`,
  message: '알림 본문',
  type: 'SYSTEM',
  read: false,
  status: 'SENT',
  createdAt: new Date(Date.now() - minutes * 60_000).toISOString(),
  deepLink: 'https://untrusted.example.com',
  ...changes,
});
const originalResize = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  global.ResizeObserver = originalResize;
});
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockAuth.isAuthenticated = true;
  mockAuth.user = { id: 1 };
  mockAuth.accessToken = 'synthetic-test-token';
  mockNotifications.unreadCount = 3;
  mockNotifications.notifications = [];
  mockNotifications.isLoadingHistory = false;
});

it.each(['signed-out', 'missing-user', 'missing-token'])(
  'does not load account notifications when %s',
  state => {
    if (state === 'signed-out') mockAuth.isAuthenticated = false;
    if (state === 'missing-user') mockAuth.user = null;
    if (state === 'missing-token') mockAuth.accessToken = null;
    mount();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mockNotifications.fetchUnreadCount).not.toHaveBeenCalled();
  }
);

it('loads history when opened, shows the empty state, and caps the unread badge', async () => {
  mockNotifications.unreadCount = 120;
  mount();
  expect(screen.getByText('99+')).toBeInTheDocument();
  expect(mockNotifications.fetchUnreadCount).toHaveBeenCalledWith(1, 'synthetic-test-token');
  open();
  await waitFor(() =>
    expect(screen.getByText(labels['header.notificationsEmpty'])).toBeInTheDocument()
  );
  expect(mockNotifications.fetchNotificationHistory).toHaveBeenCalledWith(
    1,
    'synthetic-test-token'
  );
  expect(
    screen.queryByRole('button', { name: labels['header.markAllRead'] })
  ).not.toBeInTheDocument();
});

it('announces pending history without presenting it as an empty inbox', async () => {
  mockNotifications.unreadCount = 0;
  mockNotifications.isLoadingHistory = true;
  mount();
  open();
  await waitFor(() => expect(screen.getByText(labels['header.loading'])).toBeInTheDocument());
  expect(screen.queryByText(labels['header.notificationsEmpty'])).not.toBeInTheDocument();
});

it('renders recent and older notification reasons and marks all read before refreshing the count', async () => {
  mockNotifications.notifications = [
    note(1, 0, { reason: '미세먼지 주의', type: 'CONGESTION', sentAt: new Date().toISOString() }),
    note(2, 10, { type: 'LOCATION' }),
    note(3, 120, { type: 'EVENT' }),
    note(4, 2880, { type: 'unknown', status: 'READ' }),
  ];
  mount();
  open();
  await waitFor(() => expect(screen.getAllByRole('menuitem')).toHaveLength(4));
  expect(screen.getByText('미세먼지 주의')).toBeInTheDocument();
  expect(screen.getByText('방금')).toBeInTheDocument();
  expect(screen.getByText(/10분 전/)).toBeInTheDocument();
  expect(screen.getByText(/2시간 전/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: labels['header.markAllRead'] }));
  await waitFor(() =>
    expect(mockNotifications.markAllAsRead).toHaveBeenCalledWith(1, 'synthetic-test-token')
  );
  expect(mockNotifications.fetchUnreadCount).toHaveBeenCalledTimes(2);
});

it('marks a selected notification read while refusing its external destination', async () => {
  mockNotifications.notifications = [note(7, 1)];
  mount();
  open();
  await waitFor(() => expect(screen.getByText('알림 7')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('menuitem'));
  await waitFor(() =>
    expect(mockNotifications.markAsRead).toHaveBeenCalledWith(7, 1, 'synthetic-test-token')
  );
  expect(window.location.hostname).not.toBe('untrusted.example.com');
});

it('uses English relative time when the saved locale is English', async () => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
  mockNotifications.notifications = [note(1, 0), note(2, 90)];
  mount();
  fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
  await waitFor(() => expect(screen.getByText('just now')).toBeInTheDocument());
  expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
});
