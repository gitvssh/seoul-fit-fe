/**
 * 지도 마커 2계층.
 *
 * - 벌크 계층: 시설마다 CustomOverlay 1개(같은 좌표 묶음은 스택 1개) → 공식 MarkerClusterer.
 *   key로 diff 해서 추가·삭제·이동분만 반영한다.
 * - 포커스 계층: 선택 시설은 클러스터러 밖 별도 오버레이(z 20)로 항상 보이게 하고,
 *   벌크 계층의 원본은 `data-hidden`으로 숨긴다. 클러스터에 묻히거나 뷰포트 필터에서
 *   빠져도 선택 마커는 남는다.
 *
 * z-order는 `overlay.setZIndex()`(MARKER_Z)로만 바꾼다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Facility } from '@/lib/types';
import type { KakaoCluster, KakaoCustomOverlay, KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { resolveMarkerLabels, type MarkerLabels } from '@/shared/lib/utils/marker';
import {
  applyHiddenSelection,
  disposeBulkEntries,
  reconcileBulk,
  type BulkEntry,
  type LayerHandle,
  type SelectionState,
} from './map-markers/bulk-layer';
import { createClusterLayer, decideClusterAction, zoomToCluster } from './map-markers/cluster-layer';
import {
  DEFAULT_CLUSTER_LIST_THRESHOLD,
  DEFAULT_VIEWPORT_PADDING,
  type ViewportPadding,
} from './map-markers/constants';
import {
  clearFocus,
  findKnownFacility,
  panToReveal,
  syncSelection,
  type FocusState,
} from './map-markers/focus-layer';
import {
  buildMarkerDescriptors,
  indexFacilities,
  type MarkerDescriptor,
} from './map-markers/reconcile';

export type { ViewportPadding } from './map-markers/constants';
export { getFacilityMarkerId } from '@/shared/lib/utils/marker';

export type FacilitySelectSource = 'marker' | 'cluster';

export interface UseMapMarkersProps {
  mapInstance: KakaoMap | null | undefined;
  mapStatus: { success: boolean; loading: boolean; error: string | null } | undefined;
  /** 통합자가 이미 카테고리·뷰포트로 거른 시설 */
  visibleFacilities: Facility[];
  onFacilitySelect: (facility: Facility, source: FacilitySelectSource) => void;
  /** 작은 클러스터·같은 좌표 스택 → 목록 시트. 없으면 첫 시설을 'cluster' 소스로 선택한다. */
  onClusterSelect?: (facilities: Facility[], center: { lat: number; lng: number }) => void;
  /** `getFacilityMarkerId(facility)` = `${category}:${id}` */
  selectedFacilityId?: string | null;
  /** 데스크톱(hover: hover)에서만 true. hover z-order 상승을 켠다. */
  hoverEnabled?: boolean;
  /** 번역된 접근성 이름 */
  labels?: Partial<MarkerLabels>;
  /** 헤더·시트가 가리는 px. 클러스터 확대와 revealFacility가 쓴다. */
  viewportPadding?: ViewportPadding;
  /** 이 건수 이하 클러스터는 확대 대신 목록 (기본 6) */
  clusterListThreshold?: number;
}

interface LatestProps {
  onFacilitySelect: UseMapMarkersProps['onFacilitySelect'];
  onClusterSelect: UseMapMarkersProps['onClusterSelect'];
  hoverEnabled: boolean;
  viewportPadding: ViewportPadding;
  clusterListThreshold: number;
  labels: MarkerLabels;
  selectedFacilityId: string | null;
  facilityIndex: Map<string, Facility>;
}

interface MarkerState {
  entries: Map<string, BulkEntry>;
  facilitiesOf: WeakMap<KakaoCustomOverlay, Facility[]>;
  selection: SelectionState;
  focus: FocusState;
  appliedLabels: MarkerLabels | null;
}

const createMarkerState = (): MarkerState => ({
  entries: new Map(),
  facilitiesOf: new WeakMap(),
  selection: { hiddenKey: null },
  focus: { entry: null, lastSelected: null },
  appliedLabels: null,
});

