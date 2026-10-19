import { getBackendInternalUrl } from '@/config/environment';
import type { FacilityCategory } from '@/lib/types';

interface PublicPlaceCategoryDefinition {
  slug: string;
  label: string;
  description: string;
  /** Whether list/detail pages may be indexed and listed in the sitemap. */
  indexable: boolean;
  /** Matching map category, used for the category glyph and colour. */
  facilityCategory: FacilityCategory;
}

export const PUBLIC_PLACE_CATEGORIES = [
  {
    slug: 'park',
    label: '공원',
    description: '서울의 공원과 휴식 공간',
    indexable: true,
    facilityCategory: 'park',
  },
  {
    slug: 'library',
    label: '도서관',
    description: '서울시 공공도서관 정보',
    indexable: true,
    facilityCategory: 'library',
  },
  {
    slug: 'restaurant',
    label: '맛집',
    description: '서울 관광 음식점 정보',
    indexable: true,
    facilityCategory: 'restaurant',
  },
  {
    slug: 'cultural-event',
    label: '문화행사',
    description: '서울에서 열리는 공연·전시·행사',
    indexable: false,
    facilityCategory: 'cultural_event',
  },
  {
    slug: 'cultural-reservation',
    label: '문화예약',
    description: '서울시 공공 문화 프로그램 예약',
    indexable: false,
    facilityCategory: 'cultural_reservation',
  },
  {
    slug: 'cooling-center',
    label: '무더위쉼터',
    description: '폭염 시 이용할 수 있는 서울시 무더위쉼터',
    indexable: false,
    facilityCategory: 'cooling_shelter',
  },
] as const satisfies readonly PublicPlaceCategoryDefinition[];

export type PublicPlaceCategory = (typeof PUBLIC_PLACE_CATEGORIES)[number]['slug'];

export interface PublicPlaceSummary {
  id: number;
  category: PublicPlaceCategory;
  categoryLabel: string;
  name: string;
  address: string | null;
  description: string | null;
}

/** Items dropped from a page while normalising it. */
export interface PublicPlacePageRemoved {
  /** Rows that repeated an id already on the page. */
  duplicates: number;
  /** Facilities whose name is prefixed with a closure marker such as "[폐관]". */
  closed: number;
}

export interface PublicPlacePage {
  content: PublicPlaceSummary[];
  page: number;
  size: number;
  /**
   * Backend row count. It counts index rows, not unique places, so it is only
   * trustworthy when `removed.duplicates` is 0 (see `normalizePublicPlacePage`).
   */
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  removed: PublicPlacePageRemoved;
}

/** Raw backend page before normalisation. */
export type PublicPlacePageResponse = Omit<PublicPlacePage, 'removed'>;

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

/** Thrown when the backend is reachable but failed, so pages can show a retry state instead of a 404. */
export class PublicPlaceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicPlaceUnavailableError';
  }
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

/** Deep link that opens the same place on the map (`/?place=<category>:<id>`). */
export function getPublicPlaceMapHref(place: Pick<PublicPlace, 'category' | 'id'>): string {
  return `/?place=${place.category}:${place.id}`;
}

const CLOSED_PREFIX = /^\s*[[［(（【]\s*(폐관|페관|휴관|폐원|폐업|휴업|폐쇄)\s*[\]］)）】]\s*/;

export interface ClosedPlaceName {
  /** Normalised closure label, e.g. "폐관" (also for the data typo "페관") or "휴관". */
  status: string | null;
  /** Name without the closure marker. */
  name: string;
}

/**
 * Source data marks closed facilities inside the name ("[폐관] 송중문화정보도서관").
 * Lists hide them; detail pages keep them reachable with a status badge.
 */
export function parseClosedPlaceName(name: string): ClosedPlaceName {
  const match = CLOSED_PREFIX.exec(name);
  if (!match) return { status: null, name: name.trim() };
  const word = match[1] === '페관' ? '폐관' : match[1];
  return { status: word, name: name.slice(match[0].length).trim() || name.trim() };
}

