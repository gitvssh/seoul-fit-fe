'use client';

import Link from 'next/link';
import { BellRing, Bookmark, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { KakaoLoginButton } from '@/shared/ui/kakao-login-button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';

const FEATURES: { Icon: LucideIcon; titleKey: MessageKey; hintKey: MessageKey }[] = [
  {
    Icon: SlidersHorizontal,
    titleKey: 'profile.loggedOut.feature.interests',
    hintKey: 'profile.loggedOut.feature.interestsHint',
  },
  {
    Icon: Bookmark,
    titleKey: 'profile.loggedOut.feature.places',
    hintKey: 'profile.loggedOut.feature.placesHint',
  },
  {
    Icon: BellRing,
    titleKey: 'profile.loggedOut.feature.alerts',
    hintKey: 'profile.loggedOut.feature.alertsHint',
  },
];

export interface LoggedOutProfileProps {
  onLogin: () => void;
}

/** Honest logged-out state: what the profile does, one Kakao CTA, and that local saving still works. */
export function LoggedOutProfile({ onLogin }: Readonly<LoggedOutProfileProps>) {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby='logged-out-heading'
      className='rounded-xl border border-border bg-card p-6 shadow-float-sm sm:p-8'
    >
      <p className='text-label text-primary'>{t('profile.loggedOut.eyebrow')}</p>
      <h2 id='logged-out-heading' className='mt-1 text-title text-foreground'>
        {t('profile.loggedOut.title')}
      </h2>
      <p className='mt-2 text-body text-muted-foreground'>{t('profile.loggedOut.description')}</p>

      <ul className='mt-6 grid gap-3 sm:grid-cols-3'>
        {FEATURES.map(({ Icon, titleKey, hintKey }) => (
          <li key={titleKey} className='rounded-lg bg-muted p-4'>
            <Icon aria-hidden='true' className='size-5 text-primary' />
            <p className='mt-2 text-body-sm font-medium text-foreground'>{t(titleKey)}</p>
            <p className='mt-1 text-caption text-muted-foreground'>{t(hintKey)}</p>
          </li>
        ))}
      </ul>

      <div className='mt-6 flex flex-col gap-3 sm:max-w-sm'>
        <KakaoLoginButton onClick={onLogin} label={t('profile.loggedOut.login')} />
        <Button asChild variant='ghost' size='lg'>
          <Link href='/'>{t('profile.loggedOut.browse')}</Link>
        </Button>
      </div>
      <p className='mt-4 text-body-sm text-muted-foreground'>{t('profile.loggedOut.localNote')}</p>
    </section>
  );
}
