import {
  DAILY_FRESHNESS_THRESHOLDS,
  formatClockTime,
  formatDateTime,
  formatRelativeTime,
  getAgeMinutes,
  getFreshness,
  getFreshnessBadgeVariant,
  getOldestFreshness,
  parseTimestamp,
} from '../index';

const now = new Date('2026-07-25T12:00:00+09:00');
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

describe('freshness module', () => {
  it('parses strings, numbers and dates and rejects invalid input', () => {
    expect(parseTimestamp('2026-07-25T11:50:00+09:00')?.toISOString()).toBe(
      '2026-07-25T02:50:00.000Z'
    );
    expect(parseTimestamp(now.getTime())?.getTime()).toBe(now.getTime());
    expect(parseTimestamp(now)?.getTime()).toBe(now.getTime());
    expect(parseTimestamp('')).toBeNull();
    expect(parseTimestamp('not-a-date')).toBeNull();
    expect(parseTimestamp(undefined)).toBeNull();
  });

  it('treats future timestamps as zero age', () => {
    expect(getAgeMinutes(minutesAgo(-5), now)).toBe(0);
    expect(getAgeMinutes(minutesAgo(5), now)).toBe(5);
    expect(getAgeMinutes(null, now)).toBeNull();
  });

  it('classifies with the shared 15/60 minute thresholds', () => {
    expect(getFreshness(minutesAgo(10), now)).toBe('live');
    expect(getFreshness(minutesAgo(15), now)).toBe('live');
    expect(getFreshness(minutesAgo(30), now)).toBe('recent');
    expect(getFreshness(minutesAgo(60), now)).toBe('recent');
    expect(getFreshness(minutesAgo(61), now)).toBe('stale');
    expect(getFreshness(undefined, now)).toBe('unknown');
  });

  it('supports the documented daily profile for slowly refreshed sources', () => {
    expect(getFreshness(minutesAgo(6 * 60), now, DAILY_FRESHNESS_THRESHOLDS)).toBe('recent');
    expect(getFreshness(minutesAgo(25 * 60), now, DAILY_FRESHNESS_THRESHOLDS)).toBe('stale');
  });

  it('maps statuses to badge variants and picks the oldest known status', () => {
    expect(getFreshnessBadgeVariant('live')).toBe('live');
    expect(getFreshnessBadgeVariant('recent')).toBe('success');
    expect(getFreshnessBadgeVariant('stale')).toBe('warning');
    expect(getFreshnessBadgeVariant('unknown')).toBe('muted');
    expect(getOldestFreshness(['live', 'stale', 'unknown'])).toBe('stale');
    expect(getOldestFreshness(['unknown', 'unknown'])).toBe('unknown');
    expect(getOldestFreshness([])).toBe('unknown');
  });

  it('formats relative time with a "just now" special case', () => {
    expect(formatRelativeTime(minutesAgo(0.5), 'ko', now)).toBe('방금');
    expect(formatRelativeTime(minutesAgo(0.5), 'en', now)).toBe('just now');
    expect(formatRelativeTime(minutesAgo(3), 'ko', now)).toBe('3분 전');
    expect(formatRelativeTime(minutesAgo(3), 'en', now)).toBe('3 minutes ago');
    expect(formatRelativeTime(minutesAgo(2 * 60), 'ko', now)).toBe('2시간 전');
    expect(formatRelativeTime(minutesAgo(24 * 60), 'ko', now)).toBe('어제');
    expect(formatRelativeTime(minutesAgo(24 * 60), 'en', now)).toBe('yesterday');
    expect(formatRelativeTime(minutesAgo(8 * 24 * 60), 'ko', now)).toBe('지난주');
    expect(formatRelativeTime('nope', 'ko', now)).toBe('');
  });

  it('formats clock and date-time labels per locale', () => {
    expect(formatClockTime('2026-07-25T11:50:00+09:00', 'en')).toMatch(/\d{1,2}:50/);
    expect(formatClockTime(undefined)).toBe('');
    expect(formatDateTime('2026-07-25T11:50:00+09:00', 'en')).toMatch(/2026/);
    expect(formatDateTime('bad')).toBe('');
  });
});
