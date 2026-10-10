/**
 * @fileoverview Search Entity Public API
 * @description 검색 엔티티 공개 인터페이스
 */

// Types
export type {
  POISearchItem,
  SearchParams,
  PaginationInfo,
  PaginatedResponse,
  SearchResult,
} from './model/types';

// API Functions
export {
  validateSearchParams,
  fetchPOISearchIndex,
  parseSearchResponse,
  getErrorMessage,
} from './api';
