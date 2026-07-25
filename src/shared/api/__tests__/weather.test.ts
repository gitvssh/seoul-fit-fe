import { clearWeatherCache, getWeatherData } from '../weather'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Weather API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearWeatherCache()
  })

  describe('getWeatherData', () => {
    const mockWeatherData = {
      temperature: 25,
      humidity: 60,
      windSpeed: 3.5,
      description: '맑음',
      icon: '01d',
      feelsLike: 26,
      pressure: 1013,
      visibility: 10000,
      clouds: 10,
      sunrise: 1640000000,
      sunset: 1640040000
    }

    it('fetches weather data successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockWeatherData })
      
      const result = await getWeatherData(37.5665, 126.9780)
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/weather'),
        expect.objectContaining({
          params: {
            lat: 37.5665,
            lng: 126.9780
          }
        })
      )
      expect(result).toEqual(mockWeatherData)
    })

    it('keeps server API keys out of the browser request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockWeatherData })
      
      await getWeatherData(37.5665, 126.9780)
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { lat: 37.5665, lng: 126.978 }
        })
      )
      expect(mockedAxios.get.mock.calls[0]?.[1]).not.toHaveProperty('headers.X-API-Key')
    })

    it('handles network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'))
      
      await expect(getWeatherData(37.5665, 126.9780)).rejects.toThrow('Network error')
    })

    it('handles API error responses', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Location not found' }
        }
      })
      
      await expect(getWeatherData(37.5665, 126.9780)).rejects.toMatchObject({
        response: {
          status: 404,
          data: { message: 'Location not found' }
        }
      })
    })

    it('caches weather data', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockWeatherData })
      
      // First call
      const result1 = await getWeatherData(37.5665, 126.9780)
      
      // Second call with same coordinates
      const result2 = await getWeatherData(37.5665, 126.9780)
      
      // Should only call API once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('refreshes cache after expiry', async () => {
      jest.useFakeTimers()
      mockedAxios.get.mockResolvedValue({ data: mockWeatherData })
      
      // First call
      await getWeatherData(37.5665, 126.9780)
      
      // Advance time past cache expiry (30 minutes)
      jest.advanceTimersByTime(31 * 60 * 1000)
      
      // Second call should hit API again
      await getWeatherData(37.5665, 126.9780)
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
      
      jest.useRealTimers()
    })

    it('handles invalid coordinates', async () => {
      await expect(getWeatherData(999, 999)).rejects.toThrow('Invalid coordinates')
      await expect(getWeatherData(NaN, 126.9780)).rejects.toThrow('Invalid coordinates')
    })

    it('transforms API response correctly', async () => {
      const apiResponse = {
        main: {
          temp: 25,
          feels_like: 26,
          humidity: 60,
          pressure: 1013
        },
        weather: [{
          description: '맑음',
          icon: '01d'
        }],
        wind: {
          speed: 3.5
        },
        visibility: 10000,
        clouds: {
          all: 10
        },
        sys: {
          sunrise: 1640000000,
          sunset: 1640040000
        }
      }
      
      mockedAxios.get.mockResolvedValue({ data: apiResponse })
      
      const result = await getWeatherData(37.5665, 126.9780)
      
      expect(result).toEqual({
        temperature: 25,
        feelsLike: 26,
        humidity: 60,
        pressure: 1013,
        description: '맑음',
        icon: '01d',
        windSpeed: 3.5,
        visibility: 10000,
        clouds: 10,
        sunrise: 1640000000,
        sunset: 1640040000
      })
    })
  })
})
