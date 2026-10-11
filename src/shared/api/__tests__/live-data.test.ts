import { fetchLiveCongestion, fetchLiveWeather } from '../live-data'

type FetchMock = jest.Mock<Promise<Response>, [RequestInfo | URL]>
const asFetch = (mock: FetchMock) => mock as unknown as typeof fetch

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('live-data client', () => {
  afterEach(() => jest.restoreAllMocks())

  it('returns ok with data', async () => {
    const mock: FetchMock = jest.fn(async (_input: RequestInfo | URL) => jsonResponse(200, { success: true, data: { TEMP: '21' } }))
    global.fetch = asFetch(mock)
    await expect(fetchLiveWeather(37.5, 127)).resolves.toEqual({ status: 'ok', data: { TEMP: '21' } })
    expect(mock.mock.calls[0][0]).toBe('/api/weather?lat=37.5&lng=127')
  })

  it('distinguishes outside-area from upstream failures', async () => {
    global.fetch = asFetch(jest.fn(async (_input: RequestInfo | URL) => jsonResponse(404, { success: false, code: 'OUTSIDE_LIVE_AREA' })))
    await expect(fetchLiveCongestion(37.7, 127.2)).resolves.toEqual({ status: 'outside_area' })

    global.fetch = asFetch(
      jest.fn(async (_input: RequestInfo | URL) =>
        jsonResponse(503, { success: false, code: 'UPSTREAM_ERROR', upstreamCode: 'ERROR-500' })
      )
    )
    await expect(fetchLiveCongestion(37.5, 127)).resolves.toEqual({ status: 'unavailable', code: 'ERROR-500' })
  })

  it('reports errors for invalid input and network failures', async () => {
    await expect(fetchLiveWeather(Number.NaN, 127)).resolves.toEqual({ status: 'error' })
    global.fetch = asFetch(jest.fn(async (_input: RequestInfo | URL) => { throw new Error('offline') }))
    await expect(fetchLiveWeather(37.5, 127)).resolves.toEqual({ status: 'error' })
  })
})
