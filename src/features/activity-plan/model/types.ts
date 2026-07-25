import type {
  CongestionData,
  Facility,
  FacilityCategory,
  Position,
  WeatherData,
} from '@/lib/types';

export type ActivityBudgetMinutes = 30 | 60 | 90 | 120 | 180;

export interface ActivityPlanContext {
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

export interface ActivityPlan {
  budgetMinutes: ActivityBudgetMinutes;
  totalMinutes: number;
  travelMinutes: number;
  stayMinutes: number;
  stops: ActivityPlanStop[];
  summary: string;
  warnings: string[];
}
