import { WeatherData } from '@/lib/types';
import axios from 'axios';

interface WeatherAPIResponse {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  clouds: number;
  sunrise: number;
  sunset: number;
}

interface OpenWeatherAPIResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  visibility: number;
  clouds: {
    all: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
}

// Cache implementation
const weatherCache = new Map<string, { data: WeatherAPIResponse; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function clearWeatherCache(): void {
  weatherCache.clear();
}

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

function transformAPIResponse(apiResponse: OpenWeatherAPIResponse): WeatherAPIResponse {
  return {
    temperature: apiResponse.main.temp,
    feelsLike: apiResponse.main.feels_like,
    humidity: apiResponse.main.humidity,
    pressure: apiResponse.main.pressure,
    description: apiResponse.weather[0]?.description || '',
    icon: apiResponse.weather[0]?.icon || '',
    windSpeed: apiResponse.wind.speed,
    visibility: apiResponse.visibility,
    clouds: apiResponse.clouds.all,
    sunrise: apiResponse.sys.sunrise,
    sunset: apiResponse.sys.sunset,
  };
}

export async function getWeatherData(lat: number, lng: number): Promise<WeatherAPIResponse> {
  // Validate coordinates
  if (!isValidCoordinate(lat, lng)) {
    throw new Error('Invalid coordinates');
  }

  const cacheKey = getCacheKey(lat, lng);
  const now = Date.now();

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await axios.get('/api/weather', {
      params: { lat, lng },
    });

    let weatherData: WeatherAPIResponse;

    // If response is already in our format, use it directly
    if (response.data.temperature !== undefined) {
      weatherData = response.data;
    } else {
      // Transform OpenWeather API response
      weatherData = transformAPIResponse(response.data);
    }

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: now,
    });

    return weatherData;
  } catch (error) {
    // Re-throw the error to match test expectations
    throw error;
  }
}

/**
 * 현재 위치에서 가장 가까운 장소의 날씨 정보 조회
 * (API Route를 통해 API 호출)
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소의 날씨 정보
 */
export async function getNearestWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다.');
      return null;
    }

    // Next.js API Route 호출
    const apiUrl = `/api/weather?lat=${lat}&lng=${lng}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`날씨 API 호출 실패: ${response.status}`, errorData);
      return null;
    }

    const result = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('날씨 API 에러 : ', result.error);
      return null;
    }

    // 데이터가 없는 경우
    if (!result.data) {
      console.error('날씨 데이터가 없습니다.');
      return null;
    }

    // API는 이제 원시 API 형식으로 직접 반환
    return {
      AREA_NM: result.data.AREA_NM,
      AREA_CD: result.data.AREA_CD,
      WEATHER_STTS: result.data.WEATHER_STTS,
      TEMP: result.data.TEMP,
      SENSIBLE_TEMP: result.data.SENSIBLE_TEMP,
      MAX_TEMP: result.data.MAX_TEMP,
      MIN_TEMP: result.data.MIN_TEMP,
      HUMIDITY: result.data.HUMIDITY,
      PRECIPITATION: result.data.PRECIPITATION,
      PCP_MSG: result.data.PCP_MSG,
      UV_INDEX_LVL: result.data.UV_INDEX_LVL,
      UV_MSG: result.data.UV_MSG,
      PM25_INDEX: result.data.PM25_INDEX,
      PM10_INDEX: result.data.PM10_INDEX,
      timestamp: result.data.timestamp,
      cached: result.data.cached,
    };
  } catch (error) {
    console.error('날씨 데이터 조회 실패 : ', error);
    return null;
  }
}
