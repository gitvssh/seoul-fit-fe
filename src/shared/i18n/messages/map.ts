/** 지도 제어, 데이터 신선도 */
export const ko = {
  'map.loadError': '지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'map.showCongestion': '혼잡도 보기',
  'map.hideCongestion': '혼잡도 숨기기',
  'map.showWeather': '날씨 정보 보기',
  'map.hideWeather': '날씨 정보 숨기기',
  'map.currentLocation': '현재 위치로 이동',
  'map.facilityCount': '{count}개 시설',
  'freshness.live': '실시간',
  'freshness.recent': '최근 갱신',
  'freshness.stale': '갱신 지연',
  'freshness.unknown': '기준 시각 미확인',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'map.loadError': 'Unable to load the map. Please try again.',
  'map.showCongestion': 'Show crowding',
  'map.hideCongestion': 'Hide crowding',
  'map.showWeather': 'Show weather',
  'map.hideWeather': 'Hide weather',
  'map.currentLocation': 'Move to current location',
  'map.facilityCount': '{count} facilities',
  'freshness.live': 'Live',
  'freshness.recent': 'Recently updated',
  'freshness.stale': 'Update delayed',
  'freshness.unknown': 'Time unavailable',
};
