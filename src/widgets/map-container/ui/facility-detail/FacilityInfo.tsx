'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, Database, MapPin, Phone } from 'lucide-react';
import type { Facility } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { getSafeExternalUrl } from '@/entities/facility/lib/actions';
import { getFacilityProvenance } from '@/entities/facility/lib/provenance';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { formatDistanceKm } from './FacilityHeader';

const FRESHNESS_VARIANT = {
  live: 'live',
  recent: 'success',
  stale: 'warning',
  unknown: 'muted',
} as const;

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex gap-3 py-2.5'>
      <span
        className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
        aria-hidden='true'
      >
        {icon}
      </span>
      <div className='min-w-0 flex-1'>
        <dt className='text-caption text-muted-foreground'>{label}</dt>
        <dd className='text-body text-foreground'>{children}</dd>
      </div>
    </div>
  );
}

export function FacilityInfo({ facility }: { facility: Facility }) {
  const { locale, t } = useI18n();
  const provenance = getFacilityProvenance(facility);
  const sourceUrl = getSafeExternalUrl(provenance.sourceUrl);
  const updatedLabel =
    facility.sourceUpdatedAt && Number.isFinite(Date.parse(facility.sourceUpdatedAt))
      ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(facility.sourceUpdatedAt))
      : t('facility.unknown');
  const event = facility.culturalEvent;

  return (
    <div className='space-y-4'>
      <dl className='divide-y divide-border'>
        {facility.address && (
          <InfoRow icon={<MapPin className='size-4' />} label={t('facility.address')}>
            {facility.address}
          </InfoRow>
        )}
        {facility.operatingHours && (
          <InfoRow icon={<Clock className='size-4' />} label={t('facility.hours')}>
            {facility.operatingHours}
          </InfoRow>
        )}
        {facility.phone && (
          <InfoRow icon={<Phone className='size-4' />} label={t('facility.contact')}>
            <a
              href={`tel:${facility.phone}`}
              className='text-primary underline decoration-dotted underline-offset-4'
              onClick={() =>
                trackEvent('facility_action_clicked', {
                  action_type: 'phone',
                  category: facility.category,
                })
              }
            >
              {facility.phone}
            </a>
          </InfoRow>
        )}
        <InfoRow icon={<Database className='size-4' />} label={t('facility.source')}>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline decoration-dotted underline-offset-4'
            >
              {provenance.sourceLabel}
            </a>
          ) : (
            provenance.sourceLabel
          )}
          <span className='mt-1 flex flex-wrap items-center gap-2 text-caption text-muted-foreground'>
            <Badge variant={FRESHNESS_VARIANT[provenance.freshness]}>
              {t(`freshness.${provenance.freshness}` as MessageKey)}
            </Badge>
            {provenance.freshness !== 'unknown' && <span>{updatedLabel}</span>}
          </span>
          {provenance.freshness === 'stale' && (
            <span className='mt-1 block text-caption text-warning-soft-foreground'>
              {t('facility.staleWarning')}
            </span>
          )}
        </InfoRow>
      </dl>

      <section className='rounded-lg border border-border p-3' aria-label={t('facility.info')}>
        <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm'>
          <dt className='text-muted-foreground'>{t('facility.category')}</dt>
          <dd className='text-right'>{t(`category.${facility.category}` as MessageKey)}</dd>
          {facility.distance !== undefined && (
            <>
              <dt className='text-muted-foreground'>{t('facility.distance')}</dt>
              <dd className='text-right tabular-nums'>
                {formatDistanceKm(facility.distance, t('explorer.distanceUnknown'))}
              </dd>
            </>
          )}
          <dt className='text-muted-foreground'>{t('facility.reservable')}</dt>
          <dd className='text-right'>
            {facility.isReservable ? t('facility.reservableYes') : t('facility.reservableNo')}
          </dd>
          {facility.bikeFacility && facility.bikeFacility.parkingBikeTotCnt !== undefined && (
            <>
              <dt className='text-muted-foreground'>{t('category.bike')}</dt>
              <dd className='text-right tabular-nums'>
                {t('facility.bikeAvailable', { count: facility.bikeFacility.parkingBikeTotCnt })}
                {facility.bikeFacility.rackTotCnt !== undefined &&
                  ` · ${t('facility.bikeRacks', { count: facility.bikeFacility.rackTotCnt })}`}
              </dd>
            </>
          )}
        </dl>
      </section>

      {facility.category === 'cultural_event' && event && (
        <section className='space-y-2' aria-label={t('facility.eventInfo')}>
          <h3 className='text-section'>{t('facility.eventInfo')}</h3>
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-body-sm'>
            {event.codeName && (
              <>
                <dt className='text-muted-foreground'>{t('facility.eventGenre')}</dt>
                <dd>{event.codeName}</dd>
              </>
            )}
            {event.useFee && (
              <>
                <dt className='text-muted-foreground'>{t('facility.eventFee')}</dt>
                <dd>{event.useFee}</dd>
              </>
            )}
            {event.useTarget && (
              <>
                <dt className='text-muted-foreground'>{t('facility.eventTarget')}</dt>
                <dd>{event.useTarget}</dd>
              </>
            )}
            {event.ticket && (
              <>
                <dt className='text-muted-foreground'>{t('facility.eventTicket')}</dt>
                <dd>{event.ticket}</dd>
              </>
            )}
            {event.isFree && (
              <>
                <dt className='text-muted-foreground'>{t('facility.eventKind')}</dt>
                <dd>{String(event.isFree)}</dd>
              </>
            )}
          </dl>
          {event.mainImg && (
            <Image
              src={event.mainImg}
              alt=''
              width={640}
              height={200}
              className='h-40 w-full rounded-lg object-cover'
            />
          )}
        </section>
      )}

      {facility.description && facility.category !== 'cultural_event' && (
        <section aria-label={t('facility.description')}>
          <h3 className='text-section'>{t('facility.description')}</h3>
          <p className='mt-1 text-body-sm leading-relaxed text-muted-foreground'>
            {facility.description}
          </p>
        </section>
      )}
    </div>
  );
}
