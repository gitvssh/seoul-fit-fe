import { convertLibraryRowToAppFormat, convertLibraries, paginateLibraries } from '../converter';
import type { LibraryRow } from '@/lib/seoulApi';
import type { Library } from '../../model/types';

describe('Library Converter', () => {
  const mockLibraryRow: LibraryRow = {
    LBRRY_NAME: '서울도서관',
    ADRES: '서울특별시 중구 세종대로 110',
    TEL_NO: '02-120',
    HMPG_URL: 'https://lib.seoul.go.kr',
    XCNTS: '37.5665',
    YDNTS: '126.9780',
    OP_TIME: '평일 09:00-21:00, 주말 09:00-18:00',
    FDRM_CLOSE_DATE: '매주 월요일, 법정공휴일',
  };

  describe('convertLibraryRowToAppFormat', () => {
    it('converts library row to app format correctly', () => {
      const result = convertLibraryRowToAppFormat(mockLibraryRow);

      // Check all mapped fields
      expect(result.lbrryName).toBe('서울도서관');
      expect(result.name).toBe('서울도서관');
      expect(result.adres).toBe('서울특별시 중구 세종대로 110');
      expect(result.address).toBe('서울특별시 중구 세종대로 110');
      expect(result.telNo).toBe('02-120');
      expect(result.phoneNumber).toBe('02-120');
      expect(result.hmpgUrl).toBe('https://lib.seoul.go.kr');
      expect(result.website).toBe('https://lib.seoul.go.kr');
      expect(result.xcnts).toBe(37.5665);
      expect(result.latitude).toBe(37.5665);
      expect(result.ydnts).toBe(126.978);
      expect(result.longitude).toBe(126.978);
      expect(result.opTime).toBe('평일 09:00-21:00, 주말 09:00-18:00');
      expect(result.operatingHours).toBe('평일 09:00-21:00, 주말 09:00-18:00');
      expect(result.fdrmCloseDate).toBe('매주 월요일, 법정공휴일');
    });

    it('generates unique id for each conversion', () => {
      const result1 = convertLibraryRowToAppFormat(mockLibraryRow);
      const result2 = convertLibraryRowToAppFormat(mockLibraryRow);

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('handles invalid coordinates', () => {
      const invalidCoords: LibraryRow = {
        ...mockLibraryRow,
        XCNTS: 'invalid',
        YDNTS: '',
      };

      const result = convertLibraryRowToAppFormat(invalidCoords);

      expect(result.xcnts).toBe(0);
      expect(result.latitude).toBe(0);
      expect(result.ydnts).toBe(0);
      expect(result.longitude).toBe(0);
    });

    it('handles missing values', () => {
      const partial: LibraryRow = {
        LBRRY_NAME: '테스트도서관',
        ADRES: '',
        TEL_NO: '',
        HMPG_URL: '',
        XCNTS: '0',
        YDNTS: '0',
        OP_TIME: '',
        FDRM_CLOSE_DATE: '',
      };

      const result = convertLibraryRowToAppFormat(partial);

      expect(result.name).toBe('테스트도서관');
      expect(result.address).toBe('');
      expect(result.phoneNumber).toBe('');
      expect(result.website).toBe('');
      expect(result.operatingHours).toBe('');
      expect(result.fdrmCloseDate).toBe('');
    });

    it('preserves all field mappings including duplicates', () => {
      const result = convertLibraryRowToAppFormat(mockLibraryRow);

      // Check duplicate fields exist (legacy compatibility)
      expect(result.lbrryName).toBe(result.name);
      expect(result.adres).toBe(result.address);
      expect(result.telNo).toBe(result.phoneNumber);
      expect(result.hmpgUrl).toBe(result.website);
      expect(result.xcnts).toBe(result.latitude);
      expect(result.ydnts).toBe(result.longitude);
      expect(result.opTime).toBe(result.operatingHours);
    });
  });

  describe('convertLibraries', () => {
    it('converts multiple library rows', () => {
      const libraries: LibraryRow[] = [
        mockLibraryRow,
        {
          ...mockLibraryRow,
          LBRRY_NAME: '강남도서관',
        },
        {
          ...mockLibraryRow,
          LBRRY_NAME: '마포중앙도서관',
        },
      ];

      const result = convertLibraries(libraries);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('서울도서관');
      expect(result[1].name).toBe('강남도서관');
      expect(result[2].name).toBe('마포중앙도서관');
    });

    it('handles empty array', () => {
      const result = convertLibraries([]);
      expect(result).toEqual([]);
    });

    it('generates unique ids for all libraries', () => {
      const libraries: LibraryRow[] = [mockLibraryRow, mockLibraryRow, mockLibraryRow];

      const result = convertLibraries(libraries);
      const ids = result.map(lib => lib.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('paginateLibraries', () => {
    const mockLibraries: Library[] = Array.from({ length: 25 }, (_, i) => ({
      id: `lib-${i + 1}`,
      lbrryName: `Library ${i + 1}`,
      name: `Library ${i + 1}`,
      adres: `Address ${i + 1}`,
      address: `Address ${i + 1}`,
      telNo: `02-${1000 + i}`,
      phoneNumber: `02-${1000 + i}`,
      hmpgUrl: `https://lib${i + 1}.go.kr`,
      website: `https://lib${i + 1}.go.kr`,
      xcnts: 37.5665 + i * 0.001,
      latitude: 37.5665 + i * 0.001,
      ydnts: 126.978 + i * 0.001,
      longitude: 126.978 + i * 0.001,
      opTime: '09:00-18:00',
      operatingHours: '09:00-18:00',
      fdrmCloseDate: '매주 월요일',
    }));

    it('paginates correctly with page 0', () => {
      const result = paginateLibraries(mockLibraries, 0, 10);

      expect(result).toHaveLength(10);
      expect(result[0].id).toBe('lib-1');
      expect(result[9].id).toBe('lib-10');
    });

    it('paginates correctly with subsequent pages', () => {
      const page1 = paginateLibraries(mockLibraries, 1, 10);

      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe('lib-11');
      expect(page1[9].id).toBe('lib-20');
    });

    it('handles last page with fewer items', () => {
      const lastPage = paginateLibraries(mockLibraries, 2, 10);

      expect(lastPage).toHaveLength(5);
      expect(lastPage[0].id).toBe('lib-21');
      expect(lastPage[4].id).toBe('lib-25');
    });

    it('returns empty array for out of bounds page', () => {
      const result = paginateLibraries(mockLibraries, 10, 10);
      expect(result).toEqual([]);
    });

    it('handles different page sizes', () => {
      const result1 = paginateLibraries(mockLibraries, 0, 5);
      expect(result1).toHaveLength(5);

      const result2 = paginateLibraries(mockLibraries, 0, 20);
      expect(result2).toHaveLength(20);

      const result3 = paginateLibraries(mockLibraries, 0, 30);
      expect(result3).toHaveLength(25);
    });

    it('handles empty array', () => {
      const result = paginateLibraries([], 0, 10);
      expect(result).toEqual([]);
    });
  });
});
