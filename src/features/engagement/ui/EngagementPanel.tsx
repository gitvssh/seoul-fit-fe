'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useAuthStore } from '@/shared/model/authStore';
import { useFocusTrap } from '@/shared/lib/hooks/useFocusTrap';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { EngagementPlaceSummary } from '../model/types';
import { useEngagementActions } from './hooks/useEngagementActions';
import { useEngagementData } from './hooks/useEngagementData';
import { AccountView } from './sections/AccountView';
import { GuestWelcome } from './sections/GuestWelcome';

export interface EngagementPanelProps {
  isOpen: boolean;
  /** 생활권 저장의 중심. 지도 중심 또는 사용자 위치 */
  currentLocation: { lat: number; lng: number };
  onClose: () => void;
  /** 비로그인 상태의 인라인 카카오 로그인 CTA. 없으면 버튼을 숨긴다 */
  onLogin?: () => void;
  /** 저장·최근 장소를 누르면 지도를 옮긴다. 없으면 `/?lat=&lng=` 딥링크를 쓴다 */
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}

function AccountSection({
  token,
  currentLocation,
  onPlaceSelect,
}: {
  token: string;
  currentLocation: { lat: number; lng: number };
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}) {
  const { t } = useI18n();
  const user = useAuthStore(state => state.user);
  const data = useEngagementData({ accessToken: token, enabled: true });
  const actions = useEngagementActions({
    token,
    userId: user?.id ?? null,
    currentLocation,
    data,
  });

  return (
    <AccountView
      userName={user?.nickname || t('engagement.defaultUser')}
      data={data}
      actions={actions}
      onPlaceSelect={onPlaceSelect}
    />
  );
}

/**
 * "내 생활" 패널. 비로그인에는 로그인 벽 대신 가치 설명 + 인라인 카카오 로그인 +
 * 이 기기에 저장한 장소를, 로그인에는 저장·최근·생활권·알림 섹션을 보여 준다.
 */
export function EngagementPanel({
  isOpen,
  currentLocation,
  onClose,
  onLogin,
  onPlaceSelect,
}: EngagementPanelProps) {
  const { t } = useI18n();
  const { isAuthenticated, accessToken } = useAuthStore();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const token = isAuthenticated && accessToken ? accessToken : null;

  useFocusTrap(panelRef, isOpen, onClose, closeButtonRef);

  if (!isOpen) return null;

  const handlePlaceSelect = onPlaceSelect
    ? (place: EngagementPlaceSummary) => {
        onPlaceSelect(place);
        onClose();
      }
    : undefined;

  return (
    <>
      <button
        type='button'
        className='fixed inset-0 z-sidebar cursor-default bg-scrim/40'
        onClick={onClose}
        aria-label={t('engagement.close')}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
        aria-labelledby='engagement-panel-title'
        className='fixed inset-y-0 right-0 z-sidebar flex w-full max-w-md flex-col bg-card text-card-foreground shadow-float-lg'
      >
        <div className='flex items-center justify-between gap-3 border-b border-border px-4 py-3'>
          <div className='min-w-0'>
            <h2 id='engagement-panel-title' className='text-title text-foreground'>
              {t('engagement.title')}
            </h2>
            <p className='text-caption text-muted-foreground'>{t('engagement.subtitle')}</p>
          </div>
          <Button
            ref={closeButtonRef}
            type='button'
            variant='ghost'
            size='icon-lg'
            onClick={onClose}
            aria-label={t('engagement.close')}
          >
            <X className='size-5' aria-hidden='true' />
          </Button>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {token === null ? (
            <GuestWelcome onLogin={onLogin} onPlaceSelect={handlePlaceSelect} />
          ) : (
            <AccountSection
              token={token}
              currentLocation={currentLocation}
              onPlaceSelect={handlePlaceSelect}
            />
          )}
        </div>
      </aside>
    </>
  );
}
