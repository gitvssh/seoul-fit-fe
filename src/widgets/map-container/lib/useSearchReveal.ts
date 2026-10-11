'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Facility, FacilityCategory } from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { convertSearchResultToFacility } from '@/shared/api/searchDetail';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';
import { env } from '@/config/environment';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import { useFacilityContext, type SelectionSource } from '../ui/providers/FacilityProvider';
import { useMapContext } from '../ui/providers/MapProvider';

const SEARCH_TO_FACILITY_CATEGORY: Record<SearchItem['category'], FacilityCategory> = {
  subway: 'subway',
  bike: 'bike',
  library: 'library',
  park: 'park',
  cultural_event: 'cultural_event',
  cultural_reservation: 'cultural_reservation',
  cooling_center: 'cooling_shelter',
  restaurant: 'restaurant',
};

const PUBLIC_TO_FACILITY_CATEGORY: Record<string, FacilityCategory> = {
  park: 'park',
  library: 'library',
  restaurant: 'restaurant',
  'cultural-event': 'cultural_event',
  'cultural-reservation': 'cultural_reservation',
  'cooling-center': 'cooling_shelter',
};

const SEARCH_TO_PUBLIC_SLUG: Partial<Record<SearchItem['category'], string>> = {
  park: 'park',
  library: 'library',
  restaurant: 'restaurant',
  cultural_event: 'cultural-event',
  cultural_reservation: 'cultural-reservation',
  cooling_center: 'cooling-center',
};

const normalized = (value?: string) =>
  (value || '').toLocaleLowerCase('ko-KR').replace(/[\s\-_.()[\]]/g, '');

interface PublicPlaceResponse {
  name: string;
  address: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  latitude: number | null;
  longitude: number | null;
  reservable: boolean | null;
}

/**
 * 검색 결과·공개 장소 URL에서 지도의 같은 장소를 찾아 선택하고, URL을 동기화한다.
 */
export function useSearchReveal() {
  const searchParams = useSearchParams();
  const deepLinkAppliedRef = useRef<string | null>(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const { revealPosition, mapStatus } = useMapContext();
  const { facilities, activateCategory, addTransientFacility, selectFacility, clearSelection } =
    useFacilityContext();
  const clearRule = useNaturalLanguageRuleStore(state => state.clearRule);

  const revealFacility = useCallback(
    (facility: Facility, selectionSource: SelectionSource = 'search_result') => {
      if (!isValidSeoulCoordinate(facility.position.lat, facility.position.lng)) {
        throw new Error('선택한 장소의 위치 정보가 올바르지 않습니다.');
      }
      addTransientFacility(facility);
      activateCategory(facility.category);
      selectFacility(facility, selectionSource);
      revealPosition(facility.position, { minLevel: 4 });
      setSelectionMessage(`${facility.name} 위치로 이동했습니다.`);
    },
    [activateCategory, addTransientFacility, revealPosition, selectFacility]
  );

  const resolveSearchFacility = useCallback(
    async (searchItem: SearchItem): Promise<Facility> => {
      const category = SEARCH_TO_FACILITY_CATEGORY[searchItem.category];
      const itemName = normalized(searchItem.name);
      const itemAddress = normalized(searchItem.address);
      const existing = facilities.find(facility => {
        if (facility.category !== category) return false;
        if (String(facility.id) === String(searchItem.ref_id || searchItem.id)) return true;
        if (normalized(facility.name) !== itemName) return false;
        return !itemAddress || !facility.address || normalized(facility.address) === itemAddress;
      });
      if (existing) return existing;

      if (
        searchItem.position &&
        isValidSeoulCoordinate(searchItem.position.lat, searchItem.position.lng)
      ) {
        return {
          id: searchItem.id,
          name: searchItem.name,
          address: searchItem.address || '',
          category,
          position: searchItem.position,
          congestionLevel: 'low',
          description: searchItem.remark,
        };
      }
      if (searchItem.category === 'subway' || searchItem.category === 'bike') {
        throw new Error('선택한 교통 시설의 위치를 찾을 수 없습니다.');
      }
      const response = await fetch(`/api/search/data/${encodeURIComponent(searchItem.id)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('장소 상세 정보를 불러오지 못했습니다.');
      const detail = await response.json();
      const converted = convertSearchResultToFacility(searchItem.category, detail, searchItem);
      if (!converted) throw new Error('선택한 장소의 위치를 확인할 수 없습니다.');
      return converted;
    },
    [facilities]
  );

  const handleSearchSelect = useCallback(
    async (searchItem: SearchItem) => {
      try {
        const facility = await resolveSearchFacility(searchItem);
        revealFacility(facility);
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('lat', String(facility.position.lat));
        nextUrl.searchParams.set('lng', String(facility.position.lng));
        const publicSlug = SEARCH_TO_PUBLIC_SLUG[searchItem.category];
        if (publicSlug && searchItem.ref_id !== undefined) {
          nextUrl.searchParams.set('place', `${publicSlug}:${searchItem.ref_id}`);
        } else {
          nextUrl.searchParams.delete('place');
        }
        window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '검색 결과를 지도에 표시하지 못했습니다.';
        setSelectionMessage(message);
        throw error;
      }
    },
    [resolveSearchFacility, revealFacility]
  );

  const handleSearchClear = useCallback(() => {
    clearSelection();
    clearRule();
    setSelectionMessage('');
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('place');
    window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`);
  }, [clearRule, clearSelection]);

  // /?place=slug:id 딥링크 → 공개 장소 API로 좌표를 받아 지도에서 선택한다.
  useEffect(() => {
    const placeParam = searchParams?.get('place');
    if (!placeParam || !mapStatus.success || deepLinkAppliedRef.current === placeParam) return;
    const separatorIndex = placeParam.lastIndexOf(':');
    if (separatorIndex <= 0) return;
    const categorySlug = placeParam.slice(0, separatorIndex);
    const id = Number(placeParam.slice(separatorIndex + 1));
    const category = PUBLIC_TO_FACILITY_CATEGORY[categorySlug];
    if (!category || !Number.isSafeInteger(id) || id <= 0) return;

    deepLinkAppliedRef.current = placeParam;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(
          env.createPublicBackendEndpoint(
            `/api/public/places/${encodeURIComponent(categorySlug)}/${id}`
          ),
          { cache: 'no-store', signal: controller.signal }
        );
        if (!response.ok) throw new Error('공개 장소 정보를 불러오지 못했습니다.');
        const place = (await response.json()) as PublicPlaceResponse;
        if (
          place.latitude === null ||
          place.longitude === null ||
          !isValidSeoulCoordinate(place.latitude, place.longitude)
        ) {
          throw new Error('공개 장소의 위치 정보가 없습니다.');
        }
        revealFacility(
          {
            id: `public:${categorySlug}:${id}`,
            name: place.name,
            address: place.address || '',
            description: place.description || undefined,
            phone: place.phone || undefined,
            website: place.website || undefined,
            operatingHours: place.openingHours || undefined,
            isReservable: place.reservable || false,
            category,
            position: { lat: place.latitude, lng: place.longitude },
            congestionLevel: 'low',
          },
          'public_place'
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        deepLinkAppliedRef.current = null;
        setSelectionMessage(
          error instanceof Error ? error.message : '장소를 지도에 표시하지 못했습니다.'
        );
      }
    })();
    return () => controller.abort();
  }, [mapStatus.success, revealFacility, searchParams]);

  return { handleSearchSelect, handleSearchClear, selectionMessage };
}
