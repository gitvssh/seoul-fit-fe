import { formatArrivalMessage, formatTime, cleanStationName } from '../formatter';

describe('Subway Formatter', () => {
  describe('formatArrivalMessage', () => {
    it('formats arrival messages with station count', () => {
      expect(formatArrivalMessage('[1]번째 전역')).toBe('1번째 전역');
      expect(formatArrivalMessage('[2]번째 전역')).toBe('2번째 전역');
      expect(formatArrivalMessage('[10]번째 전역')).toBe('10번째 전역');
    });

    it('handles multiple occurrences in one message', () => {
      const input = '다음역은 [1]번째 전역이고, 그 다음은 [2]번째 전역입니다';
      const expected = '다음역은 1번째 전역이고, 그 다음은 2번째 전역입니다';
      expect(formatArrivalMessage(input)).toBe(expected);
    });

    it('leaves messages without pattern unchanged', () => {
      expect(formatArrivalMessage('강남역 도착')).toBe('강남역 도착');
      expect(formatArrivalMessage('3분 후 도착')).toBe('3분 후 도착');
      expect(formatArrivalMessage('')).toBe('');
    });

    it('handles edge cases', () => {
      expect(formatArrivalMessage('[0]번째 전역')).toBe('0번째 전역');
      expect(formatArrivalMessage('[999]번째 전역')).toBe('999번째 전역');
      expect(formatArrivalMessage('전역[3]번째')).toBe('전역[3]번째'); // Pattern not matched
    });
  });

  describe('formatTime', () => {
    it('formats seconds to minutes and seconds', () => {
      expect(formatTime('90')).toBe('1분 30초');
      expect(formatTime('125')).toBe('2분 5초');
      expect(formatTime('3661')).toBe('61분 1초');
    });

    it('formats exact minutes without seconds', () => {
      expect(formatTime('60')).toBe('1분');
      expect(formatTime('120')).toBe('2분');
      expect(formatTime('300')).toBe('5분');
    });

    it('formats seconds only when less than a minute', () => {
      expect(formatTime('30')).toBe('30초');
      expect(formatTime('59')).toBe('59초');
      expect(formatTime('1')).toBe('1초');
    });

    it('returns already formatted strings unchanged', () => {
      expect(formatTime('3분 30초')).toBe('3분 30초');
      expect(formatTime('5분')).toBe('5분');
      expect(formatTime('45초')).toBe('45초');
      expect(formatTime('곧 도착')).toBe('곧 도착');
    });

    it('handles special cases', () => {
      expect(formatTime('0')).toBe('0');
      expect(formatTime('')).toBe('');
      expect(formatTime('invalid')).toBe('invalid');
      expect(formatTime('-60')).toBe('0초'); // Math.abs would be needed for negative to become positive
    });

    it('handles numeric strings with spaces', () => {
      expect(formatTime(' 60 ')).toBe('1분'); // parseInt trims spaces before parsing
      expect(formatTime('60.5')).toBe('1분'); // Decimal is truncated
    });
  });

  describe('cleanStationName', () => {
    it('removes 역 suffix from station names', () => {
      expect(cleanStationName('강남역')).toBe('강남');
      expect(cleanStationName('서울역')).toBe('서울');
      expect(cleanStationName('시청역')).toBe('시청');
    });

    it('leaves names without 역 suffix unchanged', () => {
      expect(cleanStationName('강남')).toBe('강남');
      expect(cleanStationName('서울')).toBe('서울');
      expect(cleanStationName('신도림')).toBe('신도림');
    });

    it('only removes 역 at the end', () => {
      expect(cleanStationName('역삼역')).toBe('역삼');
      expect(cleanStationName('역곡역')).toBe('역곡');
      expect(cleanStationName('역사관역')).toBe('역사관');
    });

    it('handles edge cases', () => {
      expect(cleanStationName('')).toBe('');
      expect(cleanStationName('역')).toBe('');
      expect(cleanStationName('역역')).toBe('역');
      expect(cleanStationName('역역역')).toBe('역역');
    });

    it('preserves spaces and special characters', () => {
      expect(cleanStationName('강남 역')).toBe('강남 ');
      expect(cleanStationName('강남(2호선)역')).toBe('강남(2호선)');
      expect(cleanStationName('강남·교대역')).toBe('강남·교대');
    });
  });
});
