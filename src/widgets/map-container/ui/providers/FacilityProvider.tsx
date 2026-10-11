/**
 * @fileoverview 시설 데이터 컨텍스트 프로바이더
 * @description 여러 공공데이터 소스를 하나의 시설 목록으로 합치고, 소스별 상태·선택·카테고리를 관리한다.
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
import { useParks } from '@/shared/lib/hooks/useParks';
import { useLibraries } from '@/shared/lib/hooks/useLibraries';
import { useCulturalSpaces } from '@/shared/lib/hooks/useCulturalSpaces';
import { useCulturalEvents } from '@/shared/lib/hooks/useCulturalEvents';
import { useCulturalReservations } from '@/shared/lib/hooks/useCulturalReservations';
import { useCoolingShelter } from '@/shared/lib/hooks/useCoolingShelter';
import { useSubwayStations } from '@/shared/lib/hooks/useSubwayStations';
import { usePOI } from '@/shared/lib/hooks/usePOI';
import { useBikeStations } from '@/shared/lib/hooks/useBikeStations';
import { useSportsFacilities } from '@/shared/lib/hooks/useSportsFacilities';
import { useRestaurantFacilities } from '@/shared/lib/hooks/useRestaurantFacilities';
import { convertPOIToFacility } from '@/shared/api/poi';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import {
  convertParkToFacility,
  convertLibraryToFacility,
  convertCulturalSpaceToFacility,
  convertCulturalEventToFacility,
  convertCulturalReservationToFacility,
} from '@/shared/lib/utils/facility-converter';
import { FACILITY_CATEGORIES } from '@/lib/types';
import type {
  Facility,
  ClusteredFacility,
  FacilityCategory,
  UserPreferences,
  Position,
} from '@/lib/types';

export type FacilitySource =
  | 'parks'
  | 'libraries'
  | 'subway'
  | 'pois'
  | 'bike'
  | 'culturalSpaces'
  | 'culturalEvents'
  | 'culturalReservations'
  | 'coolingShelters'
  | 'sports'
  | 'restaurants';

export type SourceStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type SelectionSource =
  | 'cluster'
  | 'map_marker'
  | 'public_place'
  | 'recommendation'
  | 'search_history'
  | 'search_result'
  | 'list'
  | 'planner';

/** 위치 기반(반경) 소스와 그 소스가 공급하는 카테고리 */
const SOURCE_CATEGORY: Record<FacilitySource, FacilityCategory | null> = {
  parks: 'park',
  libraries: 'library',
  subway: 'subway',
  pois: null,
  bike: 'bike',
  culturalSpaces: 'culture',
  culturalEvents: 'cultural_event',
  culturalReservations: 'cultural_reservation',
  coolingShelters: 'cooling_shelter',
  sports: 'sports',
  restaurants: 'restaurant',
};

const ALL_CATEGORIES = Object.values(FACILITY_CATEGORIES) as FacilityCategory[];
const DEFAULT_ORIGIN: Position = { lat: 37.5665, lng: 126.978 };
const RELOAD_DISTANCE_KM = 0.3;

const RADIUS_BY_ZOOM: Record<number, number> = {
  1: 0.1,
  2: 0.15,
  3: 0.25,
  4: 0.5,
  5: 1,
  6: 2,
  7: 3,
  8: 5,
  9: 8,
  10: 12,
  11: 20,
  12: 30,
  13: 50,
  14: 100,
};

