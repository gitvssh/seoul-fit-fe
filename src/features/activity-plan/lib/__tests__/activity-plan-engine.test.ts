import type { Facility } from '@/lib/types';
import { createActivityPlan } from '../activity-plan-engine';

const origin = { lat: 37.5665, lng: 126.978 };
const facilities: Facility[] = [
  {
    id: 'park-1',
    name: '공원',
    category: 'park',
    address: '서울',
    position: { lat: 37.567, lng: 126.979 },
    congestionLevel: 'low',
    operatingHours: '09:00~22:00',
  },
  {
    id: 'library-1',
    name: '도서관',
    category: 'library',
    address: '서울',
    position: { lat: 37.568, lng: 126.98 },
    congestionLevel: 'low',
    operatingHours: '09:00~22:00',
  },
  {
    id: 'culture-1',
    name: '문화공간',
    category: 'culture',
    address: '서울',
    position: { lat: 37.569, lng: 126.981 },
    congestionLevel: 'low',
    operatingHours: '09:00~22:00',
  },
  {
    id: 'outside',
    name: '서울 밖',
    category: 'park',
    address: '외부',
    position: { lat: 36.5, lng: 127 },
    congestionLevel: 'low',
  },
];

describe('activity plan engine', () => {
  it.each([30, 60, 90, 120, 180] as const)(
    'keeps a %i minute plan inside the budget with 2-3 Seoul stops',
    budgetMinutes => {
      const plan = createActivityPlan(facilities, {
        origin,
        budgetMinutes,
        now: new Date('2026-07-25T12:00:00+09:00'),
      });

      expect(plan).not.toBeNull();
      expect(plan!.totalMinutes).toBeLessThanOrEqual(budgetMinutes);
      expect(plan!.stops.length).toBeGreaterThanOrEqual(2);
      expect(plan!.stops.length).toBeLessThanOrEqual(3);
      expect(plan!.stops.every(stop => stop.facility.id !== 'outside')).toBe(true);
    }
  );

  it('favors preferred categories while preserving an explainable order', () => {
    const plan = createActivityPlan(facilities, {
      origin,
      budgetMinutes: 60,
      preferredCategories: ['library'],
      now: new Date('2026-07-25T12:00:00+09:00'),
    });

    expect(plan?.stops.some(stop => stop.facility.category === 'library')).toBe(true);
    expect(plan?.stops[0].arrivalOffsetMinutes).toBe(plan?.stops[0].travelMinutes);
    expect(plan?.summary).toContain('이동');
  });

  it('returns null when fewer than two valid places are available', () => {
    expect(
      createActivityPlan(facilities.slice(0, 1), {
        origin,
        budgetMinutes: 60,
        now: new Date(),
      })
    ).toBeNull();
  });
});
