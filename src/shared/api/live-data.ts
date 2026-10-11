/**
 * 서울 실시간 도시데이터(날씨·혼잡도) 클라이언트.
 * 결과를 상태로 구분해 UI가 "지원 지역 밖"과 "상위 API 장애"를 정직하게 보여줄 수 있게 한다.
 */
import type { CongestionData, WeatherData } from '@/lib/types';

export type LiveFetchResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'outside_area' }
  | { status: 'unavailable'; code?: string }
  | { status: 'error' };

interface LiveApiEnvelope<T> {
  success?: boolean;
  code?: string;
  upstreamCode?: string;
  data?: T | null;
}

async function fetchLive<T>(path: string, lat: number, lng: number): Promise<LiveFetchResult<T>> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { status: 'error' };
  }
  try {
    const response = await fetch(`${path}?lat=${lat}&lng=${lng}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const body = (await response.json().catch(() => null)) as LiveApiEnvelope<T> | null;

    if (response.ok && body?.success && body.data) {
      return { status: 'ok', data: body.data };
    }
    if (response.status === 404 && body?.code === 'OUTSIDE_LIVE_AREA') {
      return { status: 'outside_area' };
    }
    if (response.status === 404) {
      return { status: 'unavailable', code: body?.code };
    }
    if (response.status === 503 || response.status === 502) {
      return { status: 'unavailable', code: body?.upstreamCode ?? body?.code };
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export function fetchLiveWeather(lat: number, lng: number) {
  return fetchLive<WeatherData>('/api/weather', lat, lng);
}

export function fetchLiveCongestion(lat: number, lng: number) {
  return fetchLive<CongestionData>('/api/congestion', lat, lng);
}
