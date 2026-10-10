import {
  getUpstreamResult,
  isAreaNotFoundResult,
  isAreaUnavailable,
  isSuccessfulUpstreamResult,
  markAreaUnavailable,
  resetUnavailableAreas,
} from '../upstream';

describe('citydata upstream result helpers', () => {
  beforeEach(() => resetUnavailableAreas());

  it('reads the success shape', () => {
    const response = {
      RESULT: { 'RESULT.CODE': 'INFO-000', 'RESULT.MESSAGE': '정상 처리되었습니다.' },
    };
    expect(getUpstreamResult(response)).toEqual({
      code: 'INFO-000',
      message: '정상 처리되었습니다.',
    });
    expect(isSuccessfulUpstreamResult(response)).toBe(true);
  });

  it('reads the error shape', () => {
    const response = { RESULT: { CODE: 'ERROR-500', MESSAGE: '서버 오류' } };
    expect(getUpstreamResult(response)).toEqual({ code: 'ERROR-500', message: '서버 오류' });
    expect(isSuccessfulUpstreamResult(response)).toBe(false);
  });

  it('treats a missing RESULT as unknown', () => {
    expect(getUpstreamResult({})).toEqual({ code: 'UNKNOWN', message: '' });
    expect(getUpstreamResult(null)).toEqual({ code: 'UNKNOWN', message: '' });
    expect(getUpstreamResult({ RESULT: null })).toEqual({ code: 'UNKNOWN', message: '' });
  });

  it('only classifies missing-area results as not found', () => {
    expect(isAreaNotFoundResult('UNKNOWN')).toBe(true);
    expect(isAreaNotFoundResult('INFO-200')).toBe(true);
    expect(isAreaNotFoundResult('ERROR-500')).toBe(false);
    expect(isAreaNotFoundResult('INFO-000')).toBe(false);
  });

  it('remembers unavailable areas until the memo expires', () => {
    const now = 1_000_000;
    markAreaUnavailable('POI099', now);
    expect(isAreaUnavailable('POI099', now + 1)).toBe(true);
    expect(isAreaUnavailable('POI099', now + 6 * 60 * 60 * 1000)).toBe(false);
    expect(isAreaUnavailable('POI099', now + 1)).toBe(false);
    expect(isAreaUnavailable('POI130', now)).toBe(false);
  });
});
