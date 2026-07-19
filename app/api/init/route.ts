// app/api/init/route.ts - 서버 초기화 API

import { NextResponse } from 'next/server';
import { dataScheduler } from '@/shared/lib/scheduler';

/**
 * GET 서버 초기화 및 스케줄러 시작
 * 서버 시작시 한 번 호출하여 데이터 캐싱 시작
 */
export async function GET() {
  try {
    // console.log('[초기화API] 서버 초기화 시작...');

    await dataScheduler.initialize();

    const status = dataScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: '서버 초기화 완료',
      status,
    });
  } catch (error) {
    console.error('[초기화API] 초기화 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 초기화 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * POST 스케줄러 상태 조회
 */
export async function POST() {
  try {
    const status = dataScheduler.getStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[초기화API] 상태 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 실패',
      },
      { status: 500 }
    );
  }
}
