/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET as getWeather } from '../api/weather/route';
import { GET as getCongestion } from '../api/congestion/route';
import { resetUnavailableAreas } from '@/entities/weather';

type FetchMock = jest.Mock<Promise<Response>, [RequestInfo | URL]>;

const originalFetch = global.fetch;

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function weatherPayload(areaName: string) {
  return {
    RESULT: { 'RESULT.CODE': 'INFO-000', 'RESULT.MESSAGE': '정상 처리되었습니다.' },
    CITYDATA: {
      AREA_NM: areaName,
      WEATHER_STTS: [{ WEATHER_STTS: '맑음', TEMP: '21', SENSIBLE_TEMP: '21', HUMIDITY: '40' }],
    },
  };
}

function congestionPayload(areaName: string) {
  return {
    RESULT: { 'RESULT.CODE': 'INFO-000', 'RESULT.MESSAGE': '정상 처리되었습니다.' },
    CITYDATA: {
      AREA_NM: areaName,
      LIVE_PPLTN_STTS: [
        {
          AREA_CONGEST_LVL: '여유',
          AREA_CONGEST_MSG: '도보 이동이 자유로워요.',
          AREA_PPLTN_MIN: '2000',
          AREA_PPLTN_MAX: '2500',
        },
      ],
    },
  };
}

function areaCodeOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1);
}

beforeEach(() => {
  process.env.SEOUL_API_KEY = 'test-key';
  resetUnavailableAreas();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('live-data routes fall back across area candidates', () => {
  it('weather: skips an area code the catalog no longer serves and uses the next nearest', async () => {
    const requested: string[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(areaCodeOf(url));
      // 사라진 지역 코드는 RESULT 없이 빈 응답으로 온다.
      if (url.endsWith('/POI130')) return jsonResponse({});
      return jsonResponse(weatherPayload('광화문·덕수궁'));
    }) as FetchMock;

    const response = await getWeather(
      new NextRequest('http://localhost/api/weather?lat=37.5665&lng=126.978')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.AREA_CD).toBe('POI009');
    expect(body.data.TEMP).toBe('21');
    expect(requested).toEqual(['POI130', 'POI009']);

    // 사라진 코드는 메모되어 다음 요청에서 상위 API를 다시 부르지 않는다.
    requested.length = 0;
    const second = await getWeather(
      new NextRequest('http://localhost/api/weather?lat=37.5666&lng=126.9781')
    );
    expect(second.status).toBe(200);
    expect(requested).not.toContain('POI130');
  });

  it('weather: returns 503 with the upstream code when every candidate fails', async () => {
    global.fetch = jest.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({ RESULT: { CODE: 'ERROR-500', MESSAGE: '서버 오류' } })
    ) as FetchMock;

    const response = await getWeather(
      new NextRequest('http://localhost/api/weather?lat=37.4979&lng=127.0276')
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      success: false,
      code: 'UPSTREAM_ERROR',
      upstreamCode: 'ERROR-500',
    });
    expect((global.fetch as FetchMock).mock.calls).toHaveLength(3);
  });

  it('weather: rejects coordinates outside Seoul and far from live-data areas', async () => {
    global.fetch = jest.fn() as FetchMock;

    const invalid = await getWeather(
      new NextRequest('http://localhost/api/weather?lat=35&lng=129')
    );
    expect(invalid.status).toBe(400);

    const missing = await getWeather(new NextRequest('http://localhost/api/weather?lat=37.5'));
    expect(missing.status).toBe(400);

    const far = await getWeather(
      new NextRequest('http://localhost/api/weather?lat=37.75&lng=127.25')
    );
    expect(far.status).toBe(404);
    expect((await far.json()).code).toBe('OUTSIDE_LIVE_AREA');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('congestion: skips a dead area code and returns the UI payload for the next nearest', async () => {
    const requested: string[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(areaCodeOf(url));
      if (url.endsWith('/POI130'))
        return jsonResponse({
          RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' },
        });
      return jsonResponse(congestionPayload('광화문·덕수궁'));
    }) as FetchMock;

    const response = await getCongestion(
      new NextRequest('http://localhost/api/congestion?lat=37.5665&lng=126.978')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      AREA_CD: 'POI009',
      AREA_NM: '광화문·덕수궁',
      AREA_CONGEST_LVL: '여유',
      cached: false,
    });
    expect(requested).toEqual(['POI130', 'POI009']);

    // 캐시된 결과는 상위 API 호출 없이 cached: true로 돌아온다.
    const cached = await getCongestion(
      new NextRequest('http://localhost/api/congestion?lat=37.5665&lng=126.978')
    );
    expect((await cached.json()).data.cached).toBe(true);
    expect(requested).toEqual(['POI130', 'POI009']);
  });

  it('congestion: returns 503 with the upstream code when every candidate fails', async () => {
    global.fetch = jest.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({ RESULT: { CODE: 'ERROR-300', MESSAGE: '한도 초과' } })
    ) as FetchMock;

    const response = await getCongestion(
      new NextRequest('http://localhost/api/congestion?lat=37.4979&lng=127.0276')
    );
    expect(response.status).toBe(503);
    expect((await response.json()).upstreamCode).toBe('ERROR-300');
  });
});
