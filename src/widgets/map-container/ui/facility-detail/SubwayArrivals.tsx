'use client';

import React, { useEffect, useState } from 'react';
import { TrainFront } from 'lucide-react';
import type { SubwayArrivalData } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface SubwayArrivalsProps {
  stationName: string;
}

export function SubwayArrivals({ stationName }: SubwayArrivalsProps) {
  const { t } = useI18n();
  const [arrival, setArrival] = useState<SubwayArrivalData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setArrival(null);
    fetch(`/api/subway/arrival?stationName=${encodeURIComponent(stationName)}`, {
      signal: controller.signal,
    })
      .then(response => (response.ok ? response.json() : null))
      .then(result => {
        if (controller.signal.aborted) return;
        if (result?.success && result.data) {
          setArrival(result.data);
          setStatus('ok');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('empty');
      });
    return () => controller.abort();
  }, [stationName]);

  return (
    <section aria-label={t('facility.realtimeArrival')}>
      <h3 className='flex items-center gap-2 text-section'>
        <TrainFront className='size-4 text-muted-foreground' aria-hidden='true' />
        {t('facility.realtimeArrival')}
      </h3>
      {status === 'loading' ? (
        <div className='mt-2 space-y-2' aria-busy='true'>
          <Skeleton className='h-5 w-1/2' />
          <Skeleton className='h-10 w-full' />
          <span className='sr-only'>{t('facility.loadingArrival')}</span>
        </div>
      ) : status === 'ok' && arrival ? (
        <div className='mt-2 rounded-lg border border-border p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-body-sm font-medium'>{arrival.lineName}</span>
            <Badge variant='live'>{t('freshness.live')}</Badge>
          </div>
          {arrival.arrivalTime !== undefined && arrival.arrivalTime !== null && (
            <p className='mt-2 flex items-baseline justify-between'>
              <span className='text-body-sm text-muted-foreground'>{t('facility.nextTrain')}</span>
              <span className='text-title tabular-nums text-primary'>
                {t('facility.minutesLater', { value: arrival.arrivalTime })}
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className='mt-2 rounded-lg bg-muted px-3 py-3 text-body-sm text-muted-foreground'>
          {t('facility.noArrival')}
        </p>
      )}
    </section>
  );
}
