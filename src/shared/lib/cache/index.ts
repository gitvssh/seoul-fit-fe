// lib/serverCache.ts - 서버사이드 캐시 시스템

interface CacheItem<T> {
  data: T;
  timestamp: number;
  isStatic?: boolean; // 정적 데이터 여부 (지하철 등)
}

// Node.js global 객체에 캐시 저장
declare global {
  var __serverCache: Map<string, CacheItem<unknown>> | undefined;
}

class ServerCache {
  private static instance: ServerCache;
  private cache: Map<string, CacheItem<unknown>>;

  constructor() {
    // global 객체에서 캐시 가져오거나 새로 생성
    if (!global.__serverCache) {
      global.__serverCache = new Map<string, CacheItem<unknown>>();
    }
    this.cache = global.__serverCache;
  }

  static getInstance(): ServerCache {
    if (!ServerCache.instance) {
      ServerCache.instance = new ServerCache();
    }
    return ServerCache.instance;
  }

  // 정적 데이터 저장 (지하철 - 서버 시작시 1회)
  setStatic<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStatic: true,
    });
    console.log(`[캐시] 정적 데이터 저장: ${key}`);
  }

  // 동적 데이터 저장 (따릉이 - 주기적 갱신)
  setDynamic<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStatic: false,
    });
    console.log(`[캐시] 동적 데이터 갱신: ${key}`);
  }

  // 데이터 조회
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    return item ? item.data : null;
  }

  // 캐시 존재 여부 확인
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // 캐시 정보 조회
  getInfo(key: string): { timestamp: number; isStatic: boolean } | null {
    const item = this.cache.get(key);
    if (!item) return null;

    return {
      timestamp: item.timestamp,
      isStatic: item.isStatic || false,
    };
  }

  // 전체 캐시 상태 조회
  getStatus(): Record<string, { timestamp: number; isStatic: boolean; dataSize: number }> {
    const status: Record<string, { timestamp: number; isStatic: boolean; dataSize: number }> = {};

    this.cache.forEach((item, key) => {
      status[key] = {
        timestamp: item.timestamp,
        isStatic: item.isStatic || false,
        dataSize: Array.isArray(item.data) ? (item.data as unknown[]).length : 1,
      };
    });

    return status;
  }
}

export const serverCache = ServerCache.getInstance();
export { ServerCache };
