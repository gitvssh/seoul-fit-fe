/**
 * @fileoverview 탐색 상태 프로바이더
 * @description 지도(MapView)와 패널(PanelHost)이 함께 쓰는 탐색 상태: 필터, 상황 프리셋, 서울 지금(날씨·혼잡도),
 * 위치 권한, 화면 안 장소, 추천 결과. 지도가 화면 안 장소를 올리면 패널이 그 결과를 읽는다.
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import type { Facility, Position } from '@/lib/types';
import { applyPlaceFilters } from '@/features/place-filter/lib/place-filter';
import {
  DEFAULT_PLACE_FILTERS,
  type PlaceFilterKey,
  type PlaceFilterState,
} from '@/features/place-filter/model/types';
import {
  RECOMMENDATION_PRESETS,
  recommendFacilities,
} from '@/features/recommendation/lib/recommendation-engine';
import type {
  FacilityRecommendation,
  RecommendationPreset,
} from '@/features/recommendation/model/types';
import { getPresetRequiredCategories } from '@/features/recommendation/lib/presets';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import { useLiveData } from '@/shared/lib/hooks/useLiveData';
import { useGeolocation } from '@/shared/lib/hooks/useGeolocation';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { useFacilityContext } from './FacilityProvider';
import { useMapContext } from './MapProvider';

const PRESET_IDS = new Set<string>(RECOMMENDATION_PRESETS.map(preset => preset.id));

export type GeolocationBannerState = 'none' | 'prompt' | 'denied' | 'unavailable';

interface ExploreContextValue {
  filters: PlaceFilterState;
  setFilters: (next: PlaceFilterState, changedFilter: PlaceFilterKey, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  activePreset: RecommendationPreset;
  setPreset: (preset: RecommendationPreset) => void;
  isListOpen: boolean;
  setListOpen: (open: boolean) => void;
  isEngagementOpen: boolean;
  setEngagementOpen: (open: boolean) => void;
  selectedRegionCode: string;
  setSelectedRegionCode: (code: string) => void;
  /** 지도 화면 안, 활성 카테고리의 장소 (지도가 갱신) */
  visibleFacilities: Facility[];
  setVisibleFacilities: (facilities: Facility[]) => void;
  /** 화면 안 장소에 상세 필터를 적용한 결과 (목록·추천의 기준) */
  facilitiesInView: Facility[];
  recommendations: FacilityRecommendation[];
  live: ReturnType<typeof useLiveData>;
  geolocation: ReturnType<typeof useGeolocation>;
  /** 위치 권한을 요청하고 성공하면 지도와 데이터를 그 위치로 옮긴다 (사용자 행동에서만 호출). */
  locateMe: () => Promise<boolean>;
  geolocationBanner: GeolocationBannerState;
  dismissGeolocationBanner: () => void;
  /** 추천·거리 계산 기준점: 사용자의 실제 위치가 있으면 그것, 아니면 데이터 기준 위치 */
  origin: Position;
  naturalLanguageSummary: { ko: string | null; en: string | null };
  clearNaturalLanguageRule: () => void;
}

const ExploreContext = createContext<ExploreContextValue | null>(null);

