// services/location.ts - Location-based data service implementation
import { LocationDataResponse } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

export interface LocationQuery {
  latitude: number;
  longitude: number;
  radius?: number; // default: 2.0km
}

/**
 * 위치 기반 통합 데이터 조회
 */
export async function getNearbyLocationData(
  query: LocationQuery,
  accessToken: string
): Promise<LocationDataResponse> {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/nearby?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 통합 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 개인화된 위치 기반 데이터 조회
 */
export async function getPersonalizedLocationData(
  query: LocationQuery,
  accessToken: string
): Promise<LocationDataResponse> {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/nearby/personalized?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`개인화된 위치 기반 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 맛집 조회
 */
export async function getNearbyRestaurants(query: LocationQuery, accessToken: string) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/restaurants?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 맛집 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 도서관 조회
 */
export async function getNearbyLibraries(query: LocationQuery, accessToken: string) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/libraries?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 도서관 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 공원 조회
 */
export async function getNearbyParksFromBackend(query: LocationQuery, accessToken: string) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/parks?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 공원 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 체육시설 조회
 */
export async function getNearbySportsFacilities(query: LocationQuery, accessToken: string) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/sports-facilities?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 체육시설 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 무더위쉼터 조회 (백엔드 API)
 */
export async function getNearbyCoolingCentersFromBackend(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/cooling-centers?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 무더위쉼터 조회 실패: ${response.status}`);
  }

  return response.json();
}

// Utility functions for location operations
export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface AddressResult {
  address: string;
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
}

export interface SearchResult {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Get current location using browser geolocation API
 */
export function getCurrentLocation(options?: GeolocationOptions): Promise<LocationCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      defaultOptions
    );
  });
}

/**
 * Get address from coordinates using reverse geocoding
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<AddressResult> {
  try {
    const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Search for addresses using forward geocoding
 */
export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  try {
    const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Address search failed');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(point1: LocationCoords, point2: LocationCoords): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Check if a point is within a certain radius of another point
 */
export function isWithinRadius(
  center: LocationCoords,
  point: LocationCoords,
  radius: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radius;
}
