import { isSafeAppDeepLink, toEngagementPlaceRequest } from '../types';

describe('engagement types', () => {
  it('creates a backend-safe stable place key', () => {
    const request = toEngagementPlaceRequest({
      id: '서울 공원/1?lang=ko',
      category: 'park',
      name: '서울 공원',
      address: '서울시',
      position: { lat: 37.56, lng: 126.97 },
    });

    expect(request.placeKey).toMatch(/^[A-Za-z0-9:_-]+$/);
    expect(request.placeKey).toBe(
      toEngagementPlaceRequest({
        id: '서울 공원/1?lang=ko',
        category: 'park',
        name: '서울 공원',
        address: '서울시',
        position: { lat: 37.56, lng: 126.97 },
      }).placeKey
    );
  });

  it('allows only same-origin relative deep links', () => {
    expect(isSafeAppDeepLink('/?lat=37.5&lng=127')).toBe(true);
    expect(isSafeAppDeepLink('//evil.example')).toBe(false);
    expect(isSafeAppDeepLink('https://evil.example')).toBe(false);
  });
});
