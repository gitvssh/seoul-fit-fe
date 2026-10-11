import type { Facility, FacilityCategory, Position } from '@/lib/types';
import { calculateDistanceKm } from '@/features/place-filter/lib/place-filter';
import {
  DUPLICATE_MERGE_RADIUS_METERS,
  normalizePlaceName,
  recommendFacilities,
} from '@/features/recommendation/lib/recommendation-engine';
import { ko as activityMessages } from '@/shared/i18n/messages/activity';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';
import type {
  ActivityPlan,
  ActivityPlanContext,
  ActivityPlanStop,
  ActivityPlanWarningCode,
} from '../model/types';

const BASE_STAY_MINUTES: Record<FacilityCategory, number> = {
  subway: 10,
  bike: 15,
  cooling_shelter: 20,
  restaurant: 35,
  park: 35,
  library: 40,
  sports: 50,
  culture: 50,
  cultural_event: 60,
  cultural_reservation: 60,
};

/** 후보 수. 10개 중 3개 순열 720개 → 12개면 1,320개로 여전히 즉시 계산된다. */
const CANDIDATE_LIMIT = 12;
const SEARCH_RADIUS_KM = 6;
/** 같은 카테고리가 겹치면 다양성이 떨어지므로 겹치는 정거장마다 뺀다. */
const DIVERSITY_BONUS = 12;
const REPEATED_CATEGORY_PENALTY = 10;

const WARNING_LABELS: Record<ActivityPlanWarningCode, string> = {
  straight_line_estimate: activityMessages['activity.warning'],
  hours_unknown: activityMessages['activity.warningHours'],
};

function travelMinutes(from: Position, to: Position): number {
  const distanceKm = calculateDistanceKm(from, to);
  // 직선거리 보정 1.2와 보행 4.5km/h를 사용한 보수적 추정치입니다.
  return Math.max(2, Math.ceil((distanceKm * 1.2) / 0.075));
}

function permutations<T>(values: T[], length: number): T[][] {
  const result: T[][] = [];
  const walk = (selected: T[], remaining: T[]) => {
    if (selected.length === length) {
      result.push(selected);
      return;
    }
    remaining.forEach((value, index) => {
      walk([...selected, value], [...remaining.slice(0, index), ...remaining.slice(index + 1)]);
    });
  };
  walk([], values);
  return result;
}

/** 같은 이름이 150m 안에 두 번 들어가면(환승역·중복 레코드) 같은 곳을 두 번 가는 계획이다. */
export function hasRepeatedPlace(facilities: Facility[]): boolean {
  return facilities.some((facility, index) =>
    facilities
      .slice(index + 1)
      .some(
        other =>
          normalizePlaceName(other.name) === normalizePlaceName(facility.name) &&
          calculateDistanceKm(other.position, facility.position) * 1000 <=
            DUPLICATE_MERGE_RADIUS_METERS
      )
  );
}

function allocateStayMinutes(
  facilities: Facility[],
  availableMinutes: number,
  minimumStay: number
): number[] | null {
  if (availableMinutes < facilities.length * minimumStay) return null;
  const desired = facilities.map(facility =>
    Math.max(minimumStay, BASE_STAY_MINUTES[facility.category])
  );
  const desiredTotal = desired.reduce((sum, minutes) => sum + minutes, 0);
  if (desiredTotal <= availableMinutes) return desired;

  const result = facilities.map(() => minimumStay);
  let remaining = availableMinutes - minimumStay * facilities.length;
  const weights = desired.map(minutes => minutes - minimumStay);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  weights.forEach((weight, index) => {
    if (remaining <= 0 || weightTotal <= 0) return;
    const addition = Math.min(
      desired[index] - minimumStay,
      Math.floor((availableMinutes - minimumStay * facilities.length) * (weight / weightTotal))
    );
    result[index] += addition;
    remaining -= addition;
  });
  let cursor = 0;
  while (remaining > 0) {
    if (result[cursor] < desired[cursor]) {
      result[cursor] += 1;
      remaining -= 1;
    }
    cursor = (cursor + 1) % result.length;
    if (result.every((minutes, index) => minutes >= desired[index])) break;
  }
  return result;
}

