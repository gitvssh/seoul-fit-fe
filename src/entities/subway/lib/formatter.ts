/**
 * @fileoverview Subway Data Formatter
 * @description 지하철 데이터 포맷팅 유틸리티
 */

/**
 * 도착 메시지 포맷팅
 * @param message 원본 메시지
 * @returns 포맷된 메시지
 */
export function formatArrivalMessage(message: string): string {
  return message.replace(/\[(\d+)]번째 전역/g, '$1번째 전역');
}

/**
 * 도착 시간 포맷팅
 * @param seconds 초 단위 시간 또는 이미 포맷된 문자열
 * @returns 포맷된 시간 문자열
 */
export function formatTime(seconds: string): string {
  // 이미 포맷된 경우 그대로 반환
  if (seconds.includes('분') || seconds.includes('초')) {
    return seconds;
  }

  const sec = parseInt(seconds);
  if (sec === 0 || isNaN(sec)) return seconds;

  const minutes = Math.floor(sec / 60);
  const remainingSeconds = sec % 60;

  if (minutes > 0 && remainingSeconds > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  } else if (minutes > 0) {
    return `${minutes}분`;
  } else {
    return `${remainingSeconds}초`;
  }
}

/**
 * 역명 정제 (역 접미사 제거)
 * @param stationName 원본 역명
 * @returns 정제된 역명
 */
export function cleanStationName(stationName: string): string {
  return stationName.replace(/역$/, '');
}
