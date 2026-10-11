import { getCombinedLiveDataStatus, getLiveDataStatus } from '../live-data';

describe('live data status', () => {
  const now = new Date('2026-07-25T12:00:00+09:00');

  it('classifies live, recent, stale and unknown timestamps with the shared thresholds', () => {
    expect(getLiveDataStatus('2026-07-25T11:50:00+09:00', now).freshness).toBe('live');
    expect(getLiveDataStatus('2026-07-25T11:30:00+09:00', now).freshness).toBe('recent');
    expect(getLiveDataStatus('2026-07-25T10:00:00+09:00', now).freshness).toBe('stale');
    expect(getLiveDataStatus(undefined, now).freshness).toBe('unknown');
    expect(getLiveDataStatus('garbage', now).freshness).toBe('unknown');
  });

  it('exposes the shared i18n key and a reference time for the badge', () => {
    const status = getLiveDataStatus('2026-07-25T11:50:00+09:00', now);
    expect(status.labelKey).toBe('freshness.live');
    expect(status.label).toBe('실시간');
    expect(status.timestamp).toBe('2026-07-25T11:50:00+09:00');
    expect(status.referenceTimeLabel).toMatch(/\d{1,2}:50/);

    const unknown = getLiveDataStatus(undefined, now);
    expect(unknown.labelKey).toBe('freshness.unknown');
    expect(unknown.label).toBe('기준 시각 미확인');
    expect(unknown.timestamp).toBeUndefined();
    expect(unknown.referenceTimeLabel).toBe('확인되지 않음');
  });

  it('combines weather and congestion by the oldest known source', () => {
    const combined = getCombinedLiveDataStatus(
      { AREA_NM: 'a', timestamp: '2026-07-25T11:55:00+09:00' } as never,
      { timestamp: '2026-07-25T10:00:00+09:00' },
      now
    );
    expect(combined.freshness).toBe('stale');
    expect(getCombinedLiveDataStatus(null, null, now).freshness).toBe('unknown');
    expect(
      getCombinedLiveDataStatus(null, { timestamp: '2026-07-25T11:55:00+09:00' }, now).freshness
    ).toBe('live');
  });
});
