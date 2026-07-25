'use client';

import {
  Bookmark,
  CloudSun,
  ListFilter,
  MapPin,
  RotateCcw,
  Rows3,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { getFacilityOpenState, isFacilityReservable } from '../lib/place-filter';
import type { PlaceFilterKey, PlaceFilterState } from '../model/types';
import { RECOMMENDATION_PRESETS } from '@/features/recommendation/lib/recommendation-engine';
import { getCombinedLiveDataStatus } from '@/features/recommendation/lib/live-data';
import type {
  FacilityRecommendation,
  RecommendationPreset,
} from '@/features/recommendation/model/types';
import { ActivityPlanner } from '@/features/activity-plan/ui/ActivityPlanner';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { SEOUL_REGIONS } from '@/shared/lib/data/seoul-districts';

interface PlaceExplorerPanelProps {
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
}

const TOGGLE_FILTERS: Array<{
  key: keyof Pick<
    PlaceFilterState,
    'openOnly' | 'reservableOnly' | 'indoorOnly' | 'lowCongestionOnly'
  >;
  analyticsKey: PlaceFilterKey;
  labelKey: MessageKey;
}> = [
  { key: 'openOnly', analyticsKey: 'open_now', labelKey: 'explorer.openNow' },
  { key: 'reservableOnly', analyticsKey: 'reservable', labelKey: 'explorer.reservable' },
  { key: 'indoorOnly', analyticsKey: 'indoor', labelKey: 'explorer.indoor' },
  {
    key: 'lowCongestionOnly',
    analyticsKey: 'low_congestion',
    labelKey: 'explorer.lowCongestion',
  },
];

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
}: PlaceExplorerPanelProps) {
  const { locale, t } = useI18n();
  const activeFilterCount =
    TOGGLE_FILTERS.filter(({ key }) => filters[key]).length +
    (filters.maxDistanceKm === null ? 0 : 1) +
    filters.categories.length;
  const liveDataStatus = getCombinedLiveDataStatus(weatherData, congestionData);
  const naturalLanguageSummary =
    locale === 'en' ? naturalLanguageSummaryEn : naturalLanguageSummaryKo;
  const selectedRegion = SEOUL_REGIONS.find(region => region.code === selectedRegionCode);
  const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) return t('explorer.distanceUnknown');
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };
  const getOpenLabel = (facility: Facility): string => {
    const state = getFacilityOpenState(facility.operatingHours);
    if (state === 'open') return t('explorer.open');
    if (state === 'closed') return t('explorer.closed');
    return t('explorer.hoursUnknown');
  };

  return (
    <section
      className='absolute left-3 right-3 top-14 z-30 max-h-[calc(100%-7rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur md:left-4 md:right-auto md:w-[25rem]'
      aria-label={t('explorer.label')}
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <ListFilter className='h-4 w-4 shrink-0 text-blue-600' aria-hidden='true' />
          <p className='truncate text-sm font-semibold text-gray-900'>
            {t('explorer.currentMap', { count: facilities.length })}
            {activeFilterCount > 0 && (
              <span className='ml-1 font-normal text-blue-700'>
                · {t('explorer.filtersCount', { count: activeFilterCount })}
              </span>
            )}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 px-2 text-xs'
            onClick={onEngagementOpen}
          >
            <Bookmark className='mr-1 h-3.5 w-3.5' aria-hidden='true' />
            {t('explorer.myLife')}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-xs'
              onClick={onReset}
              aria-label={t('explorer.resetLabel')}
            >
              <RotateCcw className='mr-1 h-3.5 w-3.5' aria-hidden='true' />
              {t('explorer.reset')}
            </Button>
          )}
          <Button
            type='button'
            variant={isListOpen ? 'default' : 'outline'}
            size='sm'
            className='h-8 px-2 text-xs'
            onClick={() => onListOpenChange(!isListOpen)}
            aria-expanded={isListOpen}
            aria-controls='map-place-list'
          >
            {isListOpen ? (
              <X className='mr-1 h-3.5 w-3.5' aria-hidden='true' />
            ) : (
              <Rows3 className='mr-1 h-3.5 w-3.5' aria-hidden='true' />
            )}
            {isListOpen ? t('explorer.closeList') : t('explorer.openList')}
          </Button>
        </div>
      </div>

      {naturalLanguageSummary && (
        <p
          className='mt-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900'
          role='status'
        >
          {t('explorer.ruleApplied', { summary: naturalLanguageSummary })}
        </p>
      )}

      <div className='mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2'>
        <MapPin className='h-4 w-4 shrink-0 text-blue-600' aria-hidden='true' />
        <label className='min-w-0 flex-1'>
          <span className='sr-only'>{t('explorer.regionShortcut')}</span>
          <select
            value={selectedRegionCode}
            onChange={event => onRegionSelect(event.target.value)}
            className='h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label={t('explorer.regionShortcut')}
          >
            <option value='' disabled>
              {t('explorer.selectRegion')}
            </option>
            {SEOUL_REGIONS.map(region => (
              <option key={region.code} value={region.code}>
                {locale === 'en' ? region.nameEn : region.nameKo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedRegionCode && (
        <p className='sr-only' role='status'>
          {t('explorer.regionMoved', {
            region: (locale === 'en' ? selectedRegion?.nameEn : selectedRegion?.nameKo) || '',
          })}
        </p>
      )}

      <div className='mt-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='flex items-center gap-1.5 text-sm font-semibold text-gray-900'>
              <CloudSun className='h-4 w-4 text-blue-600' aria-hidden='true' />
              {t('explorer.seoulNow')}
            </p>
            {liveDataLoading ? (
              <p className='mt-1 text-xs text-gray-600'>{t('explorer.loadingLive')}</p>
            ) : weatherData || congestionData ? (
              <p className='mt-1 truncate text-xs text-gray-600'>
                {weatherData?.AREA_NM || congestionData?.AREA_NM || t('explorer.nearestArea')}
                {weatherData?.TEMP ? ` · ${Math.round(Number(weatherData.TEMP))}°C` : ''}
                {weatherData?.PM10_INDEX
                  ? ` · ${t('explorer.airQuality', { value: weatherData.PM10_INDEX })}`
                  : ''}
                {congestionData?.AREA_CONGEST_LVL
                  ? ` · ${t('explorer.congestion', {
                      value: congestionData.AREA_CONGEST_LVL,
                    })}`
                  : ''}
              </p>
            ) : (
              <p className='mt-1 text-xs leading-5 text-amber-700'>
                {t('explorer.unsupportedLive')}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
              liveDataStatus.freshness === 'live'
                ? 'bg-green-100 text-green-700'
                : liveDataStatus.freshness === 'recent'
                  ? 'bg-blue-100 text-blue-700'
                  : liveDataStatus.freshness === 'stale'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t(`freshness.${liveDataStatus.freshness}` as MessageKey)}
          </span>
        </div>
        {(weatherData || congestionData) && (
          <p className='mt-2 text-[11px] text-gray-500'>
            {t('explorer.sourceTime', { time: liveDataStatus.referenceTimeLabel })}
          </p>
        )}
      </div>

      <div
        className='mt-2 flex gap-2 overflow-x-auto pb-1'
        aria-label={t('explorer.detailFilters')}
      >
        <label className='shrink-0'>
          <span className='sr-only'>{t('explorer.maxDistance')}</span>
          <select
            value={filters.maxDistanceKm ?? ''}
            onChange={event => {
              const value = event.target.value;
              onFilterChange(
                { ...filters, maxDistanceKm: value ? Number(value) : null },
                'max_distance',
                value || 'all'
              );
            }}
            className='h-8 rounded-full border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>{t('explorer.allDistances')}</option>
            {[1, 3, 5].map(value => (
              <option key={value} value={value}>
                {t('explorer.withinKm', { value })}
              </option>
            ))}
          </select>
        </label>
        {TOGGLE_FILTERS.map(({ key, analyticsKey, labelKey }) => (
          <button
            key={key}
            type='button'
            aria-pressed={filters[key]}
            onClick={() =>
              onFilterChange(
                { ...filters, [key]: !filters[key] },
                analyticsKey,
                filters[key] ? 'disabled' : 'enabled'
              )
            }
            className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              filters[key]
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className='mt-3 border-t border-gray-100 pt-3'>
        <p className='flex items-center gap-1.5 text-xs font-semibold text-gray-700'>
          <Sparkles className='h-3.5 w-3.5 text-violet-600' aria-hidden='true' />
          {t('explorer.recommendations')}
        </p>
        <div className='mt-2 flex gap-2 overflow-x-auto pb-1'>
          {RECOMMENDATION_PRESETS.map(preset => (
            <button
              key={preset.id}
              type='button'
              aria-pressed={activePreset === preset.id}
              title={t(`preset.${preset.id}` as MessageKey)}
              onClick={() => onPresetChange(preset.id)}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                activePreset === preset.id
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t(`preset.${preset.id}` as MessageKey)}
            </button>
          ))}
        </div>

        <div className='mt-2 space-y-2' aria-live='polite'>
          {recommendations.slice(0, 3).map(recommendation => (
            <button
              key={`recommendation:${recommendation.facility.category}:${recommendation.facility.id}`}
              type='button'
              className='w-full rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-left hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
              onClick={() => onRecommendationSelect(recommendation)}
            >
              <div className='flex items-center justify-between gap-3'>
                <p className='truncate text-sm font-semibold text-gray-900'>
                  {recommendation.facility.name}
                </p>
                <span className='shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-violet-700'>
                  {t('explorer.score', { score: recommendation.score })}
                </span>
              </div>
              <p className='mt-1 line-clamp-1 text-xs text-violet-800'>
                {recommendation.reasonCodes
                  .map(code => t(`reason.${code}` as MessageKey))
                  .join(' · ') || t('explorer.nearbyInfo')}
              </p>
              {recommendation.warnings.length > 0 && (
                <p className='mt-1 line-clamp-1 text-[11px] text-amber-700'>
                  {t('explorer.check', {
                    warning: t(`warning.${recommendation.warningCodes[0]}` as MessageKey),
                  })}
                </p>
              )}
            </button>
          ))}
          {recommendations.length === 0 && (
            <p className='rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500'>
              {t('explorer.noRecommendations')}
            </p>
          )}
        </div>
      </div>

      <ActivityPlanner
        facilities={facilities}
        origin={origin}
        preferredCategories={preferredCategories}
        weather={weatherData}
        congestion={congestionData}
        onStopSelect={onFacilitySelect}
      />

      {isListOpen && (
        <div
          id='map-place-list'
          className='mt-3 max-h-64 space-y-2 overflow-y-auto border-t border-gray-100 pt-3'
          aria-live='polite'
        >
          {facilities.length === 0 ? (
            <div className='py-6 text-center text-sm text-gray-500'>
              <MapPin className='mx-auto mb-2 h-5 w-5' aria-hidden='true' />
              {t('explorer.noPlaces')}
            </div>
          ) : (
            facilities.slice(0, 100).map(facility => {
              const isSelected =
                selectedFacility?.id === facility.id &&
                selectedFacility.category === facility.category;
              return (
                <button
                  key={`${facility.category}:${facility.id}`}
                  type='button'
                  onClick={() => onFacilitySelect(facility)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-gray-900'>
                        {facility.name}
                      </p>
                      <p className='mt-0.5 truncate text-xs text-gray-500'>
                        {t(`category.${facility.category}` as MessageKey)} ·{' '}
                        {facility.address || t('explorer.addressUnknown')}
                      </p>
                    </div>
                    <span className='shrink-0 text-xs font-medium text-blue-700'>
                      {formatDistance(facility.distance)}
                    </span>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-600'>
                    <span>{getOpenLabel(facility)}</span>
                    {isFacilityReservable(facility) && <span>· {t('explorer.reservable')}</span>}
                    <span>
                      ·{' '}
                      {facility.congestionLevel === 'low'
                        ? t('explorer.lowCongestion')
                        : facility.congestionLevel === 'medium'
                          ? t('explorer.mediumCongestion')
                          : t('explorer.highCongestion')}
                    </span>
                  </div>
                </button>
              );
            })
          )}
          {facilities.length > 100 && (
            <p className='py-2 text-center text-xs text-gray-500'>{t('explorer.limitNotice')}</p>
          )}
        </div>
      )}
    </section>
  );
}
