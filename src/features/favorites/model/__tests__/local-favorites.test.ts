import type { Facility } from '@/lib/types';
import {
  getFacilityFavoriteKey,
  parseLocalFavorites,
  toggleLocalFavorite,
} from '../local-favorites';

const facility: Facility = {
  id: 'library-1',
  name: '서울 도서관',
  category: 'library',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울특별시 중구',
  congestionLevel: 'low',
};

describe('local favorites', () => {
  it('시설 카테고리와 ID로 충돌 없는 키를 만든다', () => {
    expect(getFacilityFavoriteKey(facility)).toBe('library:library-1');
  });

  it('추가와 제거를 토글한다', () => {
    const added = toggleLocalFavorite(facility, []);
    expect(added.isFavorite).toBe(true);
    expect(added.favorites).toHaveLength(1);

    const removed = toggleLocalFavorite(facility, added.favorites);
    expect(removed.isFavorite).toBe(false);
    expect(removed.favorites).toHaveLength(0);
  });

  it('손상되거나 잘못된 저장값을 무시한다', () => {
    expect(parseLocalFavorites('{')).toEqual([]);
    expect(parseLocalFavorites('[{\"key\":\"incomplete\"}]')).toEqual([]);
  });
});
