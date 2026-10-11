import type { Facility } from '@/lib/types';
import type { RecommendationPreset } from '../../model/types';
import {
  PRESET_ALLOWED_TRANSIT,
  PRESET_REQUIRED_CATEGORIES,
  getPresetRequiredCategories,
  isCategoryAllowedForPreset,
  isTransitCategory,
} from '../presets';
import { RECOMMENDATION_PRESETS, scoreFacility } from '../recommendation-engine';

const base: Facility = {
  id: 'f',
  name: '장소',
  category: 'park',
  position: { lat: 37.5665, lng: 126.978 },
  address: '서울',
  congestionLevel: 'low',
  operatingHours: '00:00~24:00',
};
const now = new Date(2026, 6, 25, 12, 0);

describe('recommendation presets', () => {
  it('lists the categories every visible preset needs to have loaded', () => {
    for (const preset of RECOMMENDATION_PRESETS) {
      const required = getPresetRequiredCategories(preset.id);
      expect(required.length).toBeGreaterThan(0);
      expect(required).toEqual(PRESET_REQUIRED_CATEGORIES[preset.id]);
      // 반환값은 복사본이라 호출부가 바꿔도 정의가 변하지 않는다.
      required.pop();
      expect(getPresetRequiredCategories(preset.id)).toEqual(PRESET_REQUIRED_CATEGORIES[preset.id]);
    }
    expect(getPresetRequiredCategories('none')).toEqual([]);
  });

  it('only requires categories the preset can actually recommend', () => {
    const presets = Object.keys(PRESET_REQUIRED_CATEGORIES) as RecommendationPreset[];
    for (const preset of presets) {
      for (const category of PRESET_REQUIRED_CATEGORIES[preset]) {
        expect(isCategoryAllowedForPreset(category, preset)).toBe(true);
      }
    }
  });

  it('rewards at least one required category with preset points for every situation', () => {
    for (const preset of RECOMMENDATION_PRESETS) {
      const best = Math.max(
        ...PRESET_REQUIRED_CATEGORIES[preset.id].map(category => {
          const facility: Facility =
            category === 'cultural_event'
              ? {
                  ...base,
                  category,
                  culturalEvent: {
                    id: 'e',
                    title: '행사',
                    description: '',
                    startDate: '2026-07-25',
                    endDate: '2026-07-25',
                    type: 'exhibition',
                    requiresReservation: false,
                  },
                }
              : { ...base, category };
          return scoreFacility(facility, { origin: base.position, now, preset: preset.id }).factors
            .preset;
        })
      );
      expect(best).toBeGreaterThan(0);
    }
  });

  it('treats subway and bike stations as transit with per-preset exceptions', () => {
    expect(isTransitCategory('subway')).toBe(true);
    expect(isTransitCategory('bike')).toBe(true);
    expect(isTransitCategory('park')).toBe(false);
    expect(PRESET_ALLOWED_TRANSIT.bike_trip).toEqual(['bike']);
    expect(isCategoryAllowedForPreset('subway', 'bike_trip')).toBe(false);
    expect(isCategoryAllowedForPreset('subway', 'none')).toBe(true);
    expect(isCategoryAllowedForPreset('subway', 'rainy_day')).toBe(false);
    expect(isCategoryAllowedForPreset('library', 'rainy_day')).toBe(true);
  });
});
