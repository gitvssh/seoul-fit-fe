import { act, renderHook, waitFor } from '@testing-library/react'
import { useSearchCache } from '../useSearchCache'

const subwayStation = {
  code: 'subway_1',
  name: '서울역',
  route: '1호선'
}

const bikeStation = {
  code: 'bike_1',
  name: '서울역 따릉이'
}

function mockInitialLoad() {
  ;(fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.startsWith('/api/search/index')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 101,
            name: '남산공원',
            address: '서울특별시 중구',
            refTable: 'park',
            refId: 42,
          },
        ],
      })
    }

    if (url.startsWith('/api/subway')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: { stations: [subwayStation] } })
      })
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: { stations: [bikeStation] } })
    })
  })
}

global.fetch = jest.fn()

describe('useSearchCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockInitialLoad()
  })

  it('loads the backend POI index with subway and bike data into the cache', async () => {
    const { result } = renderHook(() => useSearchCache())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.searchCache).toHaveLength(3)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.search('남산')).toEqual([
      expect.objectContaining({
        category: 'park',
        ref_table: 'park',
        ref_id: 42,
      }),
    ])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('searches the in-memory cache', async () => {
    const { result } = renderHook(() => useSearchCache())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.search('서울역')).toHaveLength(2)
    expect(result.current.search('없는 시설')).toEqual([])
    expect(result.current.search('   ')).toEqual([])
  })

  it('filters search results by category', async () => {
    const { result } = renderHook(() => useSearchCache())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const results = result.current.searchByCategory('서울역', ['subway'])
    expect(results).toEqual([expect.objectContaining({ category: 'subway' })])
  })

  it('stores and clears search history', async () => {
    const { result } = renderHook(() => useSearchCache())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.addToHistory('서울역'))
    expect(result.current.searchHistory).toHaveLength(1)
    expect(localStorage.getItem('seoul-fit-search-history')).toContain('서울역')

    act(() => result.current.clearHistory())
    expect(result.current.searchHistory).toEqual([])
  })

  it('reports a failed initial load without throwing', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('network failure'))
    const { result } = renderHook(() => useSearchCache())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.searchCache).toEqual([])
  })
})
