'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Map, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/brand/Logo';
import { useI18n } from '@/shared/i18n/I18nProvider';

export interface RouteErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Optional screen-specific title; defaults to the generic error copy. */
  title?: string;
  description?: string;
}

/**
 * Shared body for route error boundaries: an honest message, a retry that
 * re-renders the failed segment, a way back to the map, and the digest for support.
 */
export function RouteErrorState({
  error,
  reset,
  title,
  description,
}: Readonly<RouteErrorStateProps>) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'>
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-float-sm'>
        <LogoMark size={44} className='mx-auto' />
        <h1 className='mt-6 text-title text-foreground'>{title ?? t('error.title')}</h1>
        <p className='mt-2 text-body text-muted-foreground'>
          {description ?? t('error.description')}
        </p>
        {error.digest && (
          <p className='mt-3 text-caption text-muted-foreground tabular-nums'>
            {t('error.reference', { digest: error.digest })}
          </p>
        )}
        <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button size='lg' onClick={reset}>
            <RotateCcw aria-hidden='true' />
            {t('error.retry')}
          </Button>
          <Button asChild variant='outline' size='lg'>
            <Link href='/'>
              <Map aria-hidden='true' />
              {t('error.home')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
