import { CloudSun, Users, type LucideIcon } from 'lucide-react';
import type { FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import type { MessageKey } from '@/shared/i18n/messages';

/** Backend `InterestCategory` enum values. */
export type InterestCategory =
  | 'WEATHER'
  | 'CONGESTION'
  | 'SPORTS'
  | 'CULTURE'
  | 'CULTURAL_EVENT'
  | 'CULTURAL_RESERVATION'
  | 'RESTAURANTS'
  | 'LIBRARY'
  | 'PARK'
  | 'SUBWAY'
  | 'BIKE'
  | 'COOLING_SHELTER';

export interface InterestOption {
  key: InterestCategory;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  Icon: LucideIcon;
  /** Background class of the glyph disc. */
  color: string;
  /** Glyph colour class on that background. */
  glyphColor: string;
  isLocationBased: boolean;
  isRealtime: boolean;
}

function facilityOption(
  key: InterestCategory,
  category: FacilityCategory,
  flags: { isLocationBased: boolean; isRealtime: boolean }
): InterestOption {
  const config = FACILITY_CONFIGS[category];
  return {
    key,
    labelKey: `category.${category}`,
    descriptionKey: `categoryDescription.${category}`,
    Icon: config.Icon,
    color: config.color,
    glyphColor: config.glyph === 'ink' ? 'text-marker-ink' : 'text-primary-foreground',
    ...flags,
  };
}

/** Interest options in display order; facility ones reuse the map's category glyphs and colours. */
export const INTEREST_OPTIONS: readonly InterestOption[] = [
  {
    key: 'WEATHER',
    labelKey: 'profile.interest.weather',
    descriptionKey: 'profile.interestDescription.weather',
    Icon: CloudSun,
    color: 'bg-info',
    glyphColor: 'text-info-foreground',
    isLocationBased: false,
    isRealtime: true,
  },
  {
    key: 'CONGESTION',
    labelKey: 'profile.interest.congestion',
    descriptionKey: 'profile.interestDescription.congestion',
    Icon: Users,
    color: 'bg-live',
    glyphColor: 'text-live-foreground',
    isLocationBased: false,
    isRealtime: true,
  },
  facilityOption('CULTURAL_EVENT', 'cultural_event', { isLocationBased: true, isRealtime: true }),
  facilityOption('CULTURAL_RESERVATION', 'cultural_reservation', {
    isLocationBased: true,
    isRealtime: true,
  }),
  facilityOption('BIKE', 'bike', { isLocationBased: true, isRealtime: true }),
  facilityOption('SPORTS', 'sports', { isLocationBased: true, isRealtime: false }),
  facilityOption('CULTURE', 'culture', { isLocationBased: true, isRealtime: false }),
  facilityOption('RESTAURANTS', 'restaurant', { isLocationBased: true, isRealtime: false }),
  facilityOption('LIBRARY', 'library', { isLocationBased: true, isRealtime: false }),
  facilityOption('PARK', 'park', { isLocationBased: true, isRealtime: false }),
  facilityOption('SUBWAY', 'subway', { isLocationBased: false, isRealtime: false }),
  facilityOption('COOLING_SHELTER', 'cooling_shelter', {
    isLocationBased: false,
    isRealtime: false,
  }),
];

export const REALTIME_OPTIONS = INTEREST_OPTIONS.filter(option => option.isRealtime);
export const GENERAL_OPTIONS = INTEREST_OPTIONS.filter(option => !option.isRealtime);
