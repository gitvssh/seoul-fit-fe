import { env } from '@/config/environment';

export const SITE_NAME = 'Seoul Fit';
export const SITE_DESCRIPTION =
  '서울의 공원, 도서관, 문화행사와 공공시설을 한곳에서 탐색하는 지도 서비스';

export function getSiteUrl(path = '/'): string {
  return new URL(path, `${env.appUrl}/`).toString();
}

/**
 * Development and internal-dev builds must never publish a crawlable sitemap.
 * The hostname check keeps this safe even though Next production builds set
 * NODE_ENV=production for both deployment images.
 */
export function isSearchIndexingEnabled(): boolean {
  return new URL(env.appUrl).hostname === 'seoulfit.damecasol.com';
}
