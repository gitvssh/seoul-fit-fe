import type { Position } from '@/lib/types';

export interface SeoulRegion {
  code: string;
  nameKo: string;
  nameEn: string;
  position: Position;
  zoomLevel: number;
}

/**
 * 서울 전체와 25개 자치구의 지도 이동 기준점입니다.
 * 자치구 좌표는 구청 인근 중심점을 사용하며 사용자 현재 위치와는 별도로 취급합니다.
 */
export const SEOUL_REGIONS: readonly SeoulRegion[] = [
  {
    code: 'seoul',
    nameKo: '서울 전체',
    nameEn: 'All Seoul',
    position: { lat: 37.5665, lng: 126.978 },
    zoomLevel: 9,
  },
  {
    code: 'jongno',
    nameKo: '종로구',
    nameEn: 'Jongno-gu',
    position: { lat: 37.5735, lng: 126.979 },
    zoomLevel: 7,
  },
  {
    code: 'jung',
    nameKo: '중구',
    nameEn: 'Jung-gu',
    position: { lat: 37.5641, lng: 126.9979 },
    zoomLevel: 7,
  },
  {
    code: 'yongsan',
    nameKo: '용산구',
    nameEn: 'Yongsan-gu',
    position: { lat: 37.5326, lng: 126.9905 },
    zoomLevel: 7,
  },
  {
    code: 'seongdong',
    nameKo: '성동구',
    nameEn: 'Seongdong-gu',
    position: { lat: 37.5633, lng: 127.0371 },
    zoomLevel: 7,
  },
  {
    code: 'gwangjin',
    nameKo: '광진구',
    nameEn: 'Gwangjin-gu',
    position: { lat: 37.5385, lng: 127.0823 },
    zoomLevel: 7,
  },
  {
    code: 'dongdaemun',
    nameKo: '동대문구',
    nameEn: 'Dongdaemun-gu',
    position: { lat: 37.5744, lng: 127.0396 },
    zoomLevel: 7,
  },
  {
    code: 'jungnang',
    nameKo: '중랑구',
    nameEn: 'Jungnang-gu',
    position: { lat: 37.6063, lng: 127.0927 },
    zoomLevel: 7,
  },
  {
    code: 'seongbuk',
    nameKo: '성북구',
    nameEn: 'Seongbuk-gu',
    position: { lat: 37.5894, lng: 127.0167 },
    zoomLevel: 7,
  },
  {
    code: 'gangbuk',
    nameKo: '강북구',
    nameEn: 'Gangbuk-gu',
    position: { lat: 37.6396, lng: 127.0257 },
    zoomLevel: 7,
  },
  {
    code: 'dobong',
    nameKo: '도봉구',
    nameEn: 'Dobong-gu',
    position: { lat: 37.6688, lng: 127.0471 },
    zoomLevel: 7,
  },
  {
    code: 'nowon',
    nameKo: '노원구',
    nameEn: 'Nowon-gu',
    position: { lat: 37.6542, lng: 127.0568 },
    zoomLevel: 7,
  },
  {
    code: 'eunpyeong',
    nameKo: '은평구',
    nameEn: 'Eunpyeong-gu',
    position: { lat: 37.6027, lng: 126.9291 },
    zoomLevel: 7,
  },
  {
    code: 'seodaemun',
    nameKo: '서대문구',
    nameEn: 'Seodaemun-gu',
    position: { lat: 37.5791, lng: 126.9368 },
    zoomLevel: 7,
  },
  {
    code: 'mapo',
    nameKo: '마포구',
    nameEn: 'Mapo-gu',
    position: { lat: 37.5663, lng: 126.9019 },
    zoomLevel: 7,
  },
  {
    code: 'yangcheon',
    nameKo: '양천구',
    nameEn: 'Yangcheon-gu',
    position: { lat: 37.517, lng: 126.8666 },
    zoomLevel: 7,
  },
  {
    code: 'gangseo',
    nameKo: '강서구',
    nameEn: 'Gangseo-gu',
    position: { lat: 37.5509, lng: 126.8495 },
    zoomLevel: 7,
  },
  {
    code: 'guro',
    nameKo: '구로구',
    nameEn: 'Guro-gu',
    position: { lat: 37.4955, lng: 126.8874 },
    zoomLevel: 7,
  },
  {
    code: 'geumcheon',
    nameKo: '금천구',
    nameEn: 'Geumcheon-gu',
    position: { lat: 37.4569, lng: 126.8955 },
    zoomLevel: 7,
  },
  {
    code: 'yeongdeungpo',
    nameKo: '영등포구',
    nameEn: 'Yeongdeungpo-gu',
    position: { lat: 37.5264, lng: 126.8962 },
    zoomLevel: 7,
  },
  {
    code: 'dongjak',
    nameKo: '동작구',
    nameEn: 'Dongjak-gu',
    position: { lat: 37.5124, lng: 126.9393 },
    zoomLevel: 7,
  },
  {
    code: 'gwanak',
    nameKo: '관악구',
    nameEn: 'Gwanak-gu',
    position: { lat: 37.4784, lng: 126.9516 },
    zoomLevel: 7,
  },
  {
    code: 'seocho',
    nameKo: '서초구',
    nameEn: 'Seocho-gu',
    position: { lat: 37.4837, lng: 127.0324 },
    zoomLevel: 7,
  },
  {
    code: 'gangnam',
    nameKo: '강남구',
    nameEn: 'Gangnam-gu',
    position: { lat: 37.5173, lng: 127.0473 },
    zoomLevel: 7,
  },
  {
    code: 'songpa',
    nameKo: '송파구',
    nameEn: 'Songpa-gu',
    position: { lat: 37.5145, lng: 127.1059 },
    zoomLevel: 7,
  },
  {
    code: 'gangdong',
    nameKo: '강동구',
    nameEn: 'Gangdong-gu',
    position: { lat: 37.5301, lng: 127.1238 },
    zoomLevel: 7,
  },
] as const;

export const findSeoulRegion = (code: string): SeoulRegion | undefined =>
  SEOUL_REGIONS.find(region => region.code === code);
