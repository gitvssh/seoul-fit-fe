/**
 * @fileoverview Congestion Utility Functions
 * @description 혼잡도 관련 유틸리티 함수
 */

import type { CongestionLevel, CongestionColor } from '../model/types';

/**
 * 혼잡도 레벨을 색상으로 변환
 */
export function getCongestionColor(level: CongestionLevel): CongestionColor {
  switch (level) {
    case '여유':
      return 'green';
    case '보통':
      return 'yellow';
    case '약간 붐빔':
      return 'orange';
    case '붐빔':
      return 'red';
    default:
      return 'yellow';
  }
}

/**
 * 혼잡도 레벨 점수 계산 (정렬용)
 */
export function getCongestionScore(level: CongestionLevel): number {
  switch (level) {
    case '여유':
      return 1;
    case '보통':
      return 2;
    case '약간 붐빔':
      return 3;
    case '붐빔':
      return 4;
    default:
      return 0;
  }
}

/**
 * 인구 문자열을 숫자로 변환
 */
export function parsePopulation(populationStr: string): number {
  return parseInt(populationStr.replace(/,/g, ''), 10) || 0;
}
