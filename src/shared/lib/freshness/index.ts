/**
 * 신선도(freshness)의 단일 소스.
 *
 * 임계값·판정·상대 시각 표기를 여기서만 정의하고, 라벨은 i18n `freshness.*` 키를 쓴다.
 * 화면 표기는 `src/shared/ui/freshness-badge.tsx`를 사용한다.
 */

export type FreshnessStatus = 'live' | 'recent' | 'stale' | 'unknown';

export type FreshnessLocale = 'ko' | 'en';

export interface FreshnessThresholds {
  /** 경과 시간이 이 분 수 이하이면 `live` */
  liveMinutes: number;
  /** 경과 시간이 이 분 수 이하이면 `recent`, 넘으면 `stale` */
  staleMinutes: number;
}

/** 실시간 도시데이터(날씨·혼잡도·따릉이)의 기본 임계값: 15분 / 60분 */
export const FRESHNESS_THRESHOLDS: Readonly<FreshnessThresholds> = {
  liveMinutes: 15,
  staleMinutes: 60,
};

/**
 * 하루 단위로 갱신되는 원천(공원·도서관·문화시설 목록 등)의 임계값.
 * 이런 데이터는 아침에 갱신된 뒤 저녁까지 그대로여도 "갱신 지연"이 아니므로
 * stale 상한만 24시간으로 늘린다. live 상한(15분)은 공통이다.
 */
export const DAILY_FRESHNESS_THRESHOLDS: Readonly<FreshnessThresholds> = {
  liveMinutes: FRESHNESS_THRESHOLDS.liveMinutes,
  staleMinutes: 24 * 60,
};

/** 여러 신선도를 합칠 때 가장 낮은 값을 고르기 위한 순위 */
export const FRESHNESS_RANK: Record<FreshnessStatus, number> = {
  unknown: 0,
  stale: 1,
  recent: 2,
  live: 3,
};

export type FreshnessBadgeVariant = 'live' | 'success' | 'warning' | 'muted';

const BADGE_VARIANTS: Record<FreshnessStatus, FreshnessBadgeVariant> = {
  live: 'live',
  recent: 'success',
  stale: 'warning',
  unknown: 'muted',
};

const INTL_LOCALES: Record<FreshnessLocale, string> = { ko: 'ko-KR', en: 'en-US' };

const JUST_NOW: Record<FreshnessLocale, string> = { ko: '방금', en: 'just now' };

export type TimestampInput = string | number | Date | null | undefined;

/** 문자열·숫자·Date를 Date로 바꾼다. 비어 있거나 해석할 수 없으면 null */
export function parseTimestamp(timestamp: TimestampInput): Date | null {
  if (timestamp === null || timestamp === undefined || timestamp === '') return null;
  const parsed = new Date(timestamp);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** 기준 시각 이후 경과한 분. 미래 시각(시계 오차)은 0으로 본다. 해석 불가면 null */
export function getAgeMinutes(timestamp: TimestampInput, now: Date = new Date()): number | null {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) return null;
  return Math.max(0, (now.getTime() - parsed.getTime()) / 60_000);
}

export function getFreshness(
  timestamp: TimestampInput,
  now: Date = new Date(),
  thresholds: Partial<FreshnessThresholds> = {}
): FreshnessStatus {
  const ageMinutes = getAgeMinutes(timestamp, now);
  if (ageMinutes === null) return 'unknown';
  const liveMinutes = thresholds.liveMinutes ?? FRESHNESS_THRESHOLDS.liveMinutes;
  const staleMinutes = thresholds.staleMinutes ?? FRESHNESS_THRESHOLDS.staleMinutes;
  if (ageMinutes <= liveMinutes) return 'live';
  if (ageMinutes <= staleMinutes) return 'recent';
  return 'stale';
}

export function getFreshnessBadgeVariant(status: FreshnessStatus): FreshnessBadgeVariant {
  return BADGE_VARIANTS[status];
}

/**
 * 여러 원천의 신선도 중 가장 오래된 값. 시각을 알 수 없는 원천은 제외하되,
 * 전부 모르면 `unknown`.
 */
export function getOldestFreshness(statuses: FreshnessStatus[]): FreshnessStatus {
  const known = statuses.filter(status => status !== 'unknown');
  if (known.length === 0) return 'unknown';
  return known.reduce((oldest, status) =>
    FRESHNESS_RANK[status] < FRESHNESS_RANK[oldest] ? status : oldest, known[0]
  );
}

type RelativeUnit = Intl.RelativeTimeFormatUnit;

const RELATIVE_UNITS: Array<{ unit: RelativeUnit; minutes: number }> = [
  { unit: 'year', minutes: 365 * 24 * 60 },
  { unit: 'month', minutes: 30 * 24 * 60 },
  { unit: 'week', minutes: 7 * 24 * 60 },
  { unit: 'day', minutes: 24 * 60 },
  { unit: 'hour', minutes: 60 },
  { unit: 'minute', minutes: 1 },
];

/**
 * "3분 전", "어제"처럼 상대 시각으로 표기한다.
 * `Intl.RelativeTimeFormat`은 `(0, 'minute')`을 "현재 분"으로 돌려주므로
 * 1분 미만은 "방금"으로 따로 처리한다. 해석 불가면 빈 문자열.
 */
export function formatRelativeTime(
  timestamp: TimestampInput,
  locale: FreshnessLocale = 'ko',
  now: Date = new Date()
): string {
  const ageMinutes = getAgeMinutes(timestamp, now);
  if (ageMinutes === null) return '';
  if (ageMinutes < 1) return JUST_NOW[locale];

  const formatter = new Intl.RelativeTimeFormat(INTL_LOCALES[locale], { numeric: 'auto' });
  const match = RELATIVE_UNITS.find(({ minutes }) => ageMinutes >= minutes) ?? RELATIVE_UNITS[5];
  return formatter.format(-Math.floor(ageMinutes / match.minutes), match.unit);
}

/** "오후 03:10"처럼 시:분만 표기한다. 해석 불가면 빈 문자열 */
export function formatClockTime(timestamp: TimestampInput, locale: FreshnessLocale = 'ko'): string {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) return '';
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

/** "2026. 7. 25. 오전 11:50"처럼 날짜와 시각을 함께 표기한다. 해석 불가면 빈 문자열 */
export function formatDateTime(timestamp: TimestampInput, locale: FreshnessLocale = 'ko'): string {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) return '';
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}
