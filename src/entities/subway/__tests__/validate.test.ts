import { getUpstreamErrorCode, validateApiResponse } from '../api';
import type { SubwayArrivalApiResponse } from '../model/types';

describe('validateApiResponse', () => {
  it('accepts INFO-000 and payloads without an error block', () => {
    expect(
      validateApiResponse({ errorMessage: { code: 'INFO-000' } } as SubwayArrivalApiResponse)
    ).toBe(true);
    expect(validateApiResponse({ realtimeArrivalList: [] } as SubwayArrivalApiResponse)).toBe(true);
  });

  it('rejects the flat ERROR-338 shape the real-time service returns for an unauthorised key', () => {
    const response = {
      status: 500,
      code: 'ERROR-338',
      message: '해당 인증키로는 실시간 서비스를 사용할 수 없습니다.',
      total: 0,
    } as unknown as SubwayArrivalApiResponse;
    expect(validateApiResponse(response)).toBe(false);
    expect(getUpstreamErrorCode(response)).toBe('ERROR-338');
  });
});
