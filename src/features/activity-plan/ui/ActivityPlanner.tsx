'use client';

import React from 'react';
import { CalendarClock, ChevronRight, Info, Route } from 'lucide-react';
import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { FACILITY_CONFIGS, MARKER_GLYPH_COLOR } from '@/shared/lib/icons/facility';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { createActivityPlan } from '../lib/activity-plan-engine';
import type {
  ActivityBudgetMinutes,
  ActivityPlan,
  ActivityPlanStop,
  ActivityPlanWarningCode,
} from '../model/types';

interface ActivityPlannerProps {
  facilities: Facility[];
  /** 출발점. 탐색 패널은 지도 중심을 넘긴다. */
  origin: Position;
  preferredCategories?: FacilityCategory[];
  weather?: WeatherData | null;
  congestion?: CongestionData | null;
  onStopSelect: (facility: Facility) => void;
}

const BUDGETS: ActivityBudgetMinutes[] = [30, 60, 90, 120, 180];

const WARNING_KEYS: Record<ActivityPlanWarningCode, MessageKey> = {
  straight_line_estimate: 'activity.warning',
  hours_unknown: 'activity.warningHours',
};

function StopItem({
  stop,
  index,
  onSelect,
}: {
  stop: ActivityPlanStop;
  index: number;
  onSelect: (facility: Facility) => void;
}) {
  const { t } = useI18n();
  const config = FACILITY_CONFIGS[stop.facility.category];
  const Icon = config.Icon;

  return (
    <li
      className='flex gap-2 animate-fade-up'
      style={{ animationDelay: `${Math.min(index, 7) * 30}ms` }}
    >
      <span className='w-14 shrink-0 pt-3 text-right text-caption font-medium tabular-nums text-muted-foreground'>
        {t('activity.arrival', { minutes: stop.arrivalOffsetMinutes })}
      </span>
      <button
        type='button'
        onClick={() => onSelect(stop.facility)}
        aria-label={t('activity.stopSelect', { order: stop.order, name: stop.facility.name })}
        className='flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-float-sm outline-none transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
      >
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            config.color
          )}
          style={{ color: MARKER_GLYPH_COLOR[config.glyph] }}
          aria-hidden='true'
        >
          <Icon className='size-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-body-sm font-semibold text-foreground'>
            {stop.order}. {stop.facility.name}
          </span>
          <span className='block truncate text-caption tabular-nums text-muted-foreground'>
            {t(`category.${stop.facility.category}` as MessageKey)} ·{' '}
            {t('activity.stop', { travel: stop.travelMinutes, stay: stop.stayMinutes })}
          </span>
        </span>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
      </button>
    </li>
  );
}

export function ActivityPlanner({
  facilities,
  origin,
  preferredCategories,
  weather,
  congestion,
  onStopSelect,
}: ActivityPlannerProps) {
  const { t } = useI18n();
  const [budget, setBudget] = React.useState<ActivityBudgetMinutes>(90);
  const [plan, setPlan] = React.useState<ActivityPlan | null>(null);
  const [hasTried, setHasTried] = React.useState(false);

  const budgetLabel = (minutes: ActivityBudgetMinutes) =>
    minutes < 60
      ? t('activity.minutes', { value: minutes })
      : t('activity.hours', { value: minutes / 60 });

  const selectBudget = (minutes: ActivityBudgetMinutes) => {
    setBudget(minutes);
    setPlan(null);
    setHasTried(false);
  };

  const generate = () => {
    const nextPlan = createActivityPlan(facilities, {
      origin,
      budgetMinutes: budget,
      preferredCategories,
      now: new Date(),
      weather,
      congestion,
    });
    setPlan(nextPlan);
    setHasTried(true);
    if (nextPlan) {
      trackEvent('activity_plan_created', {
        duration_bucket: `${budget}m`,
        stop_count: String(nextPlan.stops.length),
      });
    }
  };

  return (
    <section className='mt-3 border-t border-border pt-3' aria-labelledby='activity-plan-title'>
      <h3 id='activity-plan-title' className='flex items-center gap-1.5 text-section'>
        <Route className='size-4 text-primary' aria-hidden='true' />
        {t('activity.title')}
      </h3>
      <p className='mt-0.5 text-caption text-muted-foreground'>{t('activity.description')}</p>

      <div className='mt-2 flex items-center gap-2'>
        <div
          role='group'
          aria-label={t('activity.budget')}
          className='flex min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-none'
        >
          {BUDGETS.map(minutes => {
            const selected = budget === minutes;
            return (
              <button
                key={minutes}
                type='button'
                aria-pressed={selected}
                onClick={() => selectBudget(minutes)}
                className={cn(
                  'h-9 shrink-0 rounded-md border px-3 text-label tabular-nums outline-none transition-colors duration-fast ease-standard focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input/60 bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {budgetLabel(minutes)}
              </button>
            );
          })}
        </div>
        <Button type='button' size='default' className='shrink-0' onClick={generate}>
          {plan ? t('activity.recreate') : t('activity.create')}
        </Button>
      </div>

      <div className='mt-3' aria-live='polite'>
        {plan ? (
          <div className='rounded-lg border border-border bg-card p-3 shadow-float-sm'>
            <p className='flex items-center gap-1.5 text-body-sm font-semibold tabular-nums text-foreground'>
              <CalendarClock className='size-4 shrink-0 text-primary' aria-hidden='true' />
              {t('activity.summary', {
                budget: plan.budgetMinutes,
                count: plan.stops.length,
                travel: plan.travelMinutes,
                stay: plan.stayMinutes,
              })}
            </p>
            <ol className='mt-3 space-y-2' aria-label={t('activity.result')}>
              {plan.stops.map((stop, index) => (
                <StopItem
                  key={`${stop.order}:${stop.facility.category}:${stop.facility.id}`}
                  stop={stop}
                  index={index}
                  onSelect={onStopSelect}
                />
              ))}
            </ol>
            <ul className='mt-3 space-y-1'>
              {plan.warningCodes.map(code => (
                <li key={code} className='flex gap-1.5 text-caption text-muted-foreground'>
                  <Info className='mt-0.5 size-3.5 shrink-0' aria-hidden='true' />
                  <span>{t(WARNING_KEYS[code])}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : hasTried ? (
          <p className='rounded-lg bg-muted px-3 py-4 text-center text-body-sm text-muted-foreground'>
            {t('activity.empty')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
