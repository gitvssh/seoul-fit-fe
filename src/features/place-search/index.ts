export { SearchBox } from './ui/SearchBox';
export type { SearchBoxHandle, SearchBoxProps } from './ui/SearchBox';
export type { NaturalLanguageSearchRule as NaturalLanguageRule } from '@/features/natural-language-search/model/types';
export {
  CATEGORY_PRIORITY,
  MATCH_TIER,
  loadHangul,
  matchText,
  prepareSearchEntry,
  rankSearchEntries,
} from './lib/ranking';
export type { HangulModule, SearchEntry, TextMatch } from './lib/ranking';
export { SEARCH_TO_FACILITY_CATEGORY, groupByCategory } from './lib/categories';
export type { SearchResultGroup } from './lib/categories';
