import type { Facility, FacilityCategory, Position } from '@/lib/types';
import { calculateDistanceKm } from '@/features/place-filter/lib/place-filter';
import { recommendFacilities } from '@/features/recommendation/lib/recommendation-engine';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';
import type {
  ActivityPlan,
  ActivityPlanContext,
  ActivityPlanStop,
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
      walk(
        [...selected, value],
        [...remaining.slice(0, index), ...remaining.slice(index + 1)]
      );
    });
  };
  walk([], values);
  return result;
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

export function createActivityPlan(
  facilities: Facility[],
  context: ActivityPlanContext
): ActivityPlan | null {
  if (!isValidSeoulCoordinate(context.origin.lat, context.origin.lng)) return null;

  const ranked = recommendFacilities(
    facilities.filter(
      facility =>
        isValidSeoulCoordinate(facility.position.lat, facility.position.lng) &&
        calculateDistanceKm(context.origin, facility.position) <= 6
    ),
    {
      origin: context.origin,
      now: context.now,
      preset: 'available_now',
      preferredCategories: context.preferredCategories,
      weather: context.weather,
      congestion: context.congestion,
    },
    10
  );
  if (ranked.length < 2) return null;

  const desiredStopCount = context.budgetMinutes <= 60 ? 2 : 3;
  const minimumStay = context.budgetMinutes === 30 ? 8 : 12;
  let best: CandidatePlan | null = null;

  for (let stopCount = desiredStopCount; stopCount >= 2 && !best; stopCount -= 1) {
    for (const sequence of permutations(ranked, stopCount)) {
      const travel: number[] = [];
      let previous = context.origin;
      for (const recommendation of sequence) {
        travel.push(travelMinutes(previous, recommendation.facility.position));
        previous = recommendation.facility.position;
      }
      const totalTravel = travel.reduce((sum, minutes) => sum + minutes, 0);
      const stay = allocateStayMinutes(
        sequence.map(item => item.facility),
        context.budgetMinutes - totalTravel,
        minimumStay
      );
      if (!stay) continue;

      const diversity = new Set(sequence.map(item => item.facility.category)).size;
      const score =
        sequence.reduce((sum, item) => sum + item.score, 0) +
        diversity * 8 -
        totalTravel * 0.8;
      if (!best || score > best.score) {
        best = {
          facilities: sequence.map(item => item.facility),
          travel,
          stay,
          score,
        };
      }
    }
  }
  if (!best) return null;

  let elapsed = 0;
  const stops: ActivityPlanStop[] = best.facilities.map((facility, index) => {
    elapsed += best!.travel[index];
    const stop: ActivityPlanStop = {
      facility,
      order: index + 1,
      travelMinutes: best!.travel[index],
      stayMinutes: best!.stay[index],
      arrivalOffsetMinutes: elapsed,
      reason:
        index === 0
          ? `현재 위치에서 약 ${best!.travel[index]}분 이동`
          : `이전 장소에서 약 ${best!.travel[index]}분 이동`,
    };
    elapsed += best!.stay[index];
    return stop;
  });
  const totalTravel = best.travel.reduce((sum, minutes) => sum + minutes, 0);
  const totalStay = best.stay.reduce((sum, minutes) => sum + minutes, 0);
  const warnings = [
    '이동 시간은 직선거리 기반 보행 추정치이며 실제 길찾기와 다를 수 있습니다.',
  ];
  if (stops.some(stop => !stop.facility.operatingHours)) {
    warnings.push('운영시간을 확인할 수 없는 장소는 방문 전에 공식 정보를 확인하세요.');
  }

  return {
    budgetMinutes: context.budgetMinutes,
    totalMinutes: totalTravel + totalStay,
    travelMinutes: totalTravel,
    stayMinutes: totalStay,
    stops,
    summary: `${context.budgetMinutes}분 안에 ${stops.length}곳 · 이동 ${totalTravel}분 · 체류 ${totalStay}분`,
    warnings,
  };
}
