/**
 * 화면 테마 설정. `dark` 클래스를 <html>에 붙이는 class 전략(Tailwind darkMode: 'class').
 * 첫 페인트 전에 실행되는 inline script(THEME_INIT_SCRIPT)와 React provider가 같은 규칙을 쓴다.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'seoul-fit.theme.v1';
export const MAP_DARK_STORAGE_KEY = 'seoul-fit.map-dark.v1';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}

/** <body> 첫 자식으로 실행되어 hydration 전에 테마 클래스를 맞춘다. */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var m='${MAP_DARK_STORAGE_KEY}';var p=localStorage.getItem(k);var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';if(localStorage.getItem(m)==='true'){e.setAttribute('data-map-dark','true');}}catch(e){}})();`;
