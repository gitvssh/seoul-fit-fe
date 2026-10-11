import type { Facility } from '@/lib/types';
import { DAILY_FRESHNESS_THRESHOLDS, FRESHNESS_THRESHOLDS } from '@/shared/lib/freshness';
import { getFacilityFreshnessThresholds, getFacilityProvenance } from '../provenance';

const facility: Facility = {
  id: 'bike-1',
  name: '시청역 대여소',
  category: 'bike',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울특별시 중구',
  congestionLevel: 'low',
};
const now = new Date('2026-07-25T12:00:00+09:00');

describe('facility provenance', () => {
  it('갱신 시각이 없으면 미확인으로 표시한다', () => {
    const provenance = getFacilityProvenance(facility, now);
    expect(provenance.freshness).toBe('unknown');
    expect(provenance.freshnessLabelKey).toBe('freshness.unknown');
    expect(provenance.freshnessLabel).toBe('기준 시각 미확인');
    expect(provenance.updatedLabel).toBe('확인되지 않음');
    expect(provenance.updatedAt).toBeUndefined();
    expect(provenance.sourceLabel).toBe('서울자전거 따릉이');
  });

  it('실시간 원천(따릉이)은 공통 15/60분 임계값으로 판정한다', () => {
    expect(getFacilityFreshnessThresholds('bike')).toEqual(FRESHNESS_THRESHOLDS);
    expect(
      getFacilityProvenance({ ...facility, sourceUpdatedAt: '2026-07-25T11:50:00+09:00' }, now)
        .freshness
    ).toBe('live');
    expect(
      getFacilityProvenance({ ...facility, sourceUpdatedAt: '2026-07-25T10:30:00+09:00' }, now)
        .freshness
    ).toBe('stale');
  });

  it('하루 단위 원천(도서관 등)은 24시간 프로필을 쓰고 배지에 같은 임계값을 넘긴다', () => {
    const library: Facility = { ...facility, id: 'lib', category: 'library' };
    expect(getFacilityFreshnessThresholds('library')).toEqual(DAILY_FRESHNESS_THRESHOLDS);
    const morning = getFacilityProvenance(
      { ...library, sourceUpdatedAt: '2026-07-25T06:00:00+09:00' },
      now
    );
    expect(morning.freshness).toBe('recent');
    expect(morning.thresholds).toEqual(DAILY_FRESHNESS_THRESHOLDS);
    expect(morning.updatedAt).toBe('2026-07-25T06:00:00+09:00');
    expect(
      getFacilityProvenance({ ...library, sourceUpdatedAt: '2026-07-23T12:00:00+09:00' }, now)
        .freshness
    ).toBe('stale');
  });

  it('수집기가 판정한 신선도가 있으면 그 값을 우선한다', () => {
    expect(
      getFacilityProvenance(
        { ...facility, sourceUpdatedAt: '2026-07-25T11:59:00+09:00', freshnessStatus: 'stale' },
        now
      ).freshness
    ).toBe('stale');
  });
});
