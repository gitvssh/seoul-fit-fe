'use client';

import React from 'react';
import { CloudSun, LocateFixed, Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  locating: boolean;
  locationActive: boolean;
  onToggleLive: () => void;
  liveOpen: boolean;
  liveTemperature?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/** 지도 우측 컨트롤 열: 확대·축소, 내 위치, 서울 지금. 모두 44px 타깃이다. */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  locating,
  locationActive,
  onToggleLive,
  liveOpen,
  liveTemperature,
  className,
  style,
}: Readonly<MapControlsProps>) {
  const { t } = useI18n();
  return (
    <div
      className={cn('pointer-events-none flex flex-col items-end gap-2', className)}
      style={style}
    >
      <div className='pointer-events-auto flex flex-col overflow-hidden rounded-md border border-border bg-surface-elevated shadow-float-md'>
        <Button
          type='button'
          variant='ghost'
          size='icon-lg'
          className='rounded-none'
          onClick={onZoomIn}
          aria-label={t('map.zoomIn')}
        >
          <Plus className='size-5' aria-hidden='true' />
        </Button>
        <span className='mx-2 h-px bg-border' aria-hidden='true' />
        <Button
          type='button'
          variant='ghost'
          size='icon-lg'
          className='rounded-none'
          onClick={onZoomOut}
          aria-label={t('map.zoomOut')}
        >
          <Minus className='size-5' aria-hidden='true' />
        </Button>
      </div>
      <Button
        type='button'
        variant='float'
        size='icon-lg'
        className={cn('pointer-events-auto rounded-full', locationActive && 'text-primary')}
        onClick={onLocate}
        aria-label={t('map.locateMe')}
        aria-busy={locating}
      >
        <LocateFixed className={cn('size-5', locating && 'animate-pulse')} aria-hidden='true' />
      </Button>
      <Button
        type='button'
        variant='float'
        size='icon-lg'
        className={cn(
          'pointer-events-auto relative rounded-full',
          liveOpen && 'bg-accent text-accent-foreground'
        )}
        onClick={onToggleLive}
        aria-label={liveOpen ? t('map.liveNowHide') : t('map.liveNow')}
        aria-pressed={liveOpen}
      >
        <CloudSun className='size-5' aria-hidden='true' />
        {liveTemperature && (
          <span className='absolute -right-1 -top-1 rounded-full bg-live px-1.5 text-caption font-semibold tabular-nums text-live-foreground'>
            {liveTemperature}°
          </span>
        )}
      </Button>
    </div>
  );
}
