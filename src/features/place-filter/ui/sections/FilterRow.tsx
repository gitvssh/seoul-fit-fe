'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import type { PlaceFilterKey, PlaceFilterState } from '../../model/types';
import { SEOUL_REGIONS } from '@/shared/lib/data/seoul-districts';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

const TOGGLE_FILTERS: Array<{
  key: keyof Pick<
    PlaceFilterState,
    'openOnly' | 'reservableOnly' | 'indoorOnly' | 'lowCongestionOnly'
  >;
  analyticsKey: PlaceFilterKey;
  labelKey: MessageKey;
}> = [
  { key: 'openOnly', analyticsKey: 'open_now', labelKey: 'explorer.openNow' },
  { key: 'reservableOnly', analyticsKey: 'reservable', labelKey: 'explorer.reservable' },
  { key: 'indoorOnly', analyticsKey: 'indoor', labelKey: 'explorer.indoor' },
  { key: 'lowCongestionOnly', analyticsKey: 'low_congestion', labelKey: 'explorer.lowCongestion' },
];

const selectClass =
  'h-9 rounded-full border border-input/70 bg-card px-3 text-label text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

interface FilterRowProps {
  filters: PlaceFilterState;
  selectedRegionCode: string;
  onRegionSelect: (code: string) => void;
  onFilterChange: (filters: PlaceFilterState, changedFilter: PlaceFilterKey, value: string) => void;
}

export function FilterRow({
  filters,
  selectedRegionCode,
  onRegionSelect,
  onFilterChange,
}: FilterRowProps) {
  const { locale, t } = useI18n();
  return (
    <div
      className='flex snap-x gap-2 overflow-x-auto py-1 scrollbar-none edge-fade-x'
      aria-label={t('explorer.filtersLabel')}
    >
      <label className='relative shrink-0 snap-start'>
        <span className='sr-only'>{t('explorer.regionShortcut')}</span>
        <MapPin
          className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-primary'
          aria-hidden='true'
        />
        <select
          value={selectedRegionCode}
          onChange={event => onRegionSelect(event.target.value)}
          className={cn(selectClass, 'pl-8')}
          aria-label={t('explorer.regionShortcut')}
        >
          <option value='' disabled>
            {t('explorer.selectRegion')}
          </option>
          {SEOUL_REGIONS.map(region => (
            <option key={region.code} value={region.code}>
              {locale === 'en' ? region.nameEn : region.nameKo}
            </option>
          ))}
        </select>
      </label>
      <label className='shrink-0 snap-start'>
        <span className='sr-only'>{t('explorer.maxDistance')}</span>
        <select
          value={filters.maxDistanceKm ?? ''}
          onChange={event => {
            const value = event.target.value;
            onFilterChange(
              { ...filters, maxDistanceKm: value ? Number(value) : null },
              'max_distance',
              value || 'all'
            );
          }}
          className={selectClass}
          aria-label={t('explorer.maxDistance')}
        >
          <option value=''>{t('explorer.allDistances')}</option>
          {[1, 3, 5].map(value => (
            <option key={value} value={value}>
              {t('explorer.withinKm', { value })}
            </option>
          ))}
        </select>
      </label>
      {TOGGLE_FILTERS.map(({ key, analyticsKey, labelKey }) => (
        <button
          key={key}
          type='button'
          aria-pressed={filters[key]}
          onClick={() =>
            onFilterChange(
              { ...filters, [key]: !filters[key] },
              analyticsKey,
              filters[key] ? 'disabled' : 'enabled'
            )
          }
          className={cn(
            'h-9 shrink-0 snap-start rounded-full border px-3.5 text-label outline-none transition-colors duration-fast focus-visible:ring-[3px] focus-visible:ring-ring/50',
            filters[key]
              ? 'border-primary bg-accent text-accent-foreground'
              : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
