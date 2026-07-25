import { parseNaturalLanguageSearch } from '../rule-parser';

describe('natural language search rule parser', () => {
  it('extracts only allowlisted categories and filters from Korean', () => {
    const rule = parseNaturalLanguageSearch('지금 여는 2km 이내 한산한 실내 도서관');

    expect(rule.matched).toBe(true);
    expect(rule.categories).toEqual(['library']);
    expect(rule.filters).toEqual({
      maxDistanceKm: 2,
      openOnly: true,
      reservableOnly: false,
      indoorOnly: true,
      lowCongestionOnly: true,
    });
    expect(rule.preset).toBe('quiet');
    expect(rule.summaryEn).toContain('Library');
  });

  it('supports equivalent English intents', () => {
    const rule = parseNaturalLanguageSearch('quiet indoor library near me');

    expect(rule.categories).toContain('library');
    expect(rule.filters.indoorOnly).toBe(true);
    expect(rule.filters.lowCongestionOnly).toBe(true);
    expect(rule.filters.maxDistanceKm).toBe(2);
  });

  it('converts meters and clamps excessive distances', () => {
    expect(parseNaturalLanguageSearch('500m 이내 공원').filters.maxDistanceKm).toBe(0.5);
    expect(parseNaturalLanguageSearch('999km 이내 공원').filters.maxDistanceKm).toBe(10);
  });

  it('does not interpret arbitrary text or executable-looking input', () => {
    const rule = parseNaturalLanguageSearch('<script>alert(1)</script>');

    expect(rule.matched).toBe(false);
    expect(rule.matchedRuleCodes).toEqual([]);
    expect(rule.summary).toBe('');
    expect(rule.summaryEn).toBe('');
  });
});