export function isClosedPlaceName(name: string): boolean {
  return parseClosedPlaceName(name).status !== null;
}

const MAX_TAG_LENGTH = 20;
const MAX_TAGS = 8;

/**
 * Some descriptions are raw comma-separated tags ("특정계층이용시설,회원이용시설").
 * Returns the tags when the whole value looks like a short tag list, otherwise [].
 */
export function splitPlaceTags(value: string | null | undefined): string[] {
  if (!value?.includes(',')) return [];
  const parts = value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > MAX_TAGS) return [];
  if (parts.some(part => part.length > MAX_TAG_LENGTH)) return [];
  return Array.from(new Set(parts));
}

export interface PlaceDescription {
  tags: string[];
  text: string | null;
}

/**
 * Splits a backend description into badge-able tags and remaining prose. The
 * backend joins fields with " · ", so each segment is classified on its own.
 */
export function describePlace(value: string | null | undefined): PlaceDescription {
  if (!value) return { tags: [], text: null };
  const tags: string[] = [];
  const texts: string[] = [];
  for (const segment of value.split(' · ')) {
    const segmentTags = splitPlaceTags(segment);
    if (segmentTags.length > 0) tags.push(...segmentTags);
    else if (segment.trim()) texts.push(segment.trim());
  }
  return { tags: Array.from(new Set(tags)), text: texts.length > 0 ? texts.join(' · ') : null };
}

const countFormatter = new Intl.NumberFormat('ko-KR');

/** "8000" → "8,000" */
export function formatPlaceCount(value: number): string {
  return countFormatter.format(value);
}

/**
 * The backend pages the POI search index, which can hold several rows for one
 * source record (each index sync inserts again; `poi_search_index` has no
 * unique key on ref_table + ref_id). The live list showed every library twice.
 * Pages are therefore de-duplicated by stable id here, and closed facilities are
 * dropped from lists. `removed` lets the page decide whether the backend total
 * can still be shown.
 */
export function normalizePublicPlacePage(raw: PublicPlacePageResponse): PublicPlacePage {
  const seen = new Set<string>();
  const removed: PublicPlacePageRemoved = { duplicates: 0, closed: 0 };
  const content: PublicPlaceSummary[] = [];

  for (const place of raw.content) {
    const key = `${place.category}:${place.id}`;
    if (seen.has(key)) {
      removed.duplicates += 1;
      continue;
    }
    seen.add(key);
    if (isClosedPlaceName(place.name)) {
      removed.closed += 1;
      continue;
    }
    content.push(place);
  }

  return {
    content,
    page: raw.page,
    size: raw.size,
    totalElements: raw.totalElements,
    totalPages: raw.totalPages,
    hasNext: raw.hasNext,
    removed,
  };
}

interface RequestOptions {
  /** Swallow failures and return null (sitemap must stay valid when the backend is down). */
  lenient?: boolean;
}

/**
 * Returns `null` only when the backend answers 404. Other failures throw
 * `PublicPlaceUnavailableError` so the route's error boundary can offer a retry
 * instead of telling users and crawlers the page does not exist.
 */
async function requestPublicData<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(`${getBackendInternalUrl()}${path}`, {
      next: { revalidate: 60 * 60 },
    });
  } catch (error) {
    console.error('[public-place] backend request failed', error);
    if (options.lenient) return null;
    throw new PublicPlaceUnavailableError('backend unreachable');
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    console.error('[public-place] backend responded', response.status, path);
    if (options.lenient) return null;
    throw new PublicPlaceUnavailableError(`backend responded ${response.status}`);
  }

  return (await response.json()) as T;
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
  const raw = await requestPublicData<PublicPlacePageResponse>(`/api/public/places?${query}`);
  return raw ? normalizePublicPlacePage(raw) : null;
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
  const entries = await requestPublicData<PublicPlaceSitemapEntry[]>(
    `/api/public/places/sitemap?category=${category}`,
    { lenient: true }
  );
  return entries ?? [];
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
