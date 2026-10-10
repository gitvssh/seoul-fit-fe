/**
 * @fileoverview Shared Types
 * @description 공유 타입 정의
 */

import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';

// Header Component Ref
export interface HeaderRef {
  closeSearchSuggestions: () => void;
  blurSearchInput: () => void;
}

// MapContainer Component Ref
export interface MapContainerRef {
  handleSearchSelect: (searchItem: SearchItem) => Promise<void>;
  handleSearchClear: () => void;
}

// Re-export common types
export * from '@/lib/types';
