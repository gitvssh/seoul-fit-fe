// lib/facilityIcons.tsx
import React from 'react';
import {
  Dumbbell,
  Calendar,
  UtensilsCrossed,
  BookOpen,
  TreePine,
  Bike,
  Snowflake,
  Train,
  Music,
  CalendarCheck,
} from 'lucide-react';
import { FACILITY_CATEGORIES, type FacilityCategory, type Facility } from '@/lib/types';
import { getSubwayLineColor, getSubwayIconSVG } from '@/shared/lib/icons/subway-colors';

export interface FacilityConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
  description: string;
  svgIcon: string; // 카카오맵 마커용 SVG
}

export const FACILITY_CONFIGS: Record<FacilityCategory, FacilityConfig> = {
  [FACILITY_CATEGORIES.SPORTS]: {
    icon: <Dumbbell className='w-5 h-5' />,
    color: 'bg-blue-500',
    label: '체육시설',
    description: '헬스장, 수영장, 테니스장 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
  },
  [FACILITY_CATEGORIES.CULTURE]: {
    icon: <Calendar className='w-5 h-5' />,
    color: 'bg-purple-500',
    label: '문화시설',
    description: '공연장, 전시관, 미술관 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
  },
  [FACILITY_CATEGORIES.RESTAURANT]: {
    icon: <UtensilsCrossed className='w-5 h-5' />,
    color: 'bg-red-500',
    label: '맛집',
    description: '음식점, 카페, 디저트 매장 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M15 2h4v6h-4z"/></svg>`,
  },
  [FACILITY_CATEGORIES.LIBRARY]: {
    icon: <BookOpen className='w-5 h-5' />,
    color: 'bg-green-500',
    label: '도서관',
    description: '공공도서관, 학습실 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  },
  [FACILITY_CATEGORIES.PARK]: {
    icon: <TreePine className='w-5 h-5' />,
    color: 'bg-emerald-600',
    label: '공원',
    description: '도시공원, 산책로, 쉼터 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m12 3 4 4H8l4-4Z"/><path d="m12 3 4 4H8l4-4Z"/><path d="M8 7h8v4H8z"/></svg>`,
  },
  [FACILITY_CATEGORIES.SUBWAY]: {
    icon: <Train className='w-5 h-5' />,
    color: 'bg-indigo-500',
    label: '지하철',
    description: '서울시 지하철역',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><path d="m8 19 8-8"/></svg>`,
  },
  [FACILITY_CATEGORIES.BIKE]: {
    icon: <Bike className='w-5 h-5' />,
    color: 'bg-lime-500',
    label: '따릉이',
    description: '공용자전거 대여소',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="m14 17 6-6"/><path d="M6 17h6s.5-1 0-3-1-3 0-3"/></svg>`,
  },
  [FACILITY_CATEGORIES.COOLING_SHELTER]: {
    icon: <Snowflake className='w-5 h-5' />,
    color: 'bg-cyan-500',
    label: '무더위 쉼터',
    description: '서울시 무더위 쉼터',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>`,
  },
  [FACILITY_CATEGORIES.CULTURAL_EVENT]: {
    icon: <Music className='w-5 h-5' />,
    color: 'bg-pink-500',
    label: '문화행사',
    description: '콘서트, 공연, 전시회 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  },
  [FACILITY_CATEGORIES.CULTURAL_RESERVATION]: {
    icon: <CalendarCheck className='w-5 h-5' />,
    color: 'bg-violet-500',
    label: '문화예약',
    description: '예약 가능한 문화 프로그램',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
  },
};

// 카카오맵 마커용 아이콘 SVG 생성 함수
export const getFacilityIconSVG = (facilityType: FacilityCategory): string => {
  return FACILITY_CONFIGS[facilityType]?.svgIcon || '';
};

// 혼잡도별 색상 반환 함수
export const getCrowdColor = (crowdLevel: 'low' | 'medium' | 'high'): string => {
  switch (crowdLevel) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#F59E0B';
    case 'high':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

// 카테고리별 색상 반환 함수
export const getCategoryColor = (category: FacilityCategory): string => {
  switch (category) {
    case FACILITY_CATEGORIES.SPORTS:
      return '#3B82F6'; // blue-500
    case FACILITY_CATEGORIES.CULTURE:
      return '#A855F7'; // purple-500
    case FACILITY_CATEGORIES.RESTAURANT:
      return '#EF4444'; // red-500
    case FACILITY_CATEGORIES.LIBRARY:
      return '#10B981'; // green-500
    case FACILITY_CATEGORIES.PARK:
      return '#059669'; // emerald-600
    case FACILITY_CATEGORIES.SUBWAY:
      return '#6366F1'; // indigo-500
    case FACILITY_CATEGORIES.BIKE:
      return '#84CC16'; // lime-500
    case FACILITY_CATEGORIES.COOLING_SHELTER:
      return '#06B6D4'; // cyan-500
    case FACILITY_CATEGORIES.CULTURAL_EVENT:
      return '#EC4899'; // pink-500
    case FACILITY_CATEGORIES.CULTURAL_RESERVATION:
      return '#8B5CF6'; // violet-500
    default:
      return '#6B7280';
  }
};

// 시설 아이콘 정보 반환 함수
export const getFacilityIcon = (category: FacilityCategory, facility?: Facility) => {
  const config = FACILITY_CONFIGS[category];

  // 지하철역인 경우 호선별 색상 적용
  if (category === FACILITY_CATEGORIES.SUBWAY && facility?.subwayStation?.route) {
    return {
      svg: getSubwayIconSVG(facility.subwayStation.route),
      color: getSubwayLineColor(facility.subwayStation.route),
    };
  }

  return {
    svg: config?.svgIcon || '',
    color: getCategoryColor(category),
  };
};
