/** 검색창, 최근 검색, 자연어 조건 */
export const ko = {
  'header.searchLabel': '장소와 조건 검색',
  'header.searchPlaceholder': '장소 또는 “한산한 실내 도서관” 검색',
  'header.clearSearch': '검색어 지우기',
  'header.loading': '데이터 로딩 중...',
  'header.recentSearch': '최근 검색',
  'header.clearAll': '전체 삭제',
  'header.removeHistory': '{query} 검색 기록 삭제',
  'header.searchResults': '검색 결과',
  'header.noResults': '검색 결과가 없습니다.',
  'header.applyRules': '조건으로 지도 보기',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'header.searchLabel': 'Search places and conditions',
  'header.searchPlaceholder': 'Search a place or “quiet indoor library”',
  'header.clearSearch': 'Clear search',
  'header.loading': 'Loading data...',
  'header.recentSearch': 'Recent searches',
  'header.clearAll': 'Clear all',
  'header.removeHistory': 'Remove {query} from search history',
  'header.searchResults': 'Search results',
  'header.noResults': 'No results found.',
  'header.applyRules': 'Apply conditions to map',
};
