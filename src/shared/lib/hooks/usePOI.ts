import { useState, useCallback } from 'react';
import { POIData } from '@/lib/types';
import { getNearbyPOIs } from '@/shared/api/poi';

interface UsePOIState {
  pois: POIData[];
  loading: boolean;
  error: string | null;
}

export const usePOI = () => {
  const [state, setState] = useState<UsePOIState>({
    pois: [],
    loading: false,
    error: null,
  });

  const fetchNearbyPOIs = useCallback(async (lat: number, lng: number, radius: number = 1.5) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const pois = await getNearbyPOIs(lat, lng, radius);

      setState(prev => ({
        ...prev,
        pois,
        loading: false,
        error: null,
      }));

      return pois;
    } catch (error) {
      console.error('POI 데이터 조회 실패:', error);
      setState(prev => ({
        ...prev,
        pois: [],
        loading: false,
        error: 'POI 정보를 불러오는데 실패했습니다.',
      }));
      return [];
    }
  }, []);

  const clearPOIs = useCallback(() => {
    setState({
      pois: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchNearbyPOIs,
    clearPOIs,
  };
};
