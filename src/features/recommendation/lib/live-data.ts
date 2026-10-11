import type { CongestionData, WeatherData } from '@/lib/types';
import { ko as mapMessages } from '@/shared/i18n/messages/map';
import {
  formatClockTime,
  getFreshness,
  getOldestFreshness,
  type FreshnessStatus,
} from '@/shared/lib/freshness';

/** @deprecated `FreshnessStatus`(`@/shared/lib/freshness`)와 같다. 이름 호환용 */
export type LiveDataFreshness = FreshnessStatus;

export type LiveDataLabelKey = `freshness.${FreshnessStatus}`;

export interface LiveDataStatus {
  freshness: LiveDataFreshness;
  /** i18n 키. 화면에서는 `t(labelKey)` 또는 `FreshnessBadge`를 쓴다 */
  labelKey: LiveDataLabelKey;
  /** 한국어 라벨(공통 사전 `freshness.*`의 ko 값). 레거시 호출부 호환용 */
  label: string;
  /** "오후 11:50" 같은 조회 시각. 모르면 "확인되지 않음" */
  referenceTimeLabel: string;
  /** ISO 기준 시각. `<time dateTime>`·`FreshnessBadge`에 넘긴다 */
  timestamp?: string;
}

const UNKNOWN_TIME_LABEL = '확인되지 않음';

/**
 * 실시간 도시데이터(날씨·혼잡도)의 신선도. 공통 임계값 15분/60분을 쓴다.
 */
export function getLiveDataStatus(timestamp: string | undefined, now = new Date()): LiveDataStatus {
  const freshness = getFreshness(timestamp, now);
  const labelKey: LiveDataLabelKey = `freshness.${freshness}`;
  const referenceTimeLabel = formatClockTime(timestamp) || UNKNOWN_TIME_LABEL;

  return {
    freshness,
    labelKey,
    label: mapMessages[labelKey],
    referenceTimeLabel,
    timestamp: freshness === 'unknown' ? undefined : timestamp,
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
  const oldest = getOldestFreshness(statuses.map(status => status.freshness));
  return statuses.find(status => status.freshness === oldest) ?? statuses[0];
}
