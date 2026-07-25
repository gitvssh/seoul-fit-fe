import { useState, useCallback } from 'react';
import type { Facility } from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { useSearchDetail } from './useSearchDetail';

export function useSearchMarker() {
  const [searchMarker, setSearchMarker] = useState<Facility | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { fetchSearchDetail, isLoading, error } = useSearchDetail();

  // 검색 결과 선택 시 마커 표시
  const selectSearchResult = useCallback(
    async (
      searchItem: SearchItem,
      onMapMove?: (lat: number, lng: number) => void,
      onShowDetail?: (facility: Facility) => void
    ) => {
      console.log('검색 결과 선택:', searchItem);
      setIsSearching(true);

      try {
        // 상세 데이터 조회
        const facility = await fetchSearchDetail(searchItem);
        console.log('조회된 시설 데이터:', facility);

        if (facility) {
          // 검색 마커 설정
          setSearchMarker(facility);
          console.log('검색 마커 설정 완료:', facility.name);

          // 좌표가 유효한 경우에만 지도 이동
          if (facility.position.lat !== 0 && facility.position.lng !== 0) {
            // 지도 중심 이동
            if (onMapMove) {
              console.log('검색 결과로 지도 이동');
              onMapMove(facility.position.lat, facility.position.lng);
            }
          } else {
            console.warn('유효한 좌표가 없어 지도 이동을 생략합니다.');
          }

          // 상세 바텀시트 표시
          if (onShowDetail) {
            console.log('상세 바텀시트 표시');
            onShowDetail(facility);
          }
        } else {
          console.error('시설 데이터 조회 실패');
        }
      } catch (err) {
        console.error('검색 결과 선택 실패:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [fetchSearchDetail]
  );

  // 검색 마커 제거
  const clearSearchMarker = useCallback(() => {
    console.log('검색 마커 제거 호출');
    setSearchMarker(null);
  }, []);

  // 다른 검색 결과 선택 시 이전 마커 자동 제거
  const selectNewSearchResult = useCallback(
    async (
      searchItem: SearchItem,
      onMapMove?: (lat: number, lng: number) => void,
      onShowDetail?: (facility: Facility) => void
    ) => {
      // 이전 마커 제거
      clearSearchMarker();

      // 새 마커 표시
      await selectSearchResult(searchItem, onMapMove, onShowDetail);
    },
    [selectSearchResult, clearSearchMarker]
  );

  return {
    searchMarker,
    isSearching: isSearching || isLoading,
    searchError: error,
    selectSearchResult: selectNewSearchResult,
    clearSearchMarker,
  };
}
