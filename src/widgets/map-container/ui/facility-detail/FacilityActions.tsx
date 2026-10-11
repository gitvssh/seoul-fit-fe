'use client';

import React, { useCallback } from 'react';
import { Bookmark, ExternalLink, Navigation, Phone, Share2, TicketCheck } from 'lucide-react';
import type { Facility } from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { showToast } from '@/shared/lib/utils/toast';
import { useLocalFacilityFavorite } from '@/features/favorites/lib/useLocalFacilityFavorite';
import {
  getFacilityReservationUrl,
  getFacilityShareUrl,
  getKakaoDirectionsUrl,
  getSafeExternalUrl,
} from '@/entities/facility/lib/actions';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

type FacilityActionType = 'navigation' | 'phone' | 'website' | 'share' | 'reservation';

interface FacilityActionsProps {
  facility: Facility;
  /** 피크 상태에서는 주요 3개만 */
  compact?: boolean;
}

export function FacilityActions({ facility, compact = false }: FacilityActionsProps) {
  const { t } = useI18n();
  const {
    isFavorite,
    isSaving,
    error: favoriteError,
    toggleFavorite,
  } = useLocalFacilityFavorite(facility);
  const directionsUrl = getKakaoDirectionsUrl(facility);
  const reservationUrl = getFacilityReservationUrl(facility);
  const websiteUrl = getSafeExternalUrl(facility.website);

  const track = useCallback(
    (action: FacilityActionType) =>
      trackEvent('facility_action_clicked', { action_type: action, category: facility.category }),
    [facility.category]
  );

  const handleShare = useCallback(async () => {
    const url = getFacilityShareUrl(facility);
    try {
      if (navigator.share) {
        await navigator.share({ title: facility.name, text: `${facility.name}`, url });
        showToast(t('facility.shareDone'), 'success');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast(t('facility.linkCopied'), 'success');
      } else {
        showToast(t('facility.shareUnsupported'), 'warning');
        return;
      }
      track('share');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      showToast(t('facility.shareFailed'), 'error');
    }
  }, [facility, t, track]);

  const handleFavorite = useCallback(async () => {
    const next = await toggleFavorite();
    trackEvent('favorite_changed', {
      action_type: 'save',
      category: facility.category,
      favorite_state: next ? 'saved' : 'removed',
    });
  }, [facility.category, toggleFavorite]);

  const secondary = reservationUrl ? (
    <Button asChild variant='outline' className='h-11'>
      <a
        href={reservationUrl}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => track('reservation')}
      >
        <TicketCheck aria-hidden='true' />
        {t('facility.reservation')}
      </a>
    </Button>
  ) : websiteUrl ? (
    <Button asChild variant='outline' className='h-11'>
      <a
        href={websiteUrl}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => track('website')}
      >
        <ExternalLink aria-hidden='true' />
        {t('facility.website')}
      </a>
    </Button>
  ) : facility.phone ? (
    <Button asChild variant='outline' className='h-11'>
      <a href={`tel:${facility.phone}`} onClick={() => track('phone')}>
        <Phone aria-hidden='true' />
        {t('facility.phoneAction')}
      </a>
    </Button>
  ) : null;

  return (
    <div>
      <div
        className={cn(
          'grid gap-2',
          compact ? 'grid-cols-3' : secondary ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
        )}
      >
        <Button asChild className='h-11'>
          <a
            href={directionsUrl}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => track('navigation')}
          >
            <Navigation aria-hidden='true' />
            {t('facility.directions')}
          </a>
        </Button>
        <Button type='button' variant='outline' className='h-11' onClick={handleShare}>
          <Share2 aria-hidden='true' />
          {t('facility.share')}
        </Button>
        <Button
          type='button'
          variant={isFavorite ? 'secondary' : 'outline'}
          className='h-11'
          aria-pressed={isFavorite}
          disabled={isSaving}
          onClick={handleFavorite}
        >
          <Bookmark className={cn(isFavorite && 'fill-current text-primary')} aria-hidden='true' />
          {isFavorite ? t('facility.saved') : t('facility.save')}
        </Button>
        {!compact && secondary}
      </div>
      {favoriteError && (
        <p className='mt-2 text-caption text-warning-soft-foreground' role='status'>
          {favoriteError}
        </p>
      )}
    </div>
  );
}
