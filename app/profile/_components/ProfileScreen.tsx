'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuthStore } from '@/shared/model/authStore';
import { kakaoLogin } from '@/shared/api/login';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { AccountSection } from './AccountSection';
import { INTEREST_OPTIONS } from './interest-categories';
import { InterestSection } from './InterestSection';
import { LoggedOutProfile } from './LoggedOutProfile';
import { ProfileFrame } from './ProfileFrame';

function CheckingState() {
  const { t } = useI18n();
  return (
    <div role='status' aria-live='polite' aria-busy='true' className='space-y-6'>
      <span className='sr-only'>{t('profile.checking')}</span>
      <Skeleton className='h-28 w-full rounded-xl' />
      <Skeleton className='h-64 w-full rounded-xl' />
    </div>
  );
}

function StatTile({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className='rounded-lg bg-muted p-3 text-center'>
      <p className='text-title text-foreground tabular-nums'>{value}</p>
      <p className='mt-0.5 text-caption text-muted-foreground'>{label}</p>
    </div>
  );
}

/**
 * Profile route body. The persisted auth store is read through the hook so the
 * screen follows login state; there is no silent redirect for visitors.
 */
export function ProfileScreen() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    // Persisted auth only exists in the browser; render the decision after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const fallbackInterests = user?.interests?.map(interest => interest.interestCategory) ?? [];
  const realtimeCount = interests.filter(
    key => INTEREST_OPTIONS.find(option => option.key === key)?.isRealtime
  ).length;
  const locationCount = interests.filter(
    key => INTEREST_OPTIONS.find(option => option.key === key)?.isLocationBased
  ).length;

  const handleLogin = () => {
    trackEvent('login_started', { entry_point: 'profile' });
    kakaoLogin();
  };

  if (!mounted || isLoading) {
    return (
      <ProfileFrame>
        <CheckingState />
      </ProfileFrame>
    );
  }

  if (!isAuthenticated) {
    return (
      <ProfileFrame>
        <LoggedOutProfile onLogin={handleLogin} />
      </ProfileFrame>
    );
  }

  return (
    <ProfileFrame>
      <div className='space-y-6'>
        <section
          aria-label={t('profile.title')}
          className='rounded-xl border border-border bg-card p-6 shadow-float-sm'
        >
          <div className='flex items-center gap-4'>
            <span className='inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground'>
              {user?.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt=''
                  width={64}
                  height={64}
                  className='size-full object-cover'
                />
              ) : (
                <User aria-hidden='true' className='size-7' />
              )}
            </span>
            <div className='min-w-0'>
              <h2 className='truncate text-title text-foreground'>
                {user?.nickname || t('profile.defaultUser')}
              </h2>
              <p className='text-body-sm text-muted-foreground'>Kakao</p>
            </div>
          </div>
          <div className='mt-5 grid grid-cols-3 gap-3'>
            <StatTile label={t('profile.stats.interests')} value={interests.length} />
            <StatTile label={t('profile.stats.realtime')} value={realtimeCount} />
            <StatTile label={t('profile.stats.location')} value={locationCount} />
          </div>
        </section>
        <InterestSection fallbackInterests={fallbackInterests} onChange={setInterests} />
        <AccountSection />
      </div>
    </ProfileFrame>
  );
}
