'use client';

import { Bookmark, ListFilter, RotateCcw, Rows3, X } from 'lucide-react';
import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';
import { Button } from '@/shared/ui/button';
import type { PlaceFilterKey, PlaceFilterState } from '../model/types';
import type {
  FacilityRecommendation,
  RecommendationPreset,
} from '@/features/recommendation/model/types';
import { ActivityPlanner } from '@/features/activity-plan/ui/ActivityPlanner';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { SeoulNowCard } from './sections/SeoulNowCard';
import { PresetChips } from './sections/PresetChips';
import { FilterRow } from './sections/FilterRow';
import { RecommendationCards } from './sections/RecommendationCards';
import { PlaceList } from './sections/PlaceList';

export interface PlaceExplorerPanelProps {
  filters: PlaceFilterState;
  facilities: Facility[];
  selectedFacility: Facility | null;
  isListOpen: boolean;
  weatherData: WeatherData | null;
  congestionData: CongestionData | null;
  liveDataLoading: boolean;
  activePreset: RecommendationPreset;
  recommendations: FacilityRecommendation[];
  naturalLanguageSummaryKo: string | null;
  naturalLanguageSummaryEn: string | null;
  origin: Position;
  preferredCategories?: FacilityCategory[];
  selectedRegionCode: string;
  onRegionSelect: (regionCode: string) => void;
  onListOpenChange: (isOpen: boolean) => void;
  onFilterChange: (filters: PlaceFilterState, changedFilter: PlaceFilterKey, value: string) => void;
  onReset: () => void;
  onFacilitySelect: (facility: Facility) => void;
  onPresetChange: (preset: RecommendationPreset) => void;
  onRecommendationSelect: (recommendation: FacilityRecommendation) => void;
  onEngagementOpen: () => void;
  /** 모바일 피크 상태: 요약과 프리셋만 */
  compact?: boolean;
}

export function countActiveFilters(filters: PlaceFilterState): number {
  return (
    (filters.openOnly ? 1 : 0) +
    (filters.reservableOnly ? 1 : 0) +
    (filters.indoorOnly ? 1 : 0) +
    (filters.lowCongestionOnly ? 1 : 0) +
    (filters.maxDistanceKm === null ? 0 : 1) +
    filters.categories.length
  );
}

/**
 * 탐색 패널(표현 컴포넌트). 상태는 ExplorerPanelConnected가 주입한다.
 * 순서: 요약·행동 → 서울 지금 → 상황 프리셋 → 추천 → 상세 필터 → 활동 계획 → 목록.
 */
export function PlaceExplorerPanel({
  filters,
  facilities,
  selectedFacility,
  isListOpen,
  weatherData,
  congestionData,
  liveDataLoading,
  activePreset,
  recommendations,
  naturalLanguageSummaryKo,
  naturalLanguageSummaryEn,
  origin,
  preferredCategories,
  selectedRegionCode,
  onRegionSelect,
  onListOpenChange,
  onFilterChange,
  onReset,
  onFacilitySelect,
  onPresetChange,
  onRecommendationSelect,
  onEngagementOpen,
  compact = false,
}: PlaceExplorerPanelProps) {
  const { locale, t } = useI18n();
  const activeFilterCount = countActiveFilters(filters);
  const naturalLanguageSummary =
    locale === 'en' ? naturalLanguageSummaryEn : naturalLanguageSummaryKo;

  return (
    <section aria-label={t('explorer.label')} className='flex flex-col gap-3 pt-1'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='flex min-w-0 items-center gap-1.5 text-body font-semibold'>
          <ListFilter className='size-4 shrink-0 text-primary' aria-hidden='true' />
          <output className='truncate'>
            {activeFilterCount > 0
              ? t('explorer.summary', { count: facilities.length, filters: activeFilterCount })
              : t('explorer.inView', { count: facilities.length })}
          </output>
        </h2>
        <div className='flex shrink-0 items-center gap-1'>
          <Button type='button' variant='outline' size='sm' onClick={onEngagementOpen}>
            <Bookmark aria-hidden='true' />
            {t('explorer.myLife')}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onReset}
              aria-label={t('explorer.resetLabel')}
            >
              <RotateCcw aria-hidden='true' />
              {t('explorer.reset')}
            </Button>
          )}
          {!compact && (
            <Button
              type='button'
              variant={isListOpen ? 'secondary' : 'outline'}
              size='sm'
              onClick={() => onListOpenChange(!isListOpen)}
              aria-expanded={isListOpen}
              aria-controls='map-place-list'
            >
              {isListOpen ? <X aria-hidden='true' /> : <Rows3 aria-hidden='true' />}
              {isListOpen ? t('explorer.closeList') : t('explorer.openList')}
            </Button>
          )}
        </div>
      </div>

      <PresetChips activePreset={activePreset} onPresetChange={onPresetChange} />

      {compact ? null : (
        <>
          {naturalLanguageSummary && (
            <output className='block rounded-md bg-accent px-3 py-2 text-caption text-accent-foreground'>
              {t('explorer.ruleApplied', { summary: naturalLanguageSummary })}
            </output>
          )}

          <SeoulNowCard
            weatherData={weatherData}
            congestionData={congestionData}
            loading={liveDataLoading}
          />

          <RecommendationCards
            recommendations={recommendations}
            onSelect={onRecommendationSelect}
          />

          <FilterRow
            filters={filters}
            selectedRegionCode={selectedRegionCode}
            onRegionSelect={onRegionSelect}
            onFilterChange={onFilterChange}
          />

          <ActivityPlanner
            facilities={facilities}
            origin={origin}
            preferredCategories={preferredCategories}
            weather={weatherData}
            congestion={congestionData}
            onStopSelect={onFacilitySelect}
          />

          {isListOpen && (
            <section aria-label={t('explorer.listTitle')} className='border-t border-border pt-3'>
              <PlaceList
                facilities={facilities}
                selectedFacility={selectedFacility}
                onFacilitySelect={onFacilitySelect}
                onReset={onReset}
                hasActiveFilters={activeFilterCount > 0}
              />
            </section>
          )}
        </>
      )}
    </section>
  );
}
