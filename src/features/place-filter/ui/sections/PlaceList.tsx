'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import type { Facility } from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { getFacilityOpenState, isFacilityReservable } from '../../lib/place-filter';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

interface PlaceListProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onFacilitySelect: (facility: Facility) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function formatDistance(distance: number | undefined, unknownLabel: string): string {
  if (distance === undefined) return unknownLabel;
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
}

export function PlaceList({
  facilities,
  selectedFacility,
  onFacilitySelect,
  onReset,
  hasActiveFilters,
}: Readonly<PlaceListProps>) {
  const { t } = useI18n();
  const openLabel = (facility: Facility) => {
    const state = getFacilityOpenState(facility.operatingHours);
    return state === 'open'
      ? t('explorer.open')
      : state === 'closed'
        ? t('explorer.closed')
        : t('explorer.hoursUnknown');
  };

  if (facilities.length === 0) {
    return (
      <div
        id='map-place-list'
        className='rounded-lg bg-muted px-4 py-8 text-center'
        aria-live='polite'
      >
        <MapPin className='mx-auto size-6 text-muted-foreground' aria-hidden='true' />
        <p className='mt-2 text-body-sm text-foreground'>{t('explorer.noPlaces')}</p>
        <p className='mt-1 text-caption text-muted-foreground'>{t('explorer.noPlacesHint')}</p>
        {hasActiveFilters && (
          <Button type='button' variant='secondary' size='sm' className='mt-3' onClick={onReset}>
            {t('explorer.clearAll')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul id='map-place-list' className='grid gap-2' aria-live='polite'>
      {facilities.slice(0, 100).map(facility => {
        const isSelected =
          selectedFacility?.id === facility.id && selectedFacility.category === facility.category;
        const config = FACILITY_CONFIGS[facility.category];
        const Icon = config.Icon;
        return (
          <li key={`${facility.category}:${facility.id}`}>
            <button
              type='button'
              onClick={() => onFacilitySelect(facility)}
              aria-pressed={isSelected}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left outline-none transition-colors duration-fast focus-visible:ring-[3px] focus-visible:ring-ring/50',
                isSelected ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-accent/60'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md',
                  config.color
                )}
                style={
                  config.glyph === 'ink'
                    ? { color: 'hsl(var(--marker-ink))' }
                    : { color: '#ffffff' }
                }
                aria-hidden='true'
              >
                <Icon className='size-4' />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='flex items-start justify-between gap-2'>
                  <span className='truncate text-body font-semibold'>{facility.name}</span>
                  <span className='shrink-0 text-label tabular-nums text-primary'>
                    {formatDistance(facility.distance, t('explorer.distanceUnknown'))}
                  </span>
                </span>
                <span className='mt-0.5 block truncate text-caption text-muted-foreground'>
                  {t(`category.${facility.category}` as MessageKey)} ·{' '}
                  {facility.address || t('explorer.addressUnknown')}
                </span>
                <span className='mt-1 block text-caption text-muted-foreground'>
                  {openLabel(facility)}
                  {isFacilityReservable(facility) && ` · ${t('explorer.reservable')}`}
                  {' · '}
                  {facility.congestionLevel === 'low'
                    ? t('explorer.lowCongestion')
                    : facility.congestionLevel === 'medium'
                      ? t('explorer.mediumCongestion')
                      : t('explorer.highCongestion')}
                </span>
              </span>
            </button>
          </li>
        );
      })}
      {facilities.length > 100 && (
        <li className='py-2 text-center text-caption text-muted-foreground'>
          {t('explorer.limitNotice')}
        </li>
      )}
    </ul>
  );
}
