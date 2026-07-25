import type { Facility, Position } from '@/lib/types';
import type { PlaceFilterState } from '../model/types';

export type FacilityOpenState = 'open' | 'closed' | 'unknown';

const ALWAYS_OPEN_PATTERNS = ['24시간', '24시', '연중무휴', '상시개방', '상시 운영'];
const INDOOR_CATEGORIES = new Set<Facility['category']>([
  'library',
  'culture',
  'cultural_reservation',
  'cooling_shelter',
  'subway',
  'restaurant',
]);

function minutesOfDay(hours: string, minutes: string): number {
  return Number(hours) * 60 + Number(minutes);
}

/**
 * 운영시간이 명시된 경우에만 현재 운영 여부를 판정합니다.
 * 휴무일/요일 정보가 불완전하거나 파싱할 수 없으면 안전하게 unknown을 반환합니다.
 */
export function getFacilityOpenState(
  operatingHours: string | undefined,
  now = new Date()
): FacilityOpenState {
  if (!operatingHours?.trim()) return 'unknown';

  const normalized = operatingHours.replace(/\s+/g, ' ').trim();
  if (ALWAYS_OPEN_PATTERNS.some(pattern => normalized.includes(pattern))) return 'open';
  if (/휴무|운영\s*종료|폐장/.test(normalized)) return 'closed';

  const range = normalized.match(
    /(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)\s*(?:~|-|–|—)\s*([01]?\d|2[0-3]):([0-5]\d)/
  );
  if (!range) return 'unknown';

  const opensAt = minutesOfDay(range[1], range[2]);
  const closesAt = minutesOfDay(range[3], range[4]);
  const current = now.getHours() * 60 + now.getMinutes();

  if (opensAt === closesAt) return 'open';
  if (closesAt > opensAt) return current >= opensAt && current < closesAt ? 'open' : 'closed';

  // 자정을 넘기는 운영시간(예: 18:00~02:00)
  return current >= opensAt || current < closesAt ? 'open' : 'closed';
}

export function isFacilityReservable(facility: Facility): boolean {
  return Boolean(
    facility.isReservable ||
      facility.reservationUrl ||
      facility.sportsFacility?.reservationUrl ||
      facility.culturalEvent?.requiresReservation ||
      facility.culturalEvent?.reservationUrl
  );
}

export function isFacilityIndoor(facility: Facility): boolean {
  if (typeof facility.isIndoor === 'boolean') return facility.isIndoor;
  if (typeof facility.sportsFacility?.isIndoor === 'boolean') {
    return facility.sportsFacility.isIndoor;
  }
  return INDOOR_CATEGORIES.has(facility.category);
}

export function calculateDistanceKm(from: Position, to: Position): number {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(to.lat - from.lat);
  const deltaLongitude = radians(to.lng - from.lng);
  const latitude1 = radians(from.lat);
  const latitude2 = radians(to.lat);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function applyPlaceFilters(
  facilities: Facility[],
  origin: Position,
  filters: PlaceFilterState,
  now = new Date()
): Facility[] {
  return facilities
    .map(facility => ({
      ...facility,
      distance: calculateDistanceKm(origin, facility.position),
    }))
    .filter(facility => {
      if (filters.categories.length > 0 && !filters.categories.includes(facility.category)) {
        return false;
      }
      if (
        filters.maxDistanceKm !== null &&
        (facility.distance ?? Number.POSITIVE_INFINITY) > filters.maxDistanceKm
      ) {
        return false;
      }
      if (filters.openOnly && getFacilityOpenState(facility.operatingHours, now) !== 'open') {
        return false;
      }
      if (filters.reservableOnly && !isFacilityReservable(facility)) return false;
      if (filters.indoorOnly && !isFacilityIndoor(facility)) return false;
      if (filters.lowCongestionOnly && facility.congestionLevel !== 'low') return false;
      return true;
    })
    .sort(
      (first, second) =>
        (first.distance ?? Number.POSITIVE_INFINITY) -
        (second.distance ?? Number.POSITIVE_INFINITY)
    );
}
