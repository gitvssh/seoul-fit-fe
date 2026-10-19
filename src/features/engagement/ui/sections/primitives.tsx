'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';
import type { EngagementPlaceSummary } from '../../model/types';

export function SectionHeading({
  id,
  icon: Icon,
  title,
  count,
  className,
}: Readonly<{
  id: string;
  icon: LucideIcon;
  title: string;
  count?: number;
  className?: string;
}>) {
  return (
    <h3 id={id} className={cn('flex items-center gap-2 text-section text-foreground', className)}>
      <Icon className='size-4 shrink-0 text-primary' aria-hidden='true' />
      <span className='min-w-0 truncate'>{title}</span>
      {typeof count === 'number' && (
        <span className='text-label tabular-nums text-muted-foreground'>{count}</span>
      )}
    </h3>
  );
}

export function EmptyState({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <p
      className={cn('rounded-lg bg-muted px-3 py-3 text-body-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

export function placeHref(place: Pick<EngagementPlaceSummary, 'latitude' | 'longitude'>): string {
  const params = new URLSearchParams({
    lat: String(place.latitude),
    lng: String(place.longitude),
  });
  return `/?${params.toString()}`;
}

/**
 * 장소 이름·캡션 행. `onSelect`가 있으면 지도 이동 콜백(페이지 새로고침 없음)을,
 * 없으면 딥링크를 쓴다.
 */
export function PlaceLink({
  place,
  caption,
  onSelect,
  className,
}: Readonly<{
  place: EngagementPlaceSummary;
  caption: string;
  onSelect?: (place: EngagementPlaceSummary) => void;
  className?: string;
}>) {
  const { t } = useI18n();
  const body = (
    <>
      <span className='block truncate text-body-sm font-medium text-foreground'>{place.name}</span>
      <span className='block truncate text-caption text-muted-foreground'>{caption}</span>
    </>
  );
  const classes = cn(
    'block min-w-0 flex-1 rounded-md text-left outline-none transition-colors duration-fast focus-visible:ring-[3px] focus-visible:ring-ring/50',
    className
  );

  if (onSelect) {
    return (
      <button
        type='button'
        className={classes}
        onClick={() => onSelect(place)}
        aria-label={t('engagement.openOnMap', { name: place.name })}
      >
        {body}
      </button>
    );
  }
  return (
    <a
      className={classes}
      href={placeHref(place)}
      aria-label={t('engagement.openOnMap', { name: place.name })}
    >
      {body}
    </a>
  );
}
