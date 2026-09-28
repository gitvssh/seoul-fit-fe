import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SITE_ORIGIN, absoluteSiteUrl, isIndexableRequest } from '@/shared/lib/seo/site';

/**
 * Reading request headers makes this route dynamic on purpose: the crawl
 * policy follows the host that was actually requested, not a build-time value.
 * Only the canonical production host allows crawling.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isIndexableRequest(await headers())) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/health', '/profile'],
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
    host: SITE_ORIGIN,
  };
}
