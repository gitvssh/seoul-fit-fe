import type { MetadataRoute } from 'next';
import {
  PUBLIC_PLACE_CATEGORIES,
  getPublicPlacePath,
  getPublicPlaceSitemapEntries,
} from '@/shared/lib/seo/public-places';
import { getSiteUrl, isSearchIndexingEnabled } from '@/shared/lib/seo/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSearchIndexingEnabled()) {
    return [];
  }

  const indexedCategories = PUBLIC_PLACE_CATEGORIES.filter(category => category.indexable);
  const staticPages: MetadataRoute.Sitemap = [
    { url: getSiteUrl('/') },
    { url: getSiteUrl('/places') },
    ...indexedCategories.map(category => ({
      url: getSiteUrl(`/places/${category.slug}`),
    })),
  ];

  const entries = await Promise.all(
    indexedCategories.map(async category => {
      const places = await getPublicPlaceSitemapEntries(category.slug);
      return places.map(place => ({
        url: getSiteUrl(getPublicPlacePath(category.slug, place.id)),
        lastModified: place.lastModified ? new Date(place.lastModified) : undefined,
      }));
    })
  );

  const entriesByUrl = new Map(entries.flat().map(entry => [entry.url, entry]));

  return [...staticPages, ...entriesByUrl.values()];
}
