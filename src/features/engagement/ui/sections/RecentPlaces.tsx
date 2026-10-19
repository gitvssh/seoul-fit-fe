'use client';

import React from 'react';
import { Clock3 } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { koMessages, type MessageKey } from '@/shared/i18n/messages';
import type { EngagementPlaceSummary } from '../../model/types';
import { EmptyState, PlaceLink, SectionHeading } from './primitives';

interface RecentPlacesProps {
  headingId: string;
  places: EngagementPlaceSummary[];
  isLoading?: boolean;
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}

const MAX_VISIBLE = 10;

export function RecentPlaces({
  headingId,
  places,
  isLoading = false,
  onPlaceSelect,
}: Readonly<RecentPlacesProps>) {
  const { t } = useI18n();
  // 서버가 돌려주는 category 문자열이 사전에 없으면 원문을 그대로 보여 준다.
  const categoryLabel = (category: string) => {
    const key = `category.${category}`;
    return key in koMessages ? t(key as MessageKey) : category;
  };

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} icon={Clock3} title={t('engagement.recentTitle')} />
      {places.length > 0 && (
        <ul className='mt-2 flex gap-2 overflow-x-auto pb-1 edge-fade-x scrollbar-none snap-x'>
          {places.slice(0, MAX_VISIBLE).map(place => (
            <li key={place.key} className='w-40 shrink-0 snap-start'>
              <Card className='py-2 px-3'>
                <PlaceLink
                  place={place}
                  caption={categoryLabel(place.category)}
                  onSelect={onPlaceSelect}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && places.length === 0 && (
        <EmptyState className='mt-2'>{t('engagement.recentEmpty')}</EmptyState>
      )}
    </section>
  );
}
