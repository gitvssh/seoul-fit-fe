import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/shared/lib/seo/site';
import { BRAND_HEX } from '@/shared/ui/brand/logo-mark';

/**
 * Installable web app manifest. There is deliberately no service worker: the
 * product depends on live city data and the Kakao SDK, so offline support adds
 * cost without value (see docs/research/2026-10-ui-ux/portfolio_presentation.md §4).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: 'ko',
    start_url: '/',
    display: 'standalone',
    background_color: BRAND_HEX.background,
    theme_color: BRAND_HEX.primary,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
