'use client';

import React from 'react';
import { Cloud, CloudRain, Droplets, RefreshCw, Sun, Users, Wind, X } from 'lucide-react';
import type { CongestionData, WeatherData } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { getCombinedLiveDataStatus } from '@/features/recommendation/lib/live-data';
import type { LiveSlice } from '@/shared/lib/hooks/useLiveData';
import { cn } from '@/shared/lib/utils';

interface LiveNowPanelProps {
  weather: LiveSlice<WeatherData>;
  congestion: LiveSlice<CongestionData>;
  loading: boolean;
  onRefresh: () => void;
  onClose: () => void;
  className?: string;
}

const FRESHNESS_VARIANT = {
  live: 'live',
  recent: 'success',
  stale: 'warning',
  unknown: 'muted',
} as const;

/** 날씨 현황 문자열에 맞는 아이콘 */
export function WeatherConditionIcon({
  condition,
  className,
}: {
  condition?: string;
  className?: string;
}) {
  if (condition && (condition.includes('비') || /rain/i.test(condition))) {
    return <CloudRain className={className} aria-hidden='true' />;
  }
  if (
    condition &&
    (condition.includes('구름') || condition.includes('흐림') || /cloud/i.test(condition))
  ) {
    return <Cloud className={className} aria-hidden='true' />;
  }
  return <Sun className={className} aria-hidden='true' />;
}

export function congestionVariant(level?: string): 'success' | 'warning' | 'destructive' | 'muted' {
  if (level === '여유') return 'success';
  if (level === '보통') return 'warning';
  if (level === '약간 붐빔' || level === '붐빔') return 'destructive';
  return 'muted';
}

/** 지도 위 "서울 지금" 카드: 날씨·대기질·혼잡도와 기준 시각, 실패 상태를 한 곳에서 보여준다. */
export function LiveNowPanel({
  weather,
  congestion,
  loading,
  onRefresh,
  onClose,
  className,
}: LiveNowPanelProps) {
  const { t } = useI18n();
  const status = getCombinedLiveDataStatus(weather.data, congestion.data);
  const unavailable =
    !weather.data &&
    !congestion.data &&
    (weather.status === 'unavailable' || weather.status === 'error');
  const outside = !weather.data && !congestion.data && weather.status === 'outside_area';
  const areaName = weather.data?.AREA_NM || congestion.data?.AREA_NM;

  return (
    <section
      aria-label={t('map.liveNow')}
      className={cn(
        'pointer-events-auto rounded-lg border border-border bg-card text-card-foreground shadow-float-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-base motion-reduce:animate-none',
        className
      )}
    >
      <header className='flex items-center gap-2 border-b border-border px-4 py-3'>
        <span className='flex size-2 rounded-full bg-live' aria-hidden='true' />
        <h2 className='min-w-0 flex-1 truncate text-section'>
          {t('map.liveNow')}
          {areaName && (
            <span className='ml-1.5 font-normal text-muted-foreground'>· {areaName}</span>
          )}
        </h2>
        <Badge variant={FRESHNESS_VARIANT[status.freshness]}>
          {t(`freshness.${status.freshness}` as MessageKey)}
        </Badge>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={onRefresh}
          aria-label={t('map.live.refresh')}
          disabled={loading}
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden='true' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={onClose}
          aria-label={t('map.liveNowHide')}
        >
          <X className='size-4' aria-hidden='true' />
        </Button>
      </header>

      <div className='space-y-3 px-4 py-3'>
        {loading && !weather.data && !congestion.data ? (
          <div className='space-y-2' aria-busy='true'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-8 w-2/3' />
            <span className='sr-only'>{t('map.live.loading')}</span>
          </div>
        ) : unavailable ? (
          <p className='text-body-sm text-muted-foreground'>{t('map.live.unavailable')}</p>
        ) : outside ? (
          <p className='text-body-sm text-muted-foreground'>{t('map.live.outsideArea')}</p>
        ) : (
          <>
            {weather.data && (
              <div className='flex items-center gap-3'>
                <span className='flex size-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-info-soft-foreground'>
                  <WeatherConditionIcon condition={weather.data.WEATHER_STTS} className='size-6' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-title tabular-nums'>
                    {Math.round(Number(weather.data.TEMP))}°
                    <span className='ml-2 text-body-sm font-normal text-muted-foreground'>
                      {weather.data.WEATHER_STTS}
                    </span>
                  </p>
                  <p className='text-caption text-muted-foreground'>
                    {[
                      Number.isFinite(Number(weather.data.SENSIBLE_TEMP))
                        ? t('map.live.feelsLike', {
                            value: Math.round(Number(weather.data.SENSIBLE_TEMP)),
                          })
                        : null,
                      weather.data.HUMIDITY
                        ? t('map.live.humidity', { value: weather.data.HUMIDITY })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            )}
            {weather.data && (weather.data.PM10_INDEX || weather.data.PM25_INDEX) && (
              <div className='flex flex-wrap gap-1.5'>
                {weather.data.PM10_INDEX && (
                  <Badge variant='muted'>
                    <Wind aria-hidden='true' />
                    {t('map.live.pm10', { value: weather.data.PM10_INDEX })}
                  </Badge>
                )}
                {weather.data.PM25_INDEX && (
                  <Badge variant='muted'>
                    {t('map.live.pm25', { value: weather.data.PM25_INDEX })}
                  </Badge>
                )}
              </div>
            )}
            {weather.data?.PCP_MSG && (
              <p className='flex gap-2 rounded-md bg-info-soft px-3 py-2 text-body-sm text-info-soft-foreground'>
                <Droplets className='mt-0.5 size-4 shrink-0' aria-hidden='true' />
                <span>{weather.data.PCP_MSG}</span>
              </p>
            )}
            {congestion.data && (
              <div className='rounded-md border border-border px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <Users className='size-4 text-muted-foreground' aria-hidden='true' />
                  <span className='text-body-sm font-medium'>{t('map.live.congestion')}</span>
                  <Badge
                    variant={congestionVariant(congestion.data.AREA_CONGEST_LVL)}
                    className='ml-auto'
                  >
                    {congestion.data.AREA_CONGEST_LVL}
                  </Badge>
                </div>
                {congestion.data.AREA_CONGEST_MSG && (
                  <p className='mt-1.5 text-caption text-muted-foreground'>
                    {congestion.data.AREA_CONGEST_MSG}
                  </p>
                )}
              </div>
            )}
            {!weather.data && congestion.data && weather.status === 'unavailable' && (
              <p className='text-caption text-muted-foreground'>{t('map.live.unavailable')}</p>
            )}
          </>
        )}
        <p className='text-caption text-muted-foreground'>
          {t('map.live.source')}
          {status.referenceTimeLabel
            ? ` · ${t('map.live.observedAt', { time: status.referenceTimeLabel })}`
            : ''}
        </p>
      </div>
    </section>
  );
}
