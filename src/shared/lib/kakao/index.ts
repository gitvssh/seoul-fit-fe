// lib/kakao-map.ts
// 카카오맵 API 완전한 타입 정의 (any 타입 제거)

import type { FacilityCategory } from '@/lib/types';

// 카카오맵 열거형 타입들
export const enum KakaoMapTypeId {
  ROADMAP = 'ROADMAP',
  SKYVIEW = 'SKYVIEW',
  HYBRID = 'HYBRID',
  ROADVIEW = 'ROADVIEW',
  OVERLAY = 'OVERLAY',
  TRAFFIC = 'TRAFFIC',
  TERRAIN = 'TERRAIN',
  BICYCLE = 'BICYCLE',
  BICYCLE_HYBRID = 'BICYCLE_HYBRID',
  USE_DISTRICT = 'USE_DISTRICT',
}

export const enum KakaoControlPosition {
  TOP = 'TOP',
  TOPLEFT = 'TOPLEFT',
  TOPRIGHT = 'TOPRIGHT',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  BOTTOMLEFT = 'BOTTOMLEFT',
  BOTTOM = 'BOTTOM',
  BOTTOMRIGHT = 'BOTTOMRIGHT',
}

export const enum KakaoStatus {
  OK = 'OK',
  ZERO_RESULT = 'ZERO_RESULT',
  ERROR = 'ERROR',
}

// 기본 클래스들
export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoSize {
  getWidth(): number;
  getHeight(): number;
}

export interface KakaoPoint {
  getX(): number;
  getY(): number;
}

export interface KakaoBounds {
  extend(latlng: KakaoLatLng): void;
  getSouthWest(): KakaoLatLng;
  getNorthEast(): KakaoLatLng;
  isEmpty(): boolean;
  contain(latlng: KakaoLatLng): boolean;
}

// 지도 컨트롤 타입들
export interface KakaoMapTypeControl {
  getMap(): KakaoMap | null;
  setMap(map: KakaoMap | null): void;
}

export interface KakaoZoomControl {
  getMap(): KakaoMap | null;
  setMap(map: KakaoMap | null): void;
}

// 마커 이미지 관련
export interface KakaoMarkerImage {
  getSrc(): string;
  getSize(): KakaoSize;
  getOptions(): KakaoMarkerImageOptions;
}

export interface KakaoMarkerImageOptions {
  alt?: string;
  coords?: string;
  offset?: KakaoPoint;
  shape?: 'default' | 'rect' | 'circle' | 'poly';
  spriteOrigin?: KakaoPoint;
  spriteSize?: KakaoSize;
}

// 메인 지도 인터페이스
export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  getLevel(): number;
  setLevel(level: number): void;
  relayout(): void;
  addOverlayMapTypeId(mapTypeId: KakaoMapTypeId): void;
  removeOverlayMapTypeId(mapTypeId: KakaoMapTypeId): void;
  setMapTypeId(mapTypeId: KakaoMapTypeId): void;
  getMapTypeId(): KakaoMapTypeId;
  setBounds(bounds: KakaoBounds): void;
  getBounds(): KakaoBounds;
  addControl(control: KakaoMapTypeControl | KakaoZoomControl, position: KakaoControlPosition): void;
  removeControl(control: KakaoMapTypeControl | KakaoZoomControl): void;
  setDraggable(draggable: boolean): void;
  getDraggable(): boolean;
  setZoomable(zoomable: boolean): void;
  getZoomable(): boolean;
  setKeyboardShortcuts(active: boolean): void;
  getKeyboardShortcuts(): boolean;
  panBy(deltaX: number, deltaY: number): void;
  panTo(latlng: KakaoLatLng): void;
}

// 마커 인터페이스
export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  getMap(): KakaoMap | null;
  setPosition(position: KakaoLatLng): void;
  getPosition(): KakaoLatLng;
  setTitle(title: string): void;
  getTitle(): string;
  setImage(image: KakaoMarkerImage): void;
  getImage(): KakaoMarkerImage;
  setZIndex(zIndex: number): void;
  getZIndex(): number;
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  setClickable(clickable: boolean): void;
  getClickable(): boolean;
  setAltitude(altitude: number): void;
  getAltitude(): number;
  setRange(range: number): void;
  getRange(): number;
}

// 커스텀 오버레이 인터페이스
export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
  getMap(): KakaoMap | null;
  setPosition(position: KakaoLatLng): void;
  getPosition(): KakaoLatLng;
  setContent(content: string | HTMLElement): void;
  getContent(): HTMLElement;
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  setZIndex(zIndex: number): void;
  getZIndex(): number;
  setAltitude(altitude: number): void;
  getAltitude(): number;
  setRange(range: number): void;
  getRange(): number;
}

// 생성자 옵션들
export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
  mapTypeId?: KakaoMapTypeId;
  draggable?: boolean;
  scrollwheel?: boolean;
  disableDoubleClick?: boolean;
  disableDoubleClickZoom?: boolean;
  projectionId?: string;
  tileAnimation?: boolean;
  keyboardShortcuts?: boolean;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  image?: KakaoMarkerImage;
  title?: string;
  draggable?: boolean;
  clickable?: boolean;
  zIndex?: number;
  opacity?: number;
  altitude?: number;
  range?: number;
}

export interface KakaoCustomOverlayOptions {
  position: KakaoLatLng;
  content: string | HTMLElement;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
  clickable?: boolean;
  altitude?: number;
  range?: number;
}

