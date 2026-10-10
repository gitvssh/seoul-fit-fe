import { useState, useEffect, useCallback, useMemo } from 'react';

// 검색 스코어를 포함한 검색 아이템
interface SearchItemWithScore extends SearchItem {
  score: number;
}

// 고급 검색 유틸리티 함수들
const searchUtils = {
  // 한글 → 초성 변환
  getChosung: (str: string): string => {
    const chosung = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ',
    ];
    return str.replace(/[가-힣]/g, char => {
      const code = char.charCodeAt(0) - 44032;
      if (code >= 0 && code <= 11171) {
        return chosung[Math.floor(code / 588)];
      }
      return char;
    });
  },

  // 텍스트 정규화 (띄어쓰기, 특수문자 제거)
  normalize: (str: string): string => {
    return str.toLowerCase().replace(/[\s\-_()]/g, '');
  },

  // 매치 스코어 계산
  getMatchScore: (text: string, query: string): number => {
    const normalizedText = searchUtils.normalize(text);
    const normalizedQuery = searchUtils.normalize(query);
    const chosungText = searchUtils.getChosung(text);
    const chosungQuery = searchUtils.getChosung(query);

    // 1. 완전일치 (100점)
    if (normalizedText === normalizedQuery) return 100;

    // 2. 시작매치 (90점)
    if (normalizedText.startsWith(normalizedQuery)) return 90;

    // 3. 포함매치 (70점)
    if (normalizedText.includes(normalizedQuery)) return 70;

    // 4. 초성 완전매치 (60점)
    if (chosungText === chosungQuery) return 60;

    // 5. 초성 시작매치 (50점)
    if (chosungText.startsWith(chosungQuery)) return 50;

    // 6. 초성 포함매치 (40점)
    if (chosungText.includes(chosungQuery)) return 40;

    // 7. 부분 단어 매치 (30점)
    const words = normalizedText.split(/[\s\-_]/);
    for (const word of words) {
      if (word.startsWith(normalizedQuery)) return 30;
    }

    return 0;
  },

  // 카테고리 우선순위
  getCategoryPriority: (category: SearchItem['category']): number => {
    const priorities = {
      subway: 1,
      bike: 2,
      library: 3,
      park: 4,
      cultural_event: 5,
      cultural_reservation: 6,
      cooling_center: 7,
      restaurant: 8,
    };
    return priorities[category] || 9;
  },
};

// 검색 인덱스 원시 항목 (backend 응답)
interface RawSearchIndexItem {
  id: number;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  refTable?: string;
  refId?: number;
  ref_table?: string;
  ref_id?: number;
}

/**
 * 검색 인덱스 응답을 항목 배열로 정규화한다.
 * 게이트웨이가 `/api/search`를 backend로 직접 보내면 Spring Page 형태(`{ content: [] }`)가 오고,
 * Next Route Handler를 거치면 배열이 온다. 두 형태를 모두 받아야 POI 검색이 비지 않는다.
 */
export function normalizeSearchIndexPayload(payload: unknown): RawSearchIndexItem[] {
  if (Array.isArray(payload)) return payload as RawSearchIndexItem[];
  if (payload && typeof payload === 'object') {
    const record = payload as { content?: unknown; data?: unknown; items?: unknown };
    for (const candidate of [record.content, record.data, record.items]) {
      if (Array.isArray(candidate)) return candidate as RawSearchIndexItem[];
    }
  }
  return [];
}

// 통합 검색 아이템 타입
export interface SearchItem {
  id: string;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  category:
    | 'subway'
    | 'bike'
    | 'library'
    | 'park'
    | 'cultural_event'
    | 'cultural_reservation'
    | 'cooling_center'
    | 'restaurant';
  ref_table?: string;
  ref_id?: number;
  position?: {
    lat: number;
    lng: number;
  };
}

// 검색 히스토리 아이템 타입
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  selectedItem?: SearchItem;
}

// POI 데이터는 FacilityProvider에서 처리하므로 여기서는 제거됨

// 검색 히스토리 관리 상수
const SEARCH_HISTORY_KEY = 'seoul-fit-search-history';
const MAX_HISTORY_ITEMS = 10;

