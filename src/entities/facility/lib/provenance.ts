import type { Facility } from '@/lib/types';
import { ko as mapMessages } from '@/shared/i18n/messages/map';
import {
  DAILY_FRESHNESS_THRESHOLDS,
  FRESHNESS_THRESHOLDS,
  formatDateTime,
  getFreshness,
  type FreshnessStatus,
  type FreshnessThresholds,
} from '@/shared/lib/freshness';

export interface FacilityProvenance {
  sourceLabel: string;
  sourceUrl?: string;
  /** "2026. 7. 25. 오전 11:50" 같은 갱신 시각. 모르면 "확인되지 않음" */
  updatedLabel: string;
  /** ISO 갱신 시각. `FreshnessBadge`·`<time dateTime>`에 넘긴다 */
  updatedAt?: string;
  freshness: FreshnessStatus;
  /** i18n 키(`freshness.*`). 화면에서는 `t(freshnessLabelKey)` 또는 `FreshnessBadge` */
  freshnessLabelKey: `freshness.${FreshnessStatus}`;
  /** 한국어 라벨(공통 사전의 ko 값). 레거시 호출부 호환용 */
  freshnessLabel: string;
  /** 이 시설에 적용한 임계값. 배지에 그대로 넘기면 같은 판정을 얻는다 */
  thresholds: FreshnessThresholds;
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

/**
 * 원천 갱신 주기별 임계값. 따릉이 대여 현황은 분 단위로 갱신되므로 공통 15/60분을,
 * 그 밖의 시설 목록(공원·도서관·문화시설·행사 등)은 하루 단위로 갱신되므로
 * 24시간 프로필을 쓴다. 아침에 갱신된 목록이 저녁에 "갱신 지연"으로 보이면
 * 안내가 거짓이 되기 때문이다.
 */
const REALTIME_CATEGORIES = new Set<Facility['category']>(['bike']);

export function getFacilityFreshnessThresholds(
  category: Facility['category']
): FreshnessThresholds {
  return REALTIME_CATEGORIES.has(category) ? FRESHNESS_THRESHOLDS : DAILY_FRESHNESS_THRESHOLDS;
}

const UNKNOWN_TIME_LABEL = '확인되지 않음';

export function getFacilityProvenance(facility: Facility, now = new Date()): FacilityProvenance {
  const thresholds = getFacilityFreshnessThresholds(facility.category);
  const freshness =
    facility.freshnessStatus ?? getFreshness(facility.sourceUpdatedAt, now, thresholds);
  const updatedLabel = formatDateTime(facility.sourceUpdatedAt) || UNKNOWN_TIME_LABEL;
  const freshnessLabelKey = `freshness.${freshness}` as const;

  return {
    sourceLabel: facility.dataSource?.trim() || CATEGORY_SOURCES[facility.category],
    sourceUrl: facility.dataSourceUrl,
    updatedLabel,
    updatedAt: updatedLabel === UNKNOWN_TIME_LABEL ? undefined : facility.sourceUpdatedAt,
    freshness,
    freshnessLabelKey,
    freshnessLabel: mapMessages[freshnessLabelKey],
    thresholds,
  };
}
