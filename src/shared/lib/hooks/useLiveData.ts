'use client';

import { useCallback, useRef, useState } from 'react';
import type { CongestionData, Position, WeatherData } from '@/lib/types';
import {
  fetchLiveCongestion,
  fetchLiveWeather,
  type LiveFetchResult,
} from '@/shared/api/live-data';

export type LiveSliceStatus = 'idle' | 'loading' | 'ok' | 'outside_area' | 'unavailable' | 'error';

export interface LiveSlice<T> {
  status: LiveSliceStatus;
  /** 마지막으로 성공한 데이터. 재조회 중에도 유지한다(stale-while-revalidate). */
  data: T | null;
  fetchedAt: string | null;
  /** 상위 API가 돌려준 원인 코드(진단용, 화면에는 노출하지 않음) */
  code?: string;
}

const idleSlice = <T>(): LiveSlice<T> => ({ status: 'idle', data: null, fetchedAt: null });

function applyResult<T>(previous: LiveSlice<T>, result: LiveFetchResult<T>): LiveSlice<T> {
  if (result.status === 'ok') {
    return { status: 'ok', data: result.data, fetchedAt: new Date().toISOString() };
  }
  if (result.status === 'unavailable') {
    return { ...previous, status: 'unavailable', code: result.code };
  }
  return {
    ...previous,
    status: result.status,
    data: result.status === 'outside_area' ? null : previous.data,
  };
}

/**
 * 날씨·혼잡도("서울 지금")를 한 곳에서 관리한다.
 * - 같은 위치로 1분 안에 다시 부르면 재조회하지 않는다.
 * - 재조회 중에는 이전 데이터를 유지하고 status만 loading으로 바꾼다.
 */
export function useLiveData() {
  const [weather, setWeather] = useState<LiveSlice<WeatherData>>(idleSlice);
  const [congestion, setCongestion] = useState<LiveSlice<CongestionData>>(idleSlice);
  const lastRequestRef = useRef<{ key: string; at: number } | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const load = useCallback(async (position: Position, options: { force?: boolean } = {}) => {
    const key = `${position.lat.toFixed(3)},${position.lng.toFixed(3)}`;
    const last = lastRequestRef.current;
    if (!options.force && last && last.key === key && Date.now() - last.at < 60_000) {
      return inFlightRef.current ?? undefined;
    }
    lastRequestRef.current = { key, at: Date.now() };
    setWeather(previous => ({ ...previous, status: 'loading' }));
    setCongestion(previous => ({ ...previous, status: 'loading' }));

    const request = Promise.all([
      fetchLiveWeather(position.lat, position.lng),
      fetchLiveCongestion(position.lat, position.lng),
    ]).then(([weatherResult, congestionResult]) => {
      setWeather(previous => applyResult(previous, weatherResult));
      setCongestion(previous => applyResult(previous, congestionResult));
    });
    inFlightRef.current = request;
    await request;
    inFlightRef.current = null;
  }, []);

  const refresh = useCallback((position: Position) => load(position, { force: true }), [load]);

  return {
    weather,
    congestion,
    loading: weather.status === 'loading' || congestion.status === 'loading',
    load,
    refresh,
  };
}
