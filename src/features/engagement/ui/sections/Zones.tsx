'use client';

import React from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { SavedZone } from '../../model/types';
import { EmptyState, SectionHeading } from './primitives';

interface ZonesProps {
  headingId: string;
  zones: SavedZone[];
  isMutating: boolean;
  onCreate: (label: string, radiusMeters: number) => void;
  onRecenter: (zone: SavedZone) => void;
  onDelete: (zone: SavedZone) => void;
}

const RADIUS_OPTIONS = [500, 1000, 1500, 3000, 5000] as const;

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-input/70 bg-card px-2 text-body-sm text-foreground shadow-sm outline-none transition-[color,box-shadow] duration-fast focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

export function Zones({
  headingId,
  zones,
  isMutating,
  onCreate,
  onRecenter,
  onDelete,
}: ZonesProps) {
  const { t } = useI18n();
  const [label, setLabel] = React.useState(() => t('engagement.zoneDefaultLabel'));
  const [radiusMeters, setRadiusMeters] = React.useState<number>(1500);
  const formatKm = (meters: number) => (meters / 1000).toLocaleString();

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} icon={MapPin} title={t('engagement.zonesTitle')} />
      <p className='mt-0.5 text-caption text-muted-foreground'>{t('engagement.zoneDescription')}</p>
      <div className='mt-2 grid grid-cols-[1fr_7rem] gap-2'>
        <div>
          <Label htmlFor='zone-label' className='sr-only'>
            {t('engagement.zoneLabel')}
          </Label>
          <Input
            id='zone-label'
            value={label}
            maxLength={40}
            onChange={event => setLabel(event.target.value)}
            placeholder={t('engagement.zonePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor='zone-radius' className='sr-only'>
            {t('engagement.zoneRadius')}
          </Label>
          <select
            id='zone-radius'
            value={radiusMeters}
            onChange={event => setRadiusMeters(Number(event.target.value))}
            className={SELECT_CLASS}
          >
            {RADIUS_OPTIONS.map(meters => (
              <option key={meters} value={meters}>
                {meters < 1000 ? `${meters}m` : `${formatKm(meters)}km`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button
        type='button'
        className='mt-2 w-full'
        disabled={isMutating || !label.trim()}
        onClick={() => onCreate(label.trim(), radiusMeters)}
      >
        {t('engagement.zoneSave')}
      </Button>

      <ul className='mt-2 space-y-2'>
        {zones.map(zone => (
          <li key={zone.id}>
            <Card className='flex-row items-center gap-2 py-2 pl-3 pr-1'>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-body-sm font-medium text-foreground'>{zone.label}</p>
                <p className='text-caption tabular-nums text-muted-foreground'>
                  {t('engagement.zoneRadiusLabel', { km: formatKm(zone.radiusMeters) })}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isMutating}
                onClick={() => onRecenter(zone)}
              >
                {t('engagement.zoneRecenter')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-lg'
                disabled={isMutating}
                onClick={() => onDelete(zone)}
                aria-label={t('engagement.zoneDelete', { label: zone.label })}
              >
                <Trash2 aria-hidden='true' />
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      {zones.length === 0 && <EmptyState className='mt-2'>{t('engagement.zonesEmpty')}</EmptyState>}
    </section>
  );
}
