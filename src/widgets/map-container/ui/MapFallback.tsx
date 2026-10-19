'use client';

import React from 'react';
import { MapPinned, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface MapFallbackProps {
  onRetry: () => void;
}

/** 지도 SDK를 불러오지 못했을 때의 정적 미리보기. 목록·상세는 SDK와 무관하게 동작한다. */
export function MapFallback({ onRetry }: Readonly<MapFallbackProps>) {
  const { t } = useI18n();
  return (
    <div
      role='alert'
      className='absolute inset-0 z-map-status flex items-center justify-center bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] bg-background p-6'
    >
      <div className='max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-float-lg'>
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
          <MapPinned className='size-6 text-muted-foreground' aria-hidden='true' />
        </div>
        <p className='mt-4 text-section text-foreground'>{t('map.fallback.title')}</p>
        <p className='mt-2 text-body-sm text-muted-foreground'>{t('map.fallback.description')}</p>
        <Button type='button' className='mt-5' onClick={onRetry}>
          <RefreshCw className='size-4' aria-hidden='true' />
          {t('map.fallback.retry')}
        </Button>
      </div>
    </div>
  );
}
