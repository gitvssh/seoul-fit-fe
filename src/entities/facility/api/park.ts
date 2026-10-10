import type { Park } from '@/lib/types';

export async function getNearbyParks(lat: number, lng: number): Promise<Park[]> {
  try {
    const response = await fetch(`/api/parks?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      throw new Error(`공원 API 호출 실패: ${response.status}`);
    }

    const parks = await response.json();
    return parks;
  } catch (error) {
    console.error('공원 데이터 조회 실패:', error);
    throw error;
  }
}
