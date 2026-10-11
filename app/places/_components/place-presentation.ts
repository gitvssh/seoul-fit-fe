import { describePlace, type PublicPlaceCategory } from '@/shared/lib/seo/public-places';

export interface PlaceDetailRow {
  label: string;
  value: string;
}

export interface PlacePresentation {
  tags: string[];
  text: string | null;
  /** Labelled facts recovered from joined backend fields. */
  rows: PlaceDetailRow[];
}

const MAX_VISIBLE_TAGS = 3;

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Turns a backend description into badges, labelled rows and prose. The backend
 * joins two source fields with " · " for libraries (type · regular closing days)
 * and restaurants (signature menu · nearest subway); both are only labelled when
 * both halves are present, so nothing is guessed.
 */
export function presentPlace(
  category: PublicPlaceCategory,
  description: string | null
): PlacePresentation {
  const { tags, text } = describePlace(description ? stripHtml(description) : null);

  if (text?.includes(' · ')) {
    const [first, ...rest] = text.split(' · ');
    const remainder = rest.join(' · ');
    if (category === 'library') {
      return {
        tags: [first, ...tags],
        text: null,
        rows: [{ label: '정기 휴관일', value: remainder }],
      };
    }
    if (category === 'restaurant') {
      return {
        tags,
        text: null,
        rows: [
          { label: '대표 메뉴', value: first },
          { label: '가까운 지하철', value: remainder },
        ],
      };
    }
  }

  return { tags, text, rows: [] };
}

/** Cap badges for cards; the remainder is summarised as "+N". */
export function visibleTags(tags: string[]): { shown: string[]; hidden: number } {
  const shown = tags.slice(0, MAX_VISIBLE_TAGS);
  return { shown, hidden: tags.length - shown.length };
}

/** "2026-09-01T00:00:00" → "2026-09-01" for source-freshness notes. */
export function formatSourceDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
}