export const useMapMarkers = ({
  mapInstance,
  mapStatus,
  visibleFacilities,
  onFacilitySelect,
  onClusterSelect,
  selectedFacilityId = null,
  hoverEnabled = false,
  labels: labelsProp,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
  clusterListThreshold = DEFAULT_CLUSTER_LIST_THRESHOLD,
}: UseMapMarkersProps) => {
  const ready = Boolean(mapInstance && mapStatus?.success);
  const labelFacility = labelsProp?.facility;
  const labelCluster = labelsProp?.cluster;
  const labelCurrentLocation = labelsProp?.currentLocation;
  const labels = useMemo(
    () =>
      resolveMarkerLabels({
        facility: labelFacility,
        cluster: labelCluster,
        currentLocation: labelCurrentLocation,
      }),
    [labelFacility, labelCluster, labelCurrentLocation]
  );
  const descriptors = useMemo(() => buildMarkerDescriptors(visibleFacilities), [visibleFacilities]);
  const facilityIndex = useMemo(() => indexFacilities(descriptors), [descriptors]);

  const stateRef = useRef<MarkerState>(createMarkerState());
  const layerRef = useRef<LayerHandle | null>(null);
  const latestRef = useRef<LatestProps>({
    onFacilitySelect,
    onClusterSelect,
    hoverEnabled,
    viewportPadding,
    clusterListThreshold,
    labels,
    selectedFacilityId,
    facilityIndex,
  });
  const [clustersCount, setClustersCount] = useState(0);

  useEffect(() => {
    latestRef.current = {
      onFacilitySelect,
      onClusterSelect,
      hoverEnabled,
      viewportPadding,
      clusterListThreshold,
      labels,
      selectedFacilityId,
      facilityIndex,
    };
  });

  const activateDescriptor = useCallback((descriptor: MarkerDescriptor) => {
    const { onFacilitySelect: select, onClusterSelect: selectCluster } = latestRef.current;
    if (descriptor.kind === 'facility') {
      select(descriptor.facilities[0], 'marker');
    } else if (selectCluster) {
      selectCluster(descriptor.facilities, descriptor.position);
    } else {
      select(descriptor.facilities[0], 'cluster');
    }
  }, []);

  const handleClusterActivate = useCallback(
    (map: KakaoMap, cluster: KakaoCluster, facilities: Facility[]) => {
      const latest = latestRef.current;
      const action = decideClusterAction({
        level: map.getLevel(),
        size: facilities.length,
        listThreshold: latest.clusterListThreshold,
      });
      if (action === 'zoom') {
        zoomToCluster(map, cluster, latest.viewportPadding);
        return;
      }
      const center = cluster.getCenter();
      if (latest.onClusterSelect) {
        latest.onClusterSelect(facilities, { lat: center.getLat(), lng: center.getLng() });
      } else if (facilities[0]) {
        latest.onFacilitySelect(facilities[0], 'cluster');
      }
    },
    []
  );

  // 벌크 계층(클러스터러) 생성·폐기. 지도 인스턴스가 바뀌면 전부 다시 만든다.
  useEffect(() => {
    if (!ready || !mapInstance) return;
    const maps = (window as WindowWithKakao).kakao?.maps;
    if (!maps) return;

    const map = mapInstance;
    const state = stateRef.current;
    const layer = createClusterLayer(maps, map, {
      getFacilities: overlay => state.facilitiesOf.get(overlay) ?? [],
      getLabels: () => latestRef.current.labels,
      onClustered: count => setClustersCount(current => (current === count ? current : count)),
      onClusterActivate: (cluster, facilities) => handleClusterActivate(map, cluster, facilities),
    });
    layerRef.current = { layer, map, maps };

    return () => {
      disposeBulkEntries(state.entries);
      state.selection.hiddenKey = null;
      clearFocus(state.focus);
      state.appliedLabels = null;
      layer.dispose();
      layerRef.current = null;
      setClustersCount(0);
    };
  }, [ready, mapInstance, handleClusterActivate]);

  // 벌크 계층 reconcile (key 기반 diff)
  useEffect(() => {
    const handle = layerRef.current;
    if (!handle || !ready) return;
    const state = stateRef.current;
    const relabel = state.appliedLabels !== labels;
    state.appliedLabels = labels;
    reconcileBulk(
      handle,
      {
        entries: state.entries,
        facilitiesOf: state.facilitiesOf,
        getLabels: () => latestRef.current.labels,
        isHoverEnabled: () => latestRef.current.hoverEnabled,
        activate: activateDescriptor,
      },
      descriptors,
      { relabel }
    );
    applyHiddenSelection(state.entries, state.selection, latestRef.current.selectedFacilityId);
  }, [ready, mapInstance, descriptors, labels, activateDescriptor]);

  // 포커스 계층: 선택 시설
  useEffect(() => {
    const handle = layerRef.current;
    if (!handle || !ready) return;
    const state = stateRef.current;
    syncSelection(handle, state.focus, selectedFacilityId, facilityIndex, labels, facility =>
      latestRef.current.onFacilitySelect(facility, 'marker')
    );
    applyHiddenSelection(state.entries, state.selection, selectedFacilityId);
  }, [ready, mapInstance, selectedFacilityId, facilityIndex, labels]);

  const clearMarkers = useCallback(() => {
    const state = stateRef.current;
    disposeBulkEntries(state.entries);
    state.selection.hiddenKey = null;
    clearFocus(state.focus);
    layerRef.current?.layer.clear();
    setClustersCount(0);
  }, []);

  /** 마커가 헤더·시트에 가려져 있으면 보이는 영역 안으로 최소 거리만 이동한다. */
  const revealFacility = useCallback((facilityId: string) => {
    const handle = layerRef.current;
    if (!handle) return;
    const facility = findKnownFacility(stateRef.current.focus, latestRef.current.facilityIndex, facilityId);
    if (facility) panToReveal(handle, facility.position, latestRef.current.viewportPadding);
  }, []);

  return {
    markersCount: ready ? descriptors.length : 0,
    clustersCount,
    clearMarkers,
    revealFacility,
  };
};
