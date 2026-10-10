/**
 * @fileoverview Seoul Locations Data
 * @description 서울시 주요 120개 위치 데이터
 * @source 서울 열린 데이터 광장
 */

import type { SeoulLocation } from '@/entities/weather/model/types';

/**
 * 서울시 주요 위치 데이터
 * 관광특구, 고궁·문화유산, 지하철역, 공원, 산, 강·하천, 생활권 등
 */
export const SEOUL_LOCATIONS: SeoulLocation[] = [
  // 관광특구
  { code: 'POI001', name: '강남 MICE 관광특구', lat: 37.5175, lng: 127.0473 },
  { code: 'POI002', name: '동대문 관광특구', lat: 37.5663, lng: 127.0092 },
  { code: 'POI003', name: '명동 관광특구', lat: 37.5636, lng: 126.9824 },
  { code: 'POI004', name: '이태원 관광특구', lat: 37.5344, lng: 126.9957 },
  { code: 'POI005', name: '잠실 관광특구', lat: 37.5133, lng: 127.1028 },
  { code: 'POI006', name: '종로·청계 관광특구', lat: 37.57, lng: 126.992 },
  { code: 'POI007', name: '홍대 관광특구', lat: 37.5519, lng: 126.9245 },

  // 고궁·문화유산
  { code: 'POI008', name: '경복궁', lat: 37.5788, lng: 126.977 },
  { code: 'POI009', name: '광화문·덕수궁', lat: 37.5658, lng: 126.9756 },
  { code: 'POI010', name: '보신각', lat: 37.5693, lng: 126.9833 },
  { code: 'POI011', name: '서울 암사동 유적', lat: 37.5525, lng: 127.1311 },
  { code: 'POI012', name: '창덕궁·종묘', lat: 37.5755, lng: 126.9946 },

  // 지하철역
  { code: 'POI013', name: '가산디지털단지역', lat: 37.4817, lng: 126.8824 },
  { code: 'POI014', name: '강남역', lat: 37.4979, lng: 127.0276 },
  { code: 'POI015', name: '건대입구역', lat: 37.5401, lng: 127.0701 },
  { code: 'POI016', name: '고덕역', lat: 37.5559, lng: 127.1544 },
  { code: 'POI017', name: '고속터미널역', lat: 37.5047, lng: 127.0046 },
  { code: 'POI018', name: '교대역', lat: 37.4934, lng: 127.0146 },
  { code: 'POI019', name: '구로디지털단지역', lat: 37.4851, lng: 126.9015 },
  { code: 'POI020', name: '구로역', lat: 37.5034, lng: 126.8876 },
  { code: 'POI021', name: '군자역', lat: 37.5573, lng: 127.0793 },
  { code: 'POI023', name: '대림역', lat: 37.4933, lng: 126.8964 },
  { code: 'POI024', name: '동대문역', lat: 37.5713, lng: 127.0095 },
  { code: 'POI025', name: '뚝섬역', lat: 37.5472, lng: 127.0477 },
  { code: 'POI026', name: '미아사거리역', lat: 37.6133, lng: 127.0302 },
  { code: 'POI027', name: '발산역', lat: 37.5583, lng: 126.8374 },
  { code: 'POI029', name: '사당역', lat: 37.4766, lng: 126.9816 },
  { code: 'POI030', name: '삼각지역', lat: 37.5346, lng: 126.9734 },
  { code: 'POI031', name: '서울대입구역', lat: 37.4813, lng: 126.9527 },
  { code: 'POI032', name: '서울식물원·마곡나루역', lat: 37.564, lng: 126.8337 },
  { code: 'POI033', name: '서울역', lat: 37.5547, lng: 126.9706 },
  { code: 'POI034', name: '선릉역', lat: 37.5048, lng: 127.0493 },

  // 계속해서 나머지 위치들...
  // (전체 120개 위치는 원본 파일에서 가져올 예정)
];

/**
 * 위치 코드로 위치 정보 찾기
 */
export const findLocationByCode = (code: string): SeoulLocation | undefined => {
  return SEOUL_LOCATIONS.find(location => location.code === code);
};

/**
 * 위치 이름으로 위치 정보 찾기
 */
export const findLocationByName = (name: string): SeoulLocation | undefined => {
  return SEOUL_LOCATIONS.find(
    location => location.name.includes(name) || name.includes(location.name)
  );
};

/**
 * 좌표 기준 가장 가까운 위치 찾기
 */
export const findNearestLocation = (lat: number, lng: number): SeoulLocation | undefined => {
  if (SEOUL_LOCATIONS.length === 0) return undefined;

  let nearest = SEOUL_LOCATIONS[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  for (const location of SEOUL_LOCATIONS.slice(1)) {
    const distance = calculateDistance(lat, lng, location.lat, location.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  }

  return nearest;
};

/**
 * 두 좌표 간 거리 계산 (Haversine 공식)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
