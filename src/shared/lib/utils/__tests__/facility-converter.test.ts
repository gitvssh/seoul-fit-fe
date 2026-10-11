import { convertLibraryToFacility, resolveSeoulLatLng } from '../facility-converter';

describe('resolveSeoulLatLng', () => {
  it('accepts lat/lng in the natural order', () => {
    expect(resolveSeoulLatLng(37.5675, 126.9655)).toEqual({ lat: 37.5675, lng: 126.9655 });
  });

  it('swaps the axes when the pair arrives as lng/lat', () => {
    expect(resolveSeoulLatLng(126.9655, 37.5675)).toEqual({ lat: 37.5675, lng: 126.9655 });
  });

  it('rejects values outside the Korean range and non-numbers', () => {
    expect(resolveSeoulLatLng(0, 0)).toBeNull();
    expect(resolveSeoulLatLng('x', 126.9)).toBeNull();
    // 축 판별만 담당한다. 서울 밖 여부는 convertLibraryToFacility가 isValidSeoulCoordinate로 거른다.
    expect(resolveSeoulLatLng(35.1, 129.0)).toEqual({ lat: 35.1, lng: 129.0 });
  });
});

describe('convertLibraryToFacility', () => {
  it('maps a backend library row whose xcnts is latitude', () => {
    const facility = convertLibraryToFacility(
      {
        id: 17930,
        lbrryName: '4.19혁명기념도서관',
        adres: '서울특별시 종로구 새문안로 17',
        xcnts: 37.5675109,
        ydnts: 126.9655318,
        opTime: '평일 : 08:00~22:00',
      },
      0
    );
    expect(facility).not.toBeNull();
    expect(facility?.position).toEqual({ lat: 37.5675109, lng: 126.9655318 });
    expect(facility?.category).toBe('library');
    expect(facility?.name).toBe('4.19혁명기념도서관');
  });

  it('returns null without usable coordinates', () => {
    expect(convertLibraryToFacility({ lbrryName: '좌표 없음' }, 1)).toBeNull();
    expect(
      convertLibraryToFacility({ lbrryName: '엉뚱한 좌표', xcnts: 0, ydnts: 0 }, 2)
    ).toBeNull();
    expect(
      convertLibraryToFacility({ lbrryName: '부산 좌표', xcnts: 35.1, ydnts: 129.0 }, 3)
    ).toBeNull();
  });
});
