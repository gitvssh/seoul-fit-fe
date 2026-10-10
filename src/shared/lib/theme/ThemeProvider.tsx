'use client';

import React from 'react';
import {
  MAP_DARK_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from './theme';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  mapDark: boolean;
  setMapDark: (enabled: boolean) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function readMapDark(): boolean {
  try {
    return window.localStorage.getItem(MAP_DARK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function readSystemDark() {
  return window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server render and first client render agree on 'system'; the inline script already
  // applied the stored preference to <html>, so there is no flash.
  const [preference, setPreferenceState] = React.useState<ThemePreference>('system');
  const [mapDark, setMapDarkState] = React.useState(false);
  const systemDark = React.useSyncExternalStore(subscribeSystem, readSystemDark, () => false);

  React.useEffect(() => {
    setPreferenceState(readPreference());
    setMapDarkState(readMapDark());
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(readPreference());
      if (event.key === MAP_DARK_STORAGE_KEY) setMapDarkState(readMapDark());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const resolved = resolveTheme(preference, systemDark);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (mapDark) root.setAttribute('data-map-dark', 'true');
    else root.removeAttribute('data-map-dark');
  }, [mapDark]);

  const setPreference = React.useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The current page keeps the choice even when storage is unavailable.
    }
  }, []);

  const setMapDark = React.useCallback((enabled: boolean) => {
    setMapDarkState(enabled);
    try {
      window.localStorage.setItem(MAP_DARK_STORAGE_KEY, String(enabled));
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = React.useMemo(
    () => ({ preference, resolved, setPreference, mapDark, setMapDark }),
    [preference, resolved, setPreference, mapDark, setMapDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
