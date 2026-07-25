import type { MetadataRoute } from 'next';
import { getSiteUrl, isSearchIndexingEnabled } from '@/shared/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingEnabled()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/'],
    },
    sitemap: getSiteUrl('/sitemap.xml'),
  };
}
