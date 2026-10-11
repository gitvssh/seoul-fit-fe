/** @jest-environment node */
import {
  PublicPlaceUnavailableError,
  describePlace,
  formatPlaceCount,
  getPublicPlaceMapHref,
  getPublicPlacePage,
  getPublicPlaceSitemapEntries,
  isClosedPlaceName,
  normalizePublicPlacePage,
  parseClosedPlaceName,
  splitPlaceTags,
  type PublicPlacePageResponse,
  type PublicPlaceSummary,
} from '../public-places';

function summary(id: number, name: string): PublicPlaceSummary {
  return {
    id,
    category: 'library',
    categoryLabel: '도서관',
    name,
    address: null,
    description: null,
  };
}

function page(
  content: PublicPlaceSummary[],
  totalElements = content.length
): PublicPlacePageResponse {
  return { content, page: 0, size: 24, totalElements, totalPages: 1, hasNext: false };
}

describe('normalizePublicPlacePage', () => {
  it('keeps one card per stable id when the backend index repeats rows', () => {
    // Regression: the live /places/library listed every library twice ("총 432곳" for 216 libraries).
    const raw = page(
      [
        summary(1, '4.19혁명기념도서관'),
        summary(1, '4.19혁명기념도서관'),
        summary(2, '가락몰도서관'),
        summary(2, '가락몰도서관'),
      ],
      432
    );

    const result = normalizePublicPlacePage(raw);

    expect(result.content.map(place => place.id)).toEqual([1, 2]);
    expect(result.removed).toEqual({ duplicates: 2, closed: 0 });
    expect(result.totalElements).toBe(432);
  });

  it('drops closed facilities from lists and counts them', () => {
    const raw = page([
      summary(1, '[페관] 송중문화정보도서관'),
      summary(2, '[휴관] 어린이도서관'),
      summary(3, '가락몰도서관'),
    ]);

    const result = normalizePublicPlacePage(raw);

    expect(result.content.map(place => place.name)).toEqual(['가락몰도서관']);
    expect(result.removed).toEqual({ duplicates: 0, closed: 2 });
  });

  it('does not treat different ids with the same name as duplicates', () => {
    const result = normalizePublicPlacePage(page([summary(1, '시청역'), summary(2, '시청역')]));
    expect(result.content).toHaveLength(2);
    expect(result.removed.duplicates).toBe(0);
  });
});

describe('closed facility names', () => {
  it('recognises closure markers including the data typo and strips them', () => {
    expect(parseClosedPlaceName('[폐관] 가나다도서관')).toEqual({
      status: '폐관',
      name: '가나다도서관',
    });
    expect(parseClosedPlaceName('[페관] 송중문화정보도서관')).toEqual({
      status: '폐관',
      name: '송중문화정보도서관',
    });
    expect(parseClosedPlaceName('[휴관]어린이도서관')).toEqual({
      status: '휴관',
      name: '어린이도서관',
    });
    expect(parseClosedPlaceName('서울도서관')).toEqual({ status: null, name: '서울도서관' });
    expect(isClosedPlaceName('[폐관] 가나다도서관')).toBe(true);
    expect(isClosedPlaceName('폐관 안내 중인 도서관')).toBe(false);
  });
});

describe('tags and counts', () => {
  it('turns comma-separated raw tags into labels and leaves prose alone', () => {
    expect(splitPlaceTags('특정계층이용시설,회원이용시설')).toEqual([
      '특정계층이용시설',
      '회원이용시설',
    ]);
    expect(splitPlaceTags('경로당')).toEqual([]);
    expect(splitPlaceTags('하나, 이 문장은 스무 글자를 훌쩍 넘기는 긴 설명입니다, 셋')).toEqual([]);
    expect(describePlace('특정계층이용시설,회원이용시설 · 1층 로비')).toEqual({
      tags: ['특정계층이용시설', '회원이용시설'],
      text: '1층 로비',
    });
    expect(describePlace('공공도서관 · 일요일 및 법정공휴일')).toEqual({
      tags: [],
      text: '공공도서관 · 일요일 및 법정공휴일',
    });
    expect(describePlace(null)).toEqual({ tags: [], text: null });
  });

  it('formats counts with Korean digit grouping', () => {
    expect(formatPlaceCount(8000)).toBe('8,000');
    expect(formatPlaceCount(216)).toBe('216');
  });

  it('deep-links into the map with the stable public id', () => {
    expect(getPublicPlaceMapHref({ category: 'library', id: 17930 })).toBe('/?place=library:17930');
  });
});

describe('backend requests', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function respond(status: number, body?: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it('normalises list pages fetched from the backend', async () => {
    fetchMock.mockResolvedValue(respond(200, page([summary(5, 'A'), summary(5, 'A')], 2)));

    const result = await getPublicPlacePage('library', 0);

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/api/public/places?category=library&page=0&size=24'
    );
    expect(result?.content).toHaveLength(1);
    expect(result?.removed.duplicates).toBe(1);
  });

  it('returns null for 404 but throws for backend failures so pages can retry instead of 404-ing', async () => {
    fetchMock.mockResolvedValueOnce(respond(404));
    await expect(getPublicPlacePage('park', 0)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(respond(503));
    await expect(getPublicPlacePage('park', 0)).rejects.toBeInstanceOf(PublicPlaceUnavailableError);

    fetchMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    await expect(getPublicPlacePage('park', 0)).rejects.toBeInstanceOf(PublicPlaceUnavailableError);
  });

  it('keeps the sitemap lenient: failures become an empty list', async () => {
    fetchMock.mockResolvedValueOnce(respond(500));
    await expect(getPublicPlaceSitemapEntries('park')).resolves.toEqual([]);

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(getPublicPlaceSitemapEntries('park')).resolves.toEqual([]);
  });
});
