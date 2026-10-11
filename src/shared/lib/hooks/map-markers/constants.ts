import type { KakaoMarkerClustererOptions } from '@/shared/lib/kakao';
import {
  CLUSTER_OVERLAY_STYLES,
  CLUSTER_TIER_THRESHOLDS,
  formatClusterCount,
} from '@/shared/lib/utils/marker';

export interface ViewportPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_VIEWPORT_PADDING: ViewportPadding = { top: 0, right: 0, bottom: 0, left: 0 };

/** 이 건수 이하의 클러스터는 확대 대신 목록을 연다 */
export const DEFAULT_CLUSTER_LIST_THRESHOLD = 6;

/** 이 레벨 이하(건물 단위)에서는 클러스터를 눌러도 목록을 연다 */
export const CLUSTER_LIST_MAX_LEVEL = 3;

/** 클러스터 확대 시 뷰포트 가림 영역 밖에 추가로 두는 여백(px) */
export const CLUSTER_ZOOM_MARGIN_PX = 48;

/** revealFacility가 마커를 가림 영역 안쪽으로 끌어올 때 두는 여백(px) */
export const REVEAL_MARGIN_PX = 44;

/** 공식 MarkerClusterer 옵션(인터랙션 조사 §2 권장값). `map`은 생성 시 넣는다. */
export const CLUSTERER_OPTIONS: Omit<KakaoMarkerClustererOptions, 'map' | 'markers'> = {
  averageCenter: true,
  gridSize: 64,
  minClusterSize: 2,
  minLevel: 4,
  disableClickZoom: true,
  calculator: [...CLUSTER_TIER_THRESHOLDS],
  styles: CLUSTER_OVERLAY_STYLES,
  texts: formatClusterCount,
};
