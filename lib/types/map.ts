/**
 * @fileoverview 지도 관련 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { Position } from './common';
import type { Facility } from './facility';

// 카카오맵 관련 타입들 (기존 호환성 유지)
export interface KakaoLatLng {
  lat: number;
  lng: number;
}

// 지도 설정
export interface MapConfig {
  /** 지도 컨테이너 ID */
  containerId: string;
  /** 초기 중심 좌표 */
  center: Position;
  /** 초기 줌 레벨 */
  level: number;
  /** 지도 타입 */
  mapTypeId?: 'ROADMAP' | 'SKYVIEW' | 'HYBRID';
  /** 확대/축소 컨트롤 표시 여부 */
  zoomControl?: boolean;
  /** 지도 타입 컨트롤 표시 여부 */
  mapTypeControl?: boolean;
  /** 드래그 가능 여부 */
  draggable?: boolean;
  /** 스크롤 휠 줌 가능 여부 */
  scrollwheel?: boolean;
  /** 더블클릭 줌 가능 여부 */
  disableDoubleClick?: boolean;
  /** 더블클릭 드래그 가능 여부 */
  disableDoubleClickZoom?: boolean;
}

// 지도 상태
export interface MapStatus {
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 초기화 완료 여부 */
  initialized: boolean;
  /** 지도 인스턴스 준비 여부 */
  ready: boolean;
  /** 성공 여부 */
  success?: boolean;
}

// 줌 레벨 정보
export interface ZoomInfo {
  /** 현재 줌 레벨 */
  level: number;
  /** 최소 줌 레벨 */
  minLevel: number;
  /** 최대 줌 레벨 */
  maxLevel: number;
  /** 줌 변경 중 여부 */
  isZooming: boolean;
}

// 지도 뷰포트 정보
export interface MapViewport {
  /** 뷰포트 중심 좌표 */
  center: Position;
  /** 뷰포트 경계 */
  bounds: {
    /** 남서쪽 좌표 */
    sw: Position;
    /** 북동쪽 좌표 */
    ne: Position;
  };
  /** 줌 레벨 */
  zoomLevel: number;
}

// 마커 정보
export interface MapMarker {
  /** 마커 ID */
  id: string;
  /** 마커 위치 */
  position: Position;
  /** 마커 제목 */
  title: string;
  /** 마커 아이콘 URL */
  iconUrl?: string;
  /** 마커 크기 */
  iconSize?: {
    width: number;
    height: number;
  };
  /** 클릭 가능 여부 */
  clickable: boolean;
  /** 마커 표시 여부 */
  visible: boolean;
  /** 마커 z-index */
  zIndex?: number;
  /** 연관된 시설 정보 */
  facility?: Facility;
}

// 클러스터 마커 정보
export interface ClusterMarker {
  /** 클러스터 ID */
  id: string;
  /** 클러스터 위치 */
  position: Position;
  /** 클러스터에 포함된 마커 수 */
  count: number;
  /** 클러스터 반경 */
  radius: number;
  /** 클러스터 레벨 */
  level: number;
  /** 클러스터에 포함된 시설들 */
  facilities: Facility[];
}

// 지도 이벤트 타입
export type MapEventType =
  | 'click'
  | 'dblclick'
  | 'rightclick'
  | 'mouseover'
  | 'mouseout'
  | 'mousemove'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'zoom_start'
  | 'zoom_changed'
  | 'center_changed'
  | 'bounds_changed'
  | 'idle';

// 지도 이벤트 정보
export interface MapEvent {
  /** 이벤트 타입 */
  type: MapEventType;
  /** 이벤트 발생 위치 */
  latLng?: Position;
  /** 이벤트 대상 */
  target?: unknown;
  /** 추가 데이터 */
  data?: Record<string, unknown>;
}

// 지도 컨트롤 설정
export interface MapControls {
  /** 줌 컨트롤 */
  zoom: {
    enabled: boolean;
    position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  };
  /** 지도 타입 컨트롤 */
  mapType: {
    enabled: boolean;
    position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  };
  /** 현재 위치 컨트롤 */
  currentLocation: {
    enabled: boolean;
    position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  };
  /** 전체화면 컨트롤 */
  fullscreen: {
    enabled: boolean;
    position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  };
}

// 지도 레이어 정보
export interface MapLayer {
  /** 레이어 ID */
  id: string;
  /** 레이어 이름 */
  name: string;
  /** 레이어 타입 */
  type: 'marker' | 'cluster' | 'heatmap' | 'polygon' | 'polyline';
  /** 레이어 표시 여부 */
  visible: boolean;
  /** 레이어 투명도 (0-1) */
  opacity: number;
  /** 레이어 z-index */
  zIndex: number;
  /** 레이어 데이터 */
  data: unknown[];
}

// 히트맵 데이터
export interface HeatmapData {
  /** 위치 */
  position: Position;
  /** 가중치 */
  weight: number;
}

// 폴리곤 데이터
export interface PolygonData {
  /** 폴리곤 ID */
  id: string;
  /** 폴리곤 경로 */
  path: Position[];
  /** 채우기 색상 */
  fillColor: string;
  /** 채우기 투명도 */
  fillOpacity: number;
  /** 테두리 색상 */
  strokeColor: string;
  /** 테두리 두께 */
  strokeWeight: number;
  /** 테두리 투명도 */
  strokeOpacity: number;
}

// 폴리라인 데이터
export interface PolylineData {
  /** 폴리라인 ID */
  id: string;
  /** 폴리라인 경로 */
  path: Position[];
  /** 선 색상 */
  strokeColor: string;
  /** 선 두께 */
  strokeWeight: number;
  /** 선 투명도 */
  strokeOpacity: number;
  /** 선 스타일 */
  strokeStyle: 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot';
}

// 지도 검색 결과
export interface MapSearchResult {
  /** 검색 쿼리 */
  query: string;
  /** 검색 결과 위치 */
  position: Position;
  /** 검색 결과 주소 */
  address: string;
  /** 검색 결과 타입 */
  type: 'address' | 'poi' | 'facility';
  /** 추가 정보 */
  metadata?: Record<string, unknown>;
}

// 지도 성능 메트릭
export interface MapPerformanceMetrics {
  /** 지도 로딩 시간 (ms) */
  loadTime: number;
  /** 마커 렌더링 시간 (ms) */
  markerRenderTime: number;
  /** 클러스터링 시간 (ms) */
  clusteringTime: number;
  /** 메모리 사용량 (MB) */
  memoryUsage: number;
  /** FPS */
  fps: number;
}

// 지도 인터랙션 상태
export interface MapInteractionState {
  /** 드래그 중 여부 */
  isDragging: boolean;
  /** 줌 중 여부 */
  isZooming: boolean;
  /** 마커 선택 상태 */
  selectedMarker: string | null;
  /** 클러스터 선택 상태 */
  selectedCluster: string | null;
  /** 호버 중인 마커 */
  hoveredMarker: string | null;
}
