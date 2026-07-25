import type { Facility } from '@/lib/types';

export const LOCAL_FAVORITES_STORAGE_KEY = 'seoul-fit.local-favorites.v1';
const MAX_LOCAL_FAVORITES = 100;

export interface LocalFavorite {
  key: string;
  facilityId: string;
  category: Facility['category'];
  name: string;
  address: string;
  position: Facility['position'];
  savedAt: string;
}

export function getFacilityFavoriteKey(
  facility: Pick<Facility, 'id' | 'category'>
): string {
  return `${facility.category}:${facility.id}`;
}

function isLocalFavorite(value: unknown): value is LocalFavorite {
  if (!value || typeof value !== 'object') return false;
  const favorite = value as Partial<LocalFavorite>;
  return Boolean(
    typeof favorite.key === 'string' &&
      typeof favorite.facilityId === 'string' &&
      typeof favorite.category === 'string' &&
      typeof favorite.name === 'string' &&
      typeof favorite.address === 'string' &&
      typeof favorite.position?.lat === 'number' &&
      Number.isFinite(favorite.position.lat) &&
      typeof favorite.position?.lng === 'number' &&
      Number.isFinite(favorite.position.lng) &&
      typeof favorite.savedAt === 'string'
  );
}

export function parseLocalFavorites(serialized: string | null): LocalFavorite[] {
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalFavorite).slice(0, MAX_LOCAL_FAVORITES);
  } catch {
    return [];
  }
}

export function readLocalFavorites(): LocalFavorite[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseLocalFavorites(window.localStorage.getItem(LOCAL_FAVORITES_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeLocalFavorites(favorites: LocalFavorite[]): void {
  window.localStorage.setItem(
    LOCAL_FAVORITES_STORAGE_KEY,
    JSON.stringify(favorites.slice(0, MAX_LOCAL_FAVORITES))
  );
}

export function toggleLocalFavorite(
  facility: Facility,
  currentFavorites = readLocalFavorites()
): { favorites: LocalFavorite[]; isFavorite: boolean } {
  const key = getFacilityFavoriteKey(facility);
  const exists = currentFavorites.some(favorite => favorite.key === key);
  if (exists) {
    return {
      favorites: currentFavorites.filter(favorite => favorite.key !== key),
      isFavorite: false,
    };
  }

  const favorite: LocalFavorite = {
    key,
    facilityId: String(facility.id),
    category: facility.category,
    name: facility.name,
    address: facility.address,
    position: facility.position,
    savedAt: new Date().toISOString(),
  };
  return {
    favorites: [favorite, ...currentFavorites].slice(0, MAX_LOCAL_FAVORITES),
    isFavorite: true,
  };
}
