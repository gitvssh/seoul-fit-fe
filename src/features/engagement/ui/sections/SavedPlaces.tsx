'use client';

import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import type { EngagementPlaceSummary } from '../../model/types';
import { EmptyState, PlaceLink, SectionHeading } from './primitives';

interface SavedPlacesProps {
  headingId: string;
  titleKey?: MessageKey;
  places: EngagementPlaceSummary[];
  isLoading?: boolean;
  isMutating?: boolean;
  onRemove?: (place: EngagementPlaceSummary) => void;
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}

const MAX_VISIBLE = 20;

export function SavedPlaces({
  headingId,
  titleKey = 'engagement.savedTitle',
  places,
  isLoading = false,
  isMutating = false,
  onRemove,
  onPlaceSelect,
}: SavedPlacesProps) {
  const { t } = useI18n();

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} icon={Bookmark} title={t(titleKey)} count={places.length} />
      <ul className='mt-2 space-y-2'>
        {places.slice(0, MAX_VISIBLE).map(place => (
          <li key={place.key}>
            <Card className='flex-row items-center gap-2 py-2 pl-3 pr-1'>
              <PlaceLink
                place={place}
                caption={place.address || t('engagement.addressUnknown')}
                onSelect={onPlaceSelect}
              />
              {onRemove && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-lg'
                  disabled={isMutating}
                  onClick={() => onRemove(place)}
                  aria-label={t('engagement.removeSaved', { name: place.name })}
                >
                  <Trash2 aria-hidden='true' />
                </Button>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {!isLoading && places.length === 0 && (
        <EmptyState className='mt-2'>{t('engagement.savedEmpty')}</EmptyState>
      )}
    </section>
  );
}
