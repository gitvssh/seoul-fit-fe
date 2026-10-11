'use client';

import React from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import type { AlertEvaluation, AlertRuleType, AlertSubscription, SavedZone } from '../../model/types';
import { EmptyState, SectionHeading } from './primitives';

interface AlertRulesProps {
  headingId: string;
  zones: SavedZone[];
  subscriptions: AlertSubscription[];
  isMutating: boolean;
  evaluation: AlertEvaluation | null;
  onCreate: (zoneId: number, alertType: AlertRuleType, quietHours: boolean) => void;
  onToggle: (subscription: AlertSubscription, active: boolean) => void;
  onDelete: (subscription: AlertSubscription) => void;
  onEvaluate: () => void;
}

export const ALERT_TYPES: AlertRuleType[] = [
  'AIR_QUALITY',
  'EXTREME_HEAT',
  'HEAVY_RAIN',
  'BIKE_SHORTAGE',
  'BIKE_FULL',
  'CULTURAL_EVENT',
  'RESERVATION_OPEN',
];

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-input/70 bg-card px-2 text-body-sm text-foreground shadow-sm outline-none transition-[color,box-shadow] duration-fast focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

const useAlertTypeLabel = () => {
  const { t } = useI18n();
  return (type: AlertRuleType) => t(`engagement.alertType.${type}` as MessageKey);
};

function AlertRuleForm({
  zones,
  isMutating,
  onCreate,
}: Pick<AlertRulesProps, 'zones' | 'isMutating' | 'onCreate'>) {
  const { t } = useI18n();
  const typeLabel = useAlertTypeLabel();
  const [selectedZoneId, setSelectedZoneId] = React.useState<number | null>(null);
  const [alertType, setAlertType] = React.useState<AlertRuleType>('AIR_QUALITY');
  const [quietHours, setQuietHours] = React.useState(true);
  const zoneId =
    selectedZoneId !== null && zones.some(zone => zone.id === selectedZoneId)
      ? selectedZoneId
      : zones.length > 0
        ? zones[0].id
        : null;

  return (
    <div className='mt-2 space-y-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <Label className='sr-only' htmlFor='alert-zone'>
            {t('engagement.alertZone')}
          </Label>
          <select
            id='alert-zone'
            value={zoneId ?? ''}
            onChange={event => setSelectedZoneId(Number(event.target.value))}
            className={SELECT_CLASS}
          >
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className='sr-only' htmlFor='alert-type'>
            {t('engagement.alertCondition')}
          </Label>
          <select
            id='alert-type'
            value={alertType}
            onChange={event => setAlertType(event.target.value as AlertRuleType)}
            className={SELECT_CLASS}
          >
            {ALERT_TYPES.map(type => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className='flex min-h-11 items-center gap-2'>
        <Checkbox
          id='alert-quiet-hours'
          checked={quietHours}
          onCheckedChange={checked => setQuietHours(checked === true)}
        />
        <Label htmlFor='alert-quiet-hours' className='text-body-sm font-normal'>
          {t('engagement.alertQuietHours')}
        </Label>
      </div>
      <Button
        type='button'
        className='w-full'
        variant='outline'
        disabled={isMutating || zoneId === null}
        onClick={() => zoneId !== null && onCreate(zoneId, alertType, quietHours)}
      >
        {t('engagement.alertAdd')}
      </Button>
    </div>
  );
}

function SubscriptionRow({
  subscription,
  zones,
  isMutating,
  onToggle,
  onDelete,
}: Pick<AlertRulesProps, 'zones' | 'isMutating' | 'onToggle' | 'onDelete'> & {
  subscription: AlertSubscription;
}) {
  const { t } = useI18n();
  const typeLabel = useAlertTypeLabel();
  const switchId = `alert-active-${subscription.id}`;
  const quiet =
    subscription.quietStart && subscription.quietEnd
      ? t('engagement.alertQuiet', { start: subscription.quietStart, end: subscription.quietEnd })
      : t('engagement.alertQuietNone');

  return (
    <Card className='flex-row items-center gap-2 py-2 pl-3 pr-1'>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-body-sm font-medium text-foreground'>
          {typeLabel(subscription.alertType)}
        </p>
        <p className='truncate text-caption tabular-nums text-muted-foreground'>
          {zones.find(zone => zone.id === subscription.zoneId)?.label ||
            t('engagement.alertZone')}{' '}
          · {quiet}
        </p>
      </div>
      <div className='flex min-h-11 items-center gap-2 px-1'>
        <Label htmlFor={switchId} className='text-caption font-normal text-muted-foreground'>
          {subscription.active ? t('engagement.alertOn') : t('engagement.alertOff')}
        </Label>
        <Switch
          id={switchId}
          checked={subscription.active}
          disabled={isMutating}
          aria-label={`${typeLabel(subscription.alertType)} ${t('engagement.alertActive')}`}
          onCheckedChange={checked => onToggle(subscription, checked)}
        />
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon-lg'
        disabled={isMutating}
        onClick={() => onDelete(subscription)}
        aria-label={t('engagement.alertDelete', { type: typeLabel(subscription.alertType) })}
      >
        <Trash2 aria-hidden='true' />
      </Button>
    </Card>
  );
}

export function AlertRules({
  headingId,
  zones,
  subscriptions,
  isMutating,
  evaluation,
  onCreate,
  onToggle,
  onDelete,
  onEvaluate,
}: AlertRulesProps) {
  const { t } = useI18n();

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} icon={BellRing} title={t('engagement.alertsTitle')} />

      {zones.length > 0 ? (
        <AlertRuleForm zones={zones} isMutating={isMutating} onCreate={onCreate} />
      ) : (
        <EmptyState className='mt-2'>{t('engagement.alertNeedsZone')}</EmptyState>
      )}

      <ul className='mt-2 space-y-2'>
        {subscriptions.map(subscription => (
          <li key={subscription.id}>
            <SubscriptionRow
              subscription={subscription}
              zones={zones}
              isMutating={isMutating}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
      {zones.length > 0 && subscriptions.length === 0 && (
        <EmptyState className='mt-2'>{t('engagement.alertsEmpty')}</EmptyState>
      )}

      {subscriptions.length > 0 && (
        <Button
          type='button'
          variant='outline'
          className='mt-3 w-full'
          disabled={isMutating}
          onClick={onEvaluate}
        >
          {t('engagement.alertEvaluate')}
        </Button>
      )}
      {evaluation && (
        <p className='mt-2 text-caption tabular-nums text-muted-foreground' role='status'>
          {t('engagement.alertEvaluation', {
            evaluated: evaluation.evaluated,
            generated: evaluation.generated,
            deferred: evaluation.deferred,
          })}
        </p>
      )}
      <p className='mt-2 text-caption text-muted-foreground'>{t('engagement.alertChannelNote')}</p>
    </section>
  );
}
