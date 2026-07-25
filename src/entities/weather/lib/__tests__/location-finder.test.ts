import { findNearestAreaMatch, findNearestLocation } from '../location-finder'
import { SEOUL_LOCATIONS } from '@/shared/lib/data/seoul-locations'

describe('findNearestLocation', () => {
  it('returns null when locations array is empty', () => {
    const result = findNearestLocation(37.5665, 126.9780, [])
    expect(result).toBeNull()
  })

  it('finds the nearest location', () => {
    const testLocations = [
      { name: 'Location A', lat: 37.5665, lng: 126.9780 },
      { name: 'Location B', lat: 37.5700, lng: 126.9800 },
      { name: 'Location C', lat: 37.5600, lng: 126.9700 }
    ]
    
    const result = findNearestLocation(37.5665, 126.9780, testLocations)
    expect(result).toEqual({ name: 'Location A', lat: 37.5665, lng: 126.9780 })
  })

  it('correctly calculates distance for different coordinates', () => {
    const testLocations = [
      { name: 'Far Location', lat: 37.6000, lng: 127.0000 },
      { name: 'Near Location', lat: 37.5670, lng: 126.9785 },
      { name: 'Medium Location', lat: 37.5700, lng: 126.9850 }
    ]
    
    const result = findNearestLocation(37.5665, 126.9780, testLocations)
    expect(result?.name).toBe('Near Location')
  })

  it('works with Seoul locations data', () => {
    // Test with actual Seoul locations
    const result = findNearestLocation(37.5665, 126.9780, SEOUL_LOCATIONS)
    expect(result).toBeDefined()
    expect(result?.name).toBeDefined()
    expect(result?.lat).toBeDefined()
    expect(result?.lng).toBeDefined()
  })

  it('handles edge case with single location', () => {
    const singleLocation = [{ name: 'Only Location', lat: 35.0000, lng: 125.0000 }]
    const result = findNearestLocation(37.5665, 126.9780, singleLocation)
    expect(result).toEqual(singleLocation[0])
  })

  it('handles identical coordinates', () => {
    const testLocations = [
      { name: 'Location A', lat: 37.5665, lng: 126.9780 },
      { name: 'Location B', lat: 37.5665, lng: 126.9780 }
    ]
    
    const result = findNearestLocation(37.5665, 126.9780, testLocations)
    // Should return the first one when distances are equal
    expect(result?.name).toBe('Location A')
  })

  it('reports the distance to the nearest supported live-data area', () => {
    const exact = findNearestAreaMatch(37.4979, 127.0276)
    expect(exact.location.code).toBe('POI014')
    expect(exact.distanceKm).toBeCloseTo(0, 5)

    const far = findNearestAreaMatch(37.75, 127.25)
    expect(far.distanceKm).toBeGreaterThan(3)
  })
})
