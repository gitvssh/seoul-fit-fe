'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Facility } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { SubwayStationIcon } from '../SubwayStationIcon';
import {
  categoryHasOperatingHours,
  getFacilityOpenState,
} from '@/features/place-filter/lib/place-filter';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

export function formatDistanceKm(distance: number | undefined, unknownLabel: string): string {
  if (distance === undefined || !Number.isFinite(distance)) return unknownLabel;
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
}

interface FacilityHeaderProps {
  facility: Facility;
  onBack: () => void;
  titleId: string;
}

export function FacilityHeader({ facility, onBack, titleId }: FacilityHeaderProps) {
  const { t } = useI18n();
  const config = FACILITY_CONFIGS[facility.category];
  const Icon = config.Icon;
  const showsHours = categoryHasOperatingHours(facility.category);
  const openState = getFacilityOpenState(facility.operatingHours);
  const openBadge =
    openState === 'open'
      ? { variant: 'success' as const, label: t('explorer.open') }
      : openState === 'closed'
        ? { variant: 'muted' as const, label: t('explorer.closed') }
        : { variant: 'muted' as const, label: t('explorer.hoursUnknown') };

  return (
    <header className='flex items-start gap-3'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='-ml-2 shrink-0'
        onClick={onBack}
        aria-label={t('facility.back')}
      >
        <ArrowLeft className='size-5' aria-hidden='true' />
      </Button>
      {facility.category === 'subway' ? (
        <SubwayStationIcon route={facility.subwayStation?.route} size='lg' className='shrink-0' />
      ) : (
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg shadow-marker',
            config.color
          )}
          style={
            config.glyph === 'ink' ? { color: 'hsl(var(--marker-ink))' } : { color: '#ffffff' }
          }
          aria-hidden='true'
        >
          <Icon className='size-5' />
        </span>
      )}
      <div className='min-w-0 flex-1'>
        <h2 id={titleId} className='text-title leading-7'>
          {facility.name}
        </h2>
        <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-muted-foreground'>
          <span className={config.textColor}>
            {t(`category.${facility.category}` as MessageKey)}
          </span>
          {showsHours && <Badge variant={openBadge.variant}>{openBadge.label}</Badge>}
          {facility.distance !== undefined && (
            <span className='tabular-nums'>
              {t('facility.distanceAway', {
                distance: formatDistanceKm(facility.distance, t('explorer.distanceUnknown')),
              })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
