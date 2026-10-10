/** 테마, 토스트, 다이얼로그 */
export const ko = {
  'theme.label': '화면 테마',
  'theme.system': '시스템 설정',
  'theme.light': '라이트',
  'theme.dark': '다크',
  'theme.mapDark': '지도도 어둡게',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'theme.label': 'Theme',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.mapDark': 'Dark map tiles',
};
