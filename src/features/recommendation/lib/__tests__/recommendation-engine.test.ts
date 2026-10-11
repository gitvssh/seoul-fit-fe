import type { Facility, WeatherData } from '@/lib/types';
import { isFacilityIndoor } from '@/features/place-filter/lib/place-filter';
import {
  getNearbyAlternatives,
  isHotWeather,
  isRainyWeather,
  mergeDuplicatePlaces,
  normalizePlaceName,
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
const cityHallLine1: Facility = {
  id: 'subway-0150',
  name: '시청',
  category: 'subway',
  position: { lat: 37.5647, lng: 126.9772 },
  address: '',
  congestionLevel: 'medium',
  subwayStation: { route: '1호선', stationName: '시청' },
};
const cityHallLine2: Facility = {
  ...cityHallLine1,
  id: 'subway-0201',
  position: { lat: 37.5657, lng: 126.9769 },
  subwayStation: { route: '2호선', stationName: '시청' },
};
const bikeStation: Facility = {
  ...park,
  id: 'bike-1',
  name: '시청역 대여소',
  category: 'bike',
};
const rain: WeatherData = {
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
};
const now = new Date(2026, 6, 25, 12, 0);

describe('recommendation engine', () => {
  it('weather risk predicates are conservative and deterministic', () => {
    expect(isRainyWeather({ ...rain, PRECIPITATION: '1', SENSIBLE_TEMP: '26' })).toBe(true);
    expect(
      isHotWeather({
        ...rain,
        WEATHER_STTS: '맑음',
        TEMP: '32',
        SENSIBLE_TEMP: '34',
        PRECIPITATION: '0',
      })
    ).toBe(true);
  });

  it('rainy preset ranks an indoor place above an outdoor place with explanations', () => {
    const recommendations = recommendFacilities([park, library], {
      origin: library.position,
      now,
      preset: 'rainy_day',
      weather: rain,
    });

    expect(recommendations[0].facility.id).toBe(library.id);
    expect(recommendations[0].reasonCodes).toContain('indoor');
    expect(recommendations[1].warningCodes).toContain('rain_risk');
  });

  it('never presents a subway station as an indoor rainy-day destination', () => {
    expect(isFacilityIndoor(cityHallLine1)).toBe(false);

    const recommendations = recommendFacilities([cityHallLine1, cityHallLine2, park, library], {
      origin: cityHallLine1.position,
      now,
      preset: 'rainy_day',
      weather: rain,
    });

    expect(recommendations.map(item => item.facility.category)).not.toContain('subway');
    expect(recommendations[0].facility.id).toBe(library.id);
  });

  it('excludes transit categories from situation presets but keeps them for bike trips and no preset', () => {
    const facilities = [cityHallLine1, bikeStation, park, library];
    const categoriesFor = (preset: Parameters<typeof recommendFacilities>[1]['preset']) =>
      recommendFacilities(facilities, { origin: park.position, now, preset }).map(
        item => item.facility.category
      );

    expect(categoriesFor('available_now')).toEqual(expect.not.arrayContaining(['subway', 'bike']));
    expect(categoriesFor('quiet')).toEqual(expect.not.arrayContaining(['subway', 'bike']));
    expect(categoriesFor('bike_trip')).toContain('bike');
    expect(categoriesFor('bike_trip')).not.toContain('subway');
    expect(categoriesFor('none')).toEqual(expect.arrayContaining(['subway', 'bike']));
  });

  it('scores distance from the given origin rather than a fixed default', () => {
    const farOrigin = { lat: 37.4979, lng: 127.0276 };
    const fromLibrary = scoreFacility(park, { origin: library.position, now, preset: 'none' });
    const fromGangnam = scoreFacility(park, { origin: farOrigin, now, preset: 'none' });

    expect(fromLibrary.facility.distance).toBeLessThan(1);
    expect(fromGangnam.facility.distance).toBeGreaterThan(5);
    expect(fromLibrary.factors.distance).toBe(20);
    expect(fromGangnam.factors.distance).toBeLessThanOrEqual(10);
    expect(fromLibrary.reasonCodes).toContain('nearby');
    expect(fromGangnam.reasonCodes).not.toContain('nearby');
  });

  it('merges transfer stations with the same name within 150 m and keeps the routes', () => {
    const farCityHall: Facility = {
      ...cityHallLine1,
      id: 'subway-far',
      position: { lat: 37.571, lng: 126.9772 },
      subwayStation: { route: '5호선', stationName: '시청' },
    };
    const merged = mergeDuplicatePlaces([cityHallLine1, cityHallLine2, farCityHall, park]);

    expect(merged).toHaveLength(3);
    expect(merged[0].id).toBe(cityHallLine1.id);
    expect(merged[0].routes).toEqual(['1호선', '2호선']);
    expect(merged[0].mergedIds).toEqual([cityHallLine2.id]);
    expect(merged[1].id).toBe(farCityHall.id);
    expect(merged[2].routes).toBeUndefined();
    expect(normalizePlaceName('시청 (2호선)')).toBe('시청');

    const recommendations = recommendFacilities([cityHallLine1, cityHallLine2], {
      origin: cityHallLine1.position,
      now,
      preset: 'none',
    });
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].facility.routes).toEqual(['1호선', '2호선']);
  });

  it('returns neutral points and warnings when hours, freshness and live data are missing', () => {
    const recommendation = scoreFacility(
      { ...library, operatingHours: undefined },
      { origin: library.position, now, preset: 'none' }
    );
    expect(recommendation.factors.open).toBe(7);
    expect(recommendation.factors.freshness).toBe(5);
    expect(recommendation.factors.interest).toBe(12);
    expect(recommendation.factors.preset).toBe(0);
    expect(recommendation.factors.risk).toBe(0);
    expect(recommendation.reasonCodes).not.toContain('preset_match');
    expect(recommendation.warningCodes).toEqual(
      expect.arrayContaining(['hours_unknown', 'freshness_unknown'])
    );
    expect(recommendation.warningCodes).not.toContain('rain_risk');
    expect(recommendation.score).toBeGreaterThanOrEqual(0);
    expect(recommendation.score).toBeLessThanOrEqual(100);
  });

  it('returns up to three nearby alternatives without the selected place or its duplicates', () => {
    const alternatives = getNearbyAlternatives(
      library,
      [
        library,
        park,
        { ...park, id: 'park-2', name: '한강공원', position: { lat: 37.57, lng: 126.982 } },
        { ...park, id: 'park-3', name: '남산공원', position: { lat: 37.572, lng: 126.984 } },
        { ...park, id: 'park-dup' },
      ],
      { now, preset: 'available_now' }
    );
    expect(alternatives).toHaveLength(3);
    expect(alternatives.every(item => item.facility.id !== library.id)).toBe(true);
    expect(alternatives.map(item => item.facility.id)).not.toContain('park-dup');

    const stationAlternatives = getNearbyAlternatives(
      cityHallLine1,
      [cityHallLine1, cityHallLine2, park],
      { now, preset: 'none' }
    );
    expect(stationAlternatives.map(item => item.facility.id)).toEqual([park.id]);
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
