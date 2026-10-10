import {
  getCurrentLocation,
  getAddressFromCoords,
  searchAddress,
  calculateDistance,
  isWithinRadius,
} from '../location';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

// Mock fetch
global.fetch = jest.fn();

describe('Location API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('gets current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.5665,
          longitude: 126.978,
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success(mockPosition);
      });

      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 37.5665,
        lng: 126.978,
        accuracy: 10,
      });
    });

    it('handles geolocation errors', async () => {
      const mockError = {
        code: 1,
        message: 'User denied geolocation',
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toMatchObject({
        code: 1,
        message: 'User denied geolocation',
      });
    });

    it('handles geolocation not available', async () => {
      // Temporarily remove geolocation
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported');

      // Restore geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      });
    });

    it('applies high accuracy option', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success({ coords: { latitude: 37.5665, longitude: 126.978 } });
      });

      await getCurrentLocation({ enableHighAccuracy: true });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
        })
      );
    });

    it('applies timeout option', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success({ coords: { latitude: 37.5665, longitude: 126.978 } });
      });

      await getCurrentLocation({ timeout: 5000 });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });

  describe('getAddressFromCoords', () => {
    it('gets address from coordinates successfully', async () => {
      const mockResponse = {
        address: '서울특별시 중구 세종대로 110',
        roadAddress: '서울특별시 중구 세종대로 110',
        jibunAddress: '서울특별시 중구 태평로1가 31',
        englishAddress: '110, Sejong-daero, Jung-gu, Seoul',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAddressFromCoords(37.5665, 126.978);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/geocode/reverse'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles geocoding errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getAddressFromCoords(37.5665, 126.978)).rejects.toThrow('Geocoding failed');
    });

    it('handles network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(getAddressFromCoords(37.5665, 126.978)).rejects.toThrow('Network error');
    });
  });

  describe('searchAddress', () => {
    it('searches for address successfully', async () => {
      const mockResults = [
        {
          address: '서울특별시 강남구 테헤란로 152',
          lat: 37.5006,
          lng: 127.0364,
        },
        {
          address: '서울특별시 강남구 테헤란로 212',
          lat: 37.504,
          lng: 127.0418,
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockResults }),
      });

      const result = await searchAddress('테헤란로');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/geocode/search'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResults);
    });

    it('handles empty search query', async () => {
      await expect(searchAddress('')).rejects.toThrow('Search query is required');
    });

    it('handles no results found', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await searchAddress('존재하지않는주소');
      expect(result).toEqual([]);
    });
  });

  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      // Seoul City Hall to Gangnam Station (approx 8.7km)
      const distance = calculateDistance(
        { lat: 37.5665, lng: 126.978 },
        { lat: 37.4979, lng: 127.0276 }
      );

      expect(distance).toBeGreaterThan(8000);
      expect(distance).toBeLessThan(9000);
    });

    it('returns 0 for same location', () => {
      const distance = calculateDistance(
        { lat: 37.5665, lng: 126.978 },
        { lat: 37.5665, lng: 126.978 }
      );

      expect(distance).toBe(0);
    });

    it('handles negative coordinates', () => {
      const distance = calculateDistance(
        { lat: -37.5665, lng: -126.978 },
        { lat: -37.4979, lng: -127.0276 }
      );

      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isWithinRadius', () => {
    it('checks if point is within radius', () => {
      const center = { lat: 37.5665, lng: 126.978 };
      const nearPoint = { lat: 37.567, lng: 126.9785 };
      const farPoint = { lat: 37.4979, lng: 127.0276 };

      expect(isWithinRadius(center, nearPoint, 1000)).toBe(true);
      expect(isWithinRadius(center, farPoint, 1000)).toBe(false);
      expect(isWithinRadius(center, farPoint, 10000)).toBe(true);
    });

    it('handles edge case at exact radius', () => {
      const center = { lat: 37.5665, lng: 126.978 };
      const point = { lat: 37.5674, lng: 126.978 };

      // Approximately 100m apart
      expect(isWithinRadius(center, point, 100)).toBe(true);
      expect(isWithinRadius(center, point, 99)).toBe(false);
    });
  });
});
