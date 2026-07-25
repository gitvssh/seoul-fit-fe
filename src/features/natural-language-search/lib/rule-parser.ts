import type { FacilityCategory } from '@/lib/types';
import type { NaturalLanguageSearchRule } from '../model/types';

const CATEGORY_RULES: Array<{
  category: FacilityCategory;
  pattern: RegExp;
  label: string;
  labelEn: string;
}> = [
  { category: 'library', pattern: /도서관|책|library|book/i, label: '도서관', labelEn: 'Library' },
  { category: 'park', pattern: /공원|산책|park|walk/i, label: '공원', labelEn: 'Park' },
  { category: 'restaurant', pattern: /맛집|식당|음식|restaurant|food/i, label: '맛집', labelEn: 'Restaurant' },
  { category: 'sports', pattern: /체육|운동|스포츠|sports|workout/i, label: '체육시설', labelEn: 'Sports' },
  { category: 'subway', pattern: /지하철|역\b|subway|metro/i, label: '지하철', labelEn: 'Subway' },
  { category: 'bike', pattern: /따릉이|자전거|bike|bicycle/i, label: '따릉이', labelEn: 'Seoul Bike' },
  {
    category: 'cooling_shelter',
    pattern: /무더위|쉼터|더위\s*피|cool(?:ing)?\s*(?:center|shelter)/i,
    label: '무더위쉼터',
    labelEn: 'Cooling shelter',
  },
  {
    category: 'cultural_event',
    pattern: /행사|축제|공연|전시|event|festival|performance/i,
    label: '문화행사',
    labelEn: 'Cultural event',
  },
  {
    category: 'cultural_reservation',
    pattern: /문화\s*예약|강좌|체험|class|program/i,
    label: '문화예약',
    labelEn: 'Program',
  },
  {
    category: 'culture',
    pattern: /문화\s*(?:공간|시설)|미술관|박물관|culture|museum|gallery/i,
    label: '문화시설',
    labelEn: 'Culture',
  },
];

function parseDistanceKm(input: string): number | null {
  const match = input.match(/(\d+(?:\.\d+)?)\s*(km|킬로미터|킬로|m|미터)\s*(?:이내|안|내|near)?/i);
  if (!match) {
    return /가까운|근처|nearby|near me/i.test(input) ? 2 : null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const kilometers = /^(m|미터)$/i.test(match[2]) ? value / 1000 : value;
  return Math.min(10, Math.max(0.1, kilometers));
}

export function parseNaturalLanguageSearch(input: string): NaturalLanguageSearchRule {
  const normalized = input.trim();
  const categories: FacilityCategory[] = [];
  const labels: string[] = [];
  const labelsEn: string[] = [];
  const matchedRuleCodes: string[] = [];

  for (const rule of CATEGORY_RULES) {
    if (!rule.pattern.test(normalized)) continue;
    categories.push(rule.category);
    labels.push(rule.label);
    labelsEn.push(rule.labelEn);
    matchedRuleCodes.push(`category_${rule.category}`);
  }

  if (/아이와|가족|어린이|with\s*(?:kids|family)/i.test(normalized)) {
    for (const category of ['park', 'library', 'culture'] as FacilityCategory[]) {
      if (!categories.includes(category)) categories.push(category);
    }
    labels.push('가족 활동');
    labelsEn.push('Family activity');
    matchedRuleCodes.push('intent_family');
  }

  const openOnly = /지금\s*(?:여는|열린|갈|가능)|운영\s*중|open\s*now|available\s*now/i.test(
    normalized
  );
  const reservableOnly = /예약\s*가능|예매\s*가능|reservable|bookable/i.test(normalized);
  const indoorOnly = /실내|비\s*(?:오는|올)|indoor|rainy|rain\s*day/i.test(normalized);
  const lowCongestionOnly = /한산|조용|덜\s*붐|여유|quiet|not\s*crowded/i.test(normalized);
  const maxDistanceKm = parseDistanceKm(normalized);

  if (openOnly) {
    labels.push('지금 운영');
    labelsEn.push('Open now');
    matchedRuleCodes.push('open_now');
  }
  if (reservableOnly) {
    labels.push('예약 가능');
    labelsEn.push('Reservable');
    matchedRuleCodes.push('reservable');
  }
  if (indoorOnly) {
    labels.push('실내');
    labelsEn.push('Indoor');
    matchedRuleCodes.push('indoor');
  }
  if (lowCongestionOnly) {
    labels.push('한산함');
    labelsEn.push('Quiet');
    matchedRuleCodes.push('low_congestion');
  }
  if (maxDistanceKm !== null) {
    labels.push(`${maxDistanceKm}km 이내`);
    labelsEn.push(`Within ${maxDistanceKm}km`);
    matchedRuleCodes.push('max_distance');
  }

  let preset: NaturalLanguageSearchRule['preset'] = null;
  if (/비\s*(?:오는|올)|rainy|rain\s*day/i.test(normalized)) preset = 'rainy_day';
  else if (/한산|조용|quiet|not\s*crowded/i.test(normalized)) preset = 'quiet';
  else if (/행사|축제|공연|전시|event|festival/i.test(normalized)) preset = 'today_event';
  else if (/따릉이|자전거|bike|bicycle/i.test(normalized)) preset = 'bike_trip';
  else if (/무더위|더위\s*피|cool(?:ing)?/i.test(normalized)) preset = 'cool_down';
  else if (openOnly) preset = 'available_now';
  if (preset) matchedRuleCodes.push(`preset_${preset}`);

  return {
    matched: matchedRuleCodes.length > 0,
    categories: [...new Set(categories)],
    filters: {
      maxDistanceKm,
      openOnly,
      reservableOnly,
      indoorOnly,
      lowCongestionOnly,
    },
    preset,
    summary: labels.length > 0 ? [...new Set(labels)].join(' · ') : '',
    summaryEn: labelsEn.length > 0 ? [...new Set(labelsEn)].join(' · ') : '',
    matchedRuleCodes: [...new Set(matchedRuleCodes)],
  };
}
