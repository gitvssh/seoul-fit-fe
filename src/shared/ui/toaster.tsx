'use client';

import * as React from 'react';
import { Toaster } from 'sonner';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { useTheme } from '@/shared/lib/theme';

/**
 * 앱 전역 토스트 호스트(sonner). 레이아웃에서 ThemeProvider·I18nProvider 안쪽에 한 번 마운트한다.
 * 표면은 solid 토큰(`bg-card`), 위치는 헤더 아래 상단 중앙, 라이브 리전 이름은 "알림".
 * sonner가 `prefers-reduced-motion` CSS를 내장하므로 모션 감소는 자동으로 따른다.
 */
export function AppToaster() {
  const { resolved } = useTheme();
  const { t } = useI18n();

  return (
    <Toaster
      position='top-center'
      theme={resolved}
      richColors={false}
      closeButton
      visibleToasts={2}
      containerAriaLabel={t('toast.region')}
      className='!z-toast !font-sans'
      offset={{ top: 'calc(var(--header-height) + 12px)' }}
      mobileOffset={{ top: 'calc(var(--header-height) + 8px)' }}
      style={
        {
          '--normal-bg': 'hsl(var(--card))',
          '--normal-text': 'hsl(var(--card-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4000,
        closeButtonAriaLabel: t('toast.close'),
        classNames: {
          toast: 'border border-border bg-card text-card-foreground !shadow-float-lg rounded-lg',
          title: 'text-body-sm font-medium',
          description: '!text-muted-foreground text-body-sm',
          closeButton: 'border-border bg-card text-foreground hover:!bg-accent',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-destructive',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-primary',
        },
      }}
    />
  );
}
