'use client';

import React, { useEffect, useState } from 'react';
import { TrainFront } from 'lucide-react';
import type { FormattedSubwayArrival } from '@/entities/subway';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface SubwayArrivalsProps {
  stationName: string;
}

type ArrivalStatus = 'loading' | 'ok' | 'empty' | 'unavailable';

const MAX_ROWS = 3;

/** 역 상세의 실시간 도착 목록. 상위 3건만 보여주고, 상류 오류는 '받을 수 없음'으로 구분해 알린다. */
export function SubwayArrivals({ stationName }: Readonly<SubwayArrivalsProps>) {
  const { t } = useI18n();
  const [arrivals, setArrivals] = useState<FormattedSubwayArrival[]>([]);
  const [status, setStatus] = useState<ArrivalStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setArrivals([]);
    fetch(`/api/subway/arrival?stationName=${encodeURIComponent(stationName)}`, {
      signal: controller.signal,
    })
      .then(async response => {
        const body = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { arrivals?: FormattedSubwayArrival[] };
        } | null;
        if (controller.signal.aborted) return;
        if (!response.ok || !body?.success) {
          setStatus('unavailable');
          return;
        }
        const rows = body.data?.arrivals ?? [];
        setArrivals(rows.slice(0, MAX_ROWS));
        setStatus(rows.length > 0 ? 'ok' : 'empty');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
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
          <Skeleton className='h-12 w-full' />
          <span className='sr-only'>{t('facility.loadingArrival')}</span>
        </div>
      ) : status === 'ok' ? (
        <ul className='mt-2 space-y-2'>
          {arrivals.map((arrival, index) => (
            <li
              key={`${arrival.btrainNo ?? index}-${arrival.trainLineNm}`}
              className='rounded-lg border border-border p-3'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='min-w-0 truncate text-body-sm font-medium'>
                  {arrival.trainLineNm}
                </span>
                {index === 0 && <Badge variant='live'>{t('freshness.live')}</Badge>}
              </div>
              <p className='mt-1 flex items-baseline justify-between gap-2'>
                <span className='text-caption text-muted-foreground'>
                  {arrival.bstatnNm
                    ? t('facility.arrivalDirection', { direction: arrival.bstatnNm })
                    : arrival.updnLine}
                </span>
                <span className='text-body-sm font-semibold tabular-nums text-primary'>
                  {arrival.arvlMsg2}
                </span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className='mt-2 rounded-lg bg-muted px-3 py-3 text-body-sm text-muted-foreground'>
          {status === 'unavailable' ? t('facility.arrivalUnavailable') : t('facility.noArrival')}
        </p>
      )}
    </section>
  );
}
