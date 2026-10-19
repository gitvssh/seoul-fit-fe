import { presentPlace } from '../places/_components/place-presentation';

describe('public place description normalization', () => {
  it.each([
    ['앞 <b>중간</b> 뒤', '앞 중간 뒤'],
    ['앞 <> 뒤', '앞 <> 뒤'],
    ['앞 <열린 태그', '앞 <열린 태그'],
    ['앞 <<태그> 뒤', '앞 뒤'],
    ['앞 > 뒤', '앞 > 뒤'],
  ])('preserves the existing handling of %s', (description, expected) => {
    expect(presentPlace('park', description)).toEqual({ tags: [], text: expected, rows: [] });
  });

  it('handles a long unclosed tag without repeated scans', () => {
    const description = `설명${'<'.repeat(100_000)}`;
    expect(presentPlace('park', description).text).toBe(description);
  });

  it('retains labelled library facts after stripping markup', () => {
    expect(presentPlace('library', '<b>공공도서관</b> · 매주 월요일')).toEqual({
      tags: ['공공도서관'],
      text: null,
      rows: [{ label: '정기 휴관일', value: '매주 월요일' }],
    });
  });
});
