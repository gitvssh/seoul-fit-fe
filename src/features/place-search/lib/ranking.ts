/**
 * 장소 검색 순위 규칙. `useSearchCache`의 `search()`가 이 모듈로 후보를 고르고 정렬한다.
 *
 * 점수(높을수록 먼저):
 *   정확 일치 3 > 접두 일치 2.5 > 단어·구간 시작 일치 2 > 부분 일치 1.5 > 초성·자모 일치 1
 * 비교 대상은 이름, 별칭(aliases), 주소 구간이고 같은 점수면
 *   이름 > 별칭 > 주소 → 카테고리 우선순위(지하철·도서관·공원·행사 … 따릉이 …) → 짧은 이름
 * 순으로 앞선다.
 *
 * 초성·자모 일치는 검색어 자체에 자모(ㄱ-ㅎ, ㅏ-ㅣ)가 있을 때만 시도한다. 완성형 검색어("남산")를
 * 초성으로 바꿔 비교하면 낙성대·녹사평처럼 무관한 역이 섞이기 때문이다.
 * 지하철역은 역 이름의 비퍼지(정확·접두·단어·부분) 일치만 인정한다. 역 데이터에는 주소가 없어
 * 서울 안팎을 가릴 수 없고, 퍼지 일치로 끌려오던 경기도 역(오이도·구리 등)을 이 규칙이 막는다.
 *
 * es-hangul은 첫 검색에서 `loadHangul()`로 지연 적재해 초기 번들에 넣지 않는다.
 */
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';

export interface HangulModule {
  getChoseong: (word: string, options?: { keepNonHangul?: boolean }) => string;
  disassemble: (text: string) => string;
}

export const MATCH_TIER = {
  EXACT: 3,
  PREFIX: 2.5,
  WORD_START: 2,
  SUBSTRING: 1.5,
  JAMO: 1,
} as const;
export type MatchTier = (typeof MATCH_TIER)[keyof typeof MATCH_TIER];

export type SearchFieldKind = 'name' | 'alias' | 'address';
const FIELD_RANK: Record<SearchFieldKind, number> = { name: 0, alias: 1, address: 2 };

/** 동점일 때의 카테고리 순서. 도서관·공원·행사가 따릉이보다 앞선다. */
export const CATEGORY_PRIORITY: Record<SearchItem['category'], number> = {
  subway: 1,
  library: 2,
  park: 3,
  cultural_event: 4,
  cultural_reservation: 5,
  bike: 6,
  cooling_center: 7,
  restaurant: 8,
};

/** 카테고리 자체를 뜻하는 검색어. 이 말로 검색하면 그 카테고리 항목을 한 단계 올린다(규칙 칩과 별개). */
export const CATEGORY_KEYWORDS: Record<SearchItem['category'], readonly string[]> = {
  subway: ['지하철', '지하철역', 'subway'],
  library: ['도서관', 'library'],
  park: ['공원', 'park'],
  cultural_event: ['문화행사', '행사', '공연', '전시', 'event'],
  cultural_reservation: ['문화예약', '예약', 'reservation'],
  bike: ['따릉이', '자전거', 'bike'],
  cooling_center: ['무더위쉼터', '쉼터', 'shelter'],
  restaurant: ['맛집', '음식점', '식당', 'restaurant'],
};
const CATEGORY_BOOST = 1;

/** 정규화된 검색어가 해당 카테고리를 가리키는 말과 정확히 같은지 */
export function matchesCategoryKeyword(
  category: SearchItem['category'],
  normalizedQuery: string
): boolean {
  if (normalizedQuery.length < 2) return false;
  return CATEGORY_KEYWORDS[category].some(
    keyword => normalizeText(keyword).text === normalizedQuery
  );
}

export interface SearchField {
  kind: SearchFieldKind;
  text: string;
  normalized: string;
}

export interface SearchEntry {
  item: SearchItem;
  fields: SearchField[];
  /** 초성·자모 일치 허용 여부. 지하철역은 false다. */
  fuzzy: boolean;
}

/** 원문 `text` 기준 `[start, end)` 구간과 점수 */
export interface TextMatch {
  tier: MatchTier;
  start: number;
  end: number;
}

