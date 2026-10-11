'use client';

import React from 'react';
import { RECOMMENDATION_PRESETS } from '@/features/recommendation/lib/recommendation-engine';
import type { RecommendationPreset } from '@/features/recommendation/model/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { cn } from '@/shared/lib/utils';

interface PresetChipsProps {
  activePreset: RecommendationPreset;
  onPresetChange: (preset: RecommendationPreset) => void;
  className?: string;
}

/** 상황 프리셋 6개. 라벨 고정, 선택은 색 + aria-pressed. */
export function PresetChips({ activePreset, onPresetChange, className }: PresetChipsProps) {
  const { t } = useI18n();
  return (
    <div
      role='group'
      aria-label={t('explorer.presetsLabel')}
      className={cn('flex snap-x gap-2 overflow-x-auto py-1 scrollbar-none edge-fade-x', className)}
    >
      {RECOMMENDATION_PRESETS.map(preset => {
        const active = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            type='button'
            aria-pressed={active}
            onClick={() => onPresetChange(preset.id)}
            className={cn(
              'h-9 shrink-0 snap-start rounded-full border px-3.5 text-label outline-none transition-colors duration-fast ease-standard focus-visible:ring-[3px] focus-visible:ring-ring/50',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {t(`preset.${preset.id}` as MessageKey)}
          </button>
        );
      })}
    </div>
  );
}
