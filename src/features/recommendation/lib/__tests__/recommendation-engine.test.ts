import type { Facility } from '@/lib/types';
import {
  getNearbyAlternatives,
  isHotWeather,
  isRainyWeather,
  recommendFacilities,
  scoreFacility,
} from '../recommendation-engine';

const library: Facility = {
  id: 'library-1',
  name: '서울도서관',
  category: 'library',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울 중구',
  operatingHours: '09:00~21:00',
  congestionLevel: 'low',
  isIndoor: true,
};
const park: Facility = {
  ...library,
  id: 'park-1',
  name: '서울공원',
  category: 'park',
  position: { lat: 37.568, lng: 126.98 },
  isIndoor: false,
};
const now = new Date(2026, 6, 25, 12, 0);

describe('recommendation engine', () => {
  it('weather risk predicates are conservative and deterministic', () => {
    expect(
      isRainyWeather({
        AREA_NM: '서울',
        AREA_CD: 'POI',
        WEATHER_STTS: '비',
        TEMP: '25',
        SENSIBLE_TEMP: '26',
        MAX_TEMP: '',
        MIN_TEMP: '',
        HUMIDITY: '',
        PRECIPITATION: '1',
        PCP_MSG: '',
        UV_INDEX_LVL: '',
        UV_MSG: '',
        PM25_INDEX: '보통',
        PM10_INDEX: '보통',
      })
    ).toBe(true);
    expect(
      isHotWeather({
        AREA_NM: '서울',
        AREA_CD: 'POI',
        WEATHER_STTS: '맑음',
        TEMP: '32',
        SENSIBLE_TEMP: '34',
        MAX_TEMP: '',
        MIN_TEMP: '',
        HUMIDITY: '',
        PRECIPITATION: '0',
        PCP_MSG: '',
        UV_INDEX_LVL: '',
        UV_MSG: '',
        PM25_INDEX: '보통',
        PM10_INDEX: '보통',
      })
    ).toBe(true);
  });

  it('rainy preset ranks an indoor place above an outdoor place with explanations', () => {
    const recommendations = recommendFacilities([park, library], {
      origin: library.position,
      now,
      preset: 'rainy_day',
      weather: {
        AREA_NM: '서울',
        AREA_CD: 'POI',
        WEATHER_STTS: '비',
        TEMP: '25',
        SENSIBLE_TEMP: '25',
        MAX_TEMP: '',
        MIN_TEMP: '',
        HUMIDITY: '',
        PRECIPITATION: '2',
        PCP_MSG: '',
        UV_INDEX_LVL: '',
        UV_MSG: '',
        PM25_INDEX: '보통',
        PM10_INDEX: '보통',
      },
    });

    expect(recommendations[0].facility.id).toBe(library.id);
    expect(recommendations[0].reasonCodes).toContain('indoor');
    expect(recommendations[1].warningCodes).toContain('rain_risk');
  });

  it('returns neutral points and warnings for missing hours and freshness', () => {
    const recommendation = scoreFacility(
      { ...library, operatingHours: undefined },
      { origin: library.position, now, preset: 'available_now' }
    );
    expect(recommendation.factors.open).toBe(7);
    expect(recommendation.factors.freshness).toBe(5);
    expect(recommendation.warningCodes).toEqual(
      expect.arrayContaining(['hours_unknown', 'freshness_unknown'])
    );
  });

  it('returns up to three nearby alternatives without the selected place', () => {
    const alternatives = getNearbyAlternatives(
      library,
      [library, park, { ...park, id: 'park-2' }, { ...park, id: 'park-3' }],
      { now, preset: 'available_now' }
    );
    expect(alternatives).toHaveLength(3);
    expect(alternatives.every(item => item.facility.id !== library.id)).toBe(true);
  });

  it.each([
    ['available_now', library],
    ['quiet', library],
    ['rainy_day', library],
    [
      'today_event',
      {
        ...library,
        id: 'event-1',
        category: 'cultural_event',
        culturalEvent: {
          id: 'event-1',
          title: '오늘 전시',
          description: '',
          startDate: '2026-07-25',
          endDate: '2026-07-25',
          type: 'exhibition',
          requiresReservation: false,
        },
      },
    ],
    ['bike_trip', { ...park, id: 'bike-1', category: 'bike' }],
    ['cool_down', { ...library, id: 'shelter-1', category: 'cooling_shelter' }],
  ] as const)('%s preset uses the shared scoring engine', (preset, facility) => {
    const result = scoreFacility(facility as Facility, {
      origin: library.position,
      now,
      preset,
    });
    expect(result.factors.preset).toBeGreaterThanOrEqual(14);
    expect(result.reasonCodes).toContain('preset_match');
  });
});
