/** @jest-environment node */
import robots from '../robots';

const requestHeaders = jest.fn<Promise<Headers>, []>();

jest.mock('next/headers', () => ({
  headers: () => requestHeaders(),
}));

describe('robots.txt route', () => {
  it('allows crawling only on the canonical production host', async () => {
    requestHeaders.mockResolvedValue(new Headers({ host: 'seoulfit.damecasol.com' }));

    await expect(robots()).resolves.toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/health', '/profile'],
      },
      sitemap: 'https://seoulfit.damecasol.com/sitemap.xml',
      host: 'https://seoulfit.damecasol.com',
    });
  });

  it('disallows everything for the dev zone and internal hosts', async () => {
    for (const host of ['seoulfit.dev.damecasol.com', 'seoul-fit-fe.seoul-fit-prod.svc:3000']) {
      requestHeaders.mockResolvedValue(new Headers({ host }));

      await expect(robots()).resolves.toEqual({ rules: { userAgent: '*', disallow: '/' } });
    }
  });
});
