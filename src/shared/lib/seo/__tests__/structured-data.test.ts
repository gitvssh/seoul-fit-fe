import { HOME_STRUCTURED_DATA, serializeJsonLd } from '../structured-data';
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '../site';

describe('home structured data', () => {
  it('escapes every character that could close the inline script', () => {
    const serialized = serializeJsonLd({
      name: '</script><img src=x onerror=alert(1)>&amp;  ',
    });

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).not.toContain('&');
    expect(serialized).not.toContain(' ');
    expect(serialized).not.toContain(' ');
    expect(JSON.parse(serialized)).toEqual({
      name: '</script><img src=x onerror=alert(1)>&amp;  ',
    });
  });

  it('describes the site and the web application on the production origin', () => {
    const graph = HOME_STRUCTURED_DATA['@graph'];
    const [website, application] = graph;

    expect(HOME_STRUCTURED_DATA['@context']).toBe('https://schema.org');
    expect(graph.map(node => node['@type'])).toEqual(['WebSite', 'WebApplication']);
    expect(website.url).toBe(`${SITE_ORIGIN}/`);
    expect(application.url).toBe(`${SITE_ORIGIN}/`);
    expect(application.name).toBe(SITE_NAME);
    expect(application.description).toBe(SITE_DESCRIPTION);
    expect(serializeJsonLd(HOME_STRUCTURED_DATA)).not.toContain('dev.damecasol.com');
  });
});
