'use client';

import React from 'react';
import { CloudSun } from 'lucide-react';
import type { CongestionData, WeatherData } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { getCombinedLiveDataStatus } from '@/features/recommendation/lib/live-data';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';

const FRESHNESS_VARIANT = {
  live: 'live',
  recent: 'success',
  stale: 'warning',
  unknown: 'muted',
} as const;

interface SeoulNowCardProps {
  weatherData: WeatherData | null;
  congestionData: CongestionData | null;
  loading: boolean;
}

/** 탐색 패널 상단의 "서울 지금" 한 줄 요약. 권한이 없어도 기준 위치의 실제 값을 보여준다. */
export function SeoulNowCard({ weatherData, congestionData, loading }: Readonly<SeoulNowCardProps>) {
  const { t } = useI18n();
  const status = getCombinedLiveDataStatus(weatherData, congestionData);
  const hasData = Boolean(weatherData || congestionData);
  return (
    <div className='rounded-lg border border-border bg-card p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='flex items-center gap-1.5 text-body-sm font-semibold'>
            <CloudSun className='size-4 text-primary' aria-hidden='true' />
            {t('explorer.seoulNow')}
          </p>
          {loading && !hasData ? (
            <p className='mt-1 text-caption text-muted-foreground'>{t('explorer.loadingLive')}</p>
          ) : hasData ? (
            <p className='mt-1 truncate text-body-sm text-muted-foreground tabular-nums'>
              {weatherData?.AREA_NM || congestionData?.AREA_NM || t('explorer.nearestArea')}
              {weatherData?.TEMP ? ` · ${Math.round(Number(weatherData.TEMP))}°` : ''}
              {weatherData?.PM10_INDEX
                ? ` · ${t('explorer.airQuality', { value: weatherData.PM10_INDEX })}`
                : ''}
              {congestionData?.AREA_CONGEST_LVL
                ? ` · ${t('explorer.congestion', { value: congestionData.AREA_CONGEST_LVL })}`
                : ''}
            </p>
          ) : (
            <p className='mt-1 text-caption leading-5 text-muted-foreground'>
              {t('explorer.unsupportedLive')}
            </p>
          )}
        </div>
        <Badge variant={FRESHNESS_VARIANT[status.freshness]} className='shrink-0'>
          {t(`freshness.${status.freshness}` as MessageKey)}
        </Badge>
      </div>
      {hasData && (
        <p className='mt-1.5 text-caption text-muted-foreground'>
          {t('explorer.sourceTime', { time: status.referenceTimeLabel })}
        </p>
      )}
    </div>
  );
}
