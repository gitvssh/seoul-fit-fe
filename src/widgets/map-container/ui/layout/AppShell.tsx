'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';

interface AppShellProps {
  /** 검색·메뉴가 있는 헤더. 모바일은 지도 위 글라스 띠, 데스크톱은 패널 상단 */
  header: React.ReactNode;
  panel: React.ReactNode;
  map: React.ReactNode;
  className?: string;
}

/**
 * 지도 우선 레이아웃. 데스크톱(md+)은 [헤더+패널 400px | 지도], 모바일은 지도 전면 위에 헤더 띠,
 * 패널은 바텀시트(포털)로 뜬다. 헤더·패널은 한 번만 렌더되며 그리드 영역만 바뀐다.
 */
export function AppShell({ header, panel, map, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'relative grid h-full min-h-0 w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[400px_minmax(0,1fr)]',
        className
      )}
    >
      <div className='isolate col-start-1 row-start-1 row-span-2 min-h-0 md:col-start-2 md:row-start-1'>
        {map}
      </div>
      <div className='pointer-events-none z-header col-start-1 row-start-1 md:pointer-events-auto md:border-b md:border-border md:bg-background'>
        {header}
      </div>
      <div className='col-start-1 row-start-2 hidden min-h-0 md:block'>{panel}</div>
    </div>
  );
}
