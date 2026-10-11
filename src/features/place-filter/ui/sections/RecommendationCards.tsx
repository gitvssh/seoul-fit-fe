'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { FacilityRecommendation } from '@/features/recommendation/model/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

interface RecommendationCardsProps {
  recommendations: FacilityRecommendation[];
  onSelect: (recommendation: FacilityRecommendation) => void;
}

export function RecommendationCards({ recommendations, onSelect }: RecommendationCardsProps) {
  const { t } = useI18n();
  return (
    <section aria-labelledby='recommendations-title'>
      <div className='flex items-baseline justify-between'>
        <h3 id='recommendations-title' className='flex items-center gap-1.5 text-section'>
          <Sparkles className='size-4 text-live' aria-hidden='true' />
          {t('explorer.recommendations')}
        </h3>
        <span className='text-caption text-muted-foreground'>
          {t('explorer.recommendationHint')}
        </span>
      </div>
      <ul className='mt-2 grid gap-2' aria-live='polite'>
        {recommendations.slice(0, 3).map((recommendation, index) => {
          const config = FACILITY_CONFIGS[recommendation.facility.category];
          const Icon = config.Icon;
          return (
            <li
              key={`recommendation:${recommendation.facility.category}:${recommendation.facility.id}`}
            >
              <button
                type='button'
                onClick={() => onSelect(recommendation)}
                className='flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left outline-none transition-colors duration-fast hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-safe:animate-fade-up'
                style={{ animationDelay: `${index * 30}ms` }}
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
                  <span className='flex items-center justify-between gap-2'>
                    <span className='truncate text-body font-semibold'>
                      {recommendation.facility.name}
                    </span>
                    <span className='shrink-0 rounded-md bg-accent px-2 py-0.5 text-label tabular-nums text-accent-foreground'>
                      {t('explorer.score', { score: recommendation.score })}
                    </span>
                  </span>
                  <span className='mt-0.5 line-clamp-1 block text-caption text-muted-foreground'>
                    {recommendation.reasonCodes
                      .map(code => t(`reason.${code}` as MessageKey))
                      .join(' · ') || t('explorer.nearbyInfo')}
                  </span>
                  {recommendation.warningCodes.length > 0 && (
                    <span className='mt-0.5 line-clamp-1 block text-caption text-warning-soft-foreground'>
                      {t('explorer.check', {
                        warning: t(`warning.${recommendation.warningCodes[0]}` as MessageKey),
                      })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {recommendations.length === 0 && (
          <li className='rounded-lg bg-muted px-3 py-4 text-center text-body-sm text-muted-foreground'>
            {t('explorer.noRecommendations')}
          </li>
        )}
      </ul>
    </section>
  );
}
