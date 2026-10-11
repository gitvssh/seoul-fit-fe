import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';

export type ActivityBudgetMinutes = 30 | 60 | 90 | 120 | 180;

export interface ActivityPlanContext {
  /** 출발점. 탐색 패널은 지도 중심을 넘긴다. */
  origin: Position;
  budgetMinutes: ActivityBudgetMinutes;
  preferredCategories?: FacilityCategory[];
  now: Date;
  weather?: WeatherData | null;
  congestion?: CongestionData | null;
}

export interface ActivityPlanStop {
  facility: Facility;
  order: number;
  travelMinutes: number;
  stayMinutes: number;
  arrivalOffsetMinutes: number;
  reason: string;
}

/** 화면은 이 코드를 i18n(`activity.warning*`)으로 바꿔 보여준다. */
export type ActivityPlanWarningCode = 'straight_line_estimate' | 'hours_unknown';

export interface ActivityPlan {
  budgetMinutes: ActivityBudgetMinutes;
  totalMinutes: number;
  travelMinutes: number;
  stayMinutes: number;
  stops: ActivityPlanStop[];
  summary: string;
  warningCodes: ActivityPlanWarningCode[];
  /** 한국어 경고 문구(레거시 호환). 화면은 `warningCodes`를 쓴다. */
  warnings: string[];
}
