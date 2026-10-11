'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { EngagementPlaceSummary } from '../../model/types';
import { toPlaceSummary } from '../../model/types';
import type { EngagementActions } from '../hooks/useEngagementActions';
import type { EngagementData } from '../hooks/useEngagementData';
import { AlertRules } from './AlertRules';
import { RecentPlaces } from './RecentPlaces';
import { SavedPlaces } from './SavedPlaces';
import { Zones } from './Zones';

interface AccountViewProps {
  userName: string;
  data: EngagementData;
  actions: EngagementActions;
  onPlaceSelect?: (place: EngagementPlaceSummary) => void;
}

/** 로그인 사용자의 본문: 인사·안내·네 섹션 */
export function AccountView({ userName, data, actions, onPlaceSelect }: AccountViewProps) {
  const { t } = useI18n();
  const busy = data.isLoading || data.isMutating;

  return (
    <div className='space-y-6 p-4'>
      <div className='flex items-center justify-between gap-2 rounded-lg bg-accent px-3 py-2 text-accent-foreground'>
        <p className='min-w-0 truncate text-body-sm'>
          {t('engagement.greeting', { name: userName })}
        </p>
        <Button type='button' variant='ghost' size='sm' onClick={data.load} disabled={busy}>
          <RefreshCw aria-hidden='true' />
          {t('engagement.refresh')}
        </Button>
      </div>

      {data.notice?.kind === 'error' && (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
            <span>{t(data.notice.key)}</span>
            <Button type='button' variant='outline' size='sm' onClick={data.load} disabled={busy}>
              {t('engagement.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {data.notice?.kind === 'success' && (
        <p
          className='rounded-lg bg-success-soft px-3 py-2 text-body-sm text-success-soft-foreground'
          role='status'
        >
          {t(data.notice.key)}
        </p>
      )}
      {data.isLoading && (
        <p
          className='flex items-center justify-center gap-2 py-6 text-body-sm text-muted-foreground'
          role='status'
        >
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          {t('engagement.loading')}
        </p>
      )}

      <SavedPlaces
        headingId='favorite-places-title'
        places={data.favorites.map(toPlaceSummary)}
        isLoading={data.isLoading}
        isMutating={data.isMutating}
        onPlaceSelect={onPlaceSelect}
        onRemove={actions.removeFavorite}
      />

      <RecentPlaces
        headingId='recent-places-title'
        places={data.recentPlaces.map(place => ({
          ...toPlaceSummary(place),
          key: `recent:${place.id}`,
        }))}
        isLoading={data.isLoading}
        onPlaceSelect={onPlaceSelect}
      />

      <Zones
        headingId='saved-zones-title'
        zones={data.zones}
        isMutating={data.isMutating}
        onCreate={actions.createZone}
        onRecenter={actions.recenterZone}
        onDelete={actions.deleteZone}
      />

      <AlertRules
        headingId='alert-rules-title'
        zones={data.zones}
        subscriptions={data.subscriptions}
        isMutating={data.isMutating}
        evaluation={data.evaluation}
        onCreate={actions.createRule}
        onToggle={actions.toggleRule}
        onDelete={actions.deleteRule}
        onEvaluate={actions.evaluate}
      />
    </div>
  );
}
