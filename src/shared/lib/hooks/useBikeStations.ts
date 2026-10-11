import { useState, useCallback, useEffect } from 'react';
import { getNearbyBikeStations, convertBikeStationToFacility } from '@/shared/api/bikeStation';
import type { BikeStationData, Facility } from '@/lib/types';

interface UseBikeStationsReturn {
  bikeStations: BikeStationData[];
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  fetchBikeStations: (lat: number, lng: number, radius?: number) => Promise<void>;
}

export const useBikeStations = (): UseBikeStationsReturn => {
  const [bikeStations, setBikeStations] = useState<BikeStationData[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBikeStations = useCallback(async (lat: number, lng: number, radius: number = 1.5) => {
    setLoading(true);
    setError(null);

    try {
      const stations = await getNearbyBikeStations(lat, lng, radius);

      if (stations && stations.length > 0) {
        setBikeStations(stations);

        // BikeStationData를 Facility로 변환
        const convertedFacilities = stations.map(station => convertBikeStationToFacility(station));
        setFacilities(convertedFacilities);
      } else {
        setBikeStations([]);
        setFacilities([]);
      }
    } catch (err) {
      console.error('[useBikeStations] 따릉이 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : '따릉이 데이터를 불러올 수 없습니다');
      setBikeStations([]);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bikeStations,
    facilities,
    loading,
    error,
    fetchBikeStations,
  };
};
