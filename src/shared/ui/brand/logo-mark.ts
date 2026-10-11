/**
 * Single source of the Seoul Fit brand mark.
 *
 * The pin-and-blocks glyph was drawn inline in the header; every brand surface
 * (header logo, favicon SVG, Apple touch icon, manifest icons, Open Graph card)
 * now draws the same paths so the product has exactly one mark.
 */

/** Original drawing box of the glyph paths. */
export const LOGO_MARK_VIEWBOX = '0 0 48 49';

/**
 * Square box centred on the glyph (centre 24, 24.9) so the glyph fills about
 * 62% of a tile's height. Use this for icons and tiles.
 */
export const LOGO_MARK_TILE_VIEWBOX = '2 2.9 44 44';

export const LOGO_MARK_PATHS = [
  'M24.0001 11.2046C26.9059 11.2046 29.2618 13.5605 29.2618 16.4663C29.2617 19.974 24.0001 24.6509 24.0001 24.6509C24.0001 24.6509 18.7384 19.974 18.7383 16.4663C18.7383 13.5605 21.0942 11.2046 24.0001 11.2046ZM24.0001 14.2192C22.8237 14.2192 21.8702 15.1727 21.8702 16.3491C21.8702 17.5255 22.8237 18.479 24.0001 18.479C25.1764 18.4789 26.1299 17.5254 26.1299 16.3491C26.1299 15.1728 25.1764 14.2193 24.0001 14.2192Z',
  'M19.8088 36.9922V24.6906L13.5467 27.6462V38.59L19.8088 36.9922Z',
  'M20.8936 34.3163V25.2897L27.7967 28.3252V37.6714L20.8936 34.3163Z',
  'M28.7335 37.6714V23.2926L34.4533 20.5767V34.8356L28.7335 37.6714Z',
] as const;

/**
 * Brand hex values for surfaces that cannot read CSS variables (static icon
 * files and `next/og` images). They mirror the light tokens in app/globals.css
 * and the category fills in docs/DESIGN_SYSTEM.md §2.
 */
export const BRAND_HEX = {
  primary: '#086ABA',
  primaryForeground: '#FFFFFF',
  background: '#F9FAFB',
  card: '#FFFFFF',
  foreground: '#161C27',
  mutedForeground: '#5C687A',
  border: '#DAE0E7',
  accent: '#E5F4FF',
  catPark: '#208858',
  catLibrary: '#6549D4',
  catRestaurant: '#EB5C0A',
  catCooling: '#0A91C2',
} as const;

/** Corner radius of the brand tile as a fraction of its size. */
export const LOGO_TILE_RADIUS = 0.22;
