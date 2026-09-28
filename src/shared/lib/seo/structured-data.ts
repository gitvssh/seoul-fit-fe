import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, absoluteSiteUrl } from '@/shared/lib/seo/site';

/**
 * Characters that could terminate or alter an inline `<script>` element.
 * `JSON.stringify` leaves them untouched, so they are re-encoded as JSON
 * `\uXXXX` escapes, which every JSON parser decodes back to the same text.
 */
const SCRIPT_UNSAFE_CHARACTERS = ['<', '>', '&', '\u2028', '\u2029'] as const;
const BACKSLASH = String.fromCodePoint(0x5c);

function toJsonUnicodeEscape(character: string): string {
  const codePoint = character.codePointAt(0) ?? 0;
  return `${BACKSLASH}u${codePoint.toString(16).padStart(4, '0')}`;
}

/**
 * Escape a JSON-LD payload for inline `<script type="application/ld+json">`
 * embedding so no value can close the script element.
 */
export function serializeJsonLd(value: object): string {
  return SCRIPT_UNSAFE_CHARACTERS.reduce(
    (text, character) => text.replaceAll(character, toJsonUnicodeEscape(character)),
    JSON.stringify(value)
  );
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
