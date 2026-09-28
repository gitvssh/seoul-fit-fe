import {
  INDEXABLE_HOSTNAME,
  SITE_ORIGIN,
  absoluteSiteUrl,
  isIndexableHostname,
  isIndexableRequest,
  resolveRequestHostname,
} from '../site';

function headersOf(entries: Record<string, string>): Pick<Headers, 'get'> {
  const lowered = Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value])
  );
  return { get: (name: string) => lowered[name.toLowerCase()] ?? null };
}

describe('public SEO contract', () => {
  it('pins canonical URLs to the production origin', () => {
    expect(SITE_ORIGIN).toBe('https://seoulfit.damecasol.com');
    expect(INDEXABLE_HOSTNAME).toBe('seoulfit.damecasol.com');
    expect(absoluteSiteUrl('/places/park/42')).toBe(`${SITE_ORIGIN}/places/park/42`);
    expect(absoluteSiteUrl()).toBe(`${SITE_ORIGIN}/`);
  });

  it('allows indexing only for the exact production hostname', () => {
    expect(isIndexableHostname('seoulfit.damecasol.com')).toBe(true);
    expect(isIndexableHostname('SeoulFit.damecasol.com')).toBe(true);
    expect(isIndexableHostname('seoulfit.dev.damecasol.com')).toBe(false);
    expect(isIndexableHostname('seoul-fit-fe.seoul-fit-prod.svc.cluster.local')).toBe(false);
    expect(isIndexableHostname('localhost')).toBe(false);
    expect(isIndexableHostname('')).toBe(false);
    expect(isIndexableHostname(undefined)).toBe(false);
  });

  it('resolves the requested host from forwarded headers first', () => {
    expect(
      resolveRequestHostname(
        headersOf({
          host: 'seoul-fit-fe.seoul-fit-prod.svc:3000',
          'x-forwarded-host': 'seoulfit.damecasol.com, proxy.internal',
        })
      )
    ).toBe('seoulfit.damecasol.com');
    expect(resolveRequestHostname(headersOf({ host: 'Seoulfit.dev.damecasol.com:443' }))).toBe(
      'seoulfit.dev.damecasol.com'
    );
    expect(resolveRequestHostname(headersOf({}))).toBe('');
  });

  it('keeps the dev zone and probes non-indexable', () => {
    expect(isIndexableRequest(headersOf({ host: 'seoulfit.damecasol.com' }))).toBe(true);
    expect(isIndexableRequest(headersOf({ host: 'seoulfit.dev.damecasol.com' }))).toBe(false);
    expect(isIndexableRequest(headersOf({ host: '10.42.0.17:3000' }))).toBe(false);
  });
});
