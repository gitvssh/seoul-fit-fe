/**
 * @fileoverview 체육시설 커스텀 훅
 * @description 체육시설 데이터 관리를 위한 React Hook
 */

import { useState, useCallback } from 'react';
import { getSportsNearby, getAllSports } from '@/shared/api/sports';
import type { Facility } from '@/entities/facility/model/types';

export function useSportsFacilities() {
  const [sportsFacilities, setSportsFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 위치 기반 체육시설 조회
  const fetchSportsFacilities = useCallback(async (lat: number, lng: number, radius: number = 2) => {
    console.log('[useSportsFacilities] 체육시설 데이터 조회 시작:', { radius });
    setLoading(true);
    setError(null);
    
    try {
      const facilities = await getSportsNearby(lat, lng, radius);
      console.log(`[useSportsFacilities] 체육시설 ${facilities.length}개 조회 완료`);
      setSportsFacilities(facilities);
      return facilities;
    } catch (err) {
      const errorMsg = '체육시설 조회 실패';
      console.error(errorMsg, err);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 모든 체육시설 조회
  const fetchAllSportsFacilities = useCallback(async () => {
    console.log('[useSportsFacilities] 모든 체육시설 데이터 조회 시작');
    setLoading(true);
    setError(null);
    
    try {
      const facilities = await getAllSports();
      console.log(`[useSportsFacilities] 체육시설 ${facilities.length}개 조회 완료`);
      setSportsFacilities(facilities);
      return facilities;
    } catch (err) {
      const errorMsg = '체육시설 전체 조회 실패';
      console.error(errorMsg, err);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 체육시설 초기화
  const clearSportsFacilities = useCallback(() => {
    setSportsFacilities([]);
    setError(null);
  }, []);

  return {
    sportsFacilities,
    loading,
    error,
    fetchSportsFacilities,
    fetchAllSportsFacilities,
    clearSportsFacilities,
  };
}
