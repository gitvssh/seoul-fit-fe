/**
 * 벌크 계층 엔트리: 시설(또는 같은 좌표 스택) 1개 = CustomOverlay 1개 + DOM 1개.
 * 생성·이벤트 바인딩·key 기반 reconcile을 담당하고, 지도에 올리는 일은 ClusterLayer가 한다.
 */
import type { Facility } from '@/lib/types';
import type { KakaoCustomOverlay, KakaoMap, KakaoMapsAPI } from '@/shared/lib/kakao';
import {
  createClusterElement,
  createFacilityMarkerElement,
  decorateClusterElement,
  MARKER_Z,
  setFacilityMarkerHidden,
  setFacilityMarkerHover,
  updateFacilityMarkerElement,
  type MarkerLabels,
} from '@/shared/lib/utils/marker';
import type { ClusterLayer } from './cluster-layer';
import { planReconcile, type MarkerDescriptor } from './reconcile';

export interface LayerHandle {
  layer: ClusterLayer;
  map: KakaoMap;
  maps: KakaoMapsAPI;
}

export interface BulkEntry {
  descriptor: MarkerDescriptor;
  overlay: KakaoCustomOverlay;
  element: HTMLElement;
  dispose: () => void;
}

export interface BulkContext {
  entries: Map<string, BulkEntry>;
  facilitiesOf: WeakMap<KakaoCustomOverlay, Facility[]>;
  getLabels: () => MarkerLabels;
  isHoverEnabled: () => boolean;
  activate: (descriptor: MarkerDescriptor) => void;
}

export const isActivationKey = (event: KeyboardEvent): boolean =>
  event.key === 'Enter' || event.key === ' ';

export const toLatLng = (maps: KakaoMapsAPI, position: { lat: number; lng: number }) =>
  new maps.LatLng(position.lat, position.lng);

const bindBulkElement = (
  context: BulkContext,
  element: HTMLElement,
  overlay: KakaoCustomOverlay,
  key: string
): (() => void) => {
  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const entry = context.entries.get(key);
    if (entry) context.activate(entry.descriptor);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (isActivationKey(event)) activate(event);
  };
  // hover는 데스크톱에서만 z-order를 올린다. 모양은 CSS `(hover: hover)`가 맡는다.
  const raise = () => {
    if (!context.isHoverEnabled()) return;
    setFacilityMarkerHover(element, { hover: true });
    overlay.setZIndex(MARKER_Z.hover);
  };
  const lower = () => {
    setFacilityMarkerHover(element, { hover: false });
    overlay.setZIndex(MARKER_Z.marker);
  };
  const handleFocus = () => overlay.setZIndex(MARKER_Z.hover);

  element.addEventListener('click', activate);
  element.addEventListener('keydown', handleKeyDown);
  element.addEventListener('mouseenter', raise);
  element.addEventListener('mouseleave', lower);
  element.addEventListener('focus', handleFocus);
  element.addEventListener('blur', lower);

  return () => {
    element.removeEventListener('click', activate);
    element.removeEventListener('keydown', handleKeyDown);
    element.removeEventListener('mouseenter', raise);
    element.removeEventListener('mouseleave', lower);
    element.removeEventListener('focus', handleFocus);
    element.removeEventListener('blur', lower);
  };
};

export const createBulkEntry = (
  handle: LayerHandle,
  context: BulkContext,
  descriptor: MarkerDescriptor
): BulkEntry => {
  const labels = context.getLabels();
  const element =
    descriptor.kind === 'facility'
      ? createFacilityMarkerElement(descriptor.facilities[0], { labels })
      : createClusterElement(descriptor.facilities.length, { labels });
  const overlay = new handle.maps.CustomOverlay({
    position: toLatLng(handle.maps, descriptor.position),
    content: element,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: MARKER_Z.marker,
    clickable: true,
  });
  context.facilitiesOf.set(overlay, descriptor.facilities);
  return {
    descriptor,
    overlay,
    element,
    dispose: bindBulkElement(context, element, overlay, descriptor.key),
  };
};

const refreshEntry = (entry: BulkEntry, descriptor: MarkerDescriptor, labels: MarkerLabels) => {
  if (descriptor.kind === 'facility') {
    updateFacilityMarkerElement(entry.element, descriptor.facilities[0], { labels });
  } else {
    decorateClusterElement(entry.element, descriptor.facilities.length, { labels });
  }
};

/**
 * 사라진 key만 제거하고 남은 key는 위치·속성만 갱신하며 새 key만 만든다.
 * 집합이 바뀌었을 때만 클러스터를 다시 그린다.
 */
export const reconcileBulk = (
  handle: LayerHandle,
  context: BulkContext,
  descriptors: MarkerDescriptor[],
  { relabel }: { relabel: boolean }
): void => {
  const { entries } = context;
  const labels = context.getLabels();
  const plan = planReconcile(entries, descriptors);
  let moved = false;

  plan.removed.forEach(entry => {
    entry.dispose();
    entries.delete(entry.descriptor.key);
  });
  handle.layer.remove(plan.removed.map(entry => entry.overlay));

  plan.retained.forEach(({ entry, descriptor }) => {
    if (entry.descriptor.positionSignature !== descriptor.positionSignature) {
      entry.overlay.setPosition(toLatLng(handle.maps, descriptor.position));
      moved = true;
    }
    if (relabel || entry.descriptor.contentSignature !== descriptor.contentSignature) {
      refreshEntry(entry, descriptor, labels);
    }
    entry.descriptor = descriptor;
    context.facilitiesOf.set(entry.overlay, descriptor.facilities);
  });

  const added = plan.added.map(descriptor => {
    const entry = createBulkEntry(handle, context, descriptor);
    entries.set(descriptor.key, entry);
    return entry.overlay;
  });
  handle.layer.add(added);

  if (plan.removed.length > 0 || added.length > 0 || moved) {
    handle.layer.redraw();
  }
};

export const disposeBulkEntries = (entries: Map<string, BulkEntry>): void => {
  entries.forEach(entry => entry.dispose());
  entries.clear();
};

export interface SelectionState {
  /** 현재 `data-hidden`을 준 벌크 엔트리 key */
  hiddenKey: string | null;
}

/** 선택 시설의 벌크 원본만 숨기고, 이전에 숨긴 것은 다시 보인다(포커스 계층이 대신 그린다). */
export const applyHiddenSelection = (
  entries: Map<string, BulkEntry>,
  state: SelectionState,
  selectedFacilityId: string | null
): void => {
  const selectedKey = selectedFacilityId ? `facility:${selectedFacilityId}` : null;
  if (state.hiddenKey && state.hiddenKey !== selectedKey) {
    const previous = entries.get(state.hiddenKey);
    if (previous) setFacilityMarkerHidden(previous.element, { hidden: false });
    state.hiddenKey = null;
  }
  const entry = selectedKey ? entries.get(selectedKey) : undefined;
  if (selectedKey && entry) {
    setFacilityMarkerHidden(entry.element, { hidden: true });
    state.hiddenKey = selectedKey;
  }
};
