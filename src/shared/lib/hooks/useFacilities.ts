// hooks/useFacilities.ts
import React, { useState, useEffect, useCallback } from 'react';
import type { Facility } from '@/lib/types';

export interface UseFacilitiesOptions {
  userLocation?: { lat: number; lng: number };
  searchRadius?: number;
}

export const useFacilities = (options: UseFacilitiesOptions = {}) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시설 데이터 새로고침
  const refreshFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 실제로는 여기서 API를 호출하지만, 현재는 빈 배열 반환
      // 각 Provider가 개별적으로 데이터를 가져오므로 여기서는 기본 시설만 관리
      setFacilities([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    refreshFacilities();
  }, [refreshFacilities]);

  return {
    facilities,
    loading,
    error,
    refreshFacilities,
  };
};
