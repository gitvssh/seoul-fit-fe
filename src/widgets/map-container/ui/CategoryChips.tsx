'use client';

import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { FACILITY_CATEGORIES, type FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

interface CategoryChipsProps {
  counts: Partial<Record<FacilityCategory, number>>;
  activeCategories: FacilityCategory[];
  onToggle: (category: FacilityCategory) => void;
  className?: string;
}

const ORDER = Object.values(FACILITY_CATEGORIES) as FacilityCategory[];

/**
 * 장소 종류 토글 칩. 라벨은 상태와 무관하게 고정하고 선택은 색·체크·aria-pressed로 전달한다.
 * 가로 스크롤 행은 가장자리를 페이드하고, 선택한 칩은 보이는 위치로 스크롤한다.
 */
export function CategoryChips({
  counts,
  activeCategories,
  onToggle,
  className,
}: Readonly<CategoryChipsProps>) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLFieldSetElement>(null);
  const lastToggledRef = useRef<FacilityCategory | null>(null);

  useEffect(() => {
    const category = lastToggledRef.current;
    if (!category || !rowRef.current) return;
    const chip = rowRef.current.querySelector<HTMLElement>(`[data-category="${category}"]`);
    chip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    lastToggledRef.current = null;
  }, [activeCategories]);

  return (
    <fieldset
      ref={rowRef}
      aria-label={t('map.chipsLabel')}
      className={cn(
        'min-w-0 pointer-events-none flex snap-x gap-2 overflow-x-auto px-3 py-2 scrollbar-none edge-fade-x',
        className
      )}
    >
      {ORDER.map(category => {
        const config = FACILITY_CONFIGS[category];
        const Icon = config.Icon;
        const isActive = activeCategories.includes(category);
        const count = counts[category] ?? 0;
        return (
          <button
            key={category}
            type='button'
            data-category={category}
            aria-pressed={isActive}
            onClick={() => {
              lastToggledRef.current = category;
              onToggle(category);
            }}
            className={cn(
              'pointer-events-auto flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border pl-1.5 pr-3 text-label shadow-float-sm outline-none transition-colors duration-fast ease-standard focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive
                ? 'border-transparent bg-surface-elevated text-surface-elevated-foreground'
                : 'border-border bg-surface-elevated/85 text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full',
                isActive ? config.color : 'bg-muted'
              )}
              style={
                isActive && config.glyph === 'ink' ? { color: 'hsl(var(--marker-ink))' } : undefined
              }
            >
              {isActive ? (
                <Icon
                  className={cn('size-3.5', config.glyph === 'white' && 'text-white')}
                  aria-hidden='true'
                />
              ) : (
                <Icon className='size-3.5 text-muted-foreground' aria-hidden='true' />
              )}
            </span>
            <span>{t(`category.${category}` as MessageKey)}</span>
            {count > 0 && (
              <span className='tabular-nums text-caption text-muted-foreground'>{count}</span>
            )}
            {isActive && <Check className='size-3.5 text-primary' aria-hidden='true' />}
          </button>
        );
      })}
    </fieldset>
  );
}
