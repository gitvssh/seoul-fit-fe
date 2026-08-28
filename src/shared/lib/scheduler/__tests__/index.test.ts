import { loadAllBikeStations, loadAllSubwayStations } from '@/lib/seoulApi';
import { serverCache } from '@/lib/serverCache';
import { writeRuntimeEvent } from '@/src/shared/lib/observability/http-access-log';

import { DataScheduler } from '../index';

jest.mock('@/lib/seoulApi', () => ({
  loadAllBikeStations: jest.fn(),
  loadAllSubwayStations: jest.fn(),
}));
jest.mock('@/lib/serverCache', () => ({
  serverCache: {
    getStatus: jest.fn(),
    setDynamic: jest.fn(),
    setStatic: jest.fn(),
  },
}));
jest.mock('@/src/shared/lib/observability/http-access-log', () => ({
  writeRuntimeEvent: jest.fn(),
}));

const mockedLoadAllBikeStations = jest.mocked(loadAllBikeStations);
const mockedLoadAllSubwayStations = jest.mocked(loadAllSubwayStations);
const mockedGetStatus = jest.mocked(serverCache.getStatus);
const mockedSetDynamic = jest.mocked(serverCache.setDynamic);
const mockedSetStatic = jest.mocked(serverCache.setStatic);
const mockedWriteRuntimeEvent = jest.mocked(writeRuntimeEvent);

const SUBWAY_STATIONS = [
  {
    BLDN_ID: 'subway-1',
    BLDN_NM: '서울역',
    ROUTE: '1호선',
    LAT: '37.5547',
    LOT: '126.9707',
  },
];
const BIKE_STATIONS = [
  {
    rackTotCnt: '10',
    stationName: '서울역 대여소',
    parkingBikeTotCnt: '4',
    shared: '40',
    stationLatitude: '37.5547',
    stationLongitude: '126.9707',
    stationId: 'bike-1',
  },
];

describe('DataScheduler runtime lifecycle', () => {
  let scheduler: DataScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    mockedLoadAllSubwayStations.mockResolvedValue(SUBWAY_STATIONS);
    mockedLoadAllBikeStations.mockResolvedValue(BIKE_STATIONS);
    mockedGetStatus.mockReturnValue({
      subway_stations: { timestamp: 1, isStatic: true, dataSize: 1 },
      bike_stations: { timestamp: 2, isStatic: false, dataSize: 1 },
    });
    scheduler = new DataScheduler();
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
  });

  it('initializes both caches, refreshes bikes on schedule, and stops cleanly', async () => {
    await scheduler.initialize();

    expect(mockedSetStatic).toHaveBeenCalledWith('subway_stations', SUBWAY_STATIONS);
    expect(mockedSetDynamic).toHaveBeenCalledWith('bike_stations', BIKE_STATIONS);
    expect(mockedWriteRuntimeEvent).toHaveBeenNthCalledWith(1, {
      eventName: 'service.cache.operation',
      eventAction: 'refresh',
      eventOutcome: 'success',
      operation: 'subway',
    });
    expect(mockedWriteRuntimeEvent).toHaveBeenNthCalledWith(2, {
      eventName: 'service.cache.operation',
      eventAction: 'refresh',
      eventOutcome: 'success',
      operation: 'bike',
    });
    expect(mockedWriteRuntimeEvent).toHaveBeenNthCalledWith(3, {
      eventName: 'service.cache.operation',
      eventAction: 'schedule',
      eventOutcome: 'success',
      operation: 'bike',
    });

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockedLoadAllBikeStations).toHaveBeenCalledTimes(2);
    expect(mockedSetDynamic).toHaveBeenCalledTimes(2);
    expect(scheduler.getStatus()).toEqual({
      initialized: true,
      cacheStatus: {
        subway_stations: { timestamp: 1, isStatic: true, dataSize: 1 },
        bike_stations: { timestamp: 2, isStatic: false, dataSize: 1 },
      },
    });

    await scheduler.initialize();

    expect(mockedLoadAllSubwayStations).toHaveBeenCalledTimes(1);
    expect(mockedWriteRuntimeEvent).toHaveBeenCalledWith({
      eventName: 'service.cache.initialize',
      eventAction: 'complete',
      eventOutcome: 'success',
      operation: 'scheduler',
    });

    scheduler.stop();
    scheduler.stop();
    expect(mockedWriteRuntimeEvent).toHaveBeenCalledWith({
      eventName: 'service.cache.operation',
      eventAction: 'stop',
      eventOutcome: 'success',
      operation: 'scheduler',
    });
  });

  it('records bounded failures while preserving the subway fallback and bike cache', async () => {
    const subwayError = new Error('subway-response-secret');
    const bikeError = new Error('bike-response-secret');
    mockedLoadAllSubwayStations.mockRejectedValueOnce(subwayError);
    mockedLoadAllBikeStations.mockRejectedValueOnce(bikeError);

    await scheduler.initialize();

    expect(mockedSetStatic).toHaveBeenCalledWith('subway_stations', []);
    expect(mockedSetDynamic).not.toHaveBeenCalled();
    expect(mockedWriteRuntimeEvent).toHaveBeenCalledWith({
      eventName: 'service.cache.operation',
      eventAction: 'refresh',
      eventOutcome: 'failure',
      operation: 'subway',
      error: subwayError,
    });
    expect(mockedWriteRuntimeEvent).toHaveBeenCalledWith({
      eventName: 'service.cache.operation',
      eventAction: 'refresh',
      eventOutcome: 'failure',
      operation: 'bike',
      error: bikeError,
    });
  });

  it('allows initialization to retry after an unexpected scheduler setup failure', async () => {
    const scheduleError = new Error('timer setup failed');
    mockedWriteRuntimeEvent.mockImplementation(options => {
      if (options.eventAction === 'schedule') {
        throw scheduleError;
      }
    });

    await expect(scheduler.initialize()).rejects.toThrow(scheduleError);
    expect(scheduler.getStatus().initialized).toBe(false);

    mockedWriteRuntimeEvent.mockImplementation(() => undefined);
    await expect(scheduler.initialize()).resolves.toBeUndefined();

    expect(mockedLoadAllSubwayStations).toHaveBeenCalledTimes(2);
    expect(mockedLoadAllBikeStations).toHaveBeenCalledTimes(2);
    expect(scheduler.getStatus().initialized).toBe(true);
  });
});
