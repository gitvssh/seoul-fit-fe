// lib/performance.ts - 성능 최적화 유틸리티

// 메모이제이션 캐시 타입
type MemoCache<T> = Map<string, { value: T; timestamp: number }>;

// 메모이제이션 함수 (TTL 지원)
export function memoizeWithTTL<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  ttl: number = 5 * 60 * 1000 // 기본 5분
): (...args: TArgs) => TReturn {
  const cache: MemoCache<TReturn> = new Map();

  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });

    // 캐시 크기 제한 (메모리 누수 방지)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return result;
  };
}

// 비동기 메모이제이션 함수
export function memoizeAsyncWithTTL<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ttl: number = 5 * 60 * 1000
): (...args: TArgs) => Promise<TReturn> {
  const cache: MemoCache<TReturn> = new Map();
  const pendingPromises: Map<string, Promise<TReturn>> = new Map();

  return async (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    // 동일한 요청이 진행 중이면 기다림
    const pendingPromise = pendingPromises.get(key);
    if (pendingPromise) {
      return pendingPromise;
    }

    const promise = fn(...args);
    pendingPromises.set(key, promise);

    try {
      const result = await promise;
      cache.set(key, { value: result, timestamp: now });

      // 캐시 크기 제한
      if (cache.size > 100) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }

      return result;
    } finally {
      pendingPromises.delete(key);
    }
  };
}

// 쓰로틀링 함수
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 배치 처리 함수
export function batchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
): (item: T) => Promise<R> {
  let batch: T[] = [];
  let resolvers: Array<(value: R) => void> = [];
  let rejecters: Array<(reason: unknown) => void> = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const processBatch = async () => {
    if (batch.length === 0) return;

    const currentBatch = [...batch];
    const currentResolvers = [...resolvers];
    const currentRejecters = [...rejecters];

    batch = [];
    resolvers = [];
    rejecters = [];

    try {
      const results = await processor(currentBatch);
      results.forEach((result, index) => {
        currentResolvers[index]?.(result);
      });
    } catch (error) {
      currentRejecters.forEach(reject => reject(error));
    }
  };

  return (item: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      batch.push(item);
      resolvers.push(resolve);
      rejecters.push(reject);

      if (batch.length >= batchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        processBatch();
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          processBatch();
        }, delay);
      }
    });
  };
}

// 리소스 정리 유틸리티
export class ResourceManager {
  private resources: Set<() => void> = new Set();

  add(cleanup: () => void): void {
    this.resources.add(cleanup);
  }

  remove(cleanup: () => void): void {
    this.resources.delete(cleanup);
  }

  cleanup(): void {
    this.resources.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('리소스 정리 중 오류:', error);
      }
    });
    this.resources.clear();
  }
}

// 성능 측정 유틸리티
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      const existing = this.metrics.get(name) || [];
      existing.push(duration);

      // 최근 100개 측정값만 유지
      if (existing.length > 100) {
        existing.shift();
      }

      this.metrics.set(name, existing);

      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((times, name) => {
      result[name] = {
        average: this.getAverageTime(name),
        count: times.length,
      };
    });

    return result;
  }
}