interface CandidatePlan {
  facilities: Facility[];
  travel: number[];
  stay: number[];
  score: number;
}

function sequenceScore(scores: number[], categories: FacilityCategory[], totalTravel: number) {
  const distinct = new Set(categories).size;
  const repeated = categories.length - distinct;
  return (
    scores.reduce((sum, value) => sum + value, 0) +
    distinct * DIVERSITY_BONUS -
    repeated * REPEATED_CATEGORY_PENALTY -
    totalTravel * 0.8
  );
}

export function createActivityPlan(
  facilities: Facility[],
  context: ActivityPlanContext
): ActivityPlan | null {
  if (!isValidSeoulCoordinate(context.origin.lat, context.origin.lng)) return null;

  // recommendFacilities가 교통 카테고리 제외와 같은 이름·150m 병합을 처리한다.
  const ranked = recommendFacilities(
    facilities.filter(
      facility =>
        isValidSeoulCoordinate(facility.position.lat, facility.position.lng) &&
        calculateDistanceKm(context.origin, facility.position) <= SEARCH_RADIUS_KM
    ),
    {
      origin: context.origin,
      originKind: 'map_center',
      now: context.now,
      preset: 'available_now',
      preferredCategories: context.preferredCategories,
      weather: context.weather,
      congestion: context.congestion,
    },
    CANDIDATE_LIMIT
  );
  if (ranked.length < 2) return null;

  const desiredStopCount = context.budgetMinutes <= 60 ? 2 : 3;
  const minimumStay = context.budgetMinutes === 30 ? 8 : 12;
  let best: CandidatePlan | null = null;

  for (let stopCount = desiredStopCount; stopCount >= 2 && !best; stopCount -= 1) {
    for (const sequence of permutations(ranked, stopCount)) {
      const stops = sequence.map(item => item.facility);
      if (hasRepeatedPlace(stops)) continue;

      const travel: number[] = [];
      let previous = context.origin;
      for (const facility of stops) {
        travel.push(travelMinutes(previous, facility.position));
        previous = facility.position;
      }
      const totalTravel = travel.reduce((sum, minutes) => sum + minutes, 0);
      const stay = allocateStayMinutes(stops, context.budgetMinutes - totalTravel, minimumStay);
      if (!stay) continue;

      const score = sequenceScore(
        sequence.map(item => item.score),
        stops.map(facility => facility.category),
        totalTravel
      );
      if (!best || score > best.score) best = { facilities: stops, travel, stay, score };
    }
  }
  if (!best) return null;
  const chosen: CandidatePlan = best;

  let elapsed = 0;
  const stops: ActivityPlanStop[] = chosen.facilities.map((facility, index) => {
    elapsed += chosen.travel[index];
    const stop: ActivityPlanStop = {
      facility,
      order: index + 1,
      travelMinutes: chosen.travel[index],
      stayMinutes: chosen.stay[index],
      arrivalOffsetMinutes: elapsed,
      reason:
        index === 0
          ? `출발점에서 약 ${chosen.travel[index]}분 이동`
          : `이전 장소에서 약 ${chosen.travel[index]}분 이동`,
    };
    elapsed += chosen.stay[index];
    return stop;
  });
  const totalTravel = chosen.travel.reduce((sum, minutes) => sum + minutes, 0);
  const totalStay = chosen.stay.reduce((sum, minutes) => sum + minutes, 0);
  const warningCodes: ActivityPlanWarningCode[] = ['straight_line_estimate'];
  if (stops.some(stop => !stop.facility.operatingHours)) warningCodes.push('hours_unknown');

  return {
    budgetMinutes: context.budgetMinutes,
    totalMinutes: totalTravel + totalStay,
    travelMinutes: totalTravel,
    stayMinutes: totalStay,
    stops,
    summary: `${context.budgetMinutes}분 안에 ${stops.length}곳 · 이동 ${totalTravel}분 · 체류 ${totalStay}분`,
    warningCodes,
    warnings: warningCodes.map(code => WARNING_LABELS[code]),
  };
}
