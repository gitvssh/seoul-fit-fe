/**
 * 포커스 계층: 선택 시설 오버레이(클러스터러 밖, z 20)와 "마커를 가림 영역 밖으로" 이동.
 */
import type { Facility } from '@/lib/types';
import type { KakaoCustomOverlay } from '@/shared/lib/kakao';
import {
  createFacilityMarkerElement,
  MARKER_Z,
  updateFacilityMarkerElement,
  type MarkerLabels,
} from '@/shared/lib/utils/marker';
import { isActivationKey, toLatLng, type LayerHandle } from './bulk-layer';
import { REVEAL_MARGIN_PX, type ViewportPadding } from './constants';

export interface FocusEntry {
  markerId: string;
  facility: Facility;
  overlay: KakaoCustomOverlay;
  element: HTMLElement;
  dispose: () => void;
}

export const createFocusEntry = (
  handle: LayerHandle,
  markerId: string,
  facility: Facility,
  labels: MarkerLabels,
  onActivate: () => void
): FocusEntry => {
  const element = createFacilityMarkerElement(facility, { selected: true, labels });
  const overlay = new handle.maps.CustomOverlay({
    position: toLatLng(handle.maps, facility.position),
    content: element,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: MARKER_Z.selected,
    clickable: true,
  });
  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    onActivate();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (isActivationKey(event)) activate(event);
  };
  element.addEventListener('click', activate);
  element.addEventListener('keydown', handleKeyDown);
  overlay.setMap(handle.map);

  return {
    markerId,
    facility,
    overlay,
    element,
    dispose: () => {
      element.removeEventListener('click', activate);
      element.removeEventListener('keydown', handleKeyDown);
      overlay.setMap(null);
    },
  };
};

/** 같은 시설이 새 객체로 왔을 때 오버레이를 다시 만들지 않고 속성·위치만 맞춘다. */
export const syncFocusEntry = (
  handle: LayerHandle,
  entry: FocusEntry,
  facility: Facility,
  labels: MarkerLabels
): void => {
  updateFacilityMarkerElement(entry.element, facility, { labels, selected: true });
  if (
    entry.facility.position.lat !== facility.position.lat ||
    entry.facility.position.lng !== facility.position.lng
  ) {
    entry.overlay.setPosition(toLatLng(handle.maps, facility.position));
  }
  entry.facility = facility;
};

/** 마커가 헤더·시트에 가려져 있으면 보이는 영역 안으로 최소 거리만 이동한다. */
export const panToReveal = (
  handle: LayerHandle,
  position: { lat: number; lng: number },
  padding: ViewportPadding
): void => {
  const { map, maps } = handle;
  const projection = map.getProjection();
  const bounds = map.getBounds();
  const southWest = projection.containerPointFromCoords(bounds.getSouthWest());
  const northEast = projection.containerPointFromCoords(bounds.getNorthEast());
  const point = projection.containerPointFromCoords(toLatLng(maps, position));

  const minX = southWest.x + padding.left + REVEAL_MARGIN_PX;
  const maxX = northEast.x - padding.right - REVEAL_MARGIN_PX;
  const minY = northEast.y + padding.top + REVEAL_MARGIN_PX;
  const maxY = southWest.y - padding.bottom - REVEAL_MARGIN_PX;

  let deltaX = 0;
  let deltaY = 0;
  if (minX >= maxX) deltaX = point.x - (minX + maxX) / 2;
  else if (point.x < minX) deltaX = point.x - minX;
  else if (point.x > maxX) deltaX = point.x - maxX;
  if (minY >= maxY) deltaY = point.y - (minY + maxY) / 2;
  else if (point.y < minY) deltaY = point.y - minY;
  else if (point.y > maxY) deltaY = point.y - maxY;

  if (deltaX !== 0 || deltaY !== 0) {
    map.panBy(Math.round(deltaX), Math.round(deltaY));
  }
};

export interface FocusState {
  entry: FocusEntry | null;
  /** 뷰포트 필터에서 빠진 뒤에도 선택 마커를 유지하기 위한 마지막 선택 시설 */
  lastSelected: { markerId: string; facility: Facility } | null;
}

export const clearFocus = (state: FocusState): void => {
  state.entry?.dispose();
  state.entry = null;
};

/** 선택 식별자를 포커스 오버레이 1개로 맞춘다(같은 시설이면 갱신, 다르면 교체, 없으면 제거). */
export const syncSelection = (
  handle: LayerHandle,
  state: FocusState,
  selectedFacilityId: string | null,
  facilityIndex: Map<string, Facility>,
  labels: MarkerLabels,
  onActivate: (facility: Facility) => void
): void => {
  const cached = state.lastSelected;
  const facility = selectedFacilityId
    ? (facilityIndex.get(selectedFacilityId) ??
      (cached?.markerId === selectedFacilityId ? cached.facility : null))
    : null;

  if (!selectedFacilityId || !facility) {
    clearFocus(state);
    return;
  }

  state.lastSelected = { markerId: selectedFacilityId, facility };
  if (state.entry?.markerId === selectedFacilityId) {
    syncFocusEntry(handle, state.entry, facility, labels);
    return;
  }

  clearFocus(state);
  state.entry = createFocusEntry(handle, selectedFacilityId, facility, labels, () => {
    if (state.entry) onActivate(state.entry.facility);
  });
};

/** 포커스·뷰포트 조회표·마지막 선택 순으로 시설 위치를 찾는다 */
export const findKnownFacility = (
  state: FocusState,
  facilityIndex: Map<string, Facility>,
  facilityId: string
): Facility | null =>
  facilityIndex.get(facilityId) ??
  (state.lastSelected?.markerId === facilityId ? state.lastSelected.facility : null);
