/**
 * Single source of truth for the public site identity.
 *
 * `SITE_ORIGIN` is the production canonical origin and is deliberately a
 * constant, not a build input: canonical URLs, sitemap URLs, Open Graph URLs
 * and JSON-LD must point at the public host no matter which image serves them.
 * Whether a response may be indexed is decided per request from the ingress
 * hostname (see `isIndexableHostname`), so a dev image or a mis-built image can
 * never publish crawlable robots/sitemap output on a non-canonical host.
 */

export const SITE_ORIGIN = 'https://seoulfit.damecasol.com';
export const SITE_NAME = 'Seoul Fit';
export const SITE_TITLE = `${SITE_NAME} | 서울 공공시설 지도`;
export const SITE_DESCRIPTION =
  '서울의 공원, 도서관, 문화행사와 공공시설을 한곳에서 탐색하는 지도 서비스';
export const SITE_LOCALE = 'ko-KR';
export const SITE_OG_LOCALE = 'ko_KR';
export const INDEXABLE_HOSTNAME = new URL(SITE_ORIGIN).hostname;

/** Absolute URL on the canonical public origin. */
export function absoluteSiteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

/** @deprecated Use `absoluteSiteUrl`. Kept for existing call sites. */
export const getSiteUrl = absoluteSiteUrl;

/**
 * Only the exact production hostname may be indexed. Everything else
 * (`*.dev.damecasol.com`, cluster Service names, pod IPs, localhost) is a
 * non-canonical host and must stay out of search engines.
 */
export function isIndexableHostname(hostname: string | null | undefined): boolean {
  return (hostname ?? '').trim().toLowerCase() === INDEXABLE_HOSTNAME;
}

/**
 * Resolve the hostname the client actually requested. Cloudflare and Traefik
 * preserve `Host`; `X-Forwarded-Host` wins when a proxy rewrites it.
 */
export function resolveRequestHostname(headers: Pick<Headers, 'get'>): string {
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || headers.get('host') || '';
  return host.split(':')[0].trim().toLowerCase();
}

/**
 * Request-scoped indexing decision for robots/sitemap route handlers.
 */
export function isIndexableRequest(headers: Pick<Headers, 'get'>): boolean {
  return isIndexableHostname(resolveRequestHostname(headers));
}
