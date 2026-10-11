'use client';

import React from 'react';
import type { FacilityRecommendation } from '@/features/recommendation/model/types';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { formatDistanceKm } from './FacilityHeader';

interface FacilityAlternativesProps {
  alternatives: FacilityRecommendation[];
  onSelect: (recommendation: FacilityRecommendation) => void;
}

export function FacilityAlternatives({ alternatives, onSelect }: FacilityAlternativesProps) {
  const { t } = useI18n();
  if (alternatives.length === 0) return null;
  return (
    <section aria-labelledby='nearby-alternatives-title'>
      <div className='flex items-baseline justify-between'>
        <h3 id='nearby-alternatives-title' className='text-section'>
          {t('facility.alternatives')}
        </h3>
        <span className='text-caption text-muted-foreground'>{t('facility.within5km')}</span>
      </div>
      <ul className='mt-2 grid gap-2'>
        {alternatives.map(alternative => (
          <li key={`${alternative.facility.category}:${alternative.facility.id}`}>
            <button
              type='button'
              onClick={() => {
                trackEvent('alternative_selected', {
                  category: alternative.facility.category,
                  reason_code: alternative.reasonCodes[0],
                });
                onSelect(alternative);
              }}
              className='w-full rounded-lg border border-border bg-card p-3 text-left outline-none transition-colors duration-fast hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50'
            >
              <div className='flex items-center justify-between gap-2'>
                <p className='truncate text-body font-medium'>{alternative.facility.name}</p>
                <span className='shrink-0 text-label tabular-nums text-primary'>
                  {t('facility.scoreLabel', { score: alternative.score })}
                </span>
              </div>
              <p className='mt-0.5 text-caption text-muted-foreground'>
                {formatDistanceKm(alternative.facility.distance, t('explorer.distanceUnknown'))} ·{' '}
                {alternative.reasonCodes[0]
                  ? t(`reason.${alternative.reasonCodes[0]}` as MessageKey)
                  : t('explorer.nearbyInfo')}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
