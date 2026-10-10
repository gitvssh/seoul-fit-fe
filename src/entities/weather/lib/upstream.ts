/**
 * @fileoverview 서울 실시간 도시데이터(citydata) 응답 해석과 사용 불가 지역 메모
 * @description 정상 응답은 RESULT['RESULT.CODE'], 오류 응답은 RESULT.CODE 형태로 온다.
 * 지역 목록이 바뀌어 사라진 코드는 일정 시간 건너뛰어 불필요한 상위 API 호출을 막는다.
 */

export interface UpstreamResult {
  code: string;
  message: string;
}

interface ResultEnvelope {
  RESULT?: Record<string, string | undefined> | null;
}

const SUCCESS_CODE = 'INFO-000';
const NO_DATA_CODE = 'INFO-200';
const UNKNOWN_CODE = 'UNKNOWN';
const UNAVAILABLE_AREA_TTL_MS = 6 * 60 * 60 * 1000;

const unavailableAreas = new Map<string, number>();

/** 응답에서 결과 코드와 메시지를 읽는다. 두 가지 응답 형태를 모두 지원한다. */
export function getUpstreamResult(response: ResultEnvelope | null | undefined): UpstreamResult {
  const result = response?.RESULT ?? {};
  return {
    code: result['RESULT.CODE'] ?? result.CODE ?? UNKNOWN_CODE,
    message: result['RESULT.MESSAGE'] ?? result.MESSAGE ?? '',
  };
}

export function isSuccessfulUpstreamResult(response: ResultEnvelope | null | undefined): boolean {
  return getUpstreamResult(response).code === SUCCESS_CODE;
}

/**
 * 지역 코드가 상위 API에 없을 때의 결과인지 판단한다.
 * 사라진 코드는 RESULT 없이 빈 응답이 오거나 INFO-200(데이터 없음)으로 온다.
 * 일시적인 서버 오류(ERROR-*)나 한도 초과는 여기에 해당하지 않는다.
 */
export function isAreaNotFoundResult(code: string): boolean {
  return code === UNKNOWN_CODE || code === NO_DATA_CODE;
}

export function markAreaUnavailable(code: string, now: number = Date.now()): void {
  unavailableAreas.set(code, now + UNAVAILABLE_AREA_TTL_MS);
}

export function isAreaUnavailable(code: string, now: number = Date.now()): boolean {
  const expiresAt = unavailableAreas.get(code);
  if (expiresAt === undefined) {
    return false;
  }
  if (expiresAt <= now) {
    unavailableAreas.delete(code);
    return false;
  }
  return true;
}

export function resetUnavailableAreas(): void {
  unavailableAreas.clear();
}
