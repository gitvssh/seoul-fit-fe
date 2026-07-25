import type { Facility } from '@/lib/types';
import {
  getFacilityReservationUrl,
  getKakaoDirectionsUrl,
  getSafeExternalUrl,
} from '../actions';

const facility: Facility = {
  id: 'sports-1',
  name: '서울 체육관',
  category: 'sports',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울특별시 중구',
  congestionLevel: 'low',
};

describe('facility actions', () => {
  it('http(s) 외의 외부 URL은 거부한다', () => {
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(getSafeExternalUrl('https://example.com')?.startsWith('https://')).toBe(true);
  });

  it('예약 URL과 카카오맵 길찾기 URL을 생성한다', () => {
    expect(
      getFacilityReservationUrl({ ...facility, reservationUrl: 'https://example.com/reserve' })
    ).toBe('https://example.com/reserve');
    expect(getKakaoDirectionsUrl(facility)).toContain('https://map.kakao.com/link/to/');
  });
});
