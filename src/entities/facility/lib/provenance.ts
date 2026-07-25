import type { Facility } from '@/lib/types';

export interface FacilityProvenance {
  sourceLabel: string;
  sourceUrl?: string;
  updatedLabel: string;
  freshness: NonNullable<Facility['freshnessStatus']>;
  freshnessLabel: string;
}

const CATEGORY_SOURCES: Record<Facility['category'], string> = {
  sports: '서울시 공공서비스예약',
  culture: '서울 열린데이터광장',
  restaurant: '서울시 공공데이터',
  library: '서울 열린데이터광장',
  park: '서울 열린데이터광장',
  subway: '서울교통공사',
  bike: '서울자전거 따릉이',
  cooling_shelter: '서울시 무더위쉼터',
  cultural_event: '서울문화포털',
  cultural_reservation: '서울시 공공서비스예약',
};

const FRESHNESS_LABELS: Record<
  NonNullable<Facility['freshnessStatus']>,
  string
> = {
  live: '실시간',
  recent: '최근 갱신',
  stale: '갱신 지연',
  unknown: '갱신 시각 미확인',
};

function inferFreshness(
  updatedAt: string | undefined,
  explicit: Facility['freshnessStatus'],
  now: Date
): NonNullable<Facility['freshnessStatus']> {
  if (explicit) return explicit;
  if (!updatedAt) return 'unknown';

  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return 'unknown';
  const ageMinutes = Math.max(0, (now.getTime() - timestamp) / 60_000);
  if (ageMinutes <= 15) return 'live';
  if (ageMinutes <= 24 * 60) return 'recent';
  return 'stale';
}

export function getFacilityProvenance(
  facility: Facility,
  now = new Date()
): FacilityProvenance {
  const freshness = inferFreshness(facility.sourceUpdatedAt, facility.freshnessStatus, now);
  const parsedUpdatedAt = facility.sourceUpdatedAt
    ? new Date(facility.sourceUpdatedAt)
    : undefined;
  const updatedLabel =
    parsedUpdatedAt && Number.isFinite(parsedUpdatedAt.getTime())
      ? new Intl.DateTimeFormat('ko-KR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(parsedUpdatedAt)
      : '확인되지 않음';

  return {
    sourceLabel: facility.dataSource?.trim() || CATEGORY_SOURCES[facility.category],
    sourceUrl: facility.dataSourceUrl,
    updatedLabel,
    freshness,
    freshnessLabel: FRESHNESS_LABELS[freshness],
  };
}
