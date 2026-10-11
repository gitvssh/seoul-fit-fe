'use client';

import React, { useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useAuthStore } from '@/shared/model/authStore';
import { useNotificationStore } from '@/shared/model/notificationStore';
import { isSafeAppDeepLink } from '@/features/engagement/model/types';
import type { Notification } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

const TYPE_DOT: Record<string, string> = {
  CONGESTION: 'bg-warning',
  LOCATION: 'bg-primary',
  EVENT: 'bg-success',
  SYSTEM: 'bg-muted-foreground',
};

function formatRelative(dateString: string, locale: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(locale === 'en' ? 'en' : 'ko', { numeric: 'auto' });
  if (minutes < 1) return locale === 'en' ? 'just now' : '방금';
  if (minutes < 60) return formatter.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return formatter.format(-hours, 'hour');
  return formatter.format(-Math.round(hours / 24), 'day');
}

/** 로그인 사용자의 인앱 알림 메뉴 */
export function NotificationsMenu() {
  const { locale, t } = useI18n();
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const {
    unreadCount,
    notifications,
    isLoadingHistory,
    fetchUnreadCount,
    fetchNotificationHistory,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated && user && accessToken) fetchUnreadCount(user.id, accessToken);
  }, [accessToken, fetchUnreadCount, isAuthenticated, user]);

  if (!isAuthenticated || !user || !accessToken) return null;

  const handleClick = async (notification: Notification) => {
    await markAsRead(notification.id, user.id, accessToken);
    if (isSafeAppDeepLink(notification.deepLink)) window.location.assign(notification.deepLink);
  };

  return (
    <DropdownMenu onOpenChange={open => open && fetchNotificationHistory(user.id, accessToken)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label={t('header.openNotifications')}
        >
          <Bell aria-hidden='true' />
          {unreadCount > 0 && (
            <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-live px-1 text-[10px] font-bold tabular-nums text-live-foreground'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
        <div className='flex items-center justify-between border-b border-border px-3 py-2'>
          <span className='text-body-sm font-semibold'>{t('header.notifications')}</span>
          {notifications.some(item => item.status === 'SENT') && (
            <button
              type='button'
              onClick={async event => {
                event.preventDefault();
                event.stopPropagation();
                await markAllAsRead(user.id, accessToken);
                await fetchUnreadCount(user.id, accessToken);
              }}
              className='text-caption font-medium text-primary'
            >
              {t('header.markAllRead')}
            </button>
          )}
        </div>
        {isLoadingHistory ? (
          <DropdownMenuItem>
            <div className='flex w-full items-center justify-center gap-2 py-4 text-body-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
              {t('header.loading')}
            </div>
          </DropdownMenuItem>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                'cursor-pointer border-b border-border last:border-b-0',
                notification.status === 'SENT' && 'bg-accent/60'
              )}
              onClick={() => handleClick(notification)}
            >
              <div className='flex w-full items-start gap-3 py-1'>
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    TYPE_DOT[notification.type] ?? 'bg-muted-foreground'
                  )}
                  aria-hidden='true'
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-body-sm font-medium'>{notification.title}</p>
                  <p className='mt-0.5 line-clamp-2 text-caption text-muted-foreground'>
                    {notification.message}
                  </p>
                  {notification.reason && (
                    <p className='mt-0.5 line-clamp-2 text-caption text-primary'>
                      {notification.reason}
                    </p>
                  )}
                  <p className='mt-1 text-caption text-muted-foreground'>
                    {formatRelative(notification.sentAt || notification.createdAt, locale)}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem>
            <div className='flex w-full items-center justify-center py-8 text-body-sm text-muted-foreground'>
              {t('header.notificationsEmpty')}
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
