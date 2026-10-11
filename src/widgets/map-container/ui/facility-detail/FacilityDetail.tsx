'use client';

import React, { useEffect, useId, useMemo, useRef } from 'react';
import type { Facility } from '@/lib/types';
import {
  getNearbyAlternatives,
  scoreFacility,
} from '@/features/recommendation/lib/recommendation-engine';
import type { FacilityRecommendation } from '@/features/recommendation/model/types';
import { markRecentlyViewed } from '@/features/engagement/api/engagement';
import { toEngagementPlaceRequest } from '@/features/engagement/model/types';
import { useAuthStore } from '@/shared/model/authStore';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { useFacilityContext } from '../providers/FacilityProvider';
import { useMapContext } from '../providers/MapProvider';
import { useExploreContext } from '../providers/ExploreProvider';
import { FacilityHeader } from './FacilityHeader';
import { FacilityActions } from './FacilityActions';
import { FacilityInfo } from './FacilityInfo';
import { FacilityLiveSection } from './FacilityLiveSection';
import { SubwayArrivals } from './SubwayArrivals';
import { FacilityAlternatives } from './FacilityAlternatives';

interface FacilityDetailProps {
  facility: Facility;
  onBack: () => void;
  /** 모바일 피크 상태: 머리글과 주요 행동만 */
  compact?: boolean;
}

export function FacilityDetail({ facility, onBack, compact = false }: FacilityDetailProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { facilities, selectFacility } = useFacilityContext();
  const { revealPosition } = useMapContext();
  const { live, origin, activePreset } = useExploreContext();
  const { isAuthenticated, accessToken } = useAuthStore();
  const lastRecordedRef = useRef<string | null>(null);

  const decision = useMemo(
    () =>
      scoreFacility(facility, {
        origin,
        now: new Date(),
        preset: activePreset,
        weather: live.weather.data,
        congestion: live.congestion.data,
      }),
    [activePreset, facility, live.congestion.data, live.weather.data, origin]
  );

  const alternatives = useMemo(
    () => getNearbyAlternatives(facility, facilities, { now: new Date(), preset: activePreset }, 3),
    [activePreset, facilities, facility]
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const request = toEngagementPlaceRequest(facility);
    if (lastRecordedRef.current === request.placeKey) return;
    lastRecordedRef.current = request.placeKey;
    void markRecentlyViewed(accessToken, request).catch(() => {
      lastRecordedRef.current = null;
    });
  }, [accessToken, facility, isAuthenticated]);

  const handleAlternative = (recommendation: FacilityRecommendation) => {
    selectFacility(recommendation.facility, 'recommendation');
    revealPosition(recommendation.facility.position, { minLevel: 4 });
  };

  return (
    <article aria-labelledby={titleId} className='flex flex-col gap-4 pt-1'>
      <FacilityHeader facility={facility} onBack={onBack} titleId={titleId} />
      <FacilityActions facility={facility} compact={compact} />
      {!compact && (
        <>
          <section
            className='rounded-lg bg-accent p-4 text-accent-foreground'
            aria-label={t('facility.decision')}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-caption font-medium'>{t('facility.decision')}</p>
                <p className='mt-0.5 text-body font-semibold'>
                  {decision.reasonCodes[0]
                    ? t(`reason.${decision.reasonCodes[0]}` as MessageKey)
                    : t('facility.genericDecision')}
                </p>
                {decision.reasonCodes.length > 1 && (
                  <p className='mt-1 text-caption'>
                    {decision.reasonCodes
                      .slice(1)
                      .map(code => t(`reason.${code}` as MessageKey))
                      .join(' · ')}
                  </p>
                )}
                {decision.warningCodes.length > 0 && (
                  <p className='mt-1 text-caption text-warning-soft-foreground'>
                    {t('explorer.check', {
                      warning: decision.warningCodes
                        .map(code => t(`warning.${code}` as MessageKey))
                        .join(' · '),
                    })}
                  </p>
                )}
              </div>
              <span className='shrink-0 rounded-md bg-card px-2.5 py-1 text-label tabular-nums text-primary shadow-float-sm'>
                {t('facility.scoreLabel', { score: decision.score })}
              </span>
            </div>
            <p className='mt-2 text-caption opacity-80'>{t('facility.referenceScore')}</p>
          </section>
          {facility.category === 'subway' && <SubwayArrivals stationName={facility.name} />}
          <FacilityLiveSection weather={live.weather} congestion={live.congestion} />
          <FacilityInfo facility={facility} />
          <FacilityAlternatives alternatives={alternatives} onSelect={handleAlternative} />
        </>
      )}
    </article>
  );
}
