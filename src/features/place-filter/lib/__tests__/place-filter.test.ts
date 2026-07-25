import type { Facility } from '@/lib/types';
import {
  applyPlaceFilters,
  calculateDistanceKm,
  getFacilityOpenState,
  isFacilityIndoor,
  isFacilityReservable,
} from '../place-filter';
import { DEFAULT_PLACE_FILTERS } from '../../model/types';

const baseFacility: Facility = {
  id: 'library-1',
  name: '테스트 도서관',
  category: 'library',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울특별시 중구',
  operatingHours: '09:00~18:00',
  congestionLevel: 'low',
};

describe('place filter', () => {
  it('명시된 운영시간과 자정을 넘기는 시간을 판정한다', () => {
    expect(getFacilityOpenState('09:00~18:00', new Date(2026, 0, 1, 10, 0))).toBe('open');
    expect(getFacilityOpenState('09:00~18:00', new Date(2026, 0, 1, 19, 0))).toBe('closed');
    expect(getFacilityOpenState('18:00~02:00', new Date(2026, 0, 1, 1, 0))).toBe('open');
    expect(getFacilityOpenState(undefined)).toBe('unknown');
  });

  it('예약 및 실내 여부를 명시값과 시설 정보로 판정한다', () => {
    expect(isFacilityReservable({ ...baseFacility, reservationUrl: 'https://example.com' })).toBe(
      true
    );
    expect(isFacilityIndoor(baseFacility)).toBe(true);
    expect(isFacilityIndoor({ ...baseFacility, isIndoor: false })).toBe(false);
  });

  it('거리를 계산하고 복합 조건으로 필터링한다', () => {
    const outdoorPark: Facility = {
      ...baseFacility,
      id: 'park-1',
      name: '공원',
      category: 'park',
      position: { lat: 37.5765, lng: 126.978 },
      operatingHours: undefined,
      congestionLevel: 'high',
    };
    const result = applyPlaceFilters(
      [outdoorPark, baseFacility],
      baseFacility.position,
      { ...DEFAULT_PLACE_FILTERS, openOnly: true, indoorOnly: true },
      new Date(2026, 0, 1, 10, 0)
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(baseFacility.id);
    expect(calculateDistanceKm(baseFacility.position, outdoorPark.position)).toBeGreaterThan(1);
  });
});
