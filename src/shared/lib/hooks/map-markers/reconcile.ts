/**
 * 벌크 계층 reconcile 도우미(순수 함수).
 *
 * key 계약(지도 코어 감사 §3.1): 시설 `facility:${category}:${String(id)}`,
 * 같은 좌표(소수 6자리)에 겹친 시설 묶음 `cluster:cluster-${lat},${lng}`.
 */
import type { Facility } from '@/lib/types';
import { getFacilityMarkerId, getMarkerCrowdLevel } from '@/shared/lib/utils/marker';

export type MarkerKind = 'facility' | 'stack';

export interface MarkerDescriptor {
  key: string;
  kind: MarkerKind;
  facilities: Facility[];
  position: { lat: number; lng: number };
  positionSignature: string;
  /** 요소를 다시 만들지 않고 속성만 갱신할지 판단하는 데이터 서명 */
  contentSignature: string;
}

export const hasValidPosition = (facility: Facility): boolean =>
  Boolean(facility.position) &&
  Number.isFinite(facility.position.lat) &&
  Number.isFinite(facility.position.lng) &&
  facility.position.lat !== 0 &&
  facility.position.lng !== 0;

const facilitySignature = (facility: Facility): string =>
  [
    facility.name,
    facility.category,
    getMarkerCrowdLevel(facility) ?? '',
    facility.subwayStation?.route ?? '',
  ].join('|');

/** 숫자 ID를 가진 공공데이터도 같은 key를 얻도록 `String(id)`로 정규화한다. */
export const buildMarkerDescriptors = (facilities: Facility[]): MarkerDescriptor[] => {
  const groups = new Map<string, Facility[]>();

  for (const facility of facilities) {
    if (!hasValidPosition(facility)) continue;
    const locationKey = `${facility.position.lat.toFixed(6)},${facility.position.lng.toFixed(6)}`;
    const group = groups.get(locationKey);
    if (group) group.push(facility);
    else groups.set(locationKey, [facility]);
  }

  const descriptors: MarkerDescriptor[] = [];
  const seenKeys = new Set<string>();

  groups.forEach((group, locationKey) => {
    const unique = group.filter(facility => {
      const key = getFacilityMarkerId(facility);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    if (unique.length === 0) return;

    const position = unique[0].position;
    const positionSignature = `${position.lat},${position.lng}`;

    if (unique.length === 1) {
      const facility = unique[0];
      descriptors.push({
        key: `facility:${getFacilityMarkerId(facility)}`,
        kind: 'facility',
        facilities: [facility],
        position,
        positionSignature,
        contentSignature: facilitySignature(facility),
      });
      return;
    }

    descriptors.push({
      key: `cluster:cluster-${locationKey}`,
      kind: 'stack',
      facilities: unique,
      position,
      positionSignature,
      contentSignature: `${unique.length}|${unique.map(getFacilityMarkerId).join(',')}`,
    });
  });

  return descriptors;
};

export interface ReconcilePlan<TEntry> {
  removed: TEntry[];
  retained: Array<{ entry: TEntry; descriptor: MarkerDescriptor }>;
  added: MarkerDescriptor[];
}

/** 기존 엔트리와 새 descriptor를 key로 비교해 제거·유지·추가 집합을 만든다. */
export const planReconcile = <TEntry>(
  entries: Map<string, TEntry>,
  descriptors: MarkerDescriptor[]
): ReconcilePlan<TEntry> => {
  const desired = new Map(descriptors.map(descriptor => [descriptor.key, descriptor]));
  const removed: TEntry[] = [];
  const retained: ReconcilePlan<TEntry>['retained'] = [];
  const added: MarkerDescriptor[] = [];

  entries.forEach((entry, key) => {
    const descriptor = desired.get(key);
    if (descriptor) retained.push({ entry, descriptor });
    else removed.push(entry);
  });

  descriptors.forEach(descriptor => {
    if (!entries.has(descriptor.key)) added.push(descriptor);
  });

  return { removed, retained, added };
};

/** 시설 식별자(`${category}:${id}`) → 그 시설이 속한 descriptor 조회표 */
export const indexFacilities = (descriptors: MarkerDescriptor[]): Map<string, Facility> => {
  const index = new Map<string, Facility>();
  for (const descriptor of descriptors) {
    for (const facility of descriptor.facilities) {
      index.set(getFacilityMarkerId(facility), facility);
    }
  }
  return index;
};