// 검색 히스토리 유틸리티 함수들
const searchHistoryUtils = {
  // localStorage에서 검색 히스토리 로드
  loadHistory: (): SearchHistoryItem[] => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        item =>
          item &&
          typeof item.id === 'string' &&
          typeof item.query === 'string' &&
          typeof item.timestamp === 'number'
      );
    } catch (error) {
      console.warn('검색 히스토리 로드 실패:', error);
      return [];
    }
  },

  // localStorage에 검색 히스토리 저장
  saveHistory: (history: SearchHistoryItem[]): void => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('검색 히스토리 저장 실패:', error);
    }
  },

  // 새 검색 히스토리 아이템 생성
  createHistoryItem: (query: string, selectedItem?: SearchItem): SearchHistoryItem => ({
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    query: query.trim(),
    timestamp: Date.now(),
    selectedItem,
  }),

  // 중복 제거 및 최대 개수 제한
  deduplicateAndLimit: (history: SearchHistoryItem[]): SearchHistoryItem[] => {
    const uniqueQueries = new Map<string, SearchHistoryItem>();

    // 최신 항목이 우선되도록 역순으로 처리
    [...history].reverse().forEach(item => {
      const normalizedQuery = item.query.toLowerCase().trim();
      if (!uniqueQueries.has(normalizedQuery)) {
        uniqueQueries.set(normalizedQuery, item);
      }
    });

    return Array.from(uniqueQueries.values())
      .sort((a, b) => b.timestamp - a.timestamp) // 최신순 정렬
      .slice(0, MAX_HISTORY_ITEMS); // 최대 개수 제한
  },
};

