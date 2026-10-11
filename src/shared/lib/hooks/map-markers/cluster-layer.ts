/**
 * 벌크 계층 어댑터: 공식 `kakao.maps.MarkerClusterer`에 CustomOverlay 객체를 넣는다.
 *
 * 문서는 `Marker`만 명시하지만 CustomOverlay도 동작한다(인터랙션 조사 E2 실측). 라이브러리가
 * 없으면(`libraries=clusterer` 미요청·구버전) 클러스터링 없이 오버레이를 직접 올리는
 * 폴백으로 내려가고 한 번만 경고한다.
 */
import type { Facility } from '@/lib/types';
import type {
  KakaoCluster,
  KakaoCustomOverlay,
  KakaoMap,
  KakaoMapsAPI,
  KakaoMarkerClusterer,
} from '@/shared/lib/kakao';
import { decorateClusterElement, MARKER_Z, type MarkerLabels } from '@/shared/lib/utils/marker';
import {
  CLUSTER_LIST_MAX_LEVEL,
  CLUSTER_ZOOM_MARGIN_PX,
  CLUSTERER_OPTIONS,
  type ViewportPadding,
} from './constants';

export interface ClusterLayerHandlers {
  /** 오버레이가 대표하는 시설들(같은 좌표 스택은 여러 개) */
  getFacilities: (overlay: KakaoCustomOverlay) => Facility[];
  getLabels: () => MarkerLabels;
  onClusterActivate: (cluster: KakaoCluster, facilities: Facility[]) => void;
  onClustered?: (clusterCount: number) => void;
}

export interface ClusterLayer {
  /** 공식 클러스터러를 쓰는지(false면 폴백: 클러스터링 없음) */
  readonly clustered: boolean;
  add(overlays: KakaoCustomOverlay[]): void;
  remove(overlays: KakaoCustomOverlay[]): void;
  /** 추가·삭제·이동 뒤 한 번 호출해 클러스터를 다시 계산한다 */
  redraw(): void;
  clear(): void;
  dispose(): void;
}

export type ClusterAction = 'list' | 'zoom';

/** 레벨 ≤3(건물 단위)이거나 작은 클러스터면 목록, 아니면 영역 확대 */
export const decideClusterAction = ({
  level,
  size,
  listThreshold,
}: {
  level: number;
  size: number;
  listThreshold: number;
}): ClusterAction => (level <= CLUSTER_LIST_MAX_LEVEL || size <= listThreshold ? 'list' : 'zoom');

/** 클러스터 영역이 헤더·시트에 가려지지 않게 패딩을 더해 확대한다. */
export const zoomToCluster = (
  map: KakaoMap,
  cluster: KakaoCluster,
  padding: ViewportPadding
): void => {
  const before = map.getLevel();
  map.setBounds(
    cluster.getBounds(),
    padding.top + CLUSTER_ZOOM_MARGIN_PX,
    padding.right + CLUSTER_ZOOM_MARGIN_PX,
    padding.bottom + CLUSTER_ZOOM_MARGIN_PX,
    padding.left + CLUSTER_ZOOM_MARGIN_PX
  );
  if (map.getLevel() >= before && before > 1) {
    map.setLevel(before - 1, { anchor: cluster.getCenter() });
  }
};

let warnedMissingClusterer = false;

const countFacilities = (cluster: KakaoCluster, handlers: ClusterLayerHandlers): number =>
  cluster
    .getMarkers()
    .reduce((sum, marker) => sum + handlers.getFacilities(marker as KakaoCustomOverlay).length, 0);

const collectFacilities = (cluster: KakaoCluster, handlers: ClusterLayerHandlers): Facility[] =>
  cluster.getMarkers().flatMap(marker => handlers.getFacilities(marker as KakaoCustomOverlay));

const createPlainLayer = (map: KakaoMap): ClusterLayer => {
  const shown = new Set<KakaoCustomOverlay>();
  return {
    clustered: false,
    add(overlays) {
      overlays.forEach(overlay => {
        overlay.setMap(map);
        shown.add(overlay);
      });
    },
    remove(overlays) {
      overlays.forEach(overlay => {
        overlay.setMap(null);
        shown.delete(overlay);
      });
    },
    redraw() {},
    clear() {
      shown.forEach(overlay => overlay.setMap(null));
      shown.clear();
    },
    dispose() {
      this.clear();
    },
  };
};

export const createClusterLayer = (
  maps: KakaoMapsAPI,
  map: KakaoMap,
  handlers: ClusterLayerHandlers
): ClusterLayer => {
  if (typeof maps.MarkerClusterer !== 'function') {
    if (!warnedMissingClusterer) {
      warnedMissingClusterer = true;
      console.warn(
        '[useMapMarkers] kakao.maps.MarkerClusterer가 없어 클러스터링 없이 마커를 표시합니다. SDK URL에 libraries=clusterer가 있는지 확인하세요.'
      );
    }
    return createPlainLayer(map);
  }

  const clusterer: KakaoMarkerClusterer = new maps.MarkerClusterer({ ...CLUSTERER_OPTIONS, map });
  const boundElements = new WeakSet<HTMLElement>();

  const activate = (cluster: KakaoCluster) => {
    handlers.onClusterActivate(cluster, collectFacilities(cluster, handlers));
  };

  // 클러스터 DOM(div)은 줌·이동마다 새로 만들어지므로 `clustered`에서 매번 다시 꾸민다.
  const handleClustered = (clusters: KakaoCluster[]) => {
    const labels = handlers.getLabels();
    for (const cluster of clusters) {
      const marker = cluster.getClusterMarker();
      const element = marker.getContent();
      if (!(element instanceof HTMLElement)) continue;
      decorateClusterElement(element, countFacilities(cluster, handlers), { labels });
      marker.setZIndex(MARKER_Z.cluster);
      if (!boundElements.has(element)) {
        boundElements.add(element);
        element.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate(cluster);
          }
        });
      }
    }
    handlers.onClustered?.(clusters.length);
  };

  const handleClusterClick = (cluster: KakaoCluster) => {
    activate(cluster);
  };

  maps.event.addListener(clusterer, 'clustered', handleClustered);
  maps.event.addListener(clusterer, 'clusterclick', handleClusterClick);

  return {
    clustered: true,
    add(overlays) {
      if (overlays.length > 0) clusterer.addMarkers(overlays, true);
    },
    remove(overlays) {
      if (overlays.length > 0) clusterer.removeMarkers(overlays, true);
    },
    redraw() {
      clusterer.redraw();
    },
    clear() {
      clusterer.clear();
      handlers.onClustered?.(0);
    },
    dispose() {
      maps.event.removeListener(clusterer, 'clustered', handleClustered);
      maps.event.removeListener(clusterer, 'clusterclick', handleClusterClick);
      clusterer.clear();
      clusterer.setMap(null);
    },
  };
};
