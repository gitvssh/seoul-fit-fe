/**
 * @fileoverview 새로운 지도 컨테이너 (리팩토링된 버전)
 * @description 프로바이더 패턴을 사용한 모듈화된 지도 컨테이너
 * @author Seoul Fit Team
 * @since 2.0.0
 */

'use client';

import React, { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapProvider, useMapContext } from './providers/MapProvider';
import { FacilityProvider, useFacilityContext } from './providers/FacilityProvider';
import { MapView } from './MapView';
import { ClusterBottomSheetWrapper } from './ClusterBottomSheetWrapper';
import { FacilityBottomSheetWrapper } from './FacilityBottomSheetWrapper';
import SideBar from '@/shared/ui/layout/SideBar';
import type { 
  UserPreferences, 
  FacilityCategory, 
  Position,
  Facility,
  ClusteredFacility 
} from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { convertSearchResultToFacility } from '@/shared/api/searchDetail';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';
import { env } from '@/config/environment';

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

function normalized(value?: string): string {
  return (value || '').toLocaleLowerCase('ko-KR').replace(/[\s\-_.()[\]]/g, '');
}

// MapContainer Props
interface MapContainerProps {
  /** CSS 클래스명 */
  className?: string;
  /** 사용자 선호도 */
  preferences?: UserPreferences;
  /** 선호도 토글 핸들러 */
  onPreferenceToggle?: (category: FacilityCategory) => void;
  /** 지도 클릭 핸들러 */
  onMapClick?: () => void;
  /** 위치 리셋 핸들러 */
  onLocationReset?: () => void;
  /** 초기 중심 좌표 */
  initialCenter?: Position;
  /** 초기 줌 레벨 */
  initialZoom?: number;
  /** 사이드바 열림 상태 */
  isSidebarOpen?: boolean;
  /** 사이드바 닫기 핸들러 */
  onSidebarClose?: () => void;
  /** 로그인 핸들러 */
  onLogin?: () => void;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
  /** 경고 표시 상태 */
  showWarning?: boolean;
  /** 경고 닫기 핸들러 */
  onWarningClose?: () => void;
}

// Ref 인터페이스 (기존 호환성 유지)
export interface MapContainerRef {
  handleSearchSelect: (searchItem: SearchItem) => Promise<void>;
  handleSearchClear: () => void;
}

/**
 * 지도 컨테이너 컴포넌트 (리팩토링된 버전)
 * 
 * 주요 개선사항:
 * - 프로바이더 패턴을 통한 상태 관리 분리
 * - 단일 책임 원칙 준수
 * - 컴포넌트 크기 대폭 축소 (827줄 → 140줄)
 * - 관심사 분리를 통한 유지보수성 향상
 */
