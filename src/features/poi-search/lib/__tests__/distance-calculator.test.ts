import {
  calculateDistance,
  addDistanceToPOIs,
  sortPOIsByDistance,
  filterPOIsByRadius,
  formatDistance
} from '../distance-calculator'
import type { Location } from '@/entities/weather'
import type { POIWithDistance } from '../../model/types'

describe('Distance Calculator', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points correctly', () => {
      // 서울시청(37.5665, 126.9780)과 강남역(37.4979, 127.0276) 사이의 거리
      const distance = calculateDistance(37.5665, 126.9780, 37.4979, 127.0276)
      // 실제 거리는 약 8.7km
      expect(distance).toBeGreaterThan(8000)
      expect(distance).toBeLessThan(9000)
    })

    it('returns 0 for identical coordinates', () => {
      const distance = calculateDistance(37.5665, 126.9780, 37.5665, 126.9780)
      expect(distance).toBe(0)
    })

    it('handles negative coordinates', () => {
      const distance = calculateDistance(-37.5665, -126.9780, -37.4979, -127.0276)
      expect(distance).toBeGreaterThan(0)
    })

    it('calculates short distances accurately', () => {
      // 100m 정도 떨어진 두 지점
      const distance = calculateDistance(37.5665, 126.9780, 37.5674, 126.9780)
      expect(distance).toBeGreaterThan(90)
      expect(distance).toBeLessThan(110)
    })
  })

  describe('addDistanceToPOIs', () => {
    const pois: Location[] = [
      { code: 'poi-1', name: 'POI 1', lat: 37.5665, lng: 126.9780 },
      { code: 'poi-2', name: 'POI 2', lat: 37.5700, lng: 126.9800 },
      { code: 'poi-3', name: 'POI 3', lat: 37.5600, lng: 126.9700 }
    ]

    it('adds distance to all POIs', () => {
      const result = addDistanceToPOIs(pois, 37.5665, 126.9780)
      
      expect(result).toHaveLength(3)
      result.forEach(poi => {
        expect(poi).toHaveProperty('distance')
        expect(typeof poi.distance).toBe('number')
      })
    })

    it('calculates correct distances from center point', () => {
      const result = addDistanceToPOIs(pois, 37.5665, 126.9780)
      
      // First POI is at the same location as center
      expect(result[0].distance).toBe(0)
      
      // Other POIs should have positive distances
      expect(result[1].distance).toBeGreaterThan(0)
      expect(result[2].distance).toBeGreaterThan(0)
    })

    it('handles empty POI array', () => {
      const result = addDistanceToPOIs([], 37.5665, 126.9780)
      expect(result).toEqual([])
    })
  })

  describe('sortPOIsByDistance', () => {
    const poisWithDistance: POIWithDistance[] = [
      { code: 'far', name: 'Far', lat: 37.5700, lng: 126.9850, distance: 1000 },
      { code: 'near', name: 'Near', lat: 37.5665, lng: 126.9780, distance: 100 },
      { code: 'medium', name: 'Medium', lat: 37.5680, lng: 126.9800, distance: 500 }
    ]

    it('sorts POIs by distance in ascending order', () => {
      const sorted = sortPOIsByDistance(poisWithDistance)
      
      expect(sorted[0].name).toBe('Near')
      expect(sorted[1].name).toBe('Medium')
      expect(sorted[2].name).toBe('Far')
    })

    it('does not modify original array', () => {
      const original = [...poisWithDistance]
      sortPOIsByDistance(poisWithDistance)
      
      expect(poisWithDistance).toEqual(original)
    })

    it('handles empty array', () => {
      const sorted = sortPOIsByDistance([])
      expect(sorted).toEqual([])
    })

    it('handles single item array', () => {
      const single = [poisWithDistance[0]]
      const sorted = sortPOIsByDistance(single)
      expect(sorted).toEqual(single)
    })
  })

  describe('filterPOIsByRadius', () => {
    const poisWithDistance: POIWithDistance[] = [
      { code: 'within', name: 'Within 500m', lat: 37.5665, lng: 126.9780, distance: 300 },
      { code: 'exact', name: 'Exactly 500m', lat: 37.5670, lng: 126.9785, distance: 500 },
      { code: 'outside', name: 'Outside 500m', lat: 37.5700, lng: 126.9850, distance: 800 }
    ]

    it('filters POIs within specified radius', () => {
      const filtered = filterPOIsByRadius(poisWithDistance, 500)
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].name).toBe('Within 500m')
      expect(filtered[1].name).toBe('Exactly 500m')
    })

    it('includes POIs exactly at radius distance', () => {
      const filtered = filterPOIsByRadius(poisWithDistance, 500)
      const exactMatch = filtered.find(poi => poi.distance === 500)
      expect(exactMatch).toBeDefined()
    })

    it('returns empty array when no POIs within radius', () => {
      const filtered = filterPOIsByRadius(poisWithDistance, 100)
      expect(filtered).toEqual([])
    })

    it('returns all POIs when radius is very large', () => {
      const filtered = filterPOIsByRadius(poisWithDistance, 10000)
      expect(filtered).toHaveLength(3)
    })
  })

  describe('formatDistance', () => {
    it('formats distances less than 1km in meters', () => {
      expect(formatDistance(0)).toBe('0m')
      expect(formatDistance(100)).toBe('100m')
      expect(formatDistance(999)).toBe('999m')
    })

    it('formats distances 1km or greater in kilometers', () => {
      expect(formatDistance(1000)).toBe('1.0km')
      expect(formatDistance(1500)).toBe('1.5km')
      expect(formatDistance(10000)).toBe('10.0km')
    })

    it('rounds meters to nearest integer', () => {
      expect(formatDistance(100.4)).toBe('100m')
      expect(formatDistance(100.6)).toBe('101m')
    })

    it('shows one decimal place for kilometers', () => {
      expect(formatDistance(1234)).toBe('1.2km')
      expect(formatDistance(1567)).toBe('1.6km')
    })

    it('handles very large distances', () => {
      expect(formatDistance(999999)).toBe('1000.0km')
    })

    it('handles negative distances (edge case)', () => {
      expect(formatDistance(-100)).toBe('-100m')
    })
  })
})
