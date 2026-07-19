import {
  convertParkRowToAppFormat,
  convertParks,
  paginateParks
} from '../converter'
import type { ParkRow } from '@/lib/seoulApi'
import type { Park } from '../../model/types'

describe('Park Converter', () => {
  const mockParkRow: ParkRow = {
    P_IDX: '1',
    P_PARK: '남산공원',
    P_LIST_CONTENT: '서울의 대표적인 도시공원',
    AREA: '2,947,000',
    P_ADDR: '서울특별시 중구 삼일대로 231',
    P_ADMINTEL: '02-3783-5900',
    LONGITUDE: '126.9910',
    LATITUDE: '37.5512',
    USE_REFER: '24시간 개방',
    P_IMG: 'https://images.test.invalid/namsan.jpg'
  }

  describe('convertParkRowToAppFormat', () => {
    it('converts park row to app format correctly', () => {
      const result = convertParkRowToAppFormat(mockParkRow)
      
      expect(result).toEqual({
        id: '1',
        name: '남산공원',
        content: '서울의 대표적인 도시공원',
        area: '2,947,000',
        address: '서울특별시 중구 삼일대로 231',
        adminTel: '02-3783-5900',
        longitude: 126.9910,
        latitude: 37.5512,
        useReference: '24시간 개방',
        imageUrl: 'https://images.test.invalid/namsan.jpg'
      })
    })

    it('handles missing or invalid coordinates', () => {
      const invalidCoordsPark: ParkRow = {
        ...mockParkRow,
        LONGITUDE: '',
        LATITUDE: 'invalid'
      }
      
      const result = convertParkRowToAppFormat(invalidCoordsPark)
      
      expect(result.longitude).toBe(0)
      expect(result.latitude).toBe(0)
    })

    it('handles null or undefined values', () => {
      const partialPark: ParkRow = {
        P_IDX: '2',
        P_PARK: '테스트공원',
        P_LIST_CONTENT: '',
        AREA: '',
        P_ADDR: '',
        P_ADMINTEL: '',
        LONGITUDE: '0',
        LATITUDE: '0',
        USE_REFER: '',
        P_IMG: ''
      }
      
      const result = convertParkRowToAppFormat(partialPark)
      
      expect(result.id).toBe('2')
      expect(result.name).toBe('테스트공원')
      expect(result.content).toBe('')
      expect(result.longitude).toBe(0)
      expect(result.latitude).toBe(0)
    })

    it('preserves all field mappings', () => {
      const result = convertParkRowToAppFormat(mockParkRow)
      
      // Check that all fields are mapped
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('area')
      expect(result).toHaveProperty('address')
      expect(result).toHaveProperty('adminTel')
      expect(result).toHaveProperty('longitude')
      expect(result).toHaveProperty('latitude')
      expect(result).toHaveProperty('useReference')
      expect(result).toHaveProperty('imageUrl')
    })
  })

  describe('convertParks', () => {
    it('converts multiple park rows', () => {
      const parks: ParkRow[] = [
        mockParkRow,
        {
          ...mockParkRow,
          P_IDX: '2',
          P_PARK: '한강공원'
        },
        {
          ...mockParkRow,
          P_IDX: '3',
          P_PARK: '월드컵공원'
        }
      ]
      
      const result = convertParks(parks)
      
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('남산공원')
      expect(result[1].name).toBe('한강공원')
      expect(result[2].name).toBe('월드컵공원')
    })

    it('handles empty array', () => {
      const result = convertParks([])
      expect(result).toEqual([])
    })

    it('preserves order of parks', () => {
      const parks: ParkRow[] = [
        { ...mockParkRow, P_IDX: '3' },
        { ...mockParkRow, P_IDX: '1' },
        { ...mockParkRow, P_IDX: '2' }
      ]
      
      const result = convertParks(parks)
      
      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('1')
      expect(result[2].id).toBe('2')
    })
  })

  describe('paginateParks', () => {
    const mockParks: Park[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Park ${i + 1}`,
      content: `Content ${i + 1}`,
      area: '1000',
      address: `Address ${i + 1}`,
      adminTel: '02-1234-5678',
      longitude: 126.9780 + i * 0.001,
      latitude: 37.5665 + i * 0.001,
      useReference: '24시간',
      imageUrl: `https://images.test.invalid/park${i + 1}.jpg`
    }))

    it('paginates correctly with page 0', () => {
      const result = paginateParks(mockParks, 0, 10)
      
      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('1')
      expect(result[9].id).toBe('10')
    })

    it('paginates correctly with subsequent pages', () => {
      const page1 = paginateParks(mockParks, 1, 10)
      
      expect(page1).toHaveLength(10)
      expect(page1[0].id).toBe('11')
      expect(page1[9].id).toBe('20')
    })

    it('handles last page with fewer items', () => {
      const lastPage = paginateParks(mockParks, 2, 10)
      
      expect(lastPage).toHaveLength(5)
      expect(lastPage[0].id).toBe('21')
      expect(lastPage[4].id).toBe('25')
    })

    it('returns empty array for out of bounds page', () => {
      const result = paginateParks(mockParks, 5, 10)
      expect(result).toEqual([])
    })

    it('handles different page sizes', () => {
      const result1 = paginateParks(mockParks, 0, 5)
      expect(result1).toHaveLength(5)
      
      const result2 = paginateParks(mockParks, 0, 20)
      expect(result2).toHaveLength(20)
      
      const result3 = paginateParks(mockParks, 0, 30)
      expect(result3).toHaveLength(25) // Total is 25
    })

    it('handles empty array', () => {
      const result = paginateParks([], 0, 10)
      expect(result).toEqual([])
    })

    it('handles page size of 1', () => {
      const result = paginateParks(mockParks, 10, 1)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('11')
    })
  })
})
