import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import {
  PUBLIC_PLACE_CATEGORIES,
  getPublicPlacePath,
  getPublicPlaceSitemapEntries,
} from '@/shared/lib/seo/public-places';
import { absoluteSiteUrl, isIndexableRequest } from '@/shared/lib/seo/site';

export const dynamic = 'force-dynamic';

/**
 * The sitemap is served only to the canonical production host and lists only
 * canonical production URLs. Static pages are always present so a temporarily
 * unreachable backend still yields a valid sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexableRequest(await headers())) {
    return [];
  }

  const indexedCategories = PUBLIC_PLACE_CATEGORIES.filter(category => category.indexable);
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteSiteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteSiteUrl('/places'), changeFrequency: 'weekly', priority: 0.8 },
    ...indexedCategories.map(category => ({
      url: absoluteSiteUrl(`/places/${category.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  const entries = await Promise.all(
    indexedCategories.map(async category => {
      const places = await getPublicPlaceSitemapEntries(category.slug);
      return places.map(place => ({
        url: absoluteSiteUrl(getPublicPlacePath(category.slug, place.id)),
        lastModified: place.lastModified ? new Date(place.lastModified) : undefined,
      }));
    })
  );

  const entriesByUrl = new Map(entries.flat().map(entry => [entry.url, entry]));

  return [...staticPages, ...entriesByUrl.values()];
}
