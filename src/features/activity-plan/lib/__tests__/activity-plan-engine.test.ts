import type { Facility } from '@/lib/types';
import { createActivityPlan, hasRepeatedPlace } from '../activity-plan-engine';

const origin = { lat: 37.5665, lng: 126.978 };
const now = new Date('2026-07-25T12:00:00+09:00');
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
const cityHall = (id: string, route: string, lat: number): Facility => ({
  id,
  name: '시청',
  category: 'subway',
  address: '',
  position: { lat, lng: 126.9772 },
  congestionLevel: 'medium',
  subwayStation: { route, stationName: '시청' },
});

describe('activity plan engine', () => {
  it.each([30, 60, 90, 120, 180] as const)(
    'keeps a %i minute plan inside the budget with 2-3 Seoul stops',
    budgetMinutes => {
      const plan = createActivityPlan(facilities, { origin, budgetMinutes, now });

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
      now,
    });

    expect(plan?.stops.some(stop => stop.facility.category === 'library')).toBe(true);
    expect(plan?.stops[0].arrivalOffsetMinutes).toBe(plan?.stops[0].travelMinutes);
    expect(plan?.summary).toContain('이동');
    expect(plan?.warningCodes).toEqual(['straight_line_estimate']);
    expect(plan?.warnings[0]).toContain('직선거리');
  });

  it('never visits the same station twice and leaves transit out of the itinerary', () => {
    const plan = createActivityPlan(
      [cityHall('0150', '1호선', 37.5647), cityHall('0201', '2호선', 37.5657), ...facilities],
      { origin, budgetMinutes: 90, now }
    );

    expect(plan).not.toBeNull();
    const names = plan!.stops.map(stop => stop.facility.name);
    expect(new Set(names).size).toBe(names.length);
    expect(plan!.stops.every(stop => stop.facility.category !== 'subway')).toBe(true);
    expect(
      hasRepeatedPlace([cityHall('a', '1호선', 37.5647), cityHall('b', '2호선', 37.5657)])
    ).toBe(true);
    expect(hasRepeatedPlace(facilities)).toBe(false);
  });

  it('prefers category variety over three places of the same kind', () => {
    const parks: Facility[] = [1, 2, 3].map(index => ({
      ...facilities[0],
      id: `park-${index}`,
      name: `공원 ${index}`,
      position: { lat: 37.5665 + index * 0.0005, lng: 126.978 },
      operatingHours: '00:00~24:00',
    }));
    const plan = createActivityPlan([...parks, facilities[1], facilities[2]], {
      origin,
      budgetMinutes: 120,
      now,
    });

    expect(plan).not.toBeNull();
    const categories = plan!.stops.map(stop => stop.facility.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('flags unknown hours and returns null when fewer than two valid places are available', () => {
    const plan = createActivityPlan(
      [facilities[0], { ...facilities[1], operatingHours: undefined }],
      { origin, budgetMinutes: 60, now }
    );
    expect(plan?.warningCodes).toEqual(['straight_line_estimate', 'hours_unknown']);

    expect(
      createActivityPlan(facilities.slice(0, 1), { origin, budgetMinutes: 60, now: new Date() })
    ).toBeNull();
    expect(
      createActivityPlan(facilities, { origin: { lat: 0, lng: 0 }, budgetMinutes: 60, now })
    ).toBeNull();
  });
});
