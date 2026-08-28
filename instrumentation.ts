// instrumentation.ts - Next.js 서버 시작 시에만 실행
// IMPORTANT: 이 인메모리 캐시/스케줄러는 replicas=1을 전제로 한다.
// 멀티 레플리카 지원을 위한 캐시 외부화는 별도 백로그이며 여기서 처리하지 않는다.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerHttpAccessLogging, writeRuntimeEvent } = await import(
      './src/shared/lib/observability/http-access-log'
    );
    const { dataScheduler } = await import('./src/shared/lib/scheduler');

    registerHttpAccessLogging();

    writeRuntimeEvent({
      eventName: 'service.cache.initialize',
      eventAction: 'start',
      eventOutcome: 'success',
    });
    try {
      await dataScheduler.initialize();
      writeRuntimeEvent({
        eventName: 'service.cache.initialize',
        eventAction: 'complete',
        eventOutcome: 'success',
      });
    } catch (error) {
      writeRuntimeEvent({
        eventName: 'service.cache.initialize',
        eventAction: 'complete',
        eventOutcome: 'failure',
        error,
      });
    }
  }
}
