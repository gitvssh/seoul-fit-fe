import { getBackendInternalUrl } from '@/config/environment';

export const PUBLIC_PLACE_CATEGORIES = [
  { slug: 'park', label: '공원', description: '서울의 공원과 휴식 공간', indexable: true },
  { slug: 'library', label: '도서관', description: '서울시 공공도서관 정보', indexable: true },
  { slug: 'restaurant', label: '맛집', description: '서울 관광 음식점 정보', indexable: true },
  {
    slug: 'cultural-event',
    label: '문화행사',
    description: '서울에서 열리는 공연·전시·행사',
    indexable: false,
  },
  {
    slug: 'cultural-reservation',
    label: '문화예약',
    description: '서울시 공공 문화 프로그램 예약',
    indexable: false,
  },
  {
    slug: 'cooling-center',
    label: '무더위쉼터',
    description: '폭염 시 이용할 수 있는 서울시 무더위쉼터',
    indexable: false,
  },
] as const;

export type PublicPlaceCategory = (typeof PUBLIC_PLACE_CATEGORIES)[number]['slug'];

export interface PublicPlaceSummary {
  id: number;
  category: PublicPlaceCategory;
  categoryLabel: string;
  name: string;
  address: string | null;
  description: string | null;
}

export interface PublicPlacePage {
  content: PublicPlaceSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PublicPlace {
  id: number;
  category: PublicPlaceCategory;
  categoryLabel: string;
  name: string;
  address: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  eventStart: string | null;
  eventEnd: string | null;
  reservable: boolean | null;
  lastModified: string | null;
}

interface PublicPlaceSitemapEntry {
  id: number;
  lastModified: string | null;
}

export function isPublicPlaceCategory(value: string): value is PublicPlaceCategory {
  return PUBLIC_PLACE_CATEGORIES.some(category => category.slug === value);
}

export function getPublicPlaceCategory(value: string) {
  return PUBLIC_PLACE_CATEGORIES.find(category => category.slug === value);
}

export function getPublicPlacePath(category: PublicPlaceCategory, id: number): string {
  return `/places/${category}/${id}`;
}

async function requestPublicData<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getBackendInternalUrl()}${path}`, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('[public-place] backend request failed', error);
    return null;
  }
}

export async function getPublicPlacePage(
  category: PublicPlaceCategory,
  page = 0,
  size = 24
): Promise<PublicPlacePage | null> {
  const query = new URLSearchParams({
    category,
    page: String(Math.max(0, page)),
    size: String(size),
  });
  return requestPublicData<PublicPlacePage>(`/api/public/places?${query}`);
}

export async function getPublicPlace(
  category: PublicPlaceCategory,
  id: number
): Promise<PublicPlace | null> {
  return requestPublicData<PublicPlace>(`/api/public/places/${category}/${id}`);
}

export async function getPublicPlaceSitemapEntries(
  category: PublicPlaceCategory
): Promise<PublicPlaceSitemapEntry[]> {
  return (
    (await requestPublicData<PublicPlaceSitemapEntry[]>(
      `/api/public/places/sitemap?category=${category}`
    )) ?? []
  );
}

export function externalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
