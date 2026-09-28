import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, absoluteSiteUrl } from '@/shared/lib/seo/site';

/**
 * Escape a JSON-LD payload for inline `<script>` embedding. `<`, `>` and `&`
 * are escaped so a value can never terminate the script element.
 */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** WebSite + WebApplication graph for the home page. */
export const HOME_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': absoluteSiteUrl('/#website'),
      url: absoluteSiteUrl('/'),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: SITE_LOCALE,
    },
    {
      '@type': 'WebApplication',
      '@id': absoluteSiteUrl('/#application'),
      url: absoluteSiteUrl('/'),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      inLanguage: SITE_LOCALE,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    },
  ],
} as const;
