/**
 * @fileoverview Library Entity Public API
 * @description 도서관 엔티티 공개 인터페이스
 */

// Types
export type {
  Library,
  LibrarySearchParams,
  PaginatedLibraries,
  LibraryApiResponse,
} from './model/types';

// API Functions
export {
  fetchAllLibraries,
  validateSearchParams,
  fetchNearbyLibraries,
  validateLocationWithRadius,
} from './api';

// Converters
export { convertLibraryRowToAppFormat, convertLibraries, paginateLibraries } from './lib/converter';
