/** 짧은 활동 계획 */
export const ko = {
  'activity.title': '짧은 활동 계획',
  'activity.description': '이동과 체류를 예산 안에 맞춥니다.',
  'activity.budget': '활동 시간 예산',
  'activity.minutes': '{value}분',
  'activity.hours': '{value}시간',
  'activity.create': '만들기',
  'activity.summary': '{budget}분 안에 {count}곳 · 이동 {travel}분 · 체류 {stay}분',
  'activity.stop': '이동 {travel}분 · 체류 {stay}분',
  'activity.empty': '이 시간 안에 연결할 가까운 장소가 부족합니다. 지도를 이동하거나 시간을 늘려 보세요.',
  'activity.warning': '이동 시간은 직선거리 기반 보행 추정치이며 실제 길찾기와 다를 수 있습니다.',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'activity.title': 'Short activity plan',
  'activity.description': 'Fits travel and visits within your time.',
  'activity.budget': 'Activity time budget',
  'activity.minutes': '{value} min',
  'activity.hours': '{value} hr',
  'activity.create': 'Create',
  'activity.summary': '{count} stops in {budget} min · travel {travel} min · visit {stay} min',
  'activity.stop': 'Travel {travel} min · visit {stay} min',
  'activity.empty': 'There are not enough nearby places for this budget. Move the map or allow more time.',
  'activity.warning': 'Travel time is a straight-line walking estimate and may differ from actual directions.',
};
