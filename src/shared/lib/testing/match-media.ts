/**
 * jsdom에는 `window.matchMedia`가 없다. ThemeProvider·sonner처럼 미디어 쿼리를 읽는
 * 컴포넌트를 테스트할 때 설치한다. 반환된 `setMatches`로 시스템 다크 전환을 흉내 낸다.
 */
export function installMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();

  const create = (query: string): MediaQueryList =>
    ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      addListener: (listener: () => void) => listeners.add(listener),
      removeListener: (listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => true,
    }) as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: create,
  });

  return {
    setMatches(next: boolean) {
      matches = next;
      listeners.forEach(listener => listener());
    },
  };
}
