'use client';

import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ClusteredFacility, Facility, FacilityCategory } from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';
import { useFacilityContext } from './providers/FacilityProvider';
import { useMapContext } from './providers/MapProvider';

interface ClusterListProps {
  cluster: ClusteredFacility;
  onBack: () => void;
}

/** 작은 클러스터를 눌렀을 때의 장소 목록. 항목을 고르면 상세로 넘어간다. */
export function ClusterList({ cluster, onBack }: Readonly<ClusterListProps>) {
  const { t } = useI18n();
  const { selectFacility } = useFacilityContext();
  const { revealPosition } = useMapContext();

  const grouped = useMemo(() => {
    const groups = new Map<FacilityCategory, Facility[]>();
    cluster.facilities.forEach(facility => {
      const list = groups.get(facility.category) ?? [];
      list.push(facility);
      groups.set(facility.category, list);
    });
    return Array.from(groups.entries());
  }, [cluster.facilities]);

  return (
    <section aria-labelledby='cluster-title' className='flex flex-col gap-3 pt-1'>
      <header className='flex items-center gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='-ml-2'
          onClick={onBack}
          aria-label={t('map.sheet.back')}
        >
          <ArrowLeft className='size-5' aria-hidden='true' />
        </Button>
        <h2 id='cluster-title' className='text-title'>
          {t('explorer.clusterTitle', { count: cluster.facilities.length })}
        </h2>
      </header>
      {grouped.map(([category, facilities]) => {
        const config = FACILITY_CONFIGS[category];
        const Icon = config.Icon;
        return (
          <div key={category}>
            <h3 className='flex items-center gap-2 text-label text-muted-foreground'>
              <span
                className={cn('flex size-5 items-center justify-center rounded-full', config.color)}
                style={
                  config.glyph === 'ink'
                    ? { color: 'hsl(var(--marker-ink))' }
                    : { color: '#ffffff' }
                }
                aria-hidden='true'
              >
                <Icon className='size-3' />
              </span>
              {t(`category.${category}` as MessageKey)}
              <span className='tabular-nums'>{facilities.length}</span>
            </h3>
            <ul className='mt-1.5 grid gap-1.5'>
              {facilities.map(facility => (
                <li key={`${facility.category}:${facility.id}`}>
                  <button
                    type='button'
                    onClick={() => {
                      selectFacility(facility, 'cluster');
                      revealPosition(facility.position);
                    }}
                    className='w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left outline-none transition-colors duration-fast hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50'
                  >
                    <p className='truncate text-body font-medium'>{facility.name}</p>
                    {facility.address && (
                      <p className='truncate text-caption text-muted-foreground'>
                        {facility.address}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
