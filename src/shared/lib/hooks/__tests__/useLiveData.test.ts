import { act, renderHook } from '@testing-library/react';
import { fetchLiveWeather, fetchLiveCongestion } from '@/shared/api/live-data';
import type { WeatherData, CongestionData } from '@/lib/types';
import { useLiveData } from '../useLiveData';

jest.mock('@/shared/api/live-data', () => ({
  fetchLiveWeather: jest.fn(),
  fetchLiveCongestion: jest.fn(),
}));
const origin = { lat: 37.5665, lng: 126.978 };
const weather: WeatherData = {
  AREA_NM: '시청',
  AREA_CD: 'test',
  WEATHER_STTS: '맑음',
  TEMP: '20',
  SENSIBLE_TEMP: '20',
  MAX_TEMP: '22',
  MIN_TEMP: '15',
  HUMIDITY: '40',
  PRECIPITATION: '0',
  PCP_MSG: '',
  UV_INDEX_LVL: '',
  UV_MSG: '',
  PM10_INDEX: '',
  PM25_INDEX: '',
};
const congestion: CongestionData = { AREA_CONGEST_LVL: '여유' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchLiveWeather).mockResolvedValue({ status: 'ok', data: weather });
  jest.mocked(fetchLiveCongestion).mockResolvedValue({ status: 'ok', data: congestion });
});

it('loads both live sources, reuses a rounded position for one minute, and allows forced refresh', async () => {
  let now = 1_000_000;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  try {
    const { result } = renderHook(useLiveData);
    expect(result.current.weather.status).toBe('idle');
    await act(async () => {
      await result.current.load(origin);
    });
    expect(result.current.weather).toMatchObject({
      status: 'ok',
      data: weather,
      fetchedAt: expect.any(String),
    });
    expect(result.current.congestion.data).toEqual(congestion);
    await act(async () => {
      await result.current.load({ ...origin, lng: origin.lng + 0.00001 });
    });
    expect(fetchLiveWeather).toHaveBeenCalledTimes(1);
    now += 60_001;
    await act(async () => {
      await result.current.load(origin);
    });
    expect(fetchLiveWeather).toHaveBeenCalledTimes(2);
    await act(async () => {
      await result.current.refresh(origin);
    });
    expect(fetchLiveWeather).toHaveBeenCalledTimes(3);
    expect(result.current.loading).toBe(false);
  } finally {
    clock.mockRestore();
  }
});

it('reuses an in-flight lookup instead of duplicating source requests', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof fetchLiveWeather>>) => void;
  jest.mocked(fetchLiveWeather).mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  const { result } = renderHook(useLiveData);
  let first!: Promise<void>, second!: Promise<void>;
  act(() => {
    first = result.current.load(origin);
    second = result.current.load(origin);
  });
  expect(result.current.loading).toBe(true);
  expect(fetchLiveWeather).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ status: 'ok', data: weather });
    await Promise.all([first, second]);
  });
  expect(result.current.weather.data).toEqual(weather);
});

it('retains previously loaded data on failure and clears it only outside the source area', async () => {
  const { result } = renderHook(useLiveData);
  await act(async () => {
    await result.current.load(origin);
  });
  jest
    .mocked(fetchLiveWeather)
    .mockResolvedValue({ status: 'unavailable', code: 'UPSTREAM_UNAVAILABLE' });
  jest.mocked(fetchLiveCongestion).mockResolvedValue({ status: 'error' });
  await act(async () => {
    await result.current.refresh(origin);
  });
  expect(result.current.weather).toMatchObject({
    status: 'unavailable',
    data: weather,
    code: 'UPSTREAM_UNAVAILABLE',
  });
  expect(result.current.congestion).toMatchObject({ status: 'error', data: congestion });
  jest.mocked(fetchLiveWeather).mockResolvedValue({ status: 'outside_area' });
  jest.mocked(fetchLiveCongestion).mockResolvedValue({ status: 'outside_area' });
  await act(async () => {
    await result.current.load({ lat: 37.7, lng: 127 });
  });
  expect(result.current.weather.data).toBeNull();
  expect(result.current.congestion.data).toBeNull();
});