// 이벤트 관리
export interface KakaoEventManager {
  addListener<T = unknown>(
    target: KakaoMap | KakaoMarker | KakaoCustomOverlay,
    type: MapEventType | MarkerEventType,
    handler: (event: T) => void
  ): void;
  removeListener<T = unknown>(
    target: KakaoMap | KakaoMarker | KakaoCustomOverlay,
    type: MapEventType | MarkerEventType,
    handler: (event: T) => void
  ): void;
  trigger<T = unknown>(
    target: KakaoMap | KakaoMarker | KakaoCustomOverlay,
    type: MapEventType | MarkerEventType,
    data?: T
  ): void;
}

// 지오코딩 서비스
export interface KakaoAddressResult {
  address_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  distance: string;
  id: string;
  phone: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string; // 경도
  y: string; // 위도
}

export interface KakaoGeocoder {
  addressSearch(
    address: string,
    callback: (result: KakaoAddressResult[], status: KakaoStatus) => void,
    options?: {
      page?: number;
      size?: number;
      analyze_type?: 'similar' | 'exact';
    }
  ): void;
  coord2Address(
    lng: number,
    lat: number,
    callback: (result: KakaoAddressResult[], status: KakaoStatus) => void,
    options?: {
      input_coord?: 'WGS84' | 'WCONGNAMUL' | 'CONGNAMUL' | 'WTM' | 'TM';
    }
  ): void;
  coord2RegionCode(
    lng: number,
    lat: number,
    callback: (result: KakaoAddressResult[], status: KakaoStatus) => void
  ): void;
}

// 장소 검색 서비스
export interface KakaoPlaces {
  keywordSearch(
    keyword: string,
    callback: (
      result: KakaoAddressResult[],
      status: KakaoStatus,
      pagination: KakaoPagination
    ) => void,
    options?: {
      category_group_code?: string;
      location?: KakaoLatLng;
      x?: number;
      y?: number;
      radius?: number;
      bounds?: KakaoBounds;
      rect?: string;
      size?: number;
      page?: number;
      sort?: 'distance' | 'accuracy';
    }
  ): void;
  categorySearch(
    code: string,
    callback: (
      result: KakaoAddressResult[],
      status: KakaoStatus,
      pagination: KakaoPagination
    ) => void,
    options?: {
      location?: KakaoLatLng;
      x?: number;
      y?: number;
      radius?: number;
      bounds?: KakaoBounds;
      rect?: string;
      size?: number;
      page?: number;
      sort?: 'distance' | 'accuracy';
    }
  ): void;
}

export interface KakaoPagination {
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  current: number;
  first: number;
  last: number;
  nextPage(): void;
  prevPage(): void;
  gotoPage(page: number): void;
  gotoFirst(): void;
  gotoLast(): void;
}

// 생성자 함수들
export interface KakaoMapConstructors {
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options?: KakaoMarkerImageOptions
  ) => KakaoMarkerImage;
  Size: new (width: number, height: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
  Bounds: new () => KakaoBounds;
  MapTypeControl: new () => KakaoMapTypeControl;
  ZoomControl: new () => KakaoZoomControl;
}

// 전체 카카오맵 API 인터페이스
export interface KakaoMapsAPI extends KakaoMapConstructors {
  event: KakaoEventManager;
  load: (callback: () => void) => void;
  services: {
    Geocoder: new () => KakaoGeocoder;
    Places: new () => KakaoPlaces;
    Status: typeof KakaoStatus;
  };
  MapTypeId: typeof KakaoMapTypeId;
  ControlPosition: typeof KakaoControlPosition;
}

// Window 객체 확장
export interface WindowWithKakao extends Window {
  kakao?: {
    maps?: KakaoMapsAPI;
  };
}

// 지도 상태 관리
export interface MapState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  center: { lat: number; lng: number };
  level: number;
}

// 마커 관리를 위한 확장 인터페이스
export interface ExtendedKakaoMarker extends KakaoMarker {
  facilityId?: string;
  category?: FacilityCategory;
  crowdLevel?: 'low' | 'medium' | 'high';
}

export interface ExtendedKakaoCustomOverlay extends KakaoCustomOverlay {
  facilityId?: string;
  category?: FacilityCategory;
  crowdLevel?: 'low' | 'medium' | 'high';
}

// 이벤트 타입 정의
export type MapEventType =
  | 'click'
  | 'dblclick'
  | 'rightclick'
  | 'mousemove'
  | 'mousedown'
  | 'mouseup'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'idle'
  | 'tilesloaded'
  | 'center_changed'
  | 'zoom_start'
  | 'zoom_changed'
  | 'bounds_changed'
  | 'maptypeid_changed';

export type MarkerEventType = 'click' | 'mouseover' | 'mouseout' | 'dragstart' | 'drag' | 'dragend';

// 유틸리티 타입
export type MapPosition = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  sw: MapPosition; // 남서쪽
  ne: MapPosition; // 북동쪽
};

// 마커 클러스터링을 위한 타입
export interface MarkerCluster {
  markers: ExtendedKakaoCustomOverlay[];
  center: MapPosition;
  bounds: MapBounds;
  category?: FacilityCategory;
}

// 지도 초기화 설정
export interface MapInitOptions {
  containerId: string;
  center: MapPosition;
  level?: number;
  mapTypeId?: KakaoMapTypeId;
  options?: Partial<KakaoMapOptions>;
}

// 이벤트 리스너 타입 헬퍼
export type MapEventListener<T = unknown> = (event: T) => void;
export type MarkerEventListener<T = unknown> = (event: T) => void;
