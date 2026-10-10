import { getCongestionColor, getCongestionScore, parsePopulation } from '../congestion-utils';
import type { CongestionLevel } from '../../model/types';

describe('Congestion Utils', () => {
  describe('getCongestionColor', () => {
    it('returns correct color for each congestion level', () => {
      expect(getCongestionColor('여유')).toBe('green');
      expect(getCongestionColor('보통')).toBe('yellow');
      expect(getCongestionColor('약간 붐빔')).toBe('orange');
      expect(getCongestionColor('붐빔')).toBe('red');
    });

    it('returns yellow as default for unknown levels', () => {
      expect(getCongestionColor('알 수 없음' as CongestionLevel)).toBe('yellow');
      expect(getCongestionColor('' as CongestionLevel)).toBe('yellow');
    });

    it('handles all valid congestion levels', () => {
      const levels: CongestionLevel[] = ['여유', '보통', '약간 붐빔', '붐빔'];
      const expectedColors = ['green', 'yellow', 'orange', 'red'];

      levels.forEach((level, index) => {
        expect(getCongestionColor(level)).toBe(expectedColors[index]);
      });
    });
  });

  describe('getCongestionScore', () => {
    it('returns correct score for each congestion level', () => {
      expect(getCongestionScore('여유')).toBe(1);
      expect(getCongestionScore('보통')).toBe(2);
      expect(getCongestionScore('약간 붐빔')).toBe(3);
      expect(getCongestionScore('붐빔')).toBe(4);
    });

    it('returns 0 for unknown levels', () => {
      expect(getCongestionScore('알 수 없음' as CongestionLevel)).toBe(0);
      expect(getCongestionScore('' as CongestionLevel)).toBe(0);
    });

    it('scores are in ascending order by congestion severity', () => {
      const score1 = getCongestionScore('여유');
      const score2 = getCongestionScore('보통');
      const score3 = getCongestionScore('약간 붐빔');
      const score4 = getCongestionScore('붐빔');

      expect(score1).toBeLessThan(score2);
      expect(score2).toBeLessThan(score3);
      expect(score3).toBeLessThan(score4);
    });

    it('can be used for sorting', () => {
      const levels: CongestionLevel[] = ['붐빔', '여유', '약간 붐빔', '보통'];
      const sorted = [...levels].sort((a, b) => getCongestionScore(a) - getCongestionScore(b));

      expect(sorted).toEqual(['여유', '보통', '약간 붐빔', '붐빔']);
    });
  });

  describe('parsePopulation', () => {
    it('parses population string with commas correctly', () => {
      expect(parsePopulation('1,234,567')).toBe(1234567);
      expect(parsePopulation('10,000')).toBe(10000);
      expect(parsePopulation('999')).toBe(999);
    });

    it('handles string without commas', () => {
      expect(parsePopulation('12345')).toBe(12345);
      expect(parsePopulation('100')).toBe(100);
    });

    it('returns 0 for invalid inputs', () => {
      expect(parsePopulation('')).toBe(0);
      expect(parsePopulation('invalid')).toBe(0);
      expect(parsePopulation('abc123')).toBe(0);
    });

    it('handles edge cases', () => {
      expect(parsePopulation('0')).toBe(0);
      expect(parsePopulation('00,000')).toBe(0);
      expect(parsePopulation('1')).toBe(1);
    });

    it('handles Korean number formats', () => {
      expect(parsePopulation('1,234명')).toBe(1234); // parseInt stops at first non-numeric character after parsing
      expect(parsePopulation('12,345,678')).toBe(12345678);
    });

    it('handles spaces in population string', () => {
      expect(parsePopulation(' 1,234 ')).toBe(1234); // parseInt handles leading/trailing spaces after comma removal
      expect(parsePopulation('1 234')).toBe(1); // Space causes parseInt to stop at first space
    });
  });
});
