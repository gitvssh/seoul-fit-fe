import type { Facility } from '@/lib/types';
import {
  CLUSTER_OVERLAY_STYLES,
  DEFAULT_MARKER_LABELS,
  createClusterElement,
  createCurrentLocationElement,
  createFacilityMarkerElement,
  decorateClusterElement,
  formatClusterCount,
  getClusterTier,
  getFacilityMarkerId,
  getMarkerCrowdLevel,
  setFacilityMarkerHidden,
  setFacilityMarkerSelected,
  updateFacilityMarkerElement,
} from '../marker';

const createFacility = (overrides: Partial<Facility> = {}): Facility => ({
  id: 'p1',
  name: '서울숲',
  category: 'park',
  position: { lat: 37.5444, lng: 127.0374 },
  address: '서울 성동구',
  congestionLevel: 'low',
  ...overrides,
});

describe('createFacilityMarkerElement', () => {
  it('renders public-data names as text, never as markup', () => {
    const hostile = '<script>alert(1)</script><img src=x onerror=alert(1)>';
    const element = createFacilityMarkerElement(createFacility({ name: hostile }));

    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.sf-marker__label')?.textContent).toBe(hostile);
    expect(element.getAttribute('aria-label')).toContain(hostile);
  });

  it('builds the default anatomy: 44px button out of the tab order with a 28px category pin', () => {
    const element = createFacilityMarkerElement(createFacility());

    expect(element.classList.contains('sf-marker')).toBe(true);
    expect(element.getAttribute('role')).toBe('button');
    expect(element.tabIndex).toBe(-1);
    expect(element.hasAttribute('aria-current')).toBe(false);
    expect(element.dataset.category).toBe('park');
    expect(element.dataset.facilityId).toBe('p1');
    expect(element.dataset.markerId).toBe('park:p1');
    expect(element.getAttribute('aria-label')).toBe('서울숲, 공원');
    expect(element.style.getPropertyValue('--sf-marker-fill')).toBe('hsl(var(--cat-park))');
    expect(element.style.getPropertyValue('--sf-marker-glyph')).toBe('#ffffff');
    expect(element.querySelector('.sf-marker__pin .sf-marker__glyph svg')).not.toBeNull();
    expect(element.dataset.selected).toBeUndefined();
  });

  it('uses the ink glyph on light fills and the line colour for subway stations', () => {
    const sports = createFacilityMarkerElement(createFacility({ category: 'sports' }));
    expect(sports.style.getPropertyValue('--sf-marker-glyph')).toBe('hsl(var(--marker-ink))');

    const subway = createFacilityMarkerElement(
      createFacility({ category: 'subway', subwayStation: { route: '2호선' } })
    );
    expect(subway.style.getPropertyValue('--sf-marker-fill')).toBe('#00A84D');
    expect(subway.style.getPropertyValue('--sf-marker-glyph')).toBe('#ffffff');
  });

  it('normalises numeric public-data ids', () => {
    const element = createFacilityMarkerElement(
      createFacility({ id: 831 as unknown as string, category: 'library' })
    );
    expect(element.dataset.facilityId).toBe('831');
    expect(element.dataset.markerId).toBe('library:831');
  });

  it('applies the selected state as attributes instead of rebuilding the content', () => {
    const element = createFacilityMarkerElement(createFacility(), { selected: true });
    const pin = element.querySelector('.sf-marker__pin');

    expect(element.dataset.selected).toBe('');
    expect(element.getAttribute('aria-current')).toBe('true');
    expect(element.tabIndex).toBe(0);

    setFacilityMarkerSelected(element, false);
    expect(element.dataset.selected).toBeUndefined();
    expect(element.hasAttribute('aria-current')).toBe(false);
    expect(element.tabIndex).toBe(-1);
    expect(element.querySelector('.sf-marker__pin')).toBe(pin);

    setFacilityMarkerHidden(element, true);
    expect(element.dataset.hidden).toBe('');
  });

  it('plays the select-in pop once per selection, not on data refresh or re-show', () => {
    const element = createFacilityMarkerElement(createFacility(), { selected: true });
    const pin = element.querySelector('.sf-marker__pin') as HTMLElement;
    expect(element.dataset.enter).toBe('');

    // 다른 애니메이션의 종료는 무시한다.
    const other = new Event('animationend', { bubbles: true });
    Object.defineProperty(other, 'animationName', { value: 'sf-loc-pulse' });
    pin.dispatchEvent(other);
    expect(element.dataset.enter).toBe('');

    const end = new Event('animationend', { bubbles: true });
    Object.defineProperty(end, 'animationName', { value: 'sf-marker-select-in' });
    pin.dispatchEvent(end);
    expect(element.dataset.enter).toBeUndefined();

    // 같은 시설의 데이터 갱신(syncFocusEntry)은 팝을 되풀이하지 않는다.
    updateFacilityMarkerElement(element, createFacility({ name: '서울숲 (갱신)' }), {
      selected: true,
    });
    expect(element.dataset.enter).toBeUndefined();

    // 선택을 풀었다가 다시 고르면 다시 한 번 재생한다.
    setFacilityMarkerSelected(element, false);
    expect(element.dataset.enter).toBeUndefined();
    setFacilityMarkerSelected(element, true);
    expect(element.dataset.enter).toBe('');
  });

  it('draws the crowd ring only where the level is a real signal (bike availability)', () => {
    const park = createFacilityMarkerElement(createFacility({ congestionLevel: 'high' }));
    expect(park.dataset.crowd).toBeUndefined();
    expect(getMarkerCrowdLevel(createFacility({ congestionLevel: 'high' }))).toBeNull();

    const bike = createFacilityMarkerElement(
      createFacility({
        category: 'bike',
        congestionLevel: 'high',
        bikeFacility: { parkingBikeTotCnt: 0 },
      })
    );
    expect(bike.dataset.crowd).toBe('high');
    expect(bike.style.getPropertyValue('--sf-marker-crowd')).toBe('hsl(var(--destructive))');
  });

  it('updates in place when the facility data changes', () => {
    const element = createFacilityMarkerElement(createFacility());
    const glyph = element.querySelector('.sf-marker__glyph');

    updateFacilityMarkerElement(element, createFacility({ name: '새 이름', category: 'library' }), {
      labels: { ...DEFAULT_MARKER_LABELS, facility: (name, category) => `${name} (${category})` },
    });

    expect(element.getAttribute('aria-label')).toBe('새 이름 (library)');
    expect(element.dataset.category).toBe('library');
    expect(element.querySelector('.sf-marker__label')?.textContent).toBe('새 이름');
    expect(element.querySelector('.sf-marker__glyph')).toBe(glyph);
    expect(glyph?.getAttribute('data-category')).toBe('library');
  });
});

