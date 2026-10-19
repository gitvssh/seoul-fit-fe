'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, UserRound } from 'lucide-react';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { useAuthStore } from '@/shared/model/authStore';
import { Button } from '@/shared/ui/button';
import { KakaoLoginButton } from '@/shared/ui/kakao-login-button';
import { SidebarSection } from './SidebarSection';

interface AccountSectionProps {
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigate?: (href: string) => void;
}

function Avatar({ imageUrl, name }: Readonly<{ imageUrl?: string; name: string }>) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=''
        width={40}
        height={40}
        className='size-10 shrink-0 rounded-full object-cover'
      />
    );
  }
  const initial = name.trim().charAt(0);
  return (
    <span
      aria-hidden='true'
      className='flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-body font-semibold text-accent-foreground'
    >
      {initial || <UserRound className='size-5' />}
    </span>
  );
}

export function AccountSection({ onLogin, onLogout, onNavigate }: Readonly<AccountSectionProps>) {
  const { t } = useI18n();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <SidebarSection id='sidebar-account' title={t('sidebar.account')}>
        <div className='flex flex-col gap-2 px-4 pb-2'>
          <KakaoLoginButton onClick={() => onLogin?.()} label={t('sidebar.login')} size='lg' />
          <p className='text-caption text-muted-foreground'>{t('sidebar.loginHint')}</p>
        </div>
      </SidebarSection>
    );
  }

  const name = user?.nickname || t('sidebar.defaultUser');
  return (
    <SidebarSection id='sidebar-account' title={t('sidebar.account')}>
      <div className='flex min-h-11 items-center gap-3 px-4 py-1'>
        <Avatar imageUrl={user?.profileImageUrl || undefined} name={name} />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-body font-medium text-foreground'>{name}</p>
          {user?.email ? (
            <p className='truncate text-caption text-muted-foreground'>{user.email}</p>
          ) : null}
        </div>
      </div>
      <div className='flex gap-2 px-4 pb-2 pt-1'>
        <Button asChild type='button' variant='outline' size='lg' className='flex-1'>
          <Link href='/profile' onClick={() => onNavigate?.('/profile')}>
            <UserRound aria-hidden='true' />
            {t('sidebar.profile')}
          </Link>
        </Button>
        <Button
          type='button'
          variant='outline'
          size='lg'
          className='flex-1'
          onClick={() => onLogout?.()}
        >
          <LogOut aria-hidden='true' />
          {t('sidebar.logout')}
        </Button>
      </div>
    </SidebarSection>
  );
}
