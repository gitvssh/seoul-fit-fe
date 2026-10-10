// lib/subwayColors.ts
// 서울 지하철 호선별 대표 색상 정의

export const SUBWAY_LINE_COLORS: Record<string, string> = {
  // 서울교통공사
  '1호선': '#0052A4',
  '2호선': '#00A84D',
  '3호선': '#EF7C1C',
  '4호선': '#00A5DE',
  '5호선': '#996CAC',
  '6호선': '#CD7C2F',
  '7호선': '#747F00',
  '8호선': '#E6186C',

  // 서울메트로9호선
  '9호선': '#BDB092',

  // 공항철도
  공항철도: '#0090D2',
  AREX: '#0090D2',

  // 신분당선
  신분당선: '#D4003B',

  // 경의중앙선
  경의중앙선: '#77C4A3',
  경의선: '#77C4A3',
  중앙선: '#77C4A3',

  // 경춘선
  경춘선: '#178C72',

  // 수인분당선
  수인분당선: '#FABE00',
  분당선: '#FABE00',
  수인선: '#FABE00',

  // 우이신설선
  우이신설선: '#B0CE18',

  // 서해선
  서해선: '#8FC31F',

  // 김포골드라인
  김포골드라인: '#A17A00',

  // 신림선
  신림선: '#6789CA',

  // 기본값
  default: '#6366F1',
};

// 호선명에서 색상을 추출하는 함수
export const getSubwayLineColor = (route: string): string => {
  if (!route) return SUBWAY_LINE_COLORS.default;

  // 정확한 매칭 시도
  if (SUBWAY_LINE_COLORS[route]) {
    return SUBWAY_LINE_COLORS[route];
  }

  // 부분 매칭 시도 (예: "서울지하철1호선" -> "1호선")
  for (const [lineName, color] of Object.entries(SUBWAY_LINE_COLORS)) {
    if (route.includes(lineName) || lineName.includes(route)) {
      return color;
    }
  }

  // 숫자 추출해서 매칭 시도 (예: "1" -> "1호선")
  const numberMatch = route.match(/(\d+)/);
  if (numberMatch) {
    const lineNumber = `${numberMatch[1]}호선`;
    if (SUBWAY_LINE_COLORS[lineNumber]) {
      return SUBWAY_LINE_COLORS[lineNumber];
    }
  }

  return SUBWAY_LINE_COLORS.default;
};

// 지하철 아이콘 SVG 생성 함수 (호선 색상 적용)
export const getSubwayIconSVG = (route: string): string => {
  const color = getSubwayLineColor(route);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect width="16" height="16" x="4" y="3" rx="2"/>
    <path d="M4 11h16"/>
    <path d="M12 3v8"/>
    <circle cx="8" cy="16" r="1"/>
    <circle cx="16" cy="16" r="1"/>
    <path d="m8 19 8-8"/>
  </svg>`;
};
