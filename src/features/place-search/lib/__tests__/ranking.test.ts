import { disassemble, getChoseong } from 'es-hangul';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import {
  CATEGORY_PRIORITY,
  MATCH_TIER,
  classifyQuery,
  loadHangul,
  matchText,
  normalizeText,
  prepareSearchEntry,
  rankSearchEntries,
} from '../ranking';

const hangul = { getChoseong, disassemble };

const fixtures: SearchItem[] = [
  { id: 'lib-1', name: '개봉도서관', category: 'library', address: '서울특별시 구로구 개봉로 1' },
  { id: 'lib-2', name: '서울도서관', category: 'library', address: '서울특별시 중구 세종대로 110' },
  { id: 'lib-3', name: '구로도서관', category: 'library', address: '서울특별시 구로구' },
  { id: 'park-1', name: '남산공원', category: 'park', address: '서울특별시 중구 삼일대로 231' },
  { id: 'park-2', name: '여의도한강공원', category: 'park', address: '서울특별시 영등포구' },
  { id: 'bike-1', name: '349. 어린이도서관', category: 'bike' },
  { id: 'bike-2', name: '개봉도서관 앞', category: 'bike' },
  { id: 'subway-1', name: '서울역', category: 'subway', remark: '1호선' },
  { id: 'subway-2', name: '오이도역', category: 'subway', remark: '4호선' },
  { id: 'subway-3', name: '낙성대역', category: 'subway', remark: '2호선' },
  { id: 'subway-4', name: '여의도역', category: 'subway', remark: '5호선' },
  {
    id: 'event-1',
    name: '책읽는 한강공원',
    category: 'cultural_event',
    address: '서울특별시 영등포구',
  },
  {
    id: 'cool-1',
    name: '중구 경로당',
    category: 'cooling_center',
    address: '서울특별시 중구 남산동 12',
  },
];
const entries = fixtures.map(prepareSearchEntry);
const rank = (query: string, limit = 50) =>
  rankSearchEntries(entries, query, { hangul, limit }).map(item => item.name);

describe('normalizeText', () => {
  it('drops separators, lowercases and keeps a map back to the original indices', () => {
    const normalized = normalizeText('349. 어린이 Dose관');
    expect(normalized.text).toBe('349어린이dose관');
    expect(normalized.map).toEqual([0, 1, 2, 5, 6, 7, 9, 10, 11, 12, 13]);
  });
});

describe('classifyQuery', () => {
  it('only treats queries that contain jamo as fuzzy candidates', () => {
    expect(classifyQuery('ㅅㅇㄷㅅㄱ')).toBe('choseong');
    expect(classifyQuery('서울ㄷ')).toBe('jamo');
    expect(classifyQuery('남산')).toBe('plain');
    expect(classifyQuery('abc')).toBe('plain');
  });
});

describe('matchText', () => {
  it('scores exact > prefix > word start > substring and returns the matched range', () => {
    expect(matchText('남산 공원', '남산공원')).toEqual({
      tier: MATCH_TIER.EXACT,
      start: 0,
      end: 5,
    });
    expect(matchText('개봉도서관', '개봉')).toEqual({ tier: MATCH_TIER.PREFIX, start: 0, end: 2 });
    expect(matchText('349. 어린이도서관', '어린이')).toEqual({
      tier: MATCH_TIER.WORD_START,
      start: 5,
      end: 8,
    });
    expect(matchText('개봉도서관', '도서관')).toEqual({
      tier: MATCH_TIER.SUBSTRING,
      start: 2,
      end: 5,
    });
    expect(matchText('개봉도서관', 'zzzz')).toBeNull();
  });

  it('matches 초성 and incomplete jamo through es-hangul and maps back to syllables', () => {
    expect(matchText('서울도서관', 'ㅅㅇㄷㅅㄱ', { hangul })).toEqual({
      tier: MATCH_TIER.JAMO,
      start: 0,
      end: 5,
    });
    expect(matchText('서울도서관', 'ㄷㅅㄱ', { hangul })).toEqual({
      tier: MATCH_TIER.JAMO,
      start: 2,
      end: 5,
    });
    expect(matchText('서울도서관', '서울ㄷ', { hangul })).toEqual({
      tier: MATCH_TIER.JAMO,
      start: 0,
      end: 3,
    });
  });

  it('never converts a complete-syllable query into 초성 and skips fuzzy when disabled', () => {
    expect(matchText('낙성대역', '남산', { hangul })).toBeNull();
    expect(matchText('오이도역', '여의도', { hangul })).toBeNull();
    expect(matchText('서울도서관', 'ㅅㅇㄷㅅㄱ')).toBeNull();
    expect(matchText('서울도서관', 'ㅅㅇㄷㅅㄱ', { hangul, fuzzy: false })).toBeNull();
  });
});