export interface NormalizedText {
  text: string;
  /** 정규화된 i번째 글자의 원문 인덱스 */
  map: number[];
}

export type QueryKind = 'plain' | 'choseong' | 'jamo';

export interface PreparedQuery {
  normalized: string;
  kind: QueryKind;
  /** 초성 검색어는 그대로, 자모 섞인 검색어는 분해한 문자열. 퍼지 불가면 null */
  fuzzyNeedle: string | null;
}

let hangulModule: HangulModule | null = null;
let hangulPromise: Promise<HangulModule> | null = null;

/** 이미 적재된 es-hangul 래퍼. 적재 전이면 null이며 그동안은 비퍼지 일치만 동작한다. */
export function getLoadedHangul(): HangulModule | null {
  return hangulModule;
}

/** es-hangul을 지연 적재한다. 같은 Promise를 재사용하므로 여러 번 불러도 한 번만 내려받는다. */
export function loadHangul(): Promise<HangulModule> {
  if (hangulModule) return Promise.resolve(hangulModule);
  hangulPromise ??= import('es-hangul')
    .then(mod => {
      hangulModule = { getChoseong: mod.getChoseong, disassemble: mod.disassemble };
      return hangulModule;
    })
    .catch(error => {
      hangulPromise = null;
      throw error;
    });
  return hangulPromise;
}