interface FacilityContextValue {
  facilities: Facility[];
  /** 전역 데이터(공원·도서관·지하철) 첫 로딩 */
  loading: boolean;
  /** 현재 기준 위치 주변 소스 로딩 */
  locationLoading: boolean;
  sourceStatus: Record<FacilitySource, SourceStatus>;
  /** 마지막 로딩에서 실패한 소스의 카테고리 (화면 안내용) */
  failedCategories: FacilityCategory[];
  selectedFacility: Facility | null;
  selectedCluster: ClusteredFacility | null;
  activeCategories: FacilityCategory[];
  userPreferences: UserPreferences | null;
  /** 위치 기반 소스를 읽은 기준점. 사용자의 실제 GPS 위치와는 다를 수 있다. */
  currentLocation: Position;
  lastLoadedLocation: Position | null;
  selectFacility: (facility: Facility | null, selectionSource?: SelectionSource) => void;
  selectCluster: (cluster: ClusteredFacility | null) => void;
  clearSelection: () => void;
  toggleCategory: (category: FacilityCategory) => void;
  activateCategory: (category: FacilityCategory) => void;
  activateCategories: (categories: FacilityCategory[]) => void;
  setActiveCategories: (categories: FacilityCategory[]) => void;
  addTransientFacility: (facility: Facility) => void;
  updateLocation: (
    lat: number,
    lng: number,
    options?: { force?: boolean; zoomLevel?: number }
  ) => Promise<void>;
  getFilteredFacilities: () => Facility[];
  getFacilitiesByCategory: (category: FacilityCategory) => Facility[];
  getNearbyFacilities: (position: Position, radius: number) => Facility[];
}

const FacilityContext = createContext<FacilityContextValue | null>(null);

interface FacilityProviderProps {
  userPreferences?: UserPreferences;
  children: React.ReactNode;
}

const initialSourceStatus = (): Record<FacilitySource, SourceStatus> => ({
  parks: 'idle',
  libraries: 'idle',
  subway: 'idle',
  pois: 'idle',
  bike: 'idle',
  culturalSpaces: 'idle',
  culturalEvents: 'idle',
  culturalReservations: 'idle',
  coolingShelters: 'idle',
  sports: 'idle',
  restaurants: 'idle',
});