describe('cluster elements', () => {
  it.each([
    [3, 'sm', 36, '3'],
    [42, 'md', 44, '42'],
    [99, 'md', 44, '99'],
    [150, 'lg', 52, '99+'],
  ])('sizes a cluster of %i as %s / %ipx showing %s', (count, size, px, text) => {
    const element = createClusterElement(count);

    expect(element.classList.contains('sf-cluster')).toBe(true);
    expect(element.getAttribute('role')).toBe('button');
    expect(element.tabIndex).toBe(-1);
    expect(element.dataset.size).toBe(size);
    expect(element.style.width).toBe(`${px}px`);
    expect(element.style.height).toBe(`${px}px`);
    expect(element.textContent).toBe(text);
    expect(element.getAttribute('aria-label')).toBe(`장소 ${count}곳 모음`);
    expect(getClusterTier(count).size).toBe(px);
  });

  it('decorates an existing clusterer div without replacing it and uses translated labels', () => {
    const element = document.createElement('div');
    element.innerHTML = '7';

    decorateClusterElement(element, 7, {
      labels: { ...DEFAULT_MARKER_LABELS, cluster: count => `${count} places` },
    });

    expect(element.getAttribute('aria-label')).toBe('7 places');
    expect(element.dataset.count).toBe('7');
    expect(element.textContent).toBe('7');
  });

  it('caps the count label at 99+', () => {
    expect(formatClusterCount(99)).toBe('99');
    expect(formatClusterCount(100)).toBe('99+');
    expect(formatClusterCount(Number.NaN)).toBe('0');
  });

  it('exposes matching inline styles for the official clusterer', () => {
    expect(CLUSTER_OVERLAY_STYLES.map(style => style.width)).toEqual(['36px', '44px', '52px']);
    expect(CLUSTER_OVERLAY_STYLES[0].background).toBe('hsl(var(--surface-elevated))');
  });
});

describe('createCurrentLocationElement', () => {
  it('is a named image with a pulsing halo and a dot', () => {
    const element = createCurrentLocationElement();
    expect(element.getAttribute('role')).toBe('img');
    expect(element.getAttribute('aria-label')).toBe('현재 위치');
    expect(element.querySelector('.sf-me__halo')).not.toBeNull();
    expect(element.querySelector('.sf-me__dot')).not.toBeNull();

    expect(createCurrentLocationElement('Current location').getAttribute('aria-label')).toBe(
      'Current location'
    );
  });
});

describe('getFacilityMarkerId', () => {
  it('combines category and stringified id', () => {
    expect(getFacilityMarkerId({ category: 'bike', id: 12 as unknown as string })).toBe('bike:12');
  });
});