export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { activateCategories, currentLocation, updateLocation, facilities } = useFacilityContext();
  const { setCenter, setZoom, mapStatus, getCenter } = useMapContext();
  const live = useLiveData();
  const geolocation = useGeolocation();

  const [filters, setFiltersState] = useState<PlaceFilterState>(DEFAULT_PLACE_FILTERS);
  const [activePreset, setActivePreset] = useState<RecommendationPreset>(() => {
    const param = searchParams?.get('preset');
    return param && PRESET_IDS.has(param) ? (param as RecommendationPreset) : 'available_now';
  });
  const [isListOpen, setListOpen] = useState(false);
  const [isEngagementOpen, setEngagementOpen] = useState(false);
  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [visibleFacilities, setVisibleFacilities] = useState<Facility[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const hasAutoLocatedRef = useRef(false);
  const trackedPresetRef = useRef<string | null>(null);

  const appliedRule = useNaturalLanguageRuleStore(state => state.appliedRule);
  const ruleRevision = useNaturalLanguageRuleStore(state => state.revision);
  const clearRule = useNaturalLanguageRuleStore(state => state.clearRule);
  const appliedRevisionRef = useRef(0);

  // 자연어 조건이 적용되면 필터·프리셋에 반영하고 목록을 연다.
  useEffect(() => {
    if (!appliedRule || ruleRevision === appliedRevisionRef.current) return;
    appliedRevisionRef.current = ruleRevision;
    setFiltersState({ categories: appliedRule.categories, ...appliedRule.filters });
    if (appliedRule.preset) setActivePreset(appliedRule.preset);
    if (appliedRule.categories.length > 0) activateCategories(appliedRule.categories);
    setListOpen(true);
  }, [activateCategories, appliedRule, ruleRevision]);

  const origin = geolocation.position ?? currentLocation;

  // 기본 위치(또는 사용자 위치)의 서울 지금은 권한과 무관하게 바로 읽는다.
  useEffect(() => {
    void live.load(origin);
  }, [live, origin]);

  // 이미 허용된 권한이면 프롬프트 없이 조용히 위치를 읽는다. 아니면 사용자 행동을 기다린다.
  const locateMe = useCallback(async () => {
    const position = await geolocation.request();
    trackEvent('geolocation_result', {
      location_permission: position
        ? 'granted'
        : geolocation.status === 'denied'
          ? 'denied'
          : 'unavailable',
    });
    if (!position) return false;
    setCenter(position);
    setZoom(4);
    geolocation.startWatch();
    await updateLocation(position.lat, position.lng, { force: true, zoomLevel: 4 });
    return true;
  }, [geolocation, setCenter, setZoom, updateLocation]);

  useEffect(() => {
    if (hasAutoLocatedRef.current || !mapStatus.success) return;
    if (geolocation.permission !== 'granted') return;
    hasAutoLocatedRef.current = true;
    const hasDeepLink = Boolean(searchParams?.get('lat') || searchParams?.get('place'));
    if (hasDeepLink) {
      // 딥링크 위치를 유지하고 사용자 위치는 마커로만 표시한다.
      geolocation.startWatch();
      return;
    }
    void locateMe();
  }, [geolocation, locateMe, mapStatus.success, searchParams]);

  // 위치 권한이 없을 때도 기본 위치 주변 데이터를 읽는다.
  useEffect(() => {
    if (!mapStatus.success) return;
    const center = getCenter() ?? currentLocation;
    void updateLocation(center.lat, center.lng, { zoomLevel: 4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStatus.success]);

  const setFilters = useCallback(
    (next: PlaceFilterState, changedFilter: PlaceFilterKey, value: string) => {
      setFiltersState(next);
      trackEvent('filter_applied', {
        filter_type: changedFilter,
        filter_value: value,
        page_type: 'home_map',
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_PLACE_FILTERS);
    clearRule();
    trackEvent('filter_applied', {
      filter_type: 'all',
      filter_value: 'reset',
      page_type: 'home_map',
    });
  }, [clearRule]);

  const setPreset = useCallback(
    (preset: RecommendationPreset) => {
      setActivePreset(preset);
      activateCategories(getPresetRequiredCategories(preset));
    },
    [activateCategories]
  );

  const facilitiesInView = useMemo(
    () => applyPlaceFilters(visibleFacilities, origin, filters),
    [filters, origin, visibleFacilities]
  );

  const recommendations = useMemo(
    () =>
      recommendFacilities(
        facilitiesInView,
        {
          origin,
          now: new Date(),
          preset: activePreset,
          weather: live.weather.data,
          congestion: live.congestion.data,
        },
        10
      ),
    [activePreset, facilitiesInView, live.congestion.data, live.weather.data, origin]
  );

  useEffect(() => {
    if (recommendations.length === 0) return;
    const key = `${activePreset}:${recommendations[0].facility.category}`;
    if (trackedPresetRef.current === key) return;
    trackedPresetRef.current = key;
    trackEvent('recommendation_viewed', {
      preset: activePreset,
      category: recommendations[0].facility.category,
      reason_code: recommendations[0].reasonCodes[0],
    });
  }, [activePreset, recommendations]);

  const activeFilterCount =
    (filters.openOnly ? 1 : 0) +
    (filters.reservableOnly ? 1 : 0) +
    (filters.indoorOnly ? 1 : 0) +
    (filters.lowCongestionOnly ? 1 : 0) +
    (filters.maxDistanceKm === null ? 0 : 1) +
    filters.categories.length;

  const geolocationBanner: GeolocationBannerState = useMemo(() => {
    if (bannerDismissed || geolocation.position) return 'none';
    if (geolocation.status === 'denied') return 'denied';
    if (geolocation.status === 'unavailable' || geolocation.status === 'timeout')
      return 'unavailable';
    if (geolocation.status === 'idle' && facilities.length > 0) return 'prompt';
    return 'none';
  }, [bannerDismissed, facilities.length, geolocation.position, geolocation.status]);

  const value = useMemo<ExploreContextValue>(
    () => ({
      filters,
      setFilters,
      resetFilters,
      activeFilterCount,
      activePreset,
      setPreset,
      isListOpen,
      setListOpen,
      isEngagementOpen,
      setEngagementOpen,
      selectedRegionCode,
      setSelectedRegionCode,
      visibleFacilities,
      setVisibleFacilities,
      facilitiesInView,
      recommendations,
      live,
      geolocation,
      locateMe,
      geolocationBanner,
      dismissGeolocationBanner: () => setBannerDismissed(true),
      origin,
      naturalLanguageSummary: {
        ko: appliedRule?.summary ?? null,
        en: appliedRule?.summaryEn ?? null,
      },
      clearNaturalLanguageRule: clearRule,
    }),
    [
      activeFilterCount,
      activePreset,
      appliedRule,
      clearRule,
      facilitiesInView,
      filters,
      geolocation,
      geolocationBanner,
      isEngagementOpen,
      isListOpen,
      live,
      locateMe,
      origin,
      recommendations,
      resetFilters,
      selectedRegionCode,
      setFilters,
      setPreset,
      visibleFacilities,
    ]
  );

  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>;
}

export function useExploreContext(): ExploreContextValue {
  const context = useContext(ExploreContext);
  if (!context) throw new Error('useExploreContext must be used within an ExploreProvider');
  return context;
}
