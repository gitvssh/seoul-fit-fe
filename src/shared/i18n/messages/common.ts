/** 공통 셸: 언어, 헤더 내비게이션, 사이드 메뉴 */
export const ko = {
  'language.toggle': 'English',
  'language.changed': '언어가 한국어로 변경되었습니다.',
  'header.home': 'Seoul Fit 홈',
  'header.places': '장소 둘러보기',
  'header.notifications': '알림 목록',
  'header.openNotifications': '알림 열기',
  'header.markAllRead': '모두 읽기',
  'header.openProfile': '프로필 열기',
  'header.openMenu': '메뉴 열기',
  'common.reload': '새로고침',
  'sidebar.title': '지도 마커 설정',
  'sidebar.selected': '{count}개 선택',
  'sidebar.description':
    '지도에 표시할 마커를 선택하세요. 체크된 카테고리의 시설만 지도에 표시됩니다.',
  'sidebar.close': '메뉴 닫기',
  'sidebar.profile': '프로필',
  'sidebar.defaultUser': '사용자',
  'sidebar.logout': '로그아웃',
  'sidebar.login': '카카오 로그인',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'language.toggle': '한국어',
  'language.changed': 'Language changed to English.',
  'header.home': 'Seoul Fit home',
  'header.places': 'Browse places',
  'header.notifications': 'Notifications',
  'header.openNotifications': 'Open notifications',
  'header.markAllRead': 'Mark all read',
  'header.openProfile': 'Open profile',
  'header.openMenu': 'Open menu',
  'common.reload': 'Reload',
  'sidebar.title': 'Map marker settings',
  'sidebar.selected': '{count} selected',
  'sidebar.description':
    'Choose the markers to show. Only facilities in checked categories appear on the map.',
  'sidebar.close': 'Close menu',
  'sidebar.profile': 'Profile',
  'sidebar.defaultUser': 'User',
  'sidebar.logout': 'Log out',
  'sidebar.login': 'Log in with Kakao',
};