export const useSearchCache = () => {
  const [searchCache, setSearchCache] = useState<SearchItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 매핑 함수
  const getCategoryFromRefTable = (refTable: string): SearchItem['category'] | null => {
    switch (refTable) {
      case 'libraries':
        return 'library';
      case 'park':
        return 'park';
      case 'cultural_events':
        return 'cultural_event';
      case 'cultural_reservation':
        return 'cultural_reservation';
      case 'cooling_centers':
        return 'cooling_center';
      case 'restaurants':
        return 'restaurant';
      default:
        return null;
    }
  };

  // 데이터 로드 함수
  const loadSearchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // backend POI 검색 인덱스와 실시간 교통 항목을 병렬로 적재한다.
      const [poiRes, subwayRes, bikeRes] = await Promise.allSettled([
        fetch('/api/search/index?page=0&size=20000'),
        fetch('/api/subway?lat=37.5665&lng=126.9780'),
        fetch('/api/bike-stations?lat=37.5665&lng=126.9780&radius=30'),
      ]);

      const combinedData: SearchItem[] = [];

      if (poiRes.status === 'fulfilled' && poiRes.value.ok) {
        const poiData = normalizeSearchIndexPayload(await poiRes.value.json());

        if (poiData.length > 0) {
          poiData.forEach(item => {
            const refTable = item.refTable || item.ref_table;
            const refId = item.refId ?? item.ref_id;
            if (!refTable || refId === undefined) return;

            const category = getCategoryFromRefTable(refTable);
            if (!category) return;

            combinedData.push({
              id: String(item.id),
              name: item.name,
              address: item.address,
              remark: item.remark,
              aliases: item.aliases,
              category,
              ref_table: refTable,
              ref_id: refId,
            });
          });
        }
      } else {
        console.warn('POI 검색 인덱스 로드 실패');
      }

      // 지하철 데이터 처리
      if (subwayRes.status === 'fulfilled' && subwayRes.value.ok) {
        try {
          const subwayData = await subwayRes.value.json();

          if (subwayData.success && subwayData.data?.stations) {
            interface SubwayStation {
              code?: string;
              stationId?: string;
              name: string;
              route?: string;
              line?: string;
              lat?: number;
              lng?: number;
            }

            const subwayItems: SearchItem[] = subwayData.data.stations.map(
              (station: SubwayStation) => ({
                id: station.code || `subway_${station.stationId}`,
                name: station.name,
                category: 'subway' as const,
                remark: station.route || station.line,
                position:
                  typeof station.lat === 'number' && typeof station.lng === 'number'
                    ? { lat: station.lat, lng: station.lng }
                    : undefined,
              })
            );
            combinedData.push(...subwayItems);
          } else {
            console.warn('지하철 데이터 구조 이상:', subwayData);
          }
        } catch (parseError) {
          console.error('지하철 데이터 JSON 파싱 실패:', parseError);
        }
      } else if (subwayRes.status === 'fulfilled') {
        console.warn(
          `지하철 API 호출 실패: ${subwayRes.value.status} ${subwayRes.value.statusText}`
        );
      } else {
        console.warn('지하철 API 호출 rejected:', subwayRes.reason);
      }

      // 따릉이 데이터 처리
      if (bikeRes.status === 'fulfilled' && bikeRes.value.ok) {
        const bikeData = await bikeRes.value.json();
        if (bikeData.success && bikeData.data?.stations) {
          interface BikeStation {
            code?: string;
            stationId?: string;
            name: string;
            lat?: number;
            lng?: number;
          }

          const bikeItems: SearchItem[] = bikeData.data.stations.map((station: BikeStation) => ({
            id: station.code || `bike_${station.stationId}`,
            name: station.name,
            category: 'bike' as const,
            position:
              typeof station.lat === 'number' && typeof station.lng === 'number'
                ? { lat: station.lat, lng: station.lng }
                : undefined,
          }));
          combinedData.push(...bikeItems);
        }
      } else {
        console.warn('따릉이 데이터 로드 실패');
      }

      setSearchCache(combinedData);
    } catch (err) {
      console.error('검색 데이터 로드 중 오류:', err);
      setError('검색 데이터 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색 캐시 전처리 (메모이제이션)
  const preprocessedCache = useMemo(() => {
    return searchCache.map(item => {
      const searchFields: string[] = [item.name];

      if (item.address) {
        searchFields.push(...item.address.split(',').map(addr => addr.trim()));
      }

      if (item.remark) {
        searchFields.push(...item.remark.split(',').map(remark => remark.trim()));
      }

      if (item.aliases) {
        searchFields.push(...item.aliases.split(',').map(alias => alias.trim()));
      }

      return {
        ...item,
        searchFields,
      };
    });
  }, [searchCache]);

  // 고급 검색 함수 (최적화됨)
  const search = useCallback(
    (query: string, limit: number = 10): SearchItem[] => {
      if (!query.trim() || query.length < 1) return [];

      const trimmedQuery = query.trim();

      // 전처리된 캐시를 사용하여 성능 향상
      const itemsWithScores: SearchItemWithScore[] = preprocessedCache
        .map(item => {
          let maxScore = 0;
          for (const field of item.searchFields) {
            const score = searchUtils.getMatchScore(field, trimmedQuery);
            maxScore = Math.max(maxScore, score);
          }

          return {
            id: item.id,
            name: item.name,
            address: item.address,
            remark: item.remark,
            aliases: item.aliases,
            category: item.category,
            ref_table: item.ref_table,
            ref_id: item.ref_id,
            position: item.position,
            score: maxScore,
          };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          const aPriority = searchUtils.getCategoryPriority(a.category);
          const bPriority = searchUtils.getCategoryPriority(b.category);
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return a.name.length - b.name.length;
        });

      return itemsWithScores.slice(0, limit).map(({ score, ...item }) => item);
    },
    [preprocessedCache]
  );

  // 카테고리별 검색
  const searchByCategory = useCallback(
    (query: string, categories: SearchItem['category'][], limit: number = 10): SearchItem[] => {
      if (!query.trim() || query.length < 1) return [];

      return search(query, searchCache.length)
        .filter(item => categories.includes(item.category))
        .slice(0, limit);
    },
    [search, searchCache]
  );

  // 검색 히스토리 관리 함수들
  const addToHistory = useCallback(
    (query: string, selectedItem?: SearchItem) => {
      if (!query.trim() || query.trim().length < 1) return;

      const newItem = searchHistoryUtils.createHistoryItem(query, selectedItem);
      const updatedHistory = searchHistoryUtils.deduplicateAndLimit([newItem, ...searchHistory]);

      setSearchHistory(updatedHistory);
      searchHistoryUtils.saveHistory(updatedHistory);
    },
    [searchHistory]
  );

  const removeFromHistory = useCallback(
    (historyId: string) => {
      const updatedHistory = searchHistory.filter(item => item.id !== historyId);
      setSearchHistory(updatedHistory);
      searchHistoryUtils.saveHistory(updatedHistory);
    },
    [searchHistory]
  );

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    searchHistoryUtils.saveHistory([]);
  }, []);

  // 검색 히스토리 필터링 (현재 검색어와 매치되는 항목들)
  const getRelevantHistory = useCallback(
    (query: string): SearchHistoryItem[] => {
      if (!query.trim()) return searchHistory;

      const normalizedQuery = query.toLowerCase().trim();
      return searchHistory.filter(
        item =>
          item.query.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(item.query.toLowerCase())
      );
    },
    [searchHistory]
  );

  // 컴포넌트 마운트 시 데이터 로드 및 검색 히스토리 초기화
  useEffect(() => {
    loadSearchData();

    // 검색 히스토리 로드
    const savedHistory = searchHistoryUtils.loadHistory();
    setSearchHistory(savedHistory);
  }, [loadSearchData]);

  return {
    searchCache,
    isLoading,
    error,
    search,
    searchByCategory,
    reloadData: loadSearchData,
    totalCount: searchCache.length,

    // 검색 히스토리 관련
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRelevantHistory,
  };
};
