'use client';

import React from 'react';

import type { FacilityCategory } from '@/lib/types';
import { FACILITY_CATEGORIES } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { FACILITY_CONFIGS, MARKER_GLYPH_COLOR } from '@/shared/lib/icons/facility';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { SidebarSection } from './SidebarSection';

/** 설정 메뉴에서 켜고 끌 수 있는 카테고리와 표시 순서. */
export const SIDEBAR_CATEGORIES: readonly FacilityCategory[] = [
  FACILITY_CATEGORIES.SUBWAY,
  FACILITY_CATEGORIES.BIKE,
  FACILITY_CATEGORIES.LIBRARY,
  FACILITY_CATEGORIES.PARK,
  FACILITY_CATEGORIES.COOLING_SHELTER,
  FACILITY_CATEGORIES.CULTURE,
  FACILITY_CATEGORIES.CULTURAL_EVENT,
  FACILITY_CATEGORIES.CULTURAL_RESERVATION,
];

interface MarkerSectionProps {
  activeCategories: FacilityCategory[];
  onCategoryToggle: (type: FacilityCategory) => void;
}

interface MarkerRowProps {
  category: FacilityCategory;
  checked: boolean;
  onToggle: (category: FacilityCategory) => void;
}

function MarkerRow({ category, checked, onToggle }: Readonly<MarkerRowProps>) {
  const { t } = useI18n();
  const config = FACILITY_CONFIGS[category];
  const Icon = config.Icon;
  const id = `sidebar-category-${category}`;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <div className='flex min-h-11 items-center gap-3 px-4 transition-colors duration-fast hover:bg-accent/50'>
      <label htmlFor={id} className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2'>
        <span
          aria-hidden='true'
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            config.color
          )}
          style={{ color: MARKER_GLYPH_COLOR[config.glyph] }}
        >
          <Icon className='size-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span id={labelId} className='block truncate text-body font-medium text-foreground'>
            {t(`category.${category}` as MessageKey)}
          </span>
          <span id={descriptionId} className='block text-caption text-muted-foreground'>
            {t(`categoryDescription.${category}` as MessageKey)}
          </span>
        </span>
      </label>
      <Checkbox
        id={id}
        className='size-5'
        checked={checked}
        onCheckedChange={() => onToggle(category)}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      />
    </div>
  );
}

export function MarkerSection({ activeCategories, onCategoryToggle }: Readonly<MarkerSectionProps>) {
  const { t } = useI18n();
  const selected = SIDEBAR_CATEGORIES.filter(category => activeCategories.includes(category));
  const allSelected = selected.length === SIDEBAR_CATEGORIES.length;
  const noneSelected = selected.length === 0;

  const selectAll = () => {
    SIDEBAR_CATEGORIES.filter(category => !activeCategories.includes(category)).forEach(category =>
      onCategoryToggle(category)
    );
  };
  const clearAll = () => {
    selected.forEach(category => onCategoryToggle(category));
  };

  return (
    <SidebarSection
      id='sidebar-markers'
      title={t('sidebar.markers')}
      aside={
        <p className='text-caption tabular-nums text-muted-foreground' aria-live='polite'>
          {t('sidebar.selected', { count: selected.length })}
        </p>
      }
    >
      <p className='px-4 pb-1 text-body-sm text-muted-foreground'>{t('sidebar.description')}</p>
      <div className='flex gap-1 px-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-11 px-3'
          onClick={selectAll}
          disabled={allSelected}
        >
          {t('sidebar.selectAll')}
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-11 px-3'
          onClick={clearAll}
          disabled={noneSelected}
        >
          {t('sidebar.clearAll')}
        </Button>
      </div>
      <div>
        {SIDEBAR_CATEGORIES.map(category => (
          <MarkerRow
            key={category}
            category={category}
            checked={activeCategories.includes(category)}
            onToggle={onCategoryToggle}
          />
        ))}
      </div>
    </SidebarSection>
  );
}
