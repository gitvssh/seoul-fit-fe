import { getLiveDataStatus } from '../live-data';

describe('live data status', () => {
  const now = new Date('2026-07-25T12:00:00+09:00');

  it('classifies live, recent, stale and unknown timestamps', () => {
    expect(getLiveDataStatus('2026-07-25T11:50:00+09:00', now).freshness).toBe('live');
    expect(getLiveDataStatus('2026-07-25T11:30:00+09:00', now).freshness).toBe('recent');
    expect(getLiveDataStatus('2026-07-25T10:00:00+09:00', now).freshness).toBe('stale');
    expect(getLiveDataStatus(undefined, now).freshness).toBe('unknown');
  });
});
