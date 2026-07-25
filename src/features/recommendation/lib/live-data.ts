import type { CongestionData, WeatherData } from '@/lib/types';

export type LiveDataFreshness = 'live' | 'recent' | 'stale' | 'unknown';

export interface LiveDataStatus {
  freshness: LiveDataFreshness;
  label: string;
  referenceTimeLabel: string;
}

const LABELS: Record<LiveDataFreshness, string> = {
  live: '정상 갱신',
  recent: '최근 조회',
  stale: '갱신 지연',
  unknown: '기준 시각 미확인',
};

export function getLiveDataStatus(
  timestamp: string | undefined,
  now = new Date()
): LiveDataStatus {
  if (!timestamp) {
    return {
      freshness: 'unknown',
      label: LABELS.unknown,
      referenceTimeLabel: '확인되지 않음',
    };
  }

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) {
    return {
      freshness: 'unknown',
      label: LABELS.unknown,
      referenceTimeLabel: '확인되지 않음',
    };
  }

  const ageMinutes = Math.max(0, (now.getTime() - parsed.getTime()) / 60_000);
  const freshness: LiveDataFreshness =
    ageMinutes <= 15 ? 'live' : ageMinutes <= 60 ? 'recent' : 'stale';

  return {
    freshness,
    label: LABELS[freshness],
    referenceTimeLabel: new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed),
  };
}

export function getCombinedLiveDataStatus(
  weather: WeatherData | null | undefined,
  congestion: CongestionData | null | undefined,
  now = new Date()
): LiveDataStatus {
  const statuses = [
    getLiveDataStatus(weather?.timestamp, now),
    getLiveDataStatus(congestion?.timestamp, now),
  ];
  const rank: Record<LiveDataFreshness, number> = {
    unknown: 0,
    stale: 1,
    recent: 2,
    live: 3,
  };
  const known = statuses.filter(status => status.freshness !== 'unknown');
  if (known.length === 0) return statuses[0];
  return known.reduce((oldest, status) =>
    rank[status.freshness] < rank[oldest.freshness] ? status : oldest
  );
}
