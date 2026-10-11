/**
 * @fileoverview Auth state screens: loading, success and failure of the Kakao callback.
 * Real states with actions instead of emoji and timers; copy comes from the i18n dictionary.
 */

'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { KakaoLoginButton } from '@/shared/ui/kakao-login-button';
import { LogoMark } from '@/shared/ui/brand/Logo';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface LoadingProps {
  message?: string;
}

interface SuccessProps {
  message?: string;
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

function AuthShell({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <main
      className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'
      aria-busy={busy ? 'true' : undefined}
    >
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-float-sm'>
        <LogoMark size={44} className='mx-auto' />
        {children}
      </div>
    </main>
  );
}

export const LoadingStates = {
  Loading: ({ message }: LoadingProps) => {
    const { t } = useI18n();
    return (
      <AuthShell busy>
        <div role='status' aria-live='polite'>
          <Loader2 aria-hidden='true' className='mx-auto mt-6 size-8 animate-spin text-primary' />
          <h1 className='mt-4 text-title text-foreground'>{message ?? t('auth.loading')}</h1>
          <p className='mt-2 text-body text-muted-foreground'>{t('auth.loadingHint')}</p>
        </div>
      </AuthShell>
    );
  },

  Success: ({ message }: SuccessProps) => {
    const { t } = useI18n();
    return (
      <AuthShell>
        <div role='status' aria-live='polite'>
          <CheckCircle2 aria-hidden='true' className='mx-auto mt-6 size-8 text-success' />
          <h1 className='mt-4 text-title text-foreground'>{message ?? t('auth.success')}</h1>
          <p className='mt-2 text-body text-muted-foreground'>{t('auth.successHint')}</p>
        </div>
      </AuthShell>
    );
  },

  Error: ({ message, onRetry }: ErrorProps) => {
    const { t } = useI18n();
    return (
      <AuthShell>
        <div role='alert'>
          <AlertCircle aria-hidden='true' className='mx-auto mt-6 size-8 text-destructive' />
          <h1 className='mt-4 text-title text-foreground'>{t('auth.errorTitle')}</h1>
          <p className='mt-2 text-body text-muted-foreground'>{message}</p>
        </div>
        <div className='mt-8 flex flex-col gap-3'>
          <KakaoLoginButton onClick={onRetry} label={t('auth.retry')} />
          <Button asChild variant='outline' size='lg'>
            <Link href='/'>{t('auth.home')}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  },
};
