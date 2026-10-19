'use client';

import React from 'react';
import { BellRing, Bookmark, Clock3 } from 'lucide-react';
import { KakaoLoginButton } from '@/shared/ui/kakao-login-button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import {
  readLocalFavorites,
  writeLocalFavorites,
  type LocalFavorite,
} from '@/features/favorites/model/local-favorites';
import type { EngagementPlaceSummary } from '../../model/types';
import { localFavoriteToSummary } from '../../model/types';
import { SavedPlaces } from './SavedPlaces';

interface GuestWelcomeProps {
  onLogin?: () => void;
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}

/**
 * 비로그인 본문. 로그인 벽 대신 가치 설명과 인라인 카카오 로그인, 그리고
 * 이 기기에 저장된 장소를 그대로 보여 준다. 패널이 열릴 때마다 새로 마운트되므로
 * 저장 목록은 마운트 시점에 한 번 읽는다.
 */
export function GuestWelcome({ onLogin, onPlaceSelect }: Readonly<GuestWelcomeProps>) {
  const { t } = useI18n();
  const [localFavorites, setLocalFavorites] = React.useState<LocalFavorite[]>(() =>
    readLocalFavorites()
  );
  const benefits = [
    { icon: Bookmark, text: t('engagement.guestBenefitSaved') },
    { icon: BellRing, text: t('engagement.guestBenefitZones') },
    { icon: Clock3, text: t('engagement.guestBenefitRecent') },
  ];

  const removeLocal = (place: EngagementPlaceSummary) => {
    const next = readLocalFavorites().filter(favorite => favorite.key !== place.key);
    writeLocalFavorites(next);
    setLocalFavorites(next);
  };

  return (
    <div className='space-y-6 p-4'>
      <section className='rounded-lg border border-border bg-card p-4 shadow-float-sm'>
        <h3 className='text-section text-foreground'>{t('engagement.guestTitle')}</h3>
        <ul className='mt-3 space-y-2'>
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className='flex items-start gap-2 text-body-sm text-foreground'>
              <Icon className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden='true' />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        {onLogin && (
          <div className='mt-4'>
            <KakaoLoginButton onClick={onLogin} />
          </div>
        )}
        <p className='mt-3 text-caption text-muted-foreground'>{t('engagement.guestLocalNote')}</p>
      </section>

      <SavedPlaces
        headingId='engagement-local-places-title'
        titleKey='engagement.localSavedTitle'
        places={localFavorites.map(localFavoriteToSummary)}
        onPlaceSelect={onPlaceSelect}
        onRemove={removeLocal}
      />
    </div>
  );
}