describe('rankSearchEntries', () => {
  it('puts an exact library match ahead of bike stations that merely contain the name', () => {
    expect(rank('개봉도서관')).toEqual(['개봉도서관', '개봉도서관 앞']);
  });

  it('returns libraries before bike stations for "도서관"', () => {
    const results = rankSearchEntries(entries, '도서관', { hangul, limit: 50 });
    expect(results.map(item => item.category)).toEqual([
      'library',
      'library',
      'library',
      'bike',
      'bike',
    ]);
  });

  it('lifts the category named by the query above other categories that merely contain the word', () => {
    const mixed: SearchItem[] = [
      { id: 'ev-1', name: '도서관의 날 기념행사', category: 'cultural_event', address: '' },
      { id: 'ev-2', name: '도서관 북페스티벌', category: 'cultural_event', address: '' },
      { id: 'lib-9', name: '강남구립못골도서관', category: 'library', address: '' },
      { id: 'bike-9', name: '1679. 삼육대 도서관', category: 'bike', address: '' },
    ];
    const results = rankSearchEntries(mixed.map(prepareSearchEntry), '도서관', { hangul });
    expect(results[0].category).toBe('library');
  });

  it('caps how many results one category may take so other categories stay visible', () => {
    const many: SearchItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: `ev-${index}`,
      name: `도서관 행사 ${index}`,
      category: 'cultural_event',
    }));
    many.push({ id: 'park-9', name: '도서관 옆 공원', category: 'park' });
    const results = rankSearchEntries(many.map(prepareSearchEntry), '도서관', {
      hangul,
      limit: 10,
      maxPerCategory: 4,
    });
    expect(results).toHaveLength(10);
    expect(results.filter(item => item.category === 'park')).toHaveLength(1);
    expect(results.slice(0, 5).some(item => item.category === 'park')).toBe(true);
  });

  it('finds 서울도서관 by 초성 and by an incomplete last syllable', () => {
    expect(rank('ㅅㅇㄷㅅㄱ')).toEqual(['서울도서관']);
    expect(rank('서울ㄷ')).toEqual(['서울도서관']);
  });

  it('returns nothing for a query that matches no field', () => {
    expect(rank('zzzz')).toEqual([]);
  });

  it('does not pull in unrelated stations through fuzzy matching of plain words', () => {
    expect(rank('남산')).toEqual(['남산공원', '중구 경로당']);
    expect(rank('여의도')).toEqual(['여의도역', '여의도한강공원']);
  });

  it('ranks a name match above an address match of the same tier', () => {
    expect(rank('서울').slice(0, 2)).toEqual(['서울역', '서울도서관']);
  });

  it('prefers a word-start match over a plain substring match', () => {
    expect(rank('한강공원')).toEqual(['책읽는 한강공원', '여의도한강공원']);
  });

  it('respects the limit and the category tie-break order', () => {
    expect(rank('도서관', 2)).toHaveLength(2);
    expect(CATEGORY_PRIORITY.library).toBeLessThan(CATEGORY_PRIORITY.bike);
    expect(CATEGORY_PRIORITY.park).toBeLessThan(CATEGORY_PRIORITY.bike);
    expect(CATEGORY_PRIORITY.cultural_event).toBeLessThan(CATEGORY_PRIORITY.bike);
  });

  it('matches without es-hangul until the module is loaded', () => {
    expect(rankSearchEntries(entries, 'ㅅㅇㄷㅅㄱ', { hangul: null })).toEqual([]);
    expect(rankSearchEntries(entries, '개봉', { hangul: null }).map(item => item.name)).toEqual([
      '개봉도서관',
      '개봉도서관 앞',
    ]);
  });
});

describe('loadHangul', () => {
  it('resolves the es-hangul helpers once and reuses them', async () => {
    const first = await loadHangul();
    expect(first.getChoseong('서울')).toBe('ㅅㅇ');
    expect(first.disassemble('서울ㄷ')).toBe('ㅅㅓㅇㅜㄹㄷ');
    await expect(loadHangul()).resolves.toBe(first);
  });
});
