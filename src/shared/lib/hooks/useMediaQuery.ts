'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * CSS 미디어 쿼리 일치 여부. 서버와 첫 클라이언트 렌더에서는 `fallback`을 쓴다.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(
    () => (typeof window === 'undefined' ? fallback : window.matchMedia(query).matches),
    [query, fallback]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}

export const DESKTOP_QUERY = '(min-width: 768px)';
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
