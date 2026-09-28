/** @jest-environment node */
import sitemap from '../sitemap';

const requestHeaders = jest.fn<Promise<Headers>, []>();
const sitemapEntries = jest.fn<Promise<{ id: number; lastModified: string | null }[]>, [string]>();

jest.mock('next/headers', () => ({
  headers: () => requestHeaders(),
}));

jest.mock('@/shared/lib/seo/public-places', () => {
  const actual = jest.requireActual('@/shared/lib/seo/public-places');
  return {
    ...actual,
    getPublicPlaceSitemapEntries: (category: string) => sitemapEntries(category),
  };
});

describe('sitemap.xml route', () => {
  it('is empty on non-canonical hosts', async () => {
    requestHeaders.mockResolvedValue(new Headers({ host: 'seoulfit.dev.damecasol.com' }));

    await expect(sitemap()).resolves.toEqual([]);
    expect(sitemapEntries).not.toHaveBeenCalled();
  });

  it('lists canonical production URLs for static pages and indexable places', async () => {
    requestHeaders.mockResolvedValue(new Headers({ host: 'seoulfit.damecasol.com' }));
    sitemapEntries.mockImplementation(async category =>
      category === 'park'
        ? [
            { id: 42, lastModified: '2026-09-01T00:00:00Z' },
            { id: 42, lastModified: '2026-09-01T00:00:00Z' },
            { id: 7, lastModified: null },
          ]
        : []
    );

    const entries = await sitemap();
    const urls = entries.map(entry => entry.url);

    expect(urls).toEqual([
      'https://seoulfit.damecasol.com/',
      'https://seoulfit.damecasol.com/places',
      'https://seoulfit.damecasol.com/places/park',
      'https://seoulfit.damecasol.com/places/library',
      'https://seoulfit.damecasol.com/places/restaurant',
      'https://seoulfit.damecasol.com/places/park/42',
      'https://seoulfit.damecasol.com/places/park/7',
    ]);
    expect(urls.some(url => url.includes('cultural-event'))).toBe(false);
    expect(entries.at(-2)?.lastModified).toEqual(new Date('2026-09-01T00:00:00Z'));
    expect(sitemapEntries).toHaveBeenCalledTimes(3);
  });
});
