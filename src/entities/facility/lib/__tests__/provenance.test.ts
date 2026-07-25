import type { Facility } from '@/lib/types';
import { getFacilityProvenance } from '../provenance';

const facility: Facility = {
  id: 'bike-1',
  name: '시청역 대여소',
  category: 'bike',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울특별시 중구',
  congestionLevel: 'low',
};

describe('facility provenance', () => {
  it('갱신 시각이 없으면 미확인으로 표시한다', () => {
    expect(getFacilityProvenance(facility).freshness).toBe('unknown');
  });

  it('갱신 경과 시간으로 신선도를 판정한다', () => {
    const now = new Date('2026-07-25T12:00:00+09:00');
    expect(
      getFacilityProvenance(
        { ...facility, sourceUpdatedAt: '2026-07-25T11:50:00+09:00' },
        now
      ).freshness
    ).toBe('live');
    expect(
      getFacilityProvenance(
        { ...facility, sourceUpdatedAt: '2026-07-23T12:00:00+09:00' },
        now
      ).freshness
    ).toBe('stale');
  });
});
