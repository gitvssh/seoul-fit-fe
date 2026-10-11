'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/brand/Logo';
import { useI18n } from '@/shared/i18n/I18nProvider';

/** Compact page frame for the profile screens: back to the map, brand, content column. */
export function ProfileFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <header className='border-b border-border bg-card'>
        <div className='mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6'>
          <Button asChild variant='ghost' size='icon-lg' className='-ml-2'>
            <Link href='/' aria-label={t('profile.back')}>
              <ArrowLeft aria-hidden='true' className='size-5' />
            </Link>
          </Button>
          <h1 className='text-section text-foreground'>{t('profile.title')}</h1>
          <Logo size={28} />
        </div>
      </header>
      <main className='mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8'>{children}</main>
    </div>
  );
}