export function calculateDistanceKm(from: Position, to: Position): number {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function FacilityProvider({ userPreferences, children }: FacilityProviderProps) {
  const { parks, fetchAllParksData } = useParks();
  const { libraries, fetchAllLibrariesData } = useLibraries();
  const { culturalSpaces, fetchCulturalSpaces } = useCulturalSpaces();
  const { culturalEvents, fetchCulturalEvents } = useCulturalEvents();
  const { culturalReservations, fetchCulturalReservations } = useCulturalReservations();
  const { facilities: coolingShelters, fetchCoolingShelters } = useCoolingShelter();
  const { subwayStations, loading: subwayLoading, error: subwayError } = useSubwayStations();
  const { pois, fetchNearbyPOIs } = usePOI();
  const { facilities: bikeStations, fetchBikeStations } = useBikeStations();
  const { sportsFacilities, fetchSportsFacilities } = useSportsFacilities();
  const { restaurants: restaurantFacilities, fetchRestaurants } = useRestaurantFacilities();

  const [sourceStatus, setSourceStatus] = useState(initialSourceStatus);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocationState] = useState<Position>(DEFAULT_ORIGIN);
  const [lastLoadedLocation, setLastLoadedLocation] = useState<Position | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusteredFacility | null>(null);
  const [transientFacilities, setTransientFacilities] = useState<Facility[]>([]);
  const [activeCategories, setActiveCategoriesState] = useState<FacilityCategory[]>(() =>
    userPreferences?.preferredCategories && userPreferences.preferredCategories.length > 0
      ? userPreferences.preferredCategories
      : ALL_CATEGORIES
  );
  const lastLoadedRef = useRef<Position | null>(null);

  const markSource = useCallback((source: FacilitySource, status: SourceStatus) => {
    setSourceStatus(previous =>
      previous[source] === status ? previous : { ...previous, [source]: status }
    );
  }, []);

  const runSource = useCallback(
    async (source: FacilitySource, task: () => Promise<unknown>) => {
      markSource(source, 'loading');
      try {
        await task();
        markSource(source, 'ready');
      } catch (error) {
        console.error(`[FacilityProvider] ${source} 로딩 실패`, error);
        markSource(source, 'failed');
      }
    },
    [markSource]
  );

  // 지하철 소스는 훅이 스스로 읽는다.
  useEffect(() => {
    if (subwayLoading) markSource('subway', 'loading');
    else if (subwayError) markSource('subway', 'failed');
    else if (subwayStations.length > 0) markSource('subway', 'ready');
  }, [markSource, subwayError, subwayLoading, subwayStations.length]);

  // 전역 데이터는 한 번만 읽는다.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      runSource('parks', () => fetchAllParksData(0, 1000)),
      runSource('libraries', () => fetchAllLibrariesData(0, 1000)),
    ]).finally(() => {
      if (!cancelled) setInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userPreferences?.preferredCategories && userPreferences.preferredCategories.length > 0) {
      setActiveCategoriesState(userPreferences.preferredCategories);
    }
  }, [userPreferences?.preferredCategories]);

  const loadLocationBasedData = useCallback(
    async (position: Position, zoomLevel?: number) => {
      const radius = zoomLevel !== undefined ? (RADIUS_BY_ZOOM[zoomLevel] ?? 2) : 2;
      setLocationLoading(true);
      await Promise.all([
        runSource('pois', () => fetchNearbyPOIs(position.lat, position.lng, radius)),
        runSource('bike', () => fetchBikeStations(position.lat, position.lng, Math.min(radius, 5))),
        runSource('culturalSpaces', () => fetchCulturalSpaces(position.lat, position.lng)),
        runSource('culturalEvents', () => fetchCulturalEvents(position.lat, position.lng)),
        runSource('culturalReservations', () =>
          fetchCulturalReservations(position.lat, position.lng)
        ),
        runSource('coolingShelters', () => fetchCoolingShelters(position.lat, position.lng)),
        runSource('sports', () => fetchSportsFacilities(position.lat, position.lng, radius)),
        runSource('restaurants', () => fetchRestaurants(position.lat, position.lng)),
      ]);
      lastLoadedRef.current = position;
      setLastLoadedLocation(position);
      setLocationLoading(false);
    },
    [
      fetchBikeStations,
      fetchCoolingShelters,
      fetchCulturalEvents,
      fetchCulturalReservations,
      fetchCulturalSpaces,
      fetchNearbyPOIs,
      fetchRestaurants,
      fetchSportsFacilities,
      runSource,
    ]
  );

  const updateLocation = useCallback(
    async (lat: number, lng: number, options: { force?: boolean; zoomLevel?: number } = {}) => {
      const next = { lat, lng };
      const last = lastLoadedRef.current;
      if (!options.force && last && calculateDistanceKm(next, last) < RELOAD_DISTANCE_KM) {
        setCurrentLocationState(next);
        return;
      }
      setCurrentLocationState(next);
      await loadLocationBasedData(next, options.zoomLevel);
    },
    [loadLocationBasedData]
  );

  const facilities = useMemo(() => {
    const combined: Facility[] = [];
    const push = <T,>(
      rows: T[] | undefined,
      convert: (row: T, index: number) => Facility | null
    ) => {
      if (!rows || rows.length === 0) return;
      rows.forEach((row, index) => {
        const facility = convert(row, index);
        if (facility) combined.push(facility);
      });
    };
    push(pois, poi => convertPOIToFacility(poi));
    push(parks, convertParkToFacility);
    push(libraries, convertLibraryToFacility);
    push(culturalSpaces, convertCulturalSpaceToFacility);
    push(culturalEvents, convertCulturalEventToFacility);
    push(culturalReservations, convertCulturalReservationToFacility);
    combined.push(...(coolingShelters ?? []));
    combined.push(...(subwayStations ?? []));
    combined.push(...(bikeStations ?? []));
    combined.push(...(sportsFacilities ?? []));
    combined.push(...(restaurantFacilities ?? []));

    transientFacilities.forEach(transient => {
      const existingIndex = combined.findIndex(
        facility =>
          facility.category === transient.category &&
          (facility.id === transient.id ||
            (facility.name === transient.name && facility.address === transient.address))
      );
      if (existingIndex >= 0) combined[existingIndex] = transient;
      else combined.push(transient);
    });
    return combined;
  }, [
    pois,
    parks,
    libraries,
    culturalSpaces,
    culturalEvents,
    culturalReservations,
    coolingShelters,
    subwayStations,
    bikeStations,
    sportsFacilities,
    restaurantFacilities,
    transientFacilities,
  ]);

  const failedCategories = useMemo(
    () =>
      (Object.keys(sourceStatus) as FacilitySource[])
        .filter(source => sourceStatus[source] === 'failed')
        .map(source => SOURCE_CATEGORY[source])
        .filter((category): category is FacilityCategory => category !== null),
    [sourceStatus]
  );

  const selectFacility = useCallback(
    (facility: Facility | null, selectionSource: SelectionSource = 'map_marker') => {
      setSelectedFacility(facility);
      if (facility) {
        setSelectedCluster(null);
        trackEvent('facility_detail_viewed', {
          category: facility.category,
          selection_source: selectionSource,
        });
      }
    },
    []
  );

  const selectCluster = useCallback((cluster: ClusteredFacility | null) => {
    setSelectedCluster(cluster);
    if (cluster) setSelectedFacility(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFacility(null);
    setSelectedCluster(null);
  }, []);

  const activateCategory = useCallback((category: FacilityCategory) => {
    setActiveCategoriesState(previous =>
      previous.includes(category) ? previous : [...previous, category]
    );
  }, []);

  const activateCategories = useCallback((categories: FacilityCategory[]) => {
    setActiveCategoriesState(previous => {
      const missing = categories.filter(category => !previous.includes(category));
      return missing.length === 0 ? previous : [...previous, ...missing];
    });
  }, []);

  const setActiveCategories = useCallback((categories: FacilityCategory[]) => {
    setActiveCategoriesState(categories);
  }, []);

  const toggleCategory = useCallback((category: FacilityCategory) => {
    trackEvent('discovery_started', { category, selection_source: 'category_filter' });
    setActiveCategoriesState(previous =>
      previous.includes(category)
        ? previous.filter(item => item !== category)
        : [...previous, category]
    );
  }, []);

  const addTransientFacility = useCallback((facility: Facility) => {
    setTransientFacilities(previous => {
      const remaining = previous.filter(
        item => !(item.category === facility.category && item.id === facility.id)
      );
      return [...remaining.slice(-9), facility];
    });
  }, []);

  const getFilteredFacilities = useCallback(
    () => facilities.filter(facility => activeCategories.includes(facility.category)),
    [facilities, activeCategories]
  );

  const getFacilitiesByCategory = useCallback(
    (category: FacilityCategory) => facilities.filter(facility => facility.category === category),
    [facilities]
  );

  const getNearbyFacilities = useCallback(
    (position: Position, radius: number) =>
      facilities.filter(facility => calculateDistanceKm(position, facility.position) <= radius),
    [facilities]
  );

  const contextValue = useMemo<FacilityContextValue>(
    () => ({
      facilities,
      loading: initialLoading,
      locationLoading,
      sourceStatus,
      failedCategories,
      selectedFacility,
      selectedCluster,
      activeCategories,
      userPreferences: userPreferences || null,
      currentLocation,
      lastLoadedLocation,
      selectFacility,
      selectCluster,
      clearSelection,
      toggleCategory,
      activateCategory,
      activateCategories,
      setActiveCategories,
      addTransientFacility,
      updateLocation,
      getFilteredFacilities,
      getFacilitiesByCategory,
      getNearbyFacilities,
    }),
    [
      facilities,
      initialLoading,
      locationLoading,
      sourceStatus,
      failedCategories,
      selectedFacility,
      selectedCluster,
      activeCategories,
      userPreferences,
      currentLocation,
      lastLoadedLocation,
      selectFacility,
      selectCluster,
      clearSelection,
      toggleCategory,
      activateCategory,
      activateCategories,
      setActiveCategories,
      addTransientFacility,
      updateLocation,
      getFilteredFacilities,
      getFacilitiesByCategory,
      getNearbyFacilities,
    ]
  );

  return <FacilityContext.Provider value={contextValue}>{children}</FacilityContext.Provider>;
}

export function useFacilityContext(): FacilityContextValue {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacilityContext must be used within a FacilityProvider');
  }
  return context;
}

export function useFacilitySelection() {
  const { selectedFacility, selectedCluster, selectFacility, selectCluster, clearSelection } =
    useFacilityContext();
  return { selectedFacility, selectedCluster, selectFacility, selectCluster, clearSelection };
}
