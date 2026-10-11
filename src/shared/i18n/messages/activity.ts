/** 짧은 활동 계획 */
export const ko = {
  'activity.title': '짧은 활동 계획',
  'activity.description': '지도 중심에서 출발해 이동과 체류를 예산 안에 맞춰요.',
  'activity.budget': '활동 시간',
  'activity.minutes': '{value}분',
  'activity.hours': '{value}시간',
  'activity.create': '계획 만들기',
  'activity.recreate': '다시 만들기',
  'activity.summary': '{budget}분 안에 {count}곳 · 이동 {travel}분 · 체류 {stay}분',
  'activity.stop': '이동 {travel}분 · 체류 {stay}분',
  'activity.arrival': '+{minutes}분',
  'activity.stopSelect': '{order}번째 {name} 상세 보기',
  'activity.result': '활동 계획 결과',
  'activity.empty':
    '이 시간 안에 연결할 가까운 장소가 부족해요. 지도를 이동하거나 시간을 늘려 보세요.',
  'activity.warning': '이동 시간은 직선거리 기반 보행 추정치라 실제 길찾기와 다를 수 있어요.',
  'activity.warningHours': '운영시간을 확인할 수 없는 장소는 방문 전에 공식 정보를 확인하세요.',
} as const;

export const en: Record<keyof typeof ko, string> = {
  'activity.title': 'Short activity plan',
  'activity.description': 'Starts from the map centre and fits travel and visits within your time.',
  'activity.budget': 'Activity time',
  'activity.minutes': '{value} min',
  'activity.hours': '{value} hr',
  'activity.create': 'Create plan',
  'activity.recreate': 'Create again',
  'activity.summary': '{count} stops in {budget} min · travel {travel} min · visit {stay} min',
  'activity.stop': 'Travel {travel} min · visit {stay} min',
  'activity.arrival': '+{minutes} min',
  'activity.stopSelect': 'Stop {order}: open {name}',
  'activity.result': 'Activity plan result',
  'activity.empty':
    'There are not enough nearby places for this budget. Move the map or allow more time.',
  'activity.warning':
    'Travel time is a straight-line walking estimate and may differ from actual directions.',
  'activity.warningHours':
    'Check official information before visiting places whose hours are unavailable.',
};
