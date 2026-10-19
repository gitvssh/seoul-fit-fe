'use client';

import React from 'react';
import { AlertTriangle, Loader2, MapPinOff } from 'lucide-react';
import type { FacilityCategory } from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import type { GeolocationBannerState } from './providers/ExploreProvider';

interface MapStatusChipProps {
  loading: boolean;
  locationLoading: boolean;
  failedCategories: FacilityCategory[];
  geolocationBanner: GeolocationBannerState;
  onRetryFailed: () => void;
  onLocate: () => void;
  onDismissBanner: () => void;
}

/**
 * 지도 상단 중앙의 상태 칩 한 개. 우선순위: 데이터 실패 > 위치 권한 안내 > 로딩.
 * 실패를 숨기지 않고, 권한 거부는 오류가 아닌 정상 경로로 안내한다.
 */
export function MapStatusChip({
  loading,
  locationLoading,
  failedCategories,
  geolocationBanner,
  onRetryFailed,
  onLocate,
  onDismissBanner,
}: Readonly<MapStatusChipProps>) {
  const { t } = useI18n();
  const base =
    'pointer-events-auto flex max-w-[min(100%,32rem)] items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-caption text-surface-elevated-foreground shadow-float-md md:text-body-sm';

  if (failedCategories.length > 0) {
    const names = failedCategories
      .map(category => t(`category.${category}` as MessageKey))
      .join(', ');
    return (
      <output className={base}>
        <AlertTriangle className='size-4 shrink-0 text-warning' aria-hidden='true' />
        <span className='min-w-0 flex-1'>{t('map.status.failed', { categories: names })}</span>
        <Button type='button' size='sm' variant='secondary' onClick={onRetryFailed}>
          {t('map.status.retry')}
        </Button>
      </output>
    );
  }

  if (geolocationBanner !== 'none') {
    let messageKey: MessageKey;
    if (geolocationBanner === 'denied') {
      messageKey = 'map.status.locationDenied';
    } else if (geolocationBanner === 'unavailable') {
      messageKey = 'map.status.locationUnavailable';
    } else {
      messageKey = 'map.status.locationPrompt';
    }
    return (
      <output className={base}>
        <MapPinOff className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
        <span className='min-w-0 flex-1'>{t(messageKey)}</span>
        {geolocationBanner === 'prompt' && (
          <Button type='button' size='sm' onClick={onLocate}>
            {t('map.status.locationPromptAction')}
          </Button>
        )}
        <Button type='button' size='sm' variant='ghost' onClick={onDismissBanner}>
          {t('map.status.keepDefault')}
        </Button>
      </output>
    );
  }

  if (loading || locationLoading) {
    return (
      <output aria-live='polite' className={base}>
        <Loader2 className='size-4 shrink-0 animate-spin text-primary' aria-hidden='true' />
        <span>{loading ? t('map.status.loading') : t('map.status.locationLoading')}</span>
      </output>
    );
  }

  return null;
}
