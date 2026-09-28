import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isIndexableHostname, resolveRequestHostname } from '@/shared/lib/seo/site';

export const NOINDEX_ROBOTS_TAG = 'noindex, nofollow, noarchive';

/**
 * Runtime guard for non-canonical hosts (dev zone, cluster Service names,
 * probes). It complements the host-aware robots.txt: even if a crawler reaches
 * a non-production host directly, every response carries an explicit noindex.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!isIndexableHostname(resolveRequestHostname(request.headers))) {
    response.headers.set('X-Robots-Tag', NOINDEX_ROBOTS_TAG);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