const SEPARATOR = /[\s\-_.,·()[\]'"“”‘’!?/]/;
const CHOSEONG_ONLY = /^[ㄱ-ㅎ]+$/;
const HAS_JAMO = /[ㄱ-ㅎㅏ-ㅣ]/;

/** 공백·구두점을 걷어내고 소문자로 만든다. `map`으로 원문 위치를 되찾는다. */
export function normalizeText(input: string): NormalizedText {
  let text = '';
  const map: number[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (SEPARATOR.test(char)) continue;
    const lower = char.toLowerCase();
    text += lower.length === 1 ? lower : char;
    map.push(index);
  }
  return { text, map };
}

export function classifyQuery(normalizedQuery: string): QueryKind {
  if (CHOSEONG_ONLY.test(normalizedQuery)) return 'choseong';
  if (HAS_JAMO.test(normalizedQuery)) return 'jamo';
  return 'plain';
}

export function prepareQuery(query: string, hangul: HangulModule | null): PreparedQuery | null {
  const normalized = normalizeText(query).text;
  if (!normalized) return null;
  const kind = classifyQuery(normalized);
  let fuzzyNeedle: string | null = null;
  if (hangul && kind === 'choseong') fuzzyNeedle = normalized;
  else if (hangul && kind === 'jamo') fuzzyNeedle = hangul.disassemble(normalized) || null;
  return { normalized, kind, fuzzyNeedle };
}

/** 글자 단위 초성 문자열. 한글이 아닌 글자는 그대로 두어 길이를 보존한다. */
function toChoseongText(text: string, hangul: HangulModule): string {
  let out = '';
  for (const char of text.split('')) {
    const choseong = hangul.getChoseong(char, { keepNonHangul: true });
    out += choseong.length === 1 ? choseong : char;
  }
  return out;
}

/** 글자별 자모 분해 문자열과 각 글자의 시작 오프셋 */
function toJamoText(text: string, hangul: HangulModule): { jamo: string; offsets: number[] } {
  let jamo = '';
  const offsets: number[] = [];
  // Offsets use UTF-16 units, matching normalizeText and the source index map.
  for (const char of text.split('')) {
    offsets.push(jamo.length);
    jamo += hangul.disassemble(char) || char;
  }
  return { jamo, offsets };
}

function charIndexAt(offsets: number[], jamoIndex: number): number {
  let charIndex = 0;
  for (let index = 0; index < offsets.length && offsets[index] <= jamoIndex; index += 1) {
    charIndex = index;
  }
  return charIndex;
}

interface DirectMatch {
  tier: MatchTier;
  index: number;
}

function matchDirect(normalized: NormalizedText, query: string): DirectMatch | null {
  if (normalized.text === query) return { tier: MATCH_TIER.EXACT, index: 0 };
  const index = normalized.text.indexOf(query);
  if (index < 0) return null;
  if (index === 0) return { tier: MATCH_TIER.PREFIX, index };
  // 정규화에서 구분자가 빠졌다면 원문 인덱스가 건너뛴다 → 단어·구간의 시작
  const wordStart = normalized.map[index] - normalized.map[index - 1] > 1;
  return { tier: wordStart ? MATCH_TIER.WORD_START : MATCH_TIER.SUBSTRING, index };
}

function matchFuzzy(
  normalizedText: string,
  query: PreparedQuery,
  hangul: HangulModule
): { index: number; length: number } | null {
  if (!query.fuzzyNeedle) return null;
  if (query.kind === 'choseong') {
    const index = toChoseongText(normalizedText, hangul).indexOf(query.fuzzyNeedle);
    return index < 0 ? null : { index, length: query.fuzzyNeedle.length };
  }
  const { jamo, offsets } = toJamoText(normalizedText, hangul);
  const index = jamo.indexOf(query.fuzzyNeedle);
  if (index < 0) return null;
  const start = charIndexAt(offsets, index);
  const end = charIndexAt(offsets, index + query.fuzzyNeedle.length - 1) + 1;
  return { index: start, length: end - start };
}

function toRange(normalized: NormalizedText, index: number, length: number) {
  return { start: normalized.map[index], end: normalized.map[index + length - 1] + 1 };
}

/**
 * 화면 강조용 일치 구간. 순위 계산과 같은 규칙을 쓰므로 목록의 `<mark>`가 점수와 어긋나지 않는다.
 * `fuzzy: false`면 초성·자모 일치를 건너뛴다(지하철역).
 */
export function matchText(
  text: string,
  query: string,
  options: { hangul?: HangulModule | null; fuzzy?: boolean } = {}
): TextMatch | null {
  const hangul = options.hangul ?? null;
  const prepared = prepareQuery(query, hangul);
  if (!prepared) return null;
  const normalized = normalizeText(text);
  const direct = matchDirect(normalized, prepared.normalized);
  if (direct) {
    return { tier: direct.tier, ...toRange(normalized, direct.index, prepared.normalized.length) };
  }
  if (options.fuzzy === false || !hangul) return null;
  const fuzzy = matchFuzzy(normalized.text, prepared, hangul);
  return fuzzy
    ? { tier: MATCH_TIER.JAMO, ...toRange(normalized, fuzzy.index, fuzzy.length) }
    : null;
}

// 검색마다 3만 건을 다시 분해하지 않도록 필드 객체별로 초성·자모 문자열을 기억한다.
const choseongCache = new WeakMap<SearchField, string>();
const jamoCache = new WeakMap<SearchField, string>();

function fuzzyIncludes(field: SearchField, query: PreparedQuery, hangul: HangulModule): boolean {
  if (!query.fuzzyNeedle) return false;
  if (query.kind === 'choseong') {
    let choseong = choseongCache.get(field);
    if (choseong === undefined) {
      choseong = toChoseongText(field.normalized, hangul);
      choseongCache.set(field, choseong);
    }
    return choseong.includes(query.fuzzyNeedle);
  }
  let jamo = jamoCache.get(field);
  if (jamo === undefined) {
    jamo = toJamoText(field.normalized, hangul).jamo;
    jamoCache.set(field, jamo);
  }
  return jamo.includes(query.fuzzyNeedle);
}

function scoreField(
  field: SearchField,
  query: PreparedQuery,
  fuzzy: boolean,
  hangul: HangulModule | null
): number {
  if (field.normalized === query.normalized) return MATCH_TIER.EXACT;
  const index = field.normalized.indexOf(query.normalized);
  if (index === 0) return MATCH_TIER.PREFIX;
  if (index > 0) {
    const { map } = normalizeText(field.text);
    return map[index] - map[index - 1] > 1 ? MATCH_TIER.WORD_START : MATCH_TIER.SUBSTRING;
  }
  if (!fuzzy || !hangul) return 0;
  return fuzzyIncludes(field, query, hangul) ? MATCH_TIER.JAMO : 0;
}

interface ScoredEntry {
  entry: SearchEntry;
  tier: number;
  fieldRank: number;
}

function scoreEntry(
  entry: SearchEntry,
  query: PreparedQuery,
  hangul: HangulModule | null
): ScoredEntry | null {
  let best: ScoredEntry | null = null;
  for (const field of entry.fields) {
    const tier = scoreField(field, query, entry.fuzzy, hangul);
    if (tier === 0) continue;
    const fieldRank = FIELD_RANK[field.kind];
    if (!best || tier > best.tier || (tier === best.tier && fieldRank < best.fieldRank)) {
      best = { entry, tier, fieldRank };
    }
    if (best.tier === MATCH_TIER.EXACT && best.fieldRank === 0) break;
  }
  if (best && matchesCategoryKeyword(entry.item.category, query.normalized)) {
    return { ...best, tier: best.tier + CATEGORY_BOOST };
  }
  return best;
}

function compareScored(a: ScoredEntry, b: ScoredEntry): number {
  const aItem = a.entry.item;
  const bItem = b.entry.item;
  return (
    b.tier - a.tier ||
    a.fieldRank - b.fieldRank ||
    (CATEGORY_PRIORITY[aItem.category] ?? 9) - (CATEGORY_PRIORITY[bItem.category] ?? 9) ||
    aItem.name.length - bItem.name.length ||
    aItem.name.localeCompare(bItem.name, 'ko')
  );
}

const splitSegments = (value?: string): string[] =>
  value
    ? value
        .split(',')
        .map(segment => segment.trim())
        .filter(Boolean)
    : [];

const toField = (kind: SearchFieldKind, text: string): SearchField => ({
  kind,
  text,
  normalized: normalizeText(text).text,
});

/** 검색 항목을 한 번만 정규화해 둔다. 지하철역은 이름만 비교하고 퍼지 일치를 끈다. */
export function prepareSearchEntry(item: SearchItem): SearchEntry {
  const isSubway = item.category === 'subway';
  const fields: SearchField[] = [toField('name', String(item.name ?? ''))];
  if (!isSubway) {
    for (const alias of splitSegments(item.aliases)) fields.push(toField('alias', alias));
    for (const segment of splitSegments(item.address)) fields.push(toField('address', segment));
  }
  return { item, fields: fields.filter(field => field.normalized), fuzzy: !isSubway };
}

export interface RankOptions {
  limit?: number;
  hangul?: HangulModule | null;
  /** 한 카테고리가 목록을 독점하지 않도록 상위 N건 안에서 카테고리당 허용하는 최대 건수. 기본은 limit의 40%(최소 3). */
  maxPerCategory?: number;
}

/** 점수순을 유지하되 카테고리당 상한을 넘긴 항목은 뒤로 미룬다. 자리가 남으면 미룬 항목으로 채운다. */
function diversify(scored: ScoredEntry[], limit: number, maxPerCategory: number): ScoredEntry[] {
  const picked: ScoredEntry[] = [];
  const deferred: ScoredEntry[] = [];
  const counts = new Map<SearchItem['category'], number>();
  for (const result of scored) {
    if (picked.length >= limit) break;
    const category = result.entry.item.category;
    const count = counts.get(category) ?? 0;
    if (count < maxPerCategory) {
      picked.push(result);
      counts.set(category, count + 1);
    } else {
      deferred.push(result);
    }
  }
  return picked.concat(deferred).slice(0, limit);
}

/** 검색어에 맞는 항목을 점수순으로 돌려준다. `limit`은 상위 N건 (기본 10). */
export function rankSearchEntries(
  entries: SearchEntry[],
  query: string,
  options: RankOptions = {}
): SearchItem[] {
  const hangul = options.hangul ?? null;
  const prepared = prepareQuery(query, hangul);
  if (!prepared) return [];
  const scored: ScoredEntry[] = [];
  for (const entry of entries) {
    const result = scoreEntry(entry, prepared, hangul);
    if (result) scored.push(result);
  }
  scored.sort(compareScored);
  const limit = options.limit ?? 10;
  const maxPerCategory = options.maxPerCategory ?? Math.max(3, Math.ceil(limit * 0.4));
  return diversify(scored, limit, maxPerCategory).map(result => result.entry.item);
}
