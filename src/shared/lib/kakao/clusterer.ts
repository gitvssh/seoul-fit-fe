/**
 * 마커 클러스터러 타입 (`libraries=clusterer`, clusterer.js 1.1.x 관찰 기준).
 */
import type { KakaoBounds, KakaoCustomOverlay, KakaoLatLng, KakaoMap } from './index';

/** 클러스터러에 넣을 수 있는 객체. `Marker` 외에 `CustomOverlay`도 동작한다(미문서, 실측). */
export interface KakaoClusterable {
  getPosition(): KakaoLatLng;
  setMap(map: KakaoMap | null): void;
}

/** 클러스터러 이벤트 핸들러 인자로만 얻는 클러스터 객체 */
export interface KakaoCluster {
  getCenter(): KakaoLatLng;
  /** 생성 시점의 gridSize 기반 확장 영역 (마커 분포 영역이 아님) */
  getBounds(): KakaoBounds;
  getSize(): number;
  getMarkers(): KakaoClusterable[];
  getClusterMarker(): KakaoCustomOverlay;
}

/** `styles` 항목: 클러스터 DOM의 inline style에 그대로 대입되는 CSS 속성 맵 */
export type KakaoClusterStyle = Record<string, string>;

export interface KakaoMarkerClustererOptions {
  map?: KakaoMap;
  markers?: KakaoClusterable[];
  gridSize?: number;
  averageCenter?: boolean;
  /** 이 레벨 미만에서는 클러스터링하지 않는다 */
  minLevel?: number;
  minClusterSize?: number;
  styles?: KakaoClusterStyle[];
  texts?: string[] | ((count: number) => string);
  calculator?: number[] | ((count: number) => number);
  disableClickZoom?: boolean;
  clickable?: boolean;
  hoverable?: boolean;
}

export interface KakaoMarkerClusterer {
  addMarker(marker: KakaoClusterable, noDraw?: boolean): void;
  addMarkers(markers: KakaoClusterable[], noDraw?: boolean): void;
  removeMarker(marker: KakaoClusterable, noDraw?: boolean): void;
  removeMarkers(markers: KakaoClusterable[], noDraw?: boolean): void;
  clear(): void;
  redraw(): void;
  setMap(map: KakaoMap | null): void;
  getMap(): KakaoMap | null;
  getMarkers(): KakaoClusterable[];
  getGridSize(): number;
  setGridSize(size: number): void;
  getMinClusterSize(): number;
  setMinClusterSize(size: number): void;
  getMinLevel(): number;
  setMinLevel(level: number): void;
  getStyles(): KakaoClusterStyle[];
  setStyles(styles: KakaoClusterStyle[]): void;
  getTexts(): string[] | ((count: number) => string);
  setTexts(texts: string[] | ((count: number) => string)): void;
  getCalculator(): number[] | ((count: number) => number);
  setCalculator(calculator: number[] | ((count: number) => number)): void;
}

export type ClustererEventType =
  | 'clusterclick'
  | 'clusterover'
  | 'clusterout'
  | 'clusterdblclick'
  | 'clusterrightclick'
  | 'clustered';
