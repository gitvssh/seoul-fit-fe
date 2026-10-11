'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { CongestionData, WeatherData } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { LiveSlice } from '@/shared/lib/hooks/useLiveData';
import { congestionVariant, WeatherConditionIcon } from '../LiveNowPanel';

interface FacilityLiveSectionProps {
  weather: LiveSlice<WeatherData>;
  congestion: LiveSlice<CongestionData>;
}

/** 선택 장소 주변의 지금: 데이터가 있을 때만 렌더한다. 실패 문구를 네 번 반복하지 않는다. */
export function FacilityLiveSection({ weather, congestion }: FacilityLiveSectionProps) {
  const { t } = useI18n();
  if (!weather.data && !congestion.data) {
    if (weather.status === 'unavailable' || weather.status === 'error') {
      return <p className='text-caption text-muted-foreground'>{t('facility.liveUnavailable')}</p>;
    }
    return null;
  }
  return (
    <section aria-label={t('facility.liveSection')}>
      <h3 className='text-section'>{t('facility.liveSection')}</h3>
      <div className='mt-2 grid grid-cols-2 gap-2'>
        {weather.data && (
          <div className='rounded-lg bg-info-soft p-3 text-info-soft-foreground'>
            <div className='flex items-center justify-between'>
              <span className='text-caption'>{t('facility.weather')}</span>
              <WeatherConditionIcon condition={weather.data?.WEATHER_STTS} className='size-4' />
            </div>
            <p className='mt-1 text-title tabular-nums'>{Math.round(Number(weather.data.TEMP))}°</p>
            <p className='text-caption'>
              {t('map.live.feelsLike', { value: Math.round(Number(weather.data.SENSIBLE_TEMP)) })}
              {weather.data.PM10_INDEX
                ? ` · ${t('map.live.pm10', { value: weather.data.PM10_INDEX })}`
                : ''}
            </p>
          </div>
        )}
        {congestion.data && (
          <div className='rounded-lg border border-border p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-caption text-muted-foreground'>{t('facility.crowding')}</span>
              <Users className='size-4 text-muted-foreground' aria-hidden='true' />
            </div>
            <Badge variant={congestionVariant(congestion.data.AREA_CONGEST_LVL)} className='mt-1.5'>
              {congestion.data.AREA_CONGEST_LVL}
            </Badge>
            {congestion.data.AREA_NM && (
              <p className='mt-1 truncate text-caption text-muted-foreground'>
                {congestion.data.AREA_NM}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