// 내부 컴포넌트 - FacilityContext 사용
const MapContainerInner: React.FC<MapContainerProps & { forwardedRef: React.Ref<MapContainerRef> }> = ({
  className,
  onMapClick,
  isSidebarOpen,
  onSidebarClose,
  onLogin,
  onLogout,
  showWarning,
  onWarningClose,
  forwardedRef,
}) => {
  const searchParams = useSearchParams();
  const deepLinkAppliedRef = React.useRef<string | null>(null);
  const [selectionMessage, setSelectionMessage] = React.useState('');
  const { panTo, setZoom, mapStatus } = useMapContext();
  const {
    facilities,
    activeCategories,
    toggleCategory,
    activateCategory,
    addTransientFacility,
    selectFacility,
  } = useFacilityContext();

  const revealFacility = useCallback(
    (
      facility: Facility,
      selectionSource: 'public_place' | 'search_result' = 'search_result'
    ) => {
      if (!isValidSeoulCoordinate(facility.position.lat, facility.position.lng)) {
        throw new Error('선택한 장소의 위치 정보가 올바르지 않습니다.');
      }

      addTransientFacility(facility);
      activateCategory(facility.category);
      panTo(facility.position);
      setZoom(3);
      selectFacility(facility, selectionSource);
      setSelectionMessage(`${facility.name} 위치로 이동했습니다.`);
    },
    [activateCategory, addTransientFacility, panTo, selectFacility, setZoom]
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
      if (!response.ok) {
        throw new Error('장소 상세 정보를 불러오지 못했습니다.');
      }

      const detail = await response.json();
      const converted = convertSearchResultToFacility(searchItem.category, detail, searchItem);
      if (!converted) {
        throw new Error('선택한 장소의 위치를 확인할 수 없습니다.');
      }
      return converted;
    },
    [facilities]
  );
  
  // console.log('[MapContainerInner] 렌더링됨');
  // console.log('[MapContainerInner] isSidebarOpen:', isSidebarOpen);
  // console.log('[MapContainerInner] activeCategories:', activeCategories);
  // console.log('[MapContainerInner] toggleCategory 함수 존재:', !!toggleCategory);
  
  React.useImperativeHandle(
    forwardedRef,
    () => ({
      handleSearchSelect: async (searchItem: SearchItem) => {
        try {
          const facility = await resolveSearchFacility(searchItem);
          revealFacility(facility);

          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('lat', String(facility.position.lat));
          nextUrl.searchParams.set('lng', String(facility.position.lng));
          const publicSlug = SEARCH_TO_PUBLIC_SLUG[searchItem.category];
          if (publicSlug && searchItem.ref_id !== undefined) {
            nextUrl.searchParams.set(
              'place',
              `${publicSlug}:${searchItem.ref_id}`
            );
          }
          window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '검색 결과를 지도에 표시하지 못했습니다.';
          setSelectionMessage(message);
          throw error;
        }
      },
      handleSearchClear: () => {
        selectFacility(null);
        setSelectionMessage('');
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('place');
        window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`);
      },
    }),
    [resolveSearchFacility, revealFacility, selectFacility]
  );

  React.useEffect(() => {
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

        const place = (await response.json()) as {
          name: string;
          address: string | null;
          description: string | null;
          phone: string | null;
          website: string | null;
          openingHours: string | null;
          latitude: number | null;
          longitude: number | null;
          reservable: boolean | null;
        };
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
  
  return (
    <>
      <div className={className}>
        <Suspense fallback={<div className='h-full w-full' aria-busy='true' />}>
          <MapView />
        </Suspense>
        <ClusterBottomSheetWrapper />
        <FacilityBottomSheetWrapper />
        <p className='sr-only' role='status' aria-live='polite'>
          {selectionMessage}
        </p>
      </div>
      
      {/* 사이드바 - 맵 마커 토글용 (백엔드 업데이트 없음) */}
      {isSidebarOpen !== undefined && (
        <SideBar
          isOpen={isSidebarOpen}
          onClose={onSidebarClose || (() => {})}
          activeCategories={activeCategories}
          onCategoryToggle={toggleCategory} // 로컬 상태만 업데이트
          showWarning={showWarning}
          onWarningClose={onWarningClose}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      )}
    </>
  );
};

// MapContainer - FacilityProvider로 감싸기
const MapContainer = React.forwardRef<MapContainerRef, MapContainerProps>(
  ({ 
    className,
    preferences, 
    onPreferenceToggle, 
    onMapClick, 
    onLocationReset,
    initialCenter = { lat: 37.5665, lng: 126.978 },
    initialZoom = 3,
    isSidebarOpen,
    onSidebarClose,
    onLogin,
    onLogout,
    showWarning,
    onWarningClose,
  }, ref) => {
    // console.log('[MapContainer] 렌더링 시작');
    // console.log('[MapContainer] Props:', { preferences, initialCenter, initialZoom });
    
    // 지도 클릭 핸들러
    const handleMapClick = useCallback((position: Position) => {
      console.log('Map clicked');
      onMapClick?.();
    }, [onMapClick]);

    // 지도 유휴 상태 핸들러
    const handleMapIdle = useCallback(() => {
      console.log('Map idle');
      // 필요시 추가 로직 구현
    }, []);

    // 시설 선택 핸들러
    const handleFacilitySelect = useCallback((facility: Facility | null) => {
      console.log('Facility selected:', facility);
      // 필요시 추가 로직 구현
    }, []);

    // 클러스터 선택 핸들러
    const handleClusterSelect = useCallback((cluster: ClusteredFacility | null) => {
      console.log('Cluster selected:', cluster);
      // 필요시 추가 로직 구현
    }, []);

    return (
      <MapProvider
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        containerId="kakaoMap"
        onMapClick={handleMapClick}
        onMapIdle={handleMapIdle}
      >
        <FacilityProvider
          userPreferences={preferences}
          onPreferenceChange={undefined} // 백엔드 업데이트 비활성화
          onFacilitySelect={handleFacilitySelect}
          onClusterSelect={handleClusterSelect}
        >
          <MapContainerInner
            className={className}
            onMapClick={onMapClick}
            isSidebarOpen={isSidebarOpen}
            onSidebarClose={onSidebarClose}
            onLogin={onLogin}
            onLogout={onLogout}
            showWarning={showWarning}
            onWarningClose={onWarningClose}
            forwardedRef={ref}
          />
        </FacilityProvider>
      </MapProvider>
    );
  }
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
