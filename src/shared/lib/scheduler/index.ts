// lib/scheduler.ts - 데이터 갱신 스케줄러

import { serverCache } from '@/lib/serverCache';
import { loadAllSubwayStations, loadAllBikeStations } from '@/lib/seoulApi';
import { writeRuntimeEvent } from '@/src/shared/lib/observability/http-access-log';

class DataScheduler {
  private static instance: DataScheduler;
  private bikeInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  static getInstance(): DataScheduler {
    if (!DataScheduler.instance) {
      DataScheduler.instance = new DataScheduler();
    }
    return DataScheduler.instance;
  }

  // 초기화 (서버 시작시 1회 실행)
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      writeRuntimeEvent({
        eventName: 'service.cache.initialize',
        eventAction: 'complete',
        eventOutcome: 'success',
        operation: 'scheduler',
      });
      return;
    }

    // 중복 초기화 방지
    this.isInitialized = true;
    try {
      // 1. 지하철 데이터 로드 (1회만)
      await this.loadSubwayData();

      // 2. 따릉이 데이터 로드 (초기 1회)
      await this.loadBikeData();

      // 3. 따릉이 스케줄러 시작 (1분마다)
      this.startBikeScheduler();

    } catch (error) {
      this.isInitialized = false; // 실패 시 다시 초기화 가능하도록
      throw error;
    }
  }

  // 지하철 데이터 로드 (서버 시작시 1회만)
  private async loadSubwayData(): Promise<void> {
    try {
      const stations = await loadAllSubwayStations();
      serverCache.setStatic('subway_stations', stations);
      writeRuntimeEvent({
        eventName: 'service.cache.operation',
        eventAction: 'refresh',
        eventOutcome: 'success',
        operation: 'subway',
      });
    } catch (error) {
      // 지하철 데이터는 필수이므로 에러 발생시 빈 배열로 설정
      serverCache.setStatic('subway_stations', []);
      writeRuntimeEvent({
        eventName: 'service.cache.operation',
        eventAction: 'refresh',
        eventOutcome: 'failure',
        operation: 'subway',
        error,
      });
    }
  }

  // 따릉이 데이터 로드
  private async loadBikeData(): Promise<void> {
    try {
      const stations = await loadAllBikeStations();
      serverCache.setDynamic('bike_stations', stations);
      writeRuntimeEvent({
        eventName: 'service.cache.operation',
        eventAction: 'refresh',
        eventOutcome: 'success',
        operation: 'bike',
      });
    } catch (error) {
      // 실패 시 기존 캐시 유지
      writeRuntimeEvent({
        eventName: 'service.cache.operation',
        eventAction: 'refresh',
        eventOutcome: 'failure',
        operation: 'bike',
        error,
      });
    }
  }

  // 따릉이 스케줄러 시작 (1분마다)
  private startBikeScheduler(): void {
    if (this.bikeInterval) {
      clearInterval(this.bikeInterval);
    }

    writeRuntimeEvent({
      eventName: 'service.cache.operation',
      eventAction: 'schedule',
      eventOutcome: 'success',
      operation: 'bike',
    });

    this.bikeInterval = setInterval(async () => {
      await this.loadBikeData();
    }, 60 * 1000); // 1분
  }

  // 스케줄러 중지
  stop(): void {
    if (this.bikeInterval) {
      clearInterval(this.bikeInterval);
      this.bikeInterval = null;
      writeRuntimeEvent({
        eventName: 'service.cache.operation',
        eventAction: 'stop',
        eventOutcome: 'success',
        operation: 'scheduler',
      });
    }
  }

  // 상태 확인
  getStatus(): { initialized: boolean; cacheStatus: Record<string, unknown> } {
    return {
      initialized: this.isInitialized,
      cacheStatus: serverCache.getStatus(),
    };
  }
}

export const dataScheduler = DataScheduler.getInstance();
export { DataScheduler };
