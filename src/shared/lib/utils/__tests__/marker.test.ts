import {
  createPOIMarkerContent,
  formatInfoWindowContent,
  getCrowdLevelClass,
} from '../marker'

describe('Marker Utils', () => {
  it('creates POI marker content with identifying data', () => {
    const content = createPOIMarkerContent('서울 도서관', 'library-1')

    expect(content).toContain('id="poi-marker-library-1"')
    expect(content).toContain('data-poi-code="library-1"')
    expect(content).toContain('data-poi-name="서울 도서관"')
  })

  it('escapes public-data fields before inserting marker HTML', () => {
    const marker = createPOIMarkerContent(
      '"><img src=x onerror=alert(1)>',
      'x" onclick="alert(1)'
    )
    const info = formatInfoWindowContent({
      name: '<script>alert(1)</script>',
      website: 'javascript:alert(1)',
    })

    expect(marker).not.toContain('<img')
    expect(marker).not.toContain('onclick="alert')
    expect(info).not.toContain('<script>')
    expect(info).not.toContain('javascript:')
  })

  it.each([
    ['low', 'marker-crowd-low'],
    ['medium', 'marker-crowd-medium'],
    ['high', 'marker-crowd-high'],
  ] as const)('maps %s crowd level to its CSS class', (level, expected) => {
    expect(getCrowdLevelClass(level)).toBe(expected)
  })
})
