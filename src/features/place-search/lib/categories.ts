import type { FacilityCategory } from '@/lib/types';
import type { MessageKey } from '@/shared/i18n/messages';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';

export type SearchCategory = SearchItem['category'];

/** 검색 인덱스 카테고리 → 시설 카테고리. 아이콘·색은 `FACILITY_CONFIGS` 단일 소스를 쓴다. */
export const SEARCH_TO_FACILITY_CATEGORY: Record<SearchCategory, FacilityCategory> = {
  subway: 'subway',
  bike: 'bike',
  library: 'library',
  park: 'park',
  cultural_event: 'cultural_event',
  cultural_reservation: 'cultural_reservation',
  cooling_center: 'cooling_shelter',
  restaurant: 'restaurant',
};

/** 그룹 제목용 i18n 키 */
export const CATEGORY_MESSAGE_KEY: Record<SearchCategory, MessageKey> = {
  subway: 'category.subway',
  bike: 'category.bike',
  library: 'category.library',
  park: 'category.park',
  cultural_event: 'category.cultural_event',
  cultural_reservation: 'category.cultural_reservation',
  cooling_center: 'category.cooling_shelter',
  restaurant: 'category.restaurant',
};

export interface SearchResultGroup {
  category: SearchCategory;
  items: SearchItem[];
}

/** 순위를 유지한 채 카테고리별로 묶는다. 가장 좋은 결과가 속한 그룹이 먼저 온다. */
export function groupByCategory(items: SearchItem[]): SearchResultGroup[] {
  const groups: SearchResultGroup[] = [];
  const byCategory = new Map<SearchCategory, SearchResultGroup>();
  for (const item of items) {
    let group = byCategory.get(item.category);
    if (!group) {
      group = { category: item.category, items: [] };
      byCategory.set(item.category, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}
