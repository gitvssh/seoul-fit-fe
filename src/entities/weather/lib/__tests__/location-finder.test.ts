import {
  findNearestAreaMatch,
  findNearestAreaMatches,
  findNearestLocation,
} from '../location-finder';
import { SEOUL_LOCATIONS as LIVE_DATA_AREAS } from '../../model/locations';
import { SEOUL_LOCATIONS } from '@/shared/lib/data/seoul-locations';

describe('findNearestLocation', () => {
  it('returns null when locations array is empty', () => {
    const result = findNearestLocation(37.5665, 126.978, []);
    expect(result).toBeNull();
  });

  it('finds the nearest location', () => {
    const testLocations = [
      { name: 'Location A', lat: 37.5665, lng: 126.978 },
      { name: 'Location B', lat: 37.57, lng: 126.98 },
      { name: 'Location C', lat: 37.56, lng: 126.97 },
    ];

    const result = findNearestLocation(37.5665, 126.978, testLocations);
    expect(result).toEqual({ name: 'Location A', lat: 37.5665, lng: 126.978 });
  });

  it('correctly calculates distance for different coordinates', () => {
    const testLocations = [
      { name: 'Far Location', lat: 37.6, lng: 127.0 },
      { name: 'Near Location', lat: 37.567, lng: 126.9785 },
      { name: 'Medium Location', lat: 37.57, lng: 126.985 },
    ];

    const result = findNearestLocation(37.5665, 126.978, testLocations);
    expect(result?.name).toBe('Near Location');
  });

  it('works with Seoul locations data', () => {
    // Test with actual Seoul locations
    const result = findNearestLocation(37.5665, 126.978, SEOUL_LOCATIONS);
    expect(result).toBeDefined();
    expect(result?.name).toBeDefined();
    expect(result?.lat).toBeDefined();
    expect(result?.lng).toBeDefined();
  });

  it('handles edge case with single location', () => {
    const singleLocation = [{ name: 'Only Location', lat: 35.0, lng: 125.0 }];
    const result = findNearestLocation(37.5665, 126.978, singleLocation);
    expect(result).toEqual(singleLocation[0]);
  });

  it('handles identical coordinates', () => {
    const testLocations = [
      { name: 'Location A', lat: 37.5665, lng: 126.978 },
      { name: 'Location B', lat: 37.5665, lng: 126.978 },
    ];

    const result = findNearestLocation(37.5665, 126.978, testLocations);
    // Should return the first one when distances are equal
    expect(result?.name).toBe('Location A');
  });

  it('reports the distance to the nearest supported live-data area', () => {
    const exact = findNearestAreaMatch(37.4979, 127.0276);
    expect(exact.location.code).toBe('POI014');
    expect(exact.distanceKm).toBeCloseTo(0, 5);

    const far = findNearestAreaMatch(37.75, 127.25);
    expect(far.distanceKm).toBeGreaterThan(3);
  });
});

describe('live-data area catalog', () => {
  it('resolves City Hall to an area that still exists in the citydata catalog', () => {
    const match = findNearestAreaMatch(37.5665, 126.978);
    expect(match.location.code).toBe('POI130');
    expect(match.distanceKm).toBeLessThan(0.2);
  });

  it('does not contain areas removed from the catalog and has unique codes', () => {
    const codes = LIVE_DATA_AREAS.map(location => location.code);
    expect(codes).not.toContain('POI099');
    expect(codes).not.toContain('POI113');
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual(expect.arrayContaining(['POI129', 'POI130', 'POI131']));
  });

  it('returns nearest candidates in ascending distance order', () => {
    const matches = findNearestAreaMatches(37.5665, 126.978, 3);
    expect(matches).toHaveLength(3);
    expect(matches[0].location.code).toBe('POI130');
    expect(matches[0].distanceKm).toBeLessThanOrEqual(matches[1].distanceKm);
    expect(matches[1].distanceKm).toBeLessThanOrEqual(matches[2].distanceKm);
    expect(findNearestAreaMatches(37.5665, 126.978, 0)).toEqual([]);
  });
});
