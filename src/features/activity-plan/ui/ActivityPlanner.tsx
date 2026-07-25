'use client';

import React from 'react';
import { CalendarClock, ChevronRight, Route } from 'lucide-react';
import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { createActivityPlan } from '../lib/activity-plan-engine';
import type {
  ActivityBudgetMinutes,
  ActivityPlan,
} from '../model/types';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface ActivityPlannerProps {
  facilities: Facility[];
  origin: Position;
  preferredCategories?: FacilityCategory[];
  weather?: WeatherData | null;
  congestion?: CongestionData | null;
  onStopSelect: (facility: Facility) => void;
}

const BUDGETS: ActivityBudgetMinutes[] = [30, 60, 90, 120, 180];

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
    <section className='mt-3 border-t border-gray-100 pt-3' aria-labelledby='activity-plan-title'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h3
            id='activity-plan-title'
            className='flex items-center gap-1.5 text-xs font-semibold text-gray-800'
          >
            <Route className='h-3.5 w-3.5 text-emerald-600' aria-hidden='true' />
            {t('activity.title')}
          </h3>
          <p className='mt-0.5 text-[11px] text-gray-600'>
            {t('activity.description')}
          </p>
        </div>
        <div className='flex items-center gap-1.5'>
          <label htmlFor='activity-budget' className='sr-only'>
            {t('activity.budget')}
          </label>
          <select
            id='activity-budget'
            value={budget}
            onChange={event => {
              setBudget(Number(event.target.value) as ActivityBudgetMinutes);
              setPlan(null);
              setHasTried(false);
            }}
            className='h-8 rounded-md border border-gray-300 bg-white px-2 text-xs'
          >
            {BUDGETS.map(minutes => (
              <option key={minutes} value={minutes}>
                {minutes < 60
                  ? t('activity.minutes', { value: minutes })
                  : t('activity.hours', { value: minutes / 60 })}
              </option>
            ))}
          </select>
          <Button type='button' size='sm' className='h-8 text-xs' onClick={generate}>
            {t('activity.create')}
          </Button>
        </div>
      </div>

      <div className='mt-2' aria-live='polite'>
        {plan ? (
          <div className='rounded-xl border border-emerald-100 bg-emerald-50/60 p-3'>
            <p className='flex items-center gap-1.5 text-xs font-semibold text-emerald-900'>
              <CalendarClock className='h-3.5 w-3.5' aria-hidden='true' />
              {t('activity.summary', {
                budget: plan.budgetMinutes,
                count: plan.stops.length,
                travel: plan.travelMinutes,
                stay: plan.stayMinutes,
              })}
            </p>
            <ol className='mt-2 space-y-2'>
              {plan.stops.map(stop => (
                <li key={`${stop.order}:${stop.facility.category}:${stop.facility.id}`}>
                  <button
                    type='button'
                    onClick={() => onStopSelect(stop.facility)}
                    className='flex w-full items-center gap-2 rounded-lg bg-white p-2 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600'
                  >
                    <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white'>
                      {stop.order}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-xs font-semibold text-gray-900'>
                        {stop.facility.name}
                      </span>
                      <span className='block text-[11px] text-gray-600'>
                        {t('activity.stop', {
                          travel: stop.travelMinutes,
                          stay: stop.stayMinutes,
                        })}
                      </span>
                    </span>
                    <ChevronRight className='h-4 w-4 text-gray-500' aria-hidden='true' />
                  </button>
                </li>
              ))}
            </ol>
            <p className='mt-2 text-[11px] leading-4 text-amber-800'>
              {t('activity.warning')}
            </p>
          </div>
        ) : hasTried ? (
          <p className='rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-600'>
            {t('activity.empty')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
